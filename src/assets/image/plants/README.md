# Plant Images Directory

This directory contains local plant images for development mode.

## Structure
- `placeholder.svg` - Generic plant placeholder for missing images
- Individual plant images with UUID filenames (e.g., `5bd6c09e-5f0a-4af1-ab3a-ea7db9b4a38c.jpg`)

## Usage in Development
When running in development mode, the ImageUrlService automatically:
1. Detects Azure blob URLs 
2. Extracts the filename
3. Maps to local assets in this directory
4. Falls back to default-plant.svg if local image not found

## Adding Images
To add local images for testing:
1. Copy actual plant images to this directory
2. Use the UUID filename format: `{uuid}.jpg`
3. Or use the placeholder.svg as a template

## Console Output
You'll see logs like:
```
🔄 Using local fallback: https://plantcarestorage.blob.core.windows.net/... → assets/image/plants/filename.jpg
```

This is normal behavior in development mode and helps you track which images are being mapped to local fallbacks.

## Fixing Console Errors
The 404 errors you see are expected in development mode when local images don't exist. The service will automatically fall back to the default plant image after tracking the failure.
