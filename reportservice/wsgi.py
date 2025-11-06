"""
WSGI config for reportservice project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/wsgi/
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'reportservice.settings')

application = get_wsgi_application()


# Import and start scheduler
try:
    from app.scheduler import start_scheduler
    start_scheduler()
except Exception as e:
    print(f"Failed to start scheduler: {e}")