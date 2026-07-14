"""
Feature extraction for keystroke dynamics and mouse dynamics.

Per ADR-0005: extracts ~120 raw features per 60-second window,
which are then reduced to top-36 via mRMR selection (Sprint 1).
"""


def extract_keystroke_features(events: list[dict]) -> dict[str, float]:
    raise NotImplementedError


def extract_mouse_features(events: list[dict]) -> dict[str, float]:
    raise NotImplementedError


def extract_window_features(keystroke_events: list[dict], mouse_events: list[dict]) -> dict[str, float]:
    features = {}
    features.update(extract_keystroke_features(keystroke_events))
    features.update(extract_mouse_features(mouse_events))
    return features
