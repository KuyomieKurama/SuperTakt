//! A-24: session-wide idle durations only. No hooks, keys, window titles or logs.
use std::sync::{Arc, Mutex};

#[derive(Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct IdlePeriod { started_at_ms: u64, ended_at_ms: u64 }

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
    if state.supported && last > state.last_input_at_ms.saturating_add(2000) &&
        last.saturating_sub(state.last_input_at_ms) >= 60_000 {
        state.periods.push(IdlePeriod { started_at_ms: state.last_input_at_ms, ended_at_ms: last });
        if state.periods.len() > 32 { state.periods.remove(0); }
    }
    state.supported = true;
    state.sampled_at_ms = at;
    state.last_input_at_ms = last;
}

#[cfg(windows)]
fn system_idle_ms() -> Option<u64> {
    #[repr(C)]
    struct LastInputInfo { size: u32, tick: u32 }
    #[link(name = "user32")]
    extern "system" { fn GetLastInputInfo(info: *mut LastInputInfo) -> i32; }
    #[link(name = "kernel32")]
    extern "system" { fn GetTickCount() -> u32; }
    let mut info = LastInputInfo { size: std::mem::size_of::<LastInputInfo>() as u32, tick: 0 };
    // Both counters use the same 32-bit clock; subtraction must wrap after
    // 49.7 days of Windows uptime. No global keyboard or mouse hook is used.
    unsafe {
        if GetLastInputInfo(&mut info) == 0 { return None; }
        Some(GetTickCount().wrapping_sub(info.tick) as u64)
    }
}

impl IdleMonitor {
    pub fn start() -> Self {
        let monitor = Self::default();
        #[cfg(windows)]
        {
            let shared = monitor.0.clone();
            std::thread::spawn(move || loop {
                let at = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH)
                    .map(|d| d.as_millis() as u64).unwrap_or(0);
                if let Ok(mut state) = shared.lock() {
                    match system_idle_ms() {
                        Some(idle_ms) => observe(&mut state, at, idle_ms),
                        None => state.supported = false,
                    }
                }
                std::thread::sleep(std::time::Duration::from_secs(2));
            });
        }
        monitor
    }
}

#[tauri::command]
pub fn takt_idle_activity(monitor: tauri::State<'_, IdleMonitor>) -> Result<Activity, String> {
    monitor.0.lock().map(|s| s.clone()).map_err(|_| "Die Inaktivitätserkennung ist nicht verfügbar.".into())
}

#[cfg(test)]
mod tests {
    use super::*;
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
        for at in (1_000_000..1_120_000).step_by(2000) { observe(&mut state, at, 100); }
        observe(&mut state, 500_000, 100);
        assert!(state.periods.is_empty());
    }
}
