# iPhone HealthKit companion

This companion reads selected HealthKit summaries with the user's authorization and uploads the last 30 days to the configured Cloudflare Worker over HTTPS. Background delivery is best-effort and follows iOS scheduling; it is not guaranteed to run in real time.

## Build in Xcode
1. On a Mac, create an iOS App project named `SharyHealthSync`, SwiftUI, iOS 17 or later.
2. Add `SharyHealthSyncApp.swift`, `ContentView.swift`, `HealthSyncManager.swift`, and `Keychain.swift` to the target.
3. In Signing & Capabilities, add HealthKit and HealthKit Background Delivery. Set the bundle identifier and select a signing team.
4. Replace the target Info.plist with the provided `Info.plist`, and add `SharyHealthSync.entitlements` as the target's Code Signing Entitlements.
5. Build and install on the iPhone. Enter the Worker URL and the same sync secret configured for the Worker. Tap “授权并同步健康数据” and grant the requested Health permissions.

Health data is not read until the user grants permission. The app uploads daily aggregates and workout summaries, not raw location routes.
