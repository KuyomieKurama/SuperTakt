//! Native Linux session APIs. Never use XWayland's partial input history for
//! a Wayland session. No subprocesses, input events or clipboard access.
use super::{now_ms, observe, sample, unavailable, Activity};
use std::{
    os::fd::{AsFd, AsRawFd},
    sync::{Arc, Mutex},
    time::Duration,
};
use wayland_client::{
    protocol::{wl_registry, wl_seat},
    Connection, Dispatch, Proxy, QueueHandle,
};
use wayland_protocols::ext::idle_notify::v1::client::{ext_idle_notification_v1, ext_idle_notifier_v1};
use x11rb::{connection::Connection as _, protocol::screensaver::ConnectionExt as _};

const IDLE_TIMEOUT_MS: u32 = 2000;

pub(super) fn run(shared: Arc<Mutex<Activity>>) {
    loop {
        let wayland = std::env::var_os("WAYLAND_DISPLAY").is_some()
            || std::env::var("XDG_SESSION_TYPE").is_ok_and(|v| v == "wayland");
        if wayland {
            let _ = run_wayland(shared.clone());
            unavailable(&shared);
            let _ = run_gnome(&shared);
        } else {
            let _ = run_x11(&shared);
        }
        unavailable(&shared);
        std::thread::sleep(Duration::from_secs(5));
    }
}

fn run_x11(shared: &Arc<Mutex<Activity>>) -> Result<(), Box<dyn std::error::Error>> {
    let (connection, screen) = x11rb::connect(None)?;
    let root = connection.setup().roots[screen].root;
    loop {
        let reply = connection.screensaver_query_info(root)?.reply()?;
        sample(shared, Some(u64::from(reply.ms_since_user_input)));
        std::thread::sleep(Duration::from_secs(2));
    }
}

fn run_gnome(shared: &Arc<Mutex<Activity>>) -> Result<(), Box<dyn std::error::Error>> {
    let connection = dbus::blocking::Connection::new_session()?;
    let proxy = connection.with_proxy(
        "org.gnome.Mutter.IdleMonitor",
        "/org/gnome/Mutter/IdleMonitor/Core",
        Duration::from_secs(2),
    );
    loop {
        let (ms,): (u64,) = proxy.method_call("org.gnome.Mutter.IdleMonitor", "GetIdletime", ())?;
        sample(shared, Some(ms));
        std::thread::sleep(Duration::from_secs(2));
    }
}

struct WaylandState {
    shared: Arc<Mutex<Activity>>,
    notifier: Option<ext_idle_notifier_v1::ExtIdleNotifierV1>,
    seats: Vec<wl_seat::WlSeat>,
    idle_since: Option<u64>,
}
impl Dispatch<wl_registry::WlRegistry, ()> for WaylandState {
    fn event(
        state: &mut Self,
        registry: &wl_registry::WlRegistry,
        event: wl_registry::Event,
        _: &(),
        _: &Connection,
        qh: &QueueHandle<Self>,
    ) {
        if let wl_registry::Event::Global {
            name,
            interface,
            version,
        } = event
        {
            match interface.as_str() {
                "ext_idle_notifier_v1" => state.notifier = Some(registry.bind(name, version.min(2), qh, ())),
                "wl_seat" => state.seats.push(registry.bind(name, version.min(7), qh, ())),
                _ => {}
            }
        }
    }
}
impl Dispatch<ext_idle_notification_v1::ExtIdleNotificationV1, ()> for WaylandState {
    fn event(
        state: &mut Self,
        _: &ext_idle_notification_v1::ExtIdleNotificationV1,
        event: ext_idle_notification_v1::Event,
        _: &(),
        _: &Connection,
        _: &QueueHandle<Self>,
    ) {
        let at = now_ms();
        match event {
            ext_idle_notification_v1::Event::Idled => {
                state.idle_since = Some(at.saturating_sub(u64::from(IDLE_TIMEOUT_MS)));
            }
            ext_idle_notification_v1::Event::Resumed => {
                // Record the return immediately even if the webview is asleep.
                if let Ok(mut activity) = state.shared.lock() {
                    observe(&mut activity, at, 0);
                }
                state.idle_since = None;
            }
            _ => {}
        }
    }
}
wayland_client::delegate_noop!(WaylandState: ignore wl_seat::WlSeat);
wayland_client::delegate_noop!(WaylandState: ignore ext_idle_notifier_v1::ExtIdleNotifierV1);

fn run_wayland(shared: Arc<Mutex<Activity>>) -> Result<(), Box<dyn std::error::Error>> {
    let connection = Connection::connect_to_env()?;
    let mut queue = connection.new_event_queue();
    let qh = queue.handle();
    let _registry = connection.display().get_registry(&qh, ());
    let mut state = WaylandState {
        shared,
        notifier: None,
        seats: Vec::new(),
        idle_since: None,
    };
    queue.roundtrip(&mut state)?;
    let notifier = state.notifier.as_ref().ok_or("No idle notification protocol")?;
    // A normal desktop session has one seat. Refuse an ambiguous multi-seat
    // session rather than report absence while another seat is active.
    if state.seats.len() != 1 {
        return Err("No unambiguous session seat".into());
    }
    let seat = &state.seats[0];
    let _notification = if notifier.version() >= 2 {
        notifier.get_input_idle_notification(IDLE_TIMEOUT_MS, seat, &qh, ())
    } else {
        notifier.get_idle_notification(IDLE_TIMEOUT_MS, seat, &qh, ())
    };
    queue.roundtrip(&mut state)?;
    loop {
        queue.dispatch_pending(&mut state)?;
        let at = now_ms();
        sample(
            &state.shared,
            Some(state.idle_since.map_or(0, |since| at.saturating_sub(since))),
        );
        connection.flush()?;
        if let Some(guard) = queue.prepare_read() {
            let mut fd = libc::pollfd {
                fd: connection.as_fd().as_raw_fd(),
                events: libc::POLLIN,
                revents: 0,
            };
            // Bounded wait so the sampled duration advances without input.
            let ready = unsafe { libc::poll(&mut fd, 1, 2000) };
            if ready < 0 {
                let error = std::io::Error::last_os_error();
                if error.kind() != std::io::ErrorKind::Interrupted {
                    return Err(error.into());
                }
            } else if ready > 0 {
                guard.read()?;
            }
        }
    }
}
