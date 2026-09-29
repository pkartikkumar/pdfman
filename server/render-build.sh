#!/usr/bin/env bash
# Exit on error
set -o errexit

# Install Node dependencies
npm install

# Install Python dependencies
pip install -r requirements.txt

# Download and extract portable LibreOffice or install via apt if permissions allow
# If running on Render standard environment:
apt-get update && apt-get install -y libreoffice || true