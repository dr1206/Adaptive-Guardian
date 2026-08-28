import asyncio
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from app.domain.admin.export_builder import build_user_export_zip
from app.domain.auth.models import User
import uuid

async def test_empty_export():
    # Create a dummy user with a valid UUID
    user_id = uuid.uuid4()
    user = User(id=user_id, email='test@example.com', password_hash='hash', full_name='Test User', is_verified=True, roles=['user'])

    # Call build_user_export_zip with empty data
    result = await build_user_export_zip(
        users=[user],
        user_training_sessions={},
        user_training_events={},
        user_training_features={},
        user_auth_sessions={},
        user_behavioral_events={},
        user_behavior_windows={},
        single_user=True
    )
    zip_bytes, zip_name = result
    print(f'Zip name: {zip_name}')
    print(f'Zip size: {len(zip_bytes)} bytes')

    # Check if it's a valid zip by trying to read it
    import zipfile
    import io
    if len(zip_bytes) > 0:
        try:
            zf = zipfile.ZipFile(io.BytesIO(zip_bytes))
            print(f'Files in zip: {zf.namelist()}')
            # Check the CSV files for headers only
            for filename in zf.namelist():
                print(f'--- Contents of {filename} ---')
                content = zf.read(filename).decode('utf-8')
                print(content)
        except Exception as e:
            print(f'Error reading zip: {e}')
    else:
        print('Zip is empty')

if __name__ == '__main__':
    asyncio.run(test_empty_export())