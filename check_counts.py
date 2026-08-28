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
        # We have the database
        break
    training_sessions_count = await TrainingSession.count()
    training_events_count = await TrainingEvent.count()
    training_features_count = await TrainingFeature.count()
    behavioral_events_count = await BehavioralEvent.count()
    behavior_windows_count = await BehaviorWindow.count()
    print(f'training_sessions | {training_sessions_count}')
    print(f'training_events | {training_events_count}')
    print(f'training_features | {training_features_count}')
    print(f'behavioral_events | {behavioral_events_count}')
    print(f'behavior_windows | {behavior_windows_count}')

if __name__ == '__main__':
    asyncio.run(main())