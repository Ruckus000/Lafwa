#!/bin/sh
set -e

# Xcode Cloud post-clone script
# Runs after repo clone, before build. Working dir: ios/ci_scripts/
# Docs: https://developer.apple.com/documentation/xcode/writing-custom-build-scripts

export HOMEBREW_NO_INSTALL_CLEANUP=TRUE

# 1. Install Node.js (Xcode Cloud has Homebrew but not Node)
brew install node

# 2. Install JS dependencies (deterministic via lockfile)
cd "$CI_PRIMARY_REPOSITORY_PATH"
npm ci

# 3. Install CocoaPods dependencies
cd "$CI_PRIMARY_REPOSITORY_PATH/ios"
pod install
