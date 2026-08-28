#!/usr/bin/env python3
"""Test script to verify export_builder.py correctly filters out empty records."""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from src.app.domain.admin.export_builder import (
    _is_training_event_empty,
    _is_behavior_window_empty
)
from unittest.mock import Mock

def test_is_training_event_empty():
    """Test that _is_training_event_empty correctly identifies empty events."""
    print("Testing _is_training_event_empty function...")

    # Test completely empty event
    empty_event = Mock()
    empty_event.key_code = None
    empty_event.key_char = None
    empty_event.x = None
    empty_event.y = None
    empty_event.dwell_time_ms = None
    empty_event.flight_time_ms = None
    empty_event.delta_y = None

    assert _is_training_event_empty(empty_event) == True
    print("  [PASS] Completely empty event correctly identified as empty")

    # Test event with key_code
    event_with_key = Mock()
    event_with_key.key_code = 65  # 'A'
    event_with_key.key_char = None
    event_with_key.x = None
    event_with_key.y = None
    event_with_key.dwell_time_ms = None
    event_with_key.flight_time_ms = None
    event_with_key.delta_y = None

    assert _is_training_event_empty(event_with_key) == False
    print("  [PASS] Event with key_code correctly identified as non-empty")

    # Test event with key_char
    event_with_char = Mock()
    event_with_char.key_code = None
    event_with_char.key_char = "a"
    event_with_char.x = None
    event_with_char.y = None
    event_with_char.dwell_time_ms = None
    event_with_char.flight_time_ms = None
    event_with_char.delta_y = None

    assert _is_training_event_empty(event_with_char) == False
    print("  [PASS] Event with key_char correctly identified as non-empty")

    # Test event with coordinates
    event_with_coords = Mock()
    event_with_coords.key_code = None
    event_with_coords.key_char = None
    event_with_coords.x = 100
    event_with_coords.y = 200
    event_with_coords.dwell_time_ms = None
    event_with_coords.flight_time_ms = None
    event_with_coords.delta_y = None

    assert _is_training_event_empty(event_with_coords) == False
    print("  [PASS] Event with coordinates correctly identified as non-empty")

    # Test event with dwell time
    event_with_dwell = Mock()
    event_with_dwell.key_code = None
    event_with_dwell.key_char = None
    event_with_dwell.x = None
    event_with_dwell.y = None
    event_with_dwell.dwell_time_ms = 100.0
    event_with_dwell.flight_time_ms = None
    event_with_dwell.delta_y = None

    assert _is_training_event_empty(event_with_dwell) == False
    print("  [PASS] Event with dwell time correctly identified as non-empty")

    # Test event with flight time
    event_with_flight = Mock()
    event_with_flight.key_code = None
    event_with_flight.key_char = None
    event_with_flight.x = None
    event_with_flight.y = None
    event_with_dwell.dwell_time_ms = None
    event_with_flight.flight_time_ms = 50.0
    event_with_flight.delta_y = None

    assert _is_training_event_empty(event_with_flight) == False
    print("  [PASS] Event with flight time correctly identified as non-empty")

    # Test event with delta_y
    event_with_delta = Mock()
    event_with_delta.key_code = None
    event_with_delta.key_char = None
    event_with_delta.x = None
    event_with_delta.y = None
    event_with_delta.dwell_time_ms = None
    event_with_delta.flight_time_ms = None
    event_with_delta.delta_y = 10.0

    assert _is_training_event_empty(event_with_delta) == False
    print("  [PASS] Event with delta_y correctly identified as non-empty")

    print("All _is_training_event_empty tests passed!\n")

