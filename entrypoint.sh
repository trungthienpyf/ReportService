#!/bin/sh
# Run migrations
python manage.py migrate
# Collect static files
python manage.py collectstatic
# Start Django server
python manage.py runserver 0.0.0.0:8000
