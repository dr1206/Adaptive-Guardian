#!/usr/bin/env python3
"""Generate test export data to examine"""

import asyncio
import sys
import os
import zipfile
import io
from datetime import datetime, timezone
import uuid

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from app.domain.admin.export_builder import _write_combined_biometrics_csv
from app.domain.aegis.models import BehavioralEvent, BehaviorWindow
from app.domain.auth.models import User

# Create mock data that resembles real data
class MockBehavioralEvent:
    def __init__(self, **kwargs):
        self.__dict__.update(kwargs)
        self._export_user_id = kwargs.get('_export_user_id', None)
        self.event_type = kwargs.get('event_type', '')
        self.timestamp = kwargs.get('timestamp', datetime.now(timezone.utc))
        self.key_code = kwargs.get('key_code', None)
        self.key_char = kwargs.get('key_char', None)
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

async def main():
    print("Generating test export...")

    user_id = uuid.uuid4()
    session_id = uuid.uuid4()
    now = datetime.now(timezone.utc)

    # Create some mock behavioral events
    events = []
    for i in range(5):
        event_time = now.timestamp() - (i * 1000)  # Spread over 5 seconds
        event = MockBehavioralEvent(
            id=uuid.uuid4(),
            user_id=user_id,
            session_id=session_id,
            event_type='keystroke' if i % 2 == 0 else 'mouse_move',
            timestamp=datetime.fromtimestamp(event_time, tz=timezone.utc),
            key_code=65 + i if i % 2 == 0 else None,
            key_char='A' if i % 2 == 0 else None,
            dwell_time_ms=100.0 + i if i % 2 == 0 else None,
            flight_time_ms=50.0 + i if i % 2 == 0 else None,
            x=float(100 + i*10) if i % 2 == 1 else None,
            y=float(200 + i*10) if i % 2 == 1 else None,
            feature_vector={
                'dwellMeanMs': 100.0 + i if i % 2 == 0 else 0.0,
                'flightMeanMs': 50.0 + i if i % 2 == 0 else 0.0,
                'keysPerSec': 2.0 + i*0.5 if i % 2 == 0 else 0.0
            } if i % 2 == 0 else {
                'velocityMean': 1.5 + i*0.1,
                'velocityStd': 0.2,
                'accelerationMean': 0.01,
                'accelerationStd': 0.005,
                'curvatureMean': 0.1,
                'curvatureStd': 0.02,
                'clickCount': i,
                'scrollAmount': 10.0 * i,
                'mouseTravelPx': 50.0 * i
            }
        )
        event._export_user_id = user_id
        events.append(event)

    # Create some mock behavior windows
    windows = []
    for i in range(3):
        window_start = now.timestamp() - ((i+1) * 15000)  # Every 15 seconds
        window_end = window_start + 10000  # 10 second windows
        window = MockBehaviorWindow(
            id=uuid.uuid4(),
            user_id=user_id,
            session_id=session_id,
            window_start=datetime.fromtimestamp(window_start, tz=timezone.utc),
            window_end=datetime.fromtimestamp(window_end, tz=timezone.utc),
            created_at=datetime.fromtimestamp(window_end, tz=timezone.utc),
            features={
                'dwellMeanMs': 120.0 + i*10,
                'dwellStdMs': 20.0 + i*2,
                'flightMeanMs': 80.0 + i*5,
                'flightStdMs': 15.0 + i*1,
                'keysPerSec': 3.5 + i*0.5,
                'velocityMean': 1.2 + i*0.1,
                'velocityStd': 0.3,
                'accelerationMean': 0.02,
                'accelerationStd': 0.008,
                'curvatureMean': 0.15,
                'curvatureStd': 0.03,
                'clickCount': 2 + i,
                'scrollAmount': 50.0 + i*10,
                'mouseTravelPx': 200.0 + i*50
            }
        )
        window._export_user_id = user_id
        windows.append(window)

    # Generate export
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
        _write_combined_biometrics_csv(
            zf,
            folder_path='',
            training_sessions=[],
            training_events=[],
            training_features=[],
            behavioral_events=events,
            behavior_windows=windows,
            user_id=user_id
        )

    zip_bytes = zip_buffer.getvalue()
    print(f'Generated export size: {len(zip_bytes)} bytes')

    # Extract and display the CSV
    if len(zip_bytes) > 0:
        zf = zipfile.ZipFile(io.BytesIO(zip_bytes))
        csv_filename = zf.namelist()[0]
        print(f'CSV file in export: {csv_filename}')
        csv_content = zf.read(csv_filename).decode('utf-8')
        print('\n=== CSV CONTENT ===')
        print(csv_content)

        # Save to file for easier examination
        with open('test_export_output.csv', 'w') as f:
            f.write(csv_content)
        print('\nSaved CSV to test_export_output.csv')

if __name__ == '__main__':
    asyncio.run(main())