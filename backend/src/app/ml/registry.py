"""
Model registry for loading and versioning ML artifacts from MinIO.

Per ADR-0015: models are loaded in-process via joblib.
Production pathway: S3 with versioned prefixes.
"""


def load_lightgbm_model(version: str | None = None):
    raise NotImplementedError


def load_ocsvm_model(version: str | None = None):
    raise NotImplementedError


def load_mrmr_selector(version: str | None = None):
    raise NotImplementedError
