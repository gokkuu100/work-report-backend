#!/bin/bash

# Run migrations
echo "Running migrations..."
alembic upgrade head

# Initialize DB (Run the python script explicitly to see errors)
echo "Initializing Database..."
python -m app.db.init_db_script

# Start the application
echo "Starting Uvicorn..."
uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
