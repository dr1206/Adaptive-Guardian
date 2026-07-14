"""Gunicorn configuration for production deployment."""

import multiprocessing

# Bind
bind = "0.0.0.0:8000"

# Worker processes
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "uvicorn.workers.UvicornWorker"

# Timeouts
timeout = 30
keepalive = 5
graceful_timeout = 10

# Logging
accesslog = "-"
errorlog = "-"
loglevel = "info"
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)sus'

# Process naming
proc_name = "adaptive-guardian"

# Server mechanics
preload_app = True
max_requests = 10_000
max_requests_jitter = 1_000
