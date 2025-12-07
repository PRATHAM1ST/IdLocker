# IdLocker - Secure Personal Vault

A production-grade React Native app for securely managing personal information offline. Built with Expo managed workflow.

## Features

- **Bank Accounts** - Store bank account details (account number, IFSC, branch, etc.)
- **Cards** - Store credit/debit card info (last 4 digits, expiry, brand - no CVV)
- **Government IDs** - Store Aadhaar, PAN, Passport, Driving License, etc.
- **Login Credentials** - Store usernames, passwords, and website URLs
- **Secure Notes** - Store sensitive text notes

## Security Architecture

### Data Storage

- All data encrypted using `expo-secure-store` (iOS Keychain / Android Keystore)
- Chunked storage strategy for large vaults (2KB chunks)
- No cloud sync, no network calls, no analytics

### Authentication

- Biometric authentication (Face ID / Touch ID / Fingerprint)
- Device PIN/pattern/password fallback
- Auto-lock on background (configurable timeout)
- Idle timeout lock

### Screen Protection

- Screen capture prevention on all sensitive screens
- No secrets in notifications or app previews

### Data Minimization

- CVV and OTPs never stored
- Encourages minimal sensitive data storage
- Clear warnings about data loss scenarios

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (or npm/yarn)
- Expo CLI
- iOS Simulator / Android Emulator or physical device

### Installation

```bash
# Clone the repository
cd IdLocker

# Install dependencies
pnpm install

# Start the development server
pnpm start

# Run on iOS
pnpm ios

# Run on Android
pnpm android
```

### Building for Production

```bash
# Build for iOS
npx eas build --platform ios

# Build for Android
npx eas build --platform android
```

## Project Structure

```
├── app/                    # Expo Router screens
│   ├── (vault)/           # Protected vault screens
│   │   ├── index.tsx      # Vault home
│   │   ├── item/[id].tsx  # Item detail
│   │   ├── add.tsx        # Add item
│   │   ├── edit/[id].tsx  # Edit item
│   │   └── settings.tsx   # Settings
│   ├── onboarding/        # Onboarding flow
│   ├── lock.tsx           # Lock screen
│   └── _layout.tsx        # Root layout
├── src/
│   ├── components/        # Reusable UI components
│   ├── context/           # React contexts
│   │   ├── ThemeProvider.tsx
│   │   ├── AuthLockProvider.tsx
│   │   └── VaultProvider.tsx
│   ├── storage/           # SecureStore layer
│   ├── styles/            # Theme configuration
│   ├── hooks/             # Custom hooks
│   └── utils/             # Utilities and types
```

## Configuration

### Auto-Lock Timeout

Configure in Settings > Auto-Lock Timeout:

- 30 seconds
- 1 minute (default)
- 2 minutes
- 5 minutes

### Theme

- Light mode
- Dark mode
- System (follows device setting)

## Security Notes

### Important Warnings

1. **Data Loss Risk** - Data is stored only on the device. Uninstalling the app will permanently delete all data.

2. **Biometric Changes** - Changing device biometrics (adding/removing fingerprints) may make stored data inaccessible.

3. **Device Security** - The app's security depends on your device lock strength. Use a strong PIN/password.

4. **No Backup** - There is no cloud backup. Keep separate records of critical information.

### What's NOT Stored

- CVV / CVC numbers
- OTPs or one-time codes
- Full card numbers (only last 4 digits)

### Logging

- No sensitive data is logged
- Logger utility redacts passwords, account numbers, and ID numbers
- Console logs are sanitized in production

## Platform-Specific Notes

### iOS

- Face ID usage description required in Info.plist
- Keychain-based secure storage
- Screen capture fully prevented

### Android

- Fingerprint permission required
- Android Keystore-based secure storage
- FLAG_SECURE prevents screenshots (may not work on all ROMs)
- `allowBackup: false` to prevent ADB backups

## Contributing

This is a personal security tool. For any contributions:

1. Never log or expose sensitive test data
2. Follow the existing security patterns
3. Keep all data storage local
4. No analytics or crash reporting that sends user data

## License

Private - All rights reserved

---

**Made with ❤️ for your privacy**
