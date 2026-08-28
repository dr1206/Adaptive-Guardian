import zipfile
import io
import sys
from datetime import datetime, timezone
import uuid

# Define minimal mock classes with all required attributes
class MockTrainingEvent:
    def __init__(self, **kwargs):
        self.__dict__.update(kwargs)
        self._export_user_id = kwargs.get('_export_user_id', None)
        # Defaults for empty check
        self.key_code = kwargs.get('key_code', None)
        self.key_char = kwargs.get('key_char', None)
        self.x = kwargs.get('x', None)
        self.y = kwargs.get('y', None)
        self.dwell_time_ms = kwargs.get('dwell_time_ms', None)
        self.flight_time_ms = kwargs.get('flight_time_ms', None)
        self.delta_y = kwargs.get('delta_y', None)

class MockTrainingFeature:
    def __init__(self, **kwargs):
        self.__dict__.update(kwargs)
        self._export_user_id = kwargs.get('_export_user_id', None)
        self.feature_vector = kwargs.get('feature_vector', {})

class MockBehavioralEvent:
    def __init__(self, **kwargs):
        self.__dict__.update(kwargs)
        self._export_user_id = kwargs.get('_export_user_id', None)
        self.event_type = kwargs.get('event_type', '')
        self.timestamp = kwargs.get('timestamp', datetime.now(timezone.utc))
        self.key_code = kwargs.get('key_code', None)
        self.key_char = kwargs.get('key_char', None)  # BehavioralEvent may not have key_char but we set None
        self.dwell_time_ms = kwargs.get('dwell_time_ms', None)
        self.flight_time_ms = kwargs.get('flight_time_ms', None)
        self.x = kwargs.get('x', None)
        self.y = kwargs.get('y', None)
        self.delta_x = kwargs.get('delta_x', None)
        self.delta_y = kwargs.get('delta_y', None)
        self.velocity = kwargs.get('velocity', None)
        self.window_start = kwargs.get('window_start', None)
        self.window_end = kwargs.get('window_end', None)
        self.feature_vector = kwargs.get('feature_vector', {})
        self.device_info = kwargs.get('device_info', None)

class MockBehaviorWindow:
    def __init__(self, **kwargs):
        self.__dict__.update(kwargs)
        self._export_user_id = kwargs.get('_export_user_id', None)
        self.window_start = kwargs.get('window_start', None)
        self.window_end = kwargs.get('window_end', None)
        self.created_at = kwargs.get('created_at', None)
        self.features = kwargs.get('features', {})

# Import the actual functions
sys.path.append('G:/New folder/adaptive-guardian/backend')
from app.domain.admin.export_builder import _write_combined_biometrics_csv

def test_case_empty():
    print("--- Case 1: Zero behavioral data ---")
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
        _write_combined_biometrics_csv(
            zf,
            folder_path='',
            training_sessions=[],
            training_events=[],
            training_features=[],
            behavioral_events=[],
            behavior_windows=[],
            user_id=uuid.uuid4()
        )
    zip_bytes = zip_buffer.getvalue()
    assert len(zip_bytes) > 0, "Zip should not be empty"
    zf = zipfile.ZipFile(io.BytesIO(zip_bytes))
    files = zf.namelist()
    assert len(files) == 1
    assert files[0] == 'behavioral_biometrics.csv'
    content = zf.read('behavioral_biometrics.csv').decode('utf-8')
    lines = content.strip().split('\n')
    assert len(lines) == 1, f"Expected exactly 1 line (header), got {len(lines)} lines"
    header = lines[0]
    assert len(header) > 0
    assert 'record_type' in header
    assert 'user_id' in header
    print(f'Header: {header}')
    print('Result: PASS - header present, zero data rows')

