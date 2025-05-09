#!/bin/bash

# create directory for build result if not exist yet
echo "Creating build directory..."
mkdir -p ../dist

# create directory for fetchly_delivery inside build directory if not exist yet
echo "Creating ../dist/fetchly_delivery directory..."
mkdir -p ../dist/fetchly_delivery

# copy content file from app_config.js.pekanbaru-smp to app_config.js
echo "Copying app_config.js.fetchly_delivery to app_config.js..."
cp src/deployment_config/app_config.js.fetchly_delivery src/app_config.js

# copy all files from . to ../dist/fetchly_delivery except for dist and node_modules and .git and .github and .sh files
echo "Copying all files to ../dist/fetchly_delivery..."
rsync -av --progress ./* ../dist/fetchly_delivery --exclude node_modules --exclude .next --exclude .git

# change directory to ../dist/fetchly_delivery
echo "Changing directory to ../dist/fetchly_delivery..."
cd ../dist/fetchly_delivery

# install dependencies
echo "Installing dependencies..."
npm install --legacy-peer-deps --force

# run the app
echo "Running the app..."
if [ "$1" == "staging" ]; then
  npm run dev
else
  npm run build
  npm run start
fi