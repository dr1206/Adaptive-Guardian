import zipfile
import io
import sys
from datetime import datetime, timezone
import uuid

# We'll define minimal mock classes that mimic the attributes used by export_builder
class MockTrainingEvent:
    def __init__(self, **kwargs):
        self.__dict__.update(kwargs)
        # Set default empty values for optional attributes
        self._export_user_id = kwargs.get('_export_user_id', None)
        # Ensure we have the attributes that _is_training_event_empty checks
        if not hasattr(self, 'key_code'):
            self.key_code = None
        if not hasattr(self, 'key_char'):
            self.key_char = None
        if not hasattr(self, 'x'):
            self.x = None
        if not hasattr(self, 'y'):
            self.y = None
        if not hasattr(self, 'dwell_time_ms'):
            self.dwell_time_ms = None
        if not hasattr(self, 'flight_time_ms'):
            self.flight_time_ms = None
        if not hasattr(self, 'delta_y'):
            self.delta_y = None

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

# Now import the actual functions from export_builder
sys.path.append('G:/New folder/adaptive-guardian/backend')
from app.domain.admin.export_builder import _write_combined_biometrics_csv, _is_training_event_empty, _is_behavior_window_empty

def test_empty_export():
    print("=== Testing empty export ===")
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
        _write_combined_biometrics_csv(
            zf,
            folder_path='',
            training_sessions=[],  # not used in this function
            training_events=[],
            training_features=[],
            behavioral_events=[],
            behavior_windows=[],
            user_id=uuid.uuid4()
        )
    zip_bytes = zip_buffer.getvalue()
    print(f'Zip size: {len(zip_bytes)} bytes')
    assert len(zip_bytes) > 0, "Zip should not be empty"
    zf = zipfile.ZipFile(io.BytesIO(zip_bytes))
    files = zf.namelist()
    print(f'Files in zip: {files}')
    assert len(files) == 1
    assert files[0] == 'behavioral_biometrics.csv'
    content = zf.read('behavioral_biometrics.csv').decode('utf-8')
    lines = content.strip().split('\n')
    print(f'Number of lines: {len(lines)}')
    if len(lines) >= 1:
        print(f'Header: {lines[0]}')
        # Check that header is not empty and contains expected columns
        assert len(lines[0]) > 0
        assert 'record_type' in lines[0]
        assert 'user_id' in lines[0]
        # If there are more than 1 line, then there are data rows (should be exactly 1 header line for empty data)
        if len(lines) > 1:
            print(f'WARNING: Found {len(lines)-1} data rows, expected 0')
            for i, line in enumerate(lines[1:], start=1):
                print(f'  Line {i}: {line}')
        else:
            print('SUCCESS: Only header present, no data rows')
    else:
        print('ERROR: No content in CSV')
        raise AssertionError('CSV content is empty')

def test_non_empty_export():
    print("\n=== Testing non-empty export (with mock data) ===")
    # Create a mock behavioral event
    event_id = uuid.uuid4()
    user_id = uuid.uuid4()
    now = datetime.now(timezone.utc)
    mock_event = MockBehavioralEvent(
        id=event_id,
        user_id=user_id,
        event_type='keystroke',
        timestamp=now,
        key_code=65,
        key_char='A',
        dwell_time_ms=100.0,
        flight_time_ms=50.0,
        feature_vector={'dwellMeanMs': 100.0, 'flightMeanMs': 50.0}
    )
    # Set _export_user_id (the function will use this)
    mock_event._export_user_id = user_id

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
            user_id=user_id  # this is ignored if _export_user_id is set
        )
    zip_bytes = zip_buffer.getvalue()
    print(f'Zip size: {len(zip_bytes)} bytes')
    assert len(zip_bytes) > 0, "Zip should not be empty"
    zf = zipfile.ZipFile(io.BytesIO(zip_bytes))
    files = zf.namelist()
    print(f'Files in zip: {files}')
    assert len(files) == 1
    assert files[0] == 'behavioral_biometrics.csv'
    content = zf.read('behavioral_biometrics.csv').decode('utf-8')
    lines = content.strip().split('\n')
    print(f'Number of lines: {len(lines)}')
    assert len(lines) >= 2, "Expected at least header and one data row"
    print(f'Header: {lines[0]}')
    print(f'First data row: {lines[1]}')
    # Check that the data row contains our event's values
    assert str(event_id) in lines[1]
    assert str(user_id) in lines[1]
    assert 'keystroke' in lines[1]
    assert '65' in lines[1]  # key_code
    assert 'A' in lines[1]   # key_char
    print('SUCCESS: Non-empty export contains expected data')

if __name__ == '__main__':
    test_empty_export()
    test_non_empty_export()
    print('\nAll tests passed.')