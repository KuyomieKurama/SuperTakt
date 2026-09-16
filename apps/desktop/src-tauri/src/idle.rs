//! Nur sitzungsweite Inaktivitätszeiten erfassen; keine Hooks, Tasten, Fenstertitel oder Protokolle.
use std::sync::{Arc, Mutex};
use tauri::Manager;
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
pub struct IdleMonitor(Arc<Mutex<Activity>>, Arc<Mutex<WakeState>>);

#[derive(Clone, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WakeOptions {
    enabled: bool,
    threshold_minutes: u64,
}

#[derive(Default)]
struct WakeState {
    enabled: bool,
    threshold_ms: u64,
    armed_at: u64,
    seen_return: u64,
}

fn should_wake(activity: &Activity, wake: &mut WakeState) -> bool {
    if !activity.supported || !wake.enabled {
        return false;
    }
    let mut found = false;
    for period in &activity.periods {
        if period.ended_at_ms > wake.seen_return {
            let start = period.started_at_ms.max(wake.armed_at);
            found |= period.ended_at_ms.saturating_sub(start) >= wake.threshold_ms;
            wake.seen_return = period.ended_at_ms;
        }
    }
    found
}

fn observe(state: &mut Activity, at: u64, idle_ms: u64) {
    let mut last = at.saturating_sub(idle_ms);
    if state.supported && at >= state.sampled_at_ms {
        // Ältere SendInput-Zeitpunkte und Messrücksprünge dürfen keine Abwesenheit vortäuschen.
        last = last.max(state.last_input_at_ms);
    } else if at < state.sampled_at_ms {
        state.periods.clear();
    }
    // Kleine Messschwankungen gelten nicht als Eingabe. Der native Worker erfasst
    // Rückkehrereignisse auch bei schlafender Webview.
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
    // Sitzungsübergreifend (0), beliebige Eingabe (UINT32_MAX): nur die verstrichene
    // Zeit abfragen, ohne Eingaben aufzuzeichnen oder Überwachungshooks zu setzen.
    let seconds = unsafe { CGEventSourceSecondsSinceLastEventType(0, u32::MAX) };
    (seconds.is_finite() && seconds >= 0.0 && seconds < u64::MAX as f64 / 1000.0)
        .then(|| (seconds * 1000.0) as u64)
}

impl IdleMonitor {
    pub fn start_with_app(app: tauri::AppHandle) -> Self {
        let monitor = Self::start();
        let shared = monitor.clone();
        // This worker also runs when a hidden webview throttles JavaScript.
        std::thread::spawn(move || loop {
            let wake = match (shared.0.lock(), shared.1.lock()) {
                (Ok(activity), Ok(mut state)) => should_wake(&activity, &mut state),
                _ => false,
            };
            if wake {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.unminimize();
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
            std::thread::sleep(std::time::Duration::from_millis(500));
        });
        monitor
    }

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
pub fn takt_idle_activity(
    monitor: tauri::State<'_, IdleMonitor>,
    wake: Option<WakeOptions>,
) -> Result<Activity, String> {
    if let Some(options) = wake {
        if !(1..=120).contains(&options.threshold_minutes) {
            return Err("Ungültige Inaktivitätsschwelle.".into());
        }
        if let Ok(mut state) = monitor.1.lock() {
            if options.enabled && !state.enabled {
                state.armed_at = now_ms();
                state.seen_return = state.armed_at;
            }
            state.enabled = options.enabled;
            state.threshold_ms = options.threshold_minutes * 60_000;
        }
    }
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
    fn wake_once_per_return_and_ignore_active_gaps() {
        let mut activity = Activity {
            supported: true,
            ..Activity::default()
        };
        let mut wake = WakeState {
            enabled: true,
            threshold_ms: 300_000,
            armed_at: 100_000,
            seen_return: 100_000,
        };
        activity.periods.push(IdlePeriod {
            started_at_ms: 0,
            ended_at_ms: 200_000,
        });
        assert!(!should_wake(&activity, &mut wake));
        activity.periods.push(IdlePeriod {
            started_at_ms: 210_000,
            ended_at_ms: 600_000,
        });
        assert!(should_wake(&activity, &mut wake));
        assert!(!should_wake(&activity, &mut wake));
        activity.periods.push(IdlePeriod {
            started_at_ms: 610_000,
            ended_at_ms: 700_000,
        });
        assert!(!should_wake(&activity, &mut wake));
        activity.periods.push(IdlePeriod {
            started_at_ms: 710_000,
            ended_at_ms: 1_100_000,
        });
        assert!(should_wake(&activity, &mut wake));
        assert!(!should_wake(&activity, &mut wake));
        wake.enabled = false;
        activity.periods.push(IdlePeriod {
            started_at_ms: 1_200_000,
            ended_at_ms: 2_000_000,
        });
        assert!(!should_wake(&activity, &mut wake));
    }

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
