#!/usr/bin/env python3
"""Test script to verify export_builder.py works correctly."""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from src.app.domain.admin.export_builder import (
    build_user_export_zip,
    _write_behavioral_events,
    _write_behavior_windows
)
import zipfile
import io
from unittest.mock import Mock

def test_write_functions():
    """Test that the write functions don't crash."""
    print("Testing _write_behavioral_events and _write_behavior_windows...")

    # Create a mock ZIP file
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        # Test with empty lists
        _write_behavioral_events(zf, "", [])
        _write_behavior_windows(zf, "", [])

        # Test with mock data
        mock_event = Mock()
        mock_event.id = "test-id"
        mock_event.user_id = "test-user"
        mock_event.session_id = "test-session"
        mock_event.timestamp = None
        mock_event.event_type = "test"
        mock_event.key_code = None
        mock_event.key_char = None
        mock_event.dwell_time_ms = None
        mock_event.flight_time_ms = None
        mock_event.x = None
        mock_event.y = None
        mock_event.delta_x = None
        mock_event.delta_y = None
        mock_event.velocity = None
        mock_event.window_start = None
        mock_event.window_end = None
        mock_event.feature_vector = {}

        mock_window = Mock()
        mock_window.id = "test-window-id"
        mock_window.user_id = "test-user"
        mock_window.session_id = "test-session"
        mock_window.window_start = None
        mock_window.window_end = None
        mock_window.created_at = None
        mock_window.features = {}

        _write_behavioral_events(zf, "", [mock_event])
        _write_behavior_windows(zf, "", [mock_window])

    print("Write functions test passed!")

def test_build_user_export_zip():
    """Test that build_user_export_zip doesn't crash."""
    print("Testing build_user_export_zip...")

    # Test with empty data
    zip_data, zip_name = build_user_export_zip(
        users=[],
        user_training_sessions={},
        user_training_events={},
        user_training_features={},
        user_auth_sessions={},
        user_behavioral_events={},
        user_behavior_windows={},
        user_device_profiles={},
        single_user=False
    )

    # Verify we got valid zip data
    assert isinstance(zip_data, bytes)
    assert isinstance(zip_name, str)
    assert len(zip_data) > 0

    # Test with single_user=True but empty users (should not crash)
    zip_data, zip_name = build_user_export_zip(
        users=[],
        user_training_sessions={},
        user_training_events={},
        user_training_features={},
        user_auth_sessions={},
        user_behavioral_events={},
        user_behavior_windows={},
        user_device_profiles={},
        single_user=True
    )

    assert isinstance(zip_data, bytes)
    assert isinstance(zip_name, str)

    print("build_user_export_zip test passed!")

if __name__ == "__main__":
    print("Running export_builder tests...")
    try:
        test_write_functions()
        test_build_user_export_zip()
        print("\nAll tests passed!")
    except Exception as e:
        print(f"\nTest failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)