# FastTrack Deployment Guide

## Prerequisites

- Node.js installed
- EAS CLI installed and authenticated (`npm install -g eas-cli && eas login`)
- Apple Developer Program membership active
- App Store Connect account configured
- Bundle ID: `com.anthonyhorner.fasttrack`
- EAS Project ID: `9311807a-428e-4f90-8fe1-269b7313596a`

---

## Versioning

Update the app version in `app.json` before publishing a new release:

```json
"version": "1.2.1"
```

Build numbers auto-increment via EAS (configured in `eas.json` with `"autoIncrement": true`).

---

## EAS Build Profiles

| Profile       | Purpose                          | Distribution |
|---------------|----------------------------------|--------------|
| `development` | Dev client for local testing     | Internal     |
| `preview`     | Internal testing builds          | Internal     |
| `production`  | App Store / TestFlight releases  | Store        |

---

## Building with Expo (EAS)

### Development Build

For local development with a custom dev client:

```bash
eas build --platform ios --profile development
```

### Preview Build

For internal distribution to testers (no App Store review required):

```bash
eas build --platform ios --profile preview
```

Install via the Expo dashboard or direct link shared with registered devices.

### Production Build

For App Store Connect (TestFlight + App Store):

```bash
eas build --platform ios --profile production
```

---

## Submitting to App Store Connect

After a production build completes, submit it:

```bash
eas submit --platform ios --latest
```

Or combine build and submit in one command:

```bash
eas build --platform ios --profile production --auto-submit
```

---

## TestFlight Distribution

### Step-by-step

1. **Bump version** (if needed) in `app.json`
2. **Build for production:**
   ```bash
   eas build --platform ios --profile production
   ```
3. **Submit to App Store Connect:**
   ```bash
   eas submit --platform ios --latest
   ```
   Or use `--auto-submit` in step 2 to combine both.
4. **Wait for processing** -- Apple processes the build (usually 10-30 minutes). You'll receive an email when it's ready.
5. **Manage in App Store Connect:**
   - Go to [App Store Connect](https://appstoreconnect.apple.com) > Apps > FastTrack > TestFlight
   - The build appears under the iOS tab once processing completes
   - If prompted, answer the export compliance question (FastTrack uses `ITSAppUsesNonExemptEncryption: false`)
6. **Add testers:**
   - **Internal testers:** Add App Store Connect users under Internal Testing (up to 100, no review needed)
   - **External testers:** Create a group under External Testing, add testers by email (requires Beta App Review on first build)
7. **Testers install** via the TestFlight app on their iOS device

### Quick Deploy (single command)

```bash
eas build --platform ios --profile production --auto-submit
```

This builds and submits automatically. After Apple processes it, manage testers in App Store Connect.

---

## Useful Commands

```bash
eas build:list                          # View recent builds
eas build:view                          # View latest build details
eas submit --platform ios --id BUILD_ID # Submit a specific build
eas whoami                              # Check authenticated account
eas project:info                        # View project config
```
