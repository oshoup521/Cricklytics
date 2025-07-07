# Render Build Script
# This script will be used as the build command in Render

#!/bin/bash
set -e

echo "Starting build process..."

# Upgrade pip and install build tools
python -m pip install --upgrade pip
python -m pip install --upgrade setuptools wheel

# Install requirements one by one to identify problematic packages
echo "Installing FastAPI..."
pip install fastapi==0.104.1

echo "Installing Uvicorn..."
pip install uvicorn==0.24.0

echo "Installing Pydantic..."
pip install pydantic==2.5.0

echo "Installing PyJWT..."
pip install PyJWT==2.8.0

echo "Installing bcrypt..."
pip install bcrypt==4.0.1

echo "Installing python-multipart..."
pip install python-multipart==0.0.6

echo "Build completed successfully!"