def test_is_behavior_window_empty():
    """Test that _is_behavior_window_empty correctly identifies empty windows."""
    print("Testing _is_behavior_window_empty function...")

    # Test completely empty window
    empty_window = Mock()
    empty_window.features = {}

    assert _is_behavior_window_empty(empty_window.features) == True
    print("  [PASS] Completely empty window correctly identified as empty")

    # Test window with all zero values
    zero_window = Mock()
    zero_window.features = {
        "dwellMeanMs": 0,
        "dwellStdMs": 0,
        "flightMeanMs": 0,
        "flightStdMs": 0,
        "keysPerSec": 0,
        "velocityMean": 0,
        "velocityStd": 0,
        "accelerationMean": 0,
        "accelerationStd": 0,
        "curvatureMean": 0,
        "curvatureStd": 0,
        "clickCount": 0,
        "scrollAmount": 0,
        "mouseTravelPx": 0
    }

    assert _is_behavior_window_empty(zero_window.features) == True
    print("  [PASS] Window with all zero values correctly identified as empty")

    # Test window with one non-zero value
    non_zero_window = Mock()
    non_zero_window.features = {
        "dwellMeanMs": 100,  # Non-zero
        "dwellStdMs": 0,
        "flightMeanMs": 0,
        "flightStdMs": 0,
        "keysPerSec": 0,
        "velocityMean": 0,
        "velocityStd": 0,
        "accelerationMean": 0,
        "accelerationStd": 0,
        "curvatureMean": 0,
        "curvatureStd": 0,
        "clickCount": 0,
        "scrollAmount": 0,
        "mouseTravelPx": 0
    }

    assert _is_behavior_window_empty(non_zero_window.features) == False
    print("  [PASS] Window with one non-zero value correctly identified as non-empty")

    # Test window with one non-empty string value (though features should be numeric)
    # Actually, looking at the model, features are dict[str, float], so this shouldn't happen
    # But let's test empty string anyway
    empty_string_window = Mock()
    empty_string_window.features = {
        "dwellMeanMs": "",  # Empty string
        "dwellStdMs": 0,
        "flightMeanMs": 0,
        "flightStdMs": 0,
        "keysPerSec": 0,
        "velocityMean": 0,
        "velocityStd": 0,
        "accelerationMean": 0,
        "accelerationStd": 0,
        "curvatureMean": 0,
        "curvatureStd": 0,
        "clickCount": 0,
        "scrollAmount": 0,
        "mouseTravelPx": 0
    }

    assert _is_behavior_window_empty(empty_string_window.features) == True
    print("  [PASS] Window with empty string value correctly identified as empty")

    print("All _is_behavior_window_empty tests passed!\n")

def test_filtering_logic():
    """Test that our filtering logic in the export functions works correctly."""
    print("Testing filtering logic in export functions...")

    # Mock some events
    events = []

    # Add an empty event
    empty_event = Mock()
    empty_event.key_code = None
    empty_event.key_char = None
    empty_event.x = None
    empty_event.y = None
    empty_event.dwell_time_ms = None
    empty_event.flight_time_ms = None
    empty_event.delta_y = None
    empty_event.timestamp = None
    empty_event.event_type = "test"
    empty_event.window_start = None
    empty_event.window_end = None
    empty_event.feature_vector = {}
    events.append(empty_event)

    # Add a non-empty event
    non_empty_event = Mock()
    non_empty_event.key_code = 65
    non_empty_event.key_char = None
    non_empty_event.x = None
    non_empty_event.y = None
    non_empty_event.dwell_time_ms = None
    non_empty_event.flight_time_ms = None
    non_empty_event.delta_y = None
    non_empty_event.timestamp = None
    non_empty_event.event_type = "test"
    non_empty_event.window_start = None
    non_empty_event.window_end = None
    non_empty_event.feature_vector = {"test_feature": 1.0}
    events.append(non_empty_event)

    # Apply our filtering
    filtered_events = [event for event in events if not _is_training_event_empty(event)]

    assert len(filtered_events) == 1
    assert filtered_events[0] == non_empty_event
    print("  [PASS] Behavioral events filtering correctly removes empty events")

    # Mock some windows
    windows = []

    # Add an empty window
    empty_window = Mock()
    empty_window.features = {}
    empty_window.window_start = None
    empty_window.window_end = None
    empty_window.created_at = None
    windows.append(empty_window)

    # Add a non-empty window
    non_empty_window = Mock()
    non_empty_window.features = {"dwellMeanMs": 100.0}
    non_empty_window.window_start = None
    non_empty_window.window_end = None
    non_empty_window.created_at = None
    windows.append(non_empty_window)

    # Apply our filtering
    filtered_windows = [window for window in windows if not _is_behavior_window_empty(window.features)]

    assert len(filtered_windows) == 1
    assert filtered_windows[0] == non_empty_window
    print("  [PASS] Behavioral windows filtering correctly removes empty windows")

    print("All filtering logic tests passed!\n")

if __name__ == "__main__":
    print("Running export filtering tests...")
    try:
        test_is_training_event_empty()
        test_is_behavior_window_empty()
        test_filtering_logic()
        print("All tests passed!")
    except Exception as e:
        print(f"\nTest failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)