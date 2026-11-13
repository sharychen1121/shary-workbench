# Shary Health sync setup

This repository now contains:
- The GitHub Pages dashboard under “运动健康”.
- A Cloudflare Worker/D1 API in `worker/`.
- An iOS HealthKit companion Xcode project in `ios/SharyHealthSync.xcodeproj`.

## Deploy the Cloudflare API

On a machine with Node.js and Wrangler installed:
1. Create D1: `npx wrangler d1 create shary-health`.
2. Copy its database ID into `worker/wrangler.toml`.
3. From `worker/`, apply schema: `npx wrangler d1 migrations apply shary-health --remote`.
4. Generate a unique secret (for example, `openssl rand -hex 32`) and set it with `npx wrangler secret put HEALTH_SYNC_TOKEN`. Use the same secret in the iPhone app and the website's connection form. Never commit it.
5. Deploy from `worker/` with `npx wrangler deploy`. Copy the resulting `https://…workers.dev` URL.

## Build and install the iPhone companion

On a Mac with Xcode:
1. Open `ios/SharyHealthSync.xcodeproj`.
2. Select your Apple development team for signing. The project includes HealthKit and Background Delivery entitlements.
3. Build/install on the iPhone.
4. Enter the Worker URL and the secret set above, then choose “授权并同步健康数据” and grant Health permissions.

The app sends daily aggregate metrics and workout summaries to the Worker's D1 database over HTTPS. The website reads the selected week using the same secret, stored in that browser's local storage. Background delivery follows iOS scheduling policy and is not guaranteed to be immediate. No health data or secret is included in this repository.
