# PWA Icons

This directory should contain the following icon files for PWA support:

- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png (maskable)
- icon-384x384.png
- icon-512x512.png (maskable)

## Generating Icons

You can generate icons using a tool like:

1. **PWA Asset Generator**: `npx pwa-asset-generator logo.svg ./public/icons`
2. **Favicon.io**: https://favicon.io/
3. **RealFaviconGenerator**: https://realfavicongenerator.net/

## Requirements

- All icons should be square PNG files
- The 192x192 and 512x512 icons should have the "maskable" purpose
- Icons should have transparent or solid background
- Use the brand color #6366f1 (indigo-500)

## Quick Script

```bash
# Install pwa-asset-generator
npm install -g pwa-asset-generator

# Generate all icons from a source SVG
npx pwa-asset-generator source-icon.svg ./public/icons --background "#0f0f0f" --padding "10%"
```