def test_case_single_event():
    print("\\n--- Case 2: Single behavioral event ---")
    user_id = uuid.uuid4()
    event_id = uuid.uuid4()
    session_id = uuid.uuid4()
    now = datetime.now(timezone.utc)
    mock_event = MockBehavioralEvent(
        id=event_id,
        user_id=user_id,
        session_id=session_id,
        event_type='keystroke',
        timestamp=now,
        key_code=65,
        key_char='A',
        dwell_time_ms=100.0,
        flight_time_ms=50.0,
        feature_vector={'dwellMeanMs': 100.0, 'flightMeanMs': 50.0}
    )
    mock_event._export_user_id = user_id  # ensure set

    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
        _write_combined_biometrics_csv(
            zf,
            folder_path='',
            training_sessions=[],
            training_events=[],
            training_features=[],
            behavioral_events=[mock_event],
            behavior_windows=[],
            user_id=user_id  # ignored if _export_user_id set
        )
    zip_bytes = zip_buffer.getvalue()
    assert len(zip_bytes) > 0, "Zip should not be empty"
    zf = zipfile.ZipFile(io.BytesIO(zip_bytes))
    files = zf.namelist()
    assert len(files) == 1
    assert files[0] == 'behavioral_biometrics.csv'
    content = zf.read('behavioral_biometrics.csv').decode('utf-8')
    lines = content.strip().split('\n')
    assert len(lines) == 2, f"Expected header + 1 data row, got {len(lines)} lines"
    header = lines[0]
    data_row = lines[1]
    assert 'record_type' in header
    assert 'user_id' in header
    # Parse CSV simply by splitting on commas (no quoted commas in our data)
    parts = data_row.split(',')
    # Expect: record_type, source, user_id, session_id, timestamp, event_type, ...
    assert parts[0] == 'behavioral_event'
    assert parts[1] == 'continuous'
    assert parts[2] == str(user_id)
    assert parts[3] == str(session_id)
    assert parts[4] == now.isoformat()
    assert parts[5] == 'keystroke'
    assert parts[6] == '65'  # key_code
    assert parts[7] == 'A'   # key_char
    assert parts[8] == '100.0'  # dwell_time_ms
    assert parts[9] == '50.0'   # flight_time_ms
    # Check that feature vector values appear later in the row (after the fixed columns)
    # We know the header order; we can find the index of 'behavioral_fv_dwellMeanMs'
    # but for simplicity, just check that the values appear somewhere in the row
    assert '100.0' in data_row  # dwellMeanMs
    assert '50.0' in data_row   # flightMeanMs
    print(f'Header: {header}')
    print(f'Data row: {data_row}')
    print('Result: PASS - non-empty export works correctly')

def test_case_mixed_empty_and_nonempty():
    print("\\n--- Case 3: Mixed empty and non-empty (should behave like non-empty) ---")
    # Same as case 2 but also pass empty lists for other types
    user_id = uuid.uuid4()
    event_id = uuid.uuid4()
    session_id = uuid.uuid4()
    now = datetime.now(timezone.utc)
    mock_event = MockBehavioralEvent(
        id=event_id,
        user_id=user_id,
        session_id=session_id,
        event_type='keystroke',
        timestamp=now,
        key_code=65,
        key_char='A',
        dwell_time_ms=100.0,
        flight_time_ms=50.0,
        feature_vector={'dwellMeanMs': 100.0, 'flightMeanMs': 50.0}
    )
    mock_event._export_user_id = user_id

    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
        _write_combined_biometrics_csv(
            zf,
            folder_path='',
            training_sessions=[],  # empty
            training_events=[],    # empty
            training_features=[],  # empty
            behavioral_events=[mock_event],
            behavior_windows=[],   # empty
            user_id=user_id
        )
    zip_bytes = zip_buffer.getvalue()
    assert len(zip_bytes) > 0
    zf = zipfile.ZipFile(io.BytesIO(zip_bytes))
    files = zf.namelist()
    assert len(files) == 1
    assert files[0] == 'behavioral_biometrics.csv'
    content = zf.read('behavioral_biometrics.csv').decode('utf-8')
    lines = content.strip().split('\n')
    assert len(lines) == 2
    header = lines[0]
    data_row = lines[1]
    assert parts[0] == 'behavioral_event' if (parts := data_row.split(',')) else False
    assert parts[1] == 'continuous'
    assert parts[2] == str(user_id)
    assert parts[3] == str(session_id)
    assert parts[4] == now.isoformat()
    assert parts[5] == 'keystroke'
    assert parts[6] == '65'
    assert parts[7] == 'A'
    assert parts[8] == '100.0'
    assert parts[9] == '50.0'
    print('Result: PASS - mixed empty/non-empty behaves as non-empty')

if __name__ == '__main__':
    test_case_empty()
    test_case_single_event()
    test_case_mixed_empty_and_nonempty()
    print('\\nAll export fix tests passed.')