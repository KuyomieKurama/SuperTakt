//! A-24: session-wide idle durations only. No hooks, keys, window titles or logs.
use std::sync::{Arc, Mutex};
#[cfg(target_os = "linux")]
mod linux;

fn now_ms() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}

fn unavailable(shared: &Arc<Mutex<Activity>>) {
    if let Ok(mut state) = shared.lock() {
        state.supported = false;
        state.periods.clear();
    }
}

fn sample(shared: &Arc<Mutex<Activity>>, idle_ms: Option<u64>) {
    if let Some(idle_ms) = idle_ms {
        if let Ok(mut state) = shared.lock() {
            observe(&mut state, now_ms(), idle_ms);
        }
    } else {
        unavailable(shared);
    }
}

#[derive(Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct IdlePeriod {
    started_at_ms: u64,
    ended_at_ms: u64,
}

#[derive(Clone, Default, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Activity {
    supported: bool,
    sampled_at_ms: u64,
    last_input_at_ms: u64,
    periods: Vec<IdlePeriod>,
}

#[derive(Clone, Default)]
pub struct IdleMonitor(Arc<Mutex<Activity>>);

fn observe(state: &mut Activity, at: u64, idle_ms: u64) {
    let mut last = at.saturating_sub(idle_ms);
    if state.supported && at >= state.sampled_at_ms {
        // SendInput may report an older tick; it must not manufacture a new
        // absence. Small clock/sampling regressions are clamped as well.
        last = last.max(state.last_input_at_ms);
    } else if at < state.sampled_at_ms {
        state.periods.clear();
    }
    // Small differences are sampling jitter, not a new input event. Keeping
    // this in a native worker also catches returns while the webview sleeps.
    if state.supported
        && last > state.last_input_at_ms.saturating_add(2000)
        && last.saturating_sub(state.last_input_at_ms) >= 60_000
    {
        state.periods.push(IdlePeriod {
            started_at_ms: state.last_input_at_ms,
            ended_at_ms: last,
        });
        if state.periods.len() > 32 {
            state.periods.remove(0);
        }
    }
    state.supported = true;
    state.sampled_at_ms = at;
    state.last_input_at_ms = last;
}

#[cfg(windows)]
fn system_idle_ms() -> Option<u64> {
    #[repr(C)]
    struct LastInputInfo {
        size: u32,
        tick: u32,
    }
    #[link(name = "user32")]
    extern "system" {
        fn GetLastInputInfo(info: *mut LastInputInfo) -> i32;
    }
    #[link(name = "kernel32")]
    extern "system" {
        fn GetTickCount() -> u32;
    }
    let mut info = LastInputInfo {
        size: std::mem::size_of::<LastInputInfo>() as u32,
        tick: 0,
    };
    // Both counters use the same 32-bit clock; subtraction must wrap after
    // 49.7 days of Windows uptime. No global keyboard or mouse hook is used.
    unsafe {
        if GetLastInputInfo(&mut info) == 0 {
            return None;
        }
        Some(GetTickCount().wrapping_sub(info.tick) as u64)
    }
}

#[cfg(target_os = "macos")]
fn system_idle_ms() -> Option<u64> {
    #[link(name = "CoreGraphics", kind = "framework")]
    extern "C" {
        fn CGEventSourceSecondsSinceLastEventType(state_id: i32, event_type: u32) -> f64;
    }
    // Combined session state (0), any input event (UINT32_MAX). Queries only
    // elapsed time; no event tap, accessibility hook or input recording.
    let seconds = unsafe { CGEventSourceSecondsSinceLastEventType(0, u32::MAX) };
    (seconds.is_finite() && seconds >= 0.0 && seconds < u64::MAX as f64 / 1000.0)
        .then(|| (seconds * 1000.0) as u64)
}

impl IdleMonitor {
    pub fn start() -> Self {
        let monitor = Self::default();
        #[cfg(any(windows, target_os = "macos"))]
        {
            let shared = monitor.0.clone();
            std::thread::spawn(move || loop {
                sample(&shared, system_idle_ms());
                std::thread::sleep(std::time::Duration::from_secs(2));
            });
        }
        #[cfg(target_os = "linux")]
        {
            let shared = monitor.0.clone();
            std::thread::spawn(move || linux::run(shared));
        }
        monitor
    }
}

#[tauri::command]
pub fn takt_idle_activity(monitor: tauri::State<'_, IdleMonitor>) -> Result<Activity, String> {
    monitor
        .0
        .lock()
        .map(|s| s.clone())
        .map_err(|_| "Die Inaktivitätserkennung ist nicht verfügbar.".into())
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn unavailable_backend_clears_stale_absence_and_reconnect_starts_fresh() {
        let shared = Arc::new(Mutex::new(Activity::default()));
        {
            let mut state = shared.lock().unwrap();
            observe(&mut state, 1_000_000, 0);
            observe(&mut state, 1_120_000, 0);
            assert_eq!(state.periods.len(), 1);
        }
        unavailable(&shared);
        let mut state = shared.lock().unwrap();
        assert!(!state.supported);
        assert!(state.periods.is_empty());
        observe(&mut state, 2_000_000, 100);
        assert!(state.supported);
        assert!(state.periods.is_empty());
    }

    #[test]
    #[ignore = "Requires an actual supported desktop session"]
    fn live_desktop_reports_activity_without_a_webview() {
        let monitor = IdleMonitor::start();
        std::thread::sleep(std::time::Duration::from_secs(3));
        let before = monitor.0.lock().unwrap().clone();
        assert!(before.supported, "No native session backend became available");
        std::thread::sleep(std::time::Duration::from_secs(3));
        let after = monitor.0.lock().unwrap().clone();
        assert!(after.supported);
        assert!(after.sampled_at_ms > before.sampled_at_ms);
        assert!(after.last_input_at_ms <= after.sampled_at_ms);
        eprintln!(
            "Native backend available; current idle duration: {} ms",
            after.sampled_at_ms - after.last_input_at_ms
        );
    }

    #[test]
    fn retains_away_period_after_return_even_without_webview_polling() {
        let mut state = Activity::default();
        observe(&mut state, 1_000_000, 0);
        observe(&mut state, 1_300_000, 300_000);
        observe(&mut state, 1_600_000, 0);
        assert_eq!(state.periods.len(), 1);
        assert_eq!(state.periods[0].started_at_ms, 1_000_000);
        assert_eq!(state.periods[0].ended_at_ms, 1_600_000);
        observe(&mut state, 1_602_000, 0);
        assert_eq!(state.periods.len(), 1);
    }
    #[test]
    fn normal_input_and_clock_rollback_do_not_create_idle_periods() {
        let mut state = Activity::default();
        for at in (1_000_000..1_120_000).step_by(2000) {
            observe(&mut state, at, 100);
        }
        observe(&mut state, 500_000, 100);
        assert!(state.periods.is_empty());
    }
}
