from __future__ import annotations

from pydantic import BaseModel, Field


class TrainingEventIn(BaseModel):
    """A single raw behavioral event from the frontend training collector."""

    model_config = {"populate_by_name": True}

    session_id: str = Field(validation_alias="sessionId")
    task_type: str = Field(validation_alias="taskType")  # keydown, keyup, mouse_move, mouse_click, mouse_scroll, task_start, task_end
    event_type: str = Field(validation_alias="eventType")
    timestamp: float  # epoch ms
    device_id: str | None = Field(None, validation_alias="deviceId")
    page: str | None = None
    key_code: int | None = Field(None, validation_alias="keyCode")
    key_char: str | None = Field(None, validation_alias="keyChar")
    dwell_time_ms: float | None = Field(None, validation_alias="dwellTimeMs")
    flight_time_ms: float | None = Field(None, validation_alias="flightTimeMs")
    x: float | None = None
    y: float | None = None
    target_id: str | None = Field(None, validation_alias="targetId")
    target_size: str | None = Field(None, validation_alias="targetSize")
    click_duration_ms: float | None = Field(None, validation_alias="clickDurationMs")
    delta_y: float | None = Field(None, validation_alias="deltaY")
    task_index: int | None = Field(None, validation_alias="taskIndex")
    trial_index: int | None = Field(None, validation_alias="trialIndex")
    text_length: int | None = Field(None, validation_alias="textLength")
    backspace_count: int | None = Field(None, validation_alias="backspaceCount")
    correction_count: int | None = Field(None, validation_alias="correctionCount")
    total_duration_ms: float | None = Field(None, validation_alias="totalDurationMs")
    pause_duration_ms: float | None = Field(None, validation_alias="pauseDurationMs")
    metadata: dict = Field(default_factory=dict)


class TrainingBatchRequest(BaseModel):
    """Batch of raw behavioral events from a training task."""

    model_config = {"populate_by_name": True}

    session_id: str = Field(validation_alias="sessionId")
    task_type: str = Field(validation_alias="taskType")
    device_id: str | None = Field(None, validation_alias="deviceId")
    page: str | None = None
    events: list[TrainingEventIn]


class TrainingBatchResponse(BaseModel):
    accepted: int
    status: str


class TrainingSessionStart(BaseModel):
    model_config = {"populate_by_name": True}

    task_type: str = Field(validation_alias="taskType")
    device_id: str | None = Field(None, validation_alias="deviceId")
    page: str | None = None
    metadata: dict = Field(default_factory=dict)


class TrainingSessionStartResponse(BaseModel):
    session_id: str = Field(serialization_alias="sessionId")
    status: str


class TrainingSessionComplete(BaseModel):
    model_config = {"populate_by_name": True}

    session_id: str = Field(validation_alias="sessionId")
    task_type: str = Field(validation_alias="taskType")
    sample_count: int = Field(0, validation_alias="sampleCount")
    device_id: str | None = Field(None, validation_alias="deviceId")
    metadata: dict = Field(default_factory=dict)


class TrainingSessionCompleteResponse(BaseModel):
    session_id: str = Field(serialization_alias="sessionId")
    status: str
    sample_count: int = Field(serialization_alias="sampleCount")


class TrainingFeatureIn(BaseModel):
    """Derived features from a completed training task (computed client-side)."""

    model_config = {"populate_by_name": True}

    session_id: str = Field(validation_alias="sessionId")
    task_type: str = Field(validation_alias="taskType")
    task_index: int | None = Field(None, validation_alias="taskIndex")
    trial_index: int | None = Field(None, validation_alias="trialIndex")
    device_id: str | None = Field(None, validation_alias="deviceId")
    typing_speed: float | None = Field(None, validation_alias="typingSpeed")
    mean_key_hold: float | None = Field(None, validation_alias="meanKeyHold")
    std_key_hold: float | None = Field(None, validation_alias="stdKeyHold")
    mean_flight_time: float | None = Field(None, validation_alias="meanFlightTime")
    std_flight_time: float | None = Field(None, validation_alias="stdFlightTime")
    backspace_rate: float | None = Field(None, validation_alias="backspaceRate")
    correction_rate: float | None = Field(None, validation_alias="correctionRate")
    pause_mean: float | None = Field(None, validation_alias="pauseMean")
    pause_std: float | None = Field(None, validation_alias="pauseStd")
    total_duration_ms: float | None = Field(None, validation_alias="totalDurationMs")
    mouse_speed_mean: float | None = Field(None, validation_alias="mouseSpeedMean")
    mouse_speed_std: float | None = Field(None, validation_alias="mouseSpeedStd")
    mouse_acceleration: float | None = Field(None, validation_alias="mouseAcceleration")
    click_interval_mean: float | None = Field(None, validation_alias="clickIntervalMean")
    scroll_speed: float | None = Field(None, validation_alias="scrollSpeed")
    trajectory_length: float | None = Field(None, validation_alias="trajectoryLength")
    direction_changes: int | None = Field(None, validation_alias="directionChanges")
    target_acquisition_mean: float | None = Field(None, validation_alias="targetAcquisitionMean")
    feature_vector: dict[str, float] = Field(default_factory=dict, validation_alias="featureVector")


class TrainingFeatureBatchRequest(BaseModel):
    model_config = {"populate_by_name": True}

    features: list[TrainingFeatureIn]


class TrainingFeatureBatchResponse(BaseModel):
    accepted: int
    status: str


class TrainingProgressResponse(BaseModel):
    """Non-technical training progress for the participant UI."""

    status: str  # NOT_TRAINED, TRAINING, BASELINE_READY, MODEL_READY, MONITORING
    tasks_completed: int = Field(serialization_alias="tasksCompleted")
    total_tasks: int = Field(serialization_alias="totalTasks")
    samples_collected: int = Field(serialization_alias="samplesCollected")
    message: str