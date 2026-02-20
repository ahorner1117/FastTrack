#!/bin/bash
set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BUILD_NUMBER_FILE="$ROOT_DIR/.build-number"
APP_JSON="$ROOT_DIR/app.json"
PACKAGE_JSON="$ROOT_DIR/package.json"
IOS_DIR="$ROOT_DIR/ios"
ARCHIVE_PATH="$IOS_DIR/build/FastTrack.xcarchive"
EXPORT_OPTIONS="$IOS_DIR/ExportOptions.plist"
EXPORT_PATH="$IOS_DIR/build/export"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${GREEN}[deploy]${NC} $1"; }
warn() { echo -e "${YELLOW}[deploy]${NC} $1"; }
fail() { echo -e "${RED}[deploy]${NC} $1"; exit 1; }

# Parse flags
VERSION_BUMP=""
while [[ $# -gt 0 ]]; do
  case $1 in
    --patch) VERSION_BUMP="patch"; shift ;;
    --minor) VERSION_BUMP="minor"; shift ;;
    --major) VERSION_BUMP="major"; shift ;;
    --help|-h)
      echo "Usage: npm run deploy [-- --patch|--minor|--major]"
      echo ""
      echo "  --patch   Bump patch version (e.g. 3.4.1 -> 3.4.2)"
      echo "  --minor   Bump minor version (e.g. 3.4.1 -> 3.5.0)"
      echo "  --major   Bump major version (e.g. 3.4.1 -> 4.0.0)"
      echo ""
      echo "Build number auto-increments on every run."
      exit 0
      ;;
    *) fail "Unknown flag: $1. Use --help for usage." ;;
  esac
done

# ── Read current version ──
CURRENT_VERSION=$(python3 -c "import json; print(json.load(open('$APP_JSON'))['expo']['version'])")
log "Current version: $CURRENT_VERSION"

# ── Bump version if requested ──
if [ -n "$VERSION_BUMP" ]; then
  IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"
  case $VERSION_BUMP in
    patch) PATCH=$((PATCH + 1)) ;;
    minor) MINOR=$((MINOR + 1)); PATCH=0 ;;
    major) MAJOR=$((MAJOR + 1)); MINOR=0; PATCH=0 ;;
  esac
  NEW_VERSION="$MAJOR.$MINOR.$PATCH"
  log "Bumping version: $CURRENT_VERSION -> $NEW_VERSION"

  # Update app.json
  python3 -c "
import json
with open('$APP_JSON', 'r') as f: data = json.load(f)
data['expo']['version'] = '$NEW_VERSION'
with open('$APP_JSON', 'w') as f: json.dump(data, f, indent=2)
print()  # trailing newline
"

  # Update package.json
  python3 -c "
import json
with open('$PACKAGE_JSON', 'r') as f: data = json.load(f)
data['version'] = '$NEW_VERSION'
with open('$PACKAGE_JSON', 'w') as f: json.dump(data, f, indent=2)
print()
"

  CURRENT_VERSION="$NEW_VERSION"
fi

# ── Auto-increment build number ──
if [ -f "$BUILD_NUMBER_FILE" ]; then
  BUILD_NUMBER=$(cat "$BUILD_NUMBER_FILE")
else
  BUILD_NUMBER=22
fi
BUILD_NUMBER=$((BUILD_NUMBER + 1))
echo "$BUILD_NUMBER" > "$BUILD_NUMBER_FILE"
log "Build number: $BUILD_NUMBER"

# ── Prebuild ──
log "Running expo prebuild..."
cd "$ROOT_DIR"
npx expo prebuild --platform ios --clean

# ── Set build number in Xcode project ──
log "Setting build number in Xcode project..."
cd "$IOS_DIR"
agvtool new-version -all "$BUILD_NUMBER" > /dev/null

# ── Create ExportOptions.plist ──
cat > "$EXPORT_OPTIONS" << 'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>method</key>
	<string>app-store-connect</string>
	<key>teamID</key>
	<string>Z6HV55Y4T6</string>
	<key>signingStyle</key>
	<string>automatic</string>
	<key>uploadSymbols</key>
	<true/>
	<key>destination</key>
	<string>upload</string>
</dict>
</plist>
PLIST

# ── Archive ──
log "Building archive (v$CURRENT_VERSION build $BUILD_NUMBER)..."
xcodebuild \
  -workspace FastTrack.xcworkspace \
  -scheme FastTrack \
  -configuration Release \
  -archivePath "$ARCHIVE_PATH" \
  archive \
  -allowProvisioningUpdates \
  CODE_SIGN_STYLE=Automatic \
  DEVELOPMENT_TEAM=Z6HV55Y4T6 \
  -quiet

log "Archive succeeded"

# ── Export & Upload ──
log "Uploading to App Store Connect..."
xcodebuild \
  -exportArchive \
  -archivePath "$ARCHIVE_PATH" \
  -exportOptionsPlist "$EXPORT_OPTIONS" \
  -exportPath "$EXPORT_PATH" \
  -allowProvisioningUpdates \
  -quiet

log "Upload succeeded!"
echo ""
echo -e "${GREEN}====================================${NC}"
echo -e "${GREEN} FastTrack v$CURRENT_VERSION ($BUILD_NUMBER)${NC}"
echo -e "${GREEN} Uploaded to App Store Connect${NC}"
echo -e "${GREEN}====================================${NC}"
