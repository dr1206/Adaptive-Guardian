#!/usr/bin/env python3
"""Test script to verify export_builder.py integrates with service.py correctly."""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from src.app.domain.admin.export_builder import build_user_export_zip
import zipfile
import io
from unittest.mock import Mock, MagicMock

def test_service_integration():
    """Test that build_user_export_zip works with the same parameters as service.py."""
    print("Testing service integration...")

    # Create mock data similar to what service.py would pass
    mock_user = Mock()
    mock_user.id = "123e4567-e89b-12d3-a456-426614174000"
    mock_user.email = "test@example.com"

    mock_training_session = Mock()
    mock_training_session.user_id = mock_user.id
    mock_training_session.session_id = "session-1"
    mock_training_session.task_type = "controlled_typing"
    mock_training_session.sample_count = 10
    mock_training_session.status = "completed"
    mock_training_session.device_id = "device-1"
    mock_training_session.started_at = None
    mock_training_session.completed_at = None

    mock_training_event = Mock()
    mock_training_event.user_id = mock_user.id
    mock_training_event.session_id = "session-1"
    mock_training_event.task_type = "controlled_typing"
    mock_training_event.event_type = "keydown"
    mock_training_event.timestamp = None
    mock_training_event.device_id = "device-1"
    mock_training_event.page = None
    mock_training_event.key_code = 65
    mock_training_event.key_char = "a"
    mock_training_event.dwell_time_ms = 100.0
    mock_training_event.flight_time_ms = 50.0
    mock_training_event.x = None
    mock_training_event.y = None
    mock_training_event.target_id = None
    mock_training_event.target_size = None
    mock_training_event.click_duration_ms = None
    mock_training_event.delta_y = None
    mock_training_event.task_index = 0
    mock_training_event.trial_index = 0
    mock_training_event.text_length = 0  # Fixed: was causing syntax error
    mock_training_event.backspace_count = 0
    mock_training_event.correction_count = 0
    mock_training_event.total_duration_ms = 150.0
    mock_training_event.pause_duration_ms = 0
    mock_training_event.metadata = {}

    mock_training_feature = Mock()
    mock_training_feature.user_id = mock_user.id
    mock_training_feature.session_id = "session-1"
    mock_training_feature.task_type = "controlled_typing"
    mock_training_feature.task_index = 0
    mock_training_feature.trial_index = 0
    mock_training_feature.device_id = "device-1"
    mock_training_feature.created_at = None
    mock_training_feature.typing_speed = 5.0
    mock_training_feature.mean_key_hold = 100.0
    mock_training_feature.std_key_hold = 10.0
    mock_training_feature.mean_flight_time = 50.0
    mock_training_feature.std_flight_time = 5.0
    mock_training_feature.backspace_rate = 0.0
    mock_training_feature.correction_rate = 0.0
    mock_training_feature.pause_mean = 0.0
    mock_training_feature.pause_std = 0.0
    mock_training_feature.total_duration_ms = 150.0
    mock_training_feature.mouse_speed_mean = 0.0
    mock_training_feature.mouse_speed_std = 0.0
    mock_training_feature.mouse_acceleration = 0.0
    mock_training_feature.click_interval_mean = 0.0
    mock_training_feature.scroll_speed = 0.0
    mock_training_feature.trajectory_length = 0.0
    mock_training_feature.direction_changes = 0
    mock_training_feature.target_acquisition_mean = 0.0
    mock_training_feature.feature_vector = {"typing_speed": 5.0, "accuracy": 0.95}

    mock_behavioral_event = Mock()
    mock_behavioral_event.id = "behavior-1"
    mock_behavioral_event.user_id = mock_user.id
    mock_behavioral_event.session_id = "session-1"
    mock_behavioral_event.timestamp = None
    mock_behavioral_event.event_type = "keystroke"
    mock_behavioral_event.key_code = 65
    mock_behavioral_event.key_char = "a"
    mock_behavioral_event.dwell_time_ms = 100.0
    mock_behavioral_event.flight_time_ms = 50.0
    mock_behavioral_event.x = None
    mock_behavioral_event.y = None
    mock_behavioral_event.delta_x = None
    mock_behavioral_event.delta_y = None
    mock_behavioral_event.velocity = None
    mock_behavioral_event.window_start = None
    mock_behavioral_event.window_end = None
    mock_behavioral_event.feature_vector = {"dwellMeanMs": 100.0, "flightMeanMs": 50.0}
    mock_behavioral_event.device_info = None

    mock_behavior_window = Mock()
    mock_behavior_window.id = "window-1"
    mock_behavior_window.user_id = mock_user.id
    mock_behavior_window.session_id = "session-1"
    mock_behavior_window.window_start = None
    mock_behavior_window.window_end = None
    mock_behavior_window.created_at = None
    mock_behavior_window.features = {"dwellMeanMs": 100.0, "flightMeanMs": 50.0, "keysPerSec": 10.0}

    mock_device_profile = Mock()
    mock_device_profile.user_id = mock_user.id
    mock_device_profile.fingerprint = "test-fingerprint"
    mock_device_profile.label = "Test Device"
    mock_device_profile.kind = "laptop"
    mock_device_profile.os = "Windows"
    mock_device_profile.browser = "Chrome"
    mock_device_profile.trust = "known"
    mock_device_profile.last_active = None

    # Test the function as service.py would call it
    zip_data, zip_name = build_user_export_zip(
        users=[mock_user],
        user_training_sessions={mock_user.id: [mock_training_session]},
        user_training_events={mock_user.id: [mock_training_event]},
        user_training_features={mock_user.id: [mock_training_feature]},
        user_auth_sessions={},  # Not needed for this test
        user_behavioral_events={mock_user.id: [mock_behavioral_event]},
        user_behavior_windows={mock_user.id: [mock_behavior_window]},
        user_device_profiles={mock_user.id: [mock_device_profile]},
        single_user=True
    )

    # Verify we got valid zip data
    assert isinstance(zip_data, bytes)
    assert isinstance(zip_name, str)
    assert len(zip_data) > 0
    assert zip_name.endswith('.zip')

    # Try to open the zip file to verify it's valid
    zip_buffer = io.BytesIO(zip_data)
    with zipfile.ZipFile(zip_buffer, "r") as zf:
        file_list = zf.namelist()
        print(f"Files in ZIP: {file_list}")

        # Should have training_data.csv and behavioral_data.csv for single user export
        assert "training_data.csv" in file_list
        assert "behavioral_data.csv" in file_list

        # Check that we can read the files
        training_data = zf.read("training_data.csv")
        behavioral_data = zf.read("behavioral_data.csv")

        assert len(training_data) > 0
        assert len(behavioral_data) > 0

        print(f"training_data.csv size: {len(training_data)} bytes")
        print(f"behavioral_data.csv size: {len(behavioral_data)} bytes")

    print("Service integration test passed!")

if __name__ == "__main__":
    print("Running service integration tests...")
    try:
        test_service_integration()
        print("\nAll integration tests passed!")
    except Exception as e:
        print(f"\nTest failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)