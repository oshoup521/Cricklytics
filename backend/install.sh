#!/bin/bash
set -e

echo "Installing packages individually to avoid metadata issues..."

# Upgrade pip first
python -m pip install --upgrade pip

# Install packages one by one
echo "Installing FastAPI..."
pip install fastapi==0.115.0

echo "Installing Uvicorn..."
pip install uvicorn==0.32.0

echo "Installing Pydantic..."
pip install pydantic==2.10.3

echo "Installing PyJWT..."
pip install PyJWT==2.10.1

echo "Installing bcrypt..."
pip install --no-build-isolation bcrypt==4.2.1

echo "Installing python-multipart..."
pip install python-multipart==0.0.18

echo "All packages installed successfully!"
python -c "import fastapi, uvicorn, pydantic, jwt, bcrypt; print('✅ All imports working!')"
