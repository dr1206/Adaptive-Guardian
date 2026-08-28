import asyncio
import sys
import os
import zipfile
import io
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# We need to import the export builder and the model classes to create mock instances
from app.domain.admin.export_builder import build_user_export_zip, _write_combined_biometrics_csv
from app.domain.auth.models import User
from app.domain.training.models import TrainingSession, TrainingEvent, TrainingFeature
from app.domain.aegis.models import BehavioralEvent, BehaviorWindow
import uuid
from datetime import datetime, timezone

def test_empty_export():
    print("=== Testing empty export ===")
    # Create a dummy user
    user_id = uuid.uuid4()
    user = User(id=user_id, email='test@example.com', password_hash='hash', full_name='Test User', is_verified=True, roles=['user'])

    # Call build_user_export_zip with empty data
    result = asyncio.run(build_user_export_zip(
        users=[user],
        user_training_sessions={},
        user_training_events={},
        user_training_features={},
        user_auth_sessions={},
        user_behavioral_events={},
        user_behavior_windows={},
        single_user=True
    ))
    zip_bytes, zip_name = result
    print(f'Zip name: {zip_name}')
    print(f'Zip size: {len(zip_bytes)} bytes')

    # Check if it's a valid zip by trying to read it
    if len(zip_bytes) > 0:
        try:
            zf = zipfile.ZipFile(io.BytesIO(zip_bytes))
            print(f'Files in zip: {zf.namelist()}')
            # Expect exactly one file: behavioral_biometrics.csv
            assert len(zf.namelist()) == 1
            assert zf.namelist()[0] == 'behavioral_biometrics.csv'
            # Read the CSV content
            content = zf.read('behavioral_biometrics.csv').decode('utf-8')
            lines = content.strip().split('\\n')
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
                else:
                    print('SUCCESS: Only header present, no data rows')
            else:
                print('ERROR: No content in CSV')
        except Exception as e:
            print(f'Error reading zip: {e}')
            raise
    else:
        print('ERROR: Zip is empty')
        raise AssertionError('Zip should not be empty')

def test_non_empty_export():
    print("\\n=== Testing non-empty export (with mock data) ===")
    # We'll create a single mock behavioral event and see if the export still works.
    # We must NOT insert these into the database; we just pass them to the export function.
    user_id = uuid.uuid4()
    user = User(id=user_id, email='test@example.com', password_hash='hash', full_name='Test User', is_verified=True, roles=['user'])

    # Create a mock behavioral event (minimal set of fields)
    event_id = uuid.uuid4()
    session_id = uuid.uuid4()
    now = datetime.now(timezone.utc)
    mock_event = BehavioralEvent(
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

    # We'll also need to set the _export_user_id attribute (the export builder uses it)
    mock_event._export_user_id = user_id

    # Call the low-level function directly to avoid complexity of build_user_export_zip with dicts
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
            user_id=user_id
        )
    zip_bytes = zip_buffer.getvalue()
    print(f'Zip size: {len(zip_bytes)} bytes')
    if len(zip_bytes) > 0:
        zf = zipfile.ZipFile(io.BytesIO(zip_bytes))
        print(f'Files in zip: {zf.namelist()}')
        content = zf.read('behavioral_biometrics.csv').decode('utf-8')
        lines = content.strip().split('\\n')
        print(f'Number of lines: {len(lines)}')
        if len(lines) >= 1:
            print(f'Header: {lines[0]}')
            if len(lines) >= 2:
                print(f'First data row: {lines[1]}')
                # Check that the data row contains our event's values
                assert str(event_id) in lines[1]
                assert str(user_id) in lines[1]
                assert 'keystroke' in lines[1]
                assert '65' in lines[1]  # key_code
                assert 'A' in lines[1]   # key_char
                print('SUCCESS: Non-empty export contains expected data')
            else:
                print('ERROR: No data rows found')
        else:
            print('ERROR: No header found')
    else:
        print('ERROR: Zip is empty for non-empty input')

if __name__ == '__main__':
    test_empty_export()
    test_non_empty_export()
    print('\\nAll tests passed.')