#!/bin/bash

set -e  # stop script if any command fails
set -o pipefail

echo "=== Preparing build directories..."

mkdir -p ../dist/spln_landing_page

echo "✔️ Build directories ready."

echo "=== Applying environment config..."
cp ../deployment_config/appConfig.ts.spln_landing_page ../app/appConfig.ts

echo "✔️ Config copied."

echo "=== Copying project files (excluding heavy folders)..."
rsync -av --progress ../ ../dist/spln_landing_page \
  --exclude node_modules \
  --exclude .next \
  --exclude .git \
  --exclude .github \
  --exclude "*.sh" \
  --exclude dist

echo "✔️ Project files copied."

cd ../dist/spln_landing_page

echo "=== Installing dependencies with memory-safe options..."
NODE_OPTIONS="--max-old-space-size=512" nice -n 10 npm install --legacy-peer-deps --no-audit --prefer-offline

echo "✔️ Dependencies installed."

if [ "$1" == "staging" ]; then
  echo "=== Starting app in development mode..."
  npm run dev
else
  if [ "$1" == "rebuild" ]; then
    echo "=== Building production version..."
    NODE_OPTIONS="--max-old-space-size=512" nice -n 10 npm run build
    echo "✔️ Build completed."
  fi

  echo "=== Starting app in production mode on port 6061..."
  npm run start -- -p 6062
fi
