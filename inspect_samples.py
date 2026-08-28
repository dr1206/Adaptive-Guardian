import asyncio
import sys
sys.path.append('.')

from app.config import settings
from app.db.mongodb import init_db, get_db
from app.domain.aegis.models import BehavioralEvent, BehaviorWindow
from app.domain.training.models import TrainingEvent, TrainingFeature, TrainingSession

async def main():
    await init_db()
    async for db in get_db():
        break

    print("=== TRAINING SESSIONS (first 2) ===")
    sessions = await TrainingSession.find().limit(2).to_list()
    for i, s in enumerate(sessions):
        print(f"Session {i}:")
        print(f"  id: {s.id}")
        print(f"  user_id: {s.user_id}")
        print(f"  session_id: {s.session_id}")
        print(f"  device_id: {s.device_id}")
        print(f"  task_type: {s.task_type}")
        print(f"  status: {s.status}")
        print(f"  started_at: {s.started_at}")
        print(f"  completed_at: {s.completed_at}")
        print(f"  sample_count: {s.sample_count}")
        print(f"  metadata: {s.metadata}")
        print()

    print("=== TRAINING EVENTS (first 2) ===")
    events = await TrainingEvent.find().limit(2).to_list()
    for i, e in enumerate(events):
        print(f"Event {i}:")
        print(f"  id: {e.id}")
        print(f"  user_id: {e.user_id}")
        print(f"  session_id: {e.session_id}")
        print(f"  task_type: {e.task_type}")
        print(f"  event_type: {e.event_type}")
        print(f"  timestamp: {e.timestamp}")
        print(f"  device_id: {e.device_id}")
        print(f"  page: {e.page}")
        # For keystroke events
        if hasattr(e, 'key_code'):
            print(f"  key_code: {e.key_code}")
            print(f"  key_char: {e.key_char}")
            print(f"  dwell_time_ms: {e.dwell_time_ms}")
            print(f"  flight_time_ms: {e.flight_time_ms}")
        # For mouse events
        if hasattr(e, 'x'):
            print(f"  x: {e.x}")
            print(f"  y: {e.y}")
            print(f"  target_id: {e.target_id}")
            print(f"  target_size: {e.target_size}")
            print(f"  click_duration_ms: {e.click_duration_ms}")
            if hasattr(e, 'delta_y'):
                print(f"  delta_y: {e.delta_y}")
        print(f"  task_index: {e.task_index}")
        print(f"  trial_index: {e.trial_index}")
        print(f"  text_length: {e.text_length}")
        print(f"  backspace_count: {e.backspace_count}")
        print(f"  correction_count: {e.correction_count}")
        print(f"  total_duration_ms: {e.total_duration_ms}")
        print(f"  pause_duration_ms: {e.pause_duration_ms}")
        print()

    print("=== TRAINING FEATURES (first 2) ===")
    features = await TrainingFeature.find().limit(2).to_list()
    for i, f in enumerate(features):
        print(f"Feature {i}:")
        print(f"  id: {f.id}")
        print(f"  user_id: {f.user_id}")
        print(f"  session_id: {f.session_id}")
        print(f"  task_type: {f.task_type}")
        print(f"  task_index: {f.task_index}")
        print(f"  trial_index: {f.trial_index}")
        print(f"  device_id: {f.device_id}")
        print(f"  typing_speed: {f.typing_speed}")
        print(f"  mean_key_hold: {f.mean_key_hold}")
        print(f"  std_key_hold: {f.std_key_hold}")
        print(f"  mean_flight_time: {f.mean_flight_time}")
        print(f"  std_flight_time: {f.std_flight_time}")
        print(f"  backspace_rate: {f.backspace_rate}")
        print(f"  correction_rate: {f.correction_rate}")
        print(f"  pause_mean: {f.pause_mean}")
        print(f"  pause_std: {f.pause_std}")
        print(f"  total_duration_ms: {f.total_duration_ms}")
        print(f"  mouse_speed_mean: {f.mouse_speed_mean}")
        print(f"  mouse_speed_std: {f.mouse_speed_std}")
        print(f"  mouse_acceleration: {f.mouse_acceleration}")
        print(f"  click_interval_mean: {f.click_interval_mean}")
        print(f"  scroll_speed: {f.scroll_speed}")
        print(f"  trajectory_length: {f.trajectory_length}")
        print(f"  direction_changes: {f.direction_changes}")
        print(f"  target_acquisition_mean: {f.target_acquisition_mean}")
        print(f"  feature_vector: {f.feature_vector}")
        print()

    print("=== BEHAVIORAL EVENTS (first 2) ===")
    bev_events = await BehavioralEvent.find().limit(2).to_list()
    for i, e in enumerate(bev_events):
        print(f"Behavioral Event {i}:")
        print(f"  id: {e.id}")
        print(f"  user_id: {e.user_id}")
        print(f"  session_id: {e.session_id}")
        print(f"  device_id: {e.device_id}")
        print(f"  event_type: {e.event_type}")
        print(f"  timestamp: {e.timestamp}")
        # For keystroke
        if e.event_type == "keystroke":
            print(f"  key_code: {e.key_code}")
            print(f"  dwell_time_ms: {e.dwell_time_ms}")
            print(f"  flight_time_ms: {e.flight_time_ms}")
        # For mouse move/click
        if e.event_type in ["mouse_move", "mouse_click"]:
            print(f"  x: {e.x}")
            print(f"  y: {e.y}")
            print(f"  delta_x: {e.delta_x}")
            print(f"  delta_y: {e.delta_y}")
            print(f"  velocity: {e.velocity}")
        # For mouse scroll
        if e.event_type == "mouse_scroll":
            print(f"  delta_y: {e.delta_y}")
        # For window_aggregate
        if e.event_type == "window_aggregate":
            print(f"  window_start: {e.window_start}")
            print(f"  window_end: {e.window_end}")
        print(f"  feature_vector: {e.feature_vector}")
        print(f"  device_info: {e.device_info}")
        print()

    print("=== BEHAVIOR WINDOWS (first 2) ===")
    bw_windows = await BehaviorWindow.find().limit(2).to_list()
    for i, w in enumerate(bw_windows):
        print(f"Behavior Window {i}:")
        print(f"  id: {w.id}")
        print(f"  user_id: {w.user_id}")
        print(f"  session_id: {w.session_id}")
        print(f"  device_id: {w.device_id}")
        print(f"  window_start: {w.window_start}")
        print(f"  window_end: {w.window_end}")
        print(f"  created_at: {w.created_at}")
        print(f"  features: {w.features}")
        print()

if __name__ == '__main__':
    asyncio.run(main())