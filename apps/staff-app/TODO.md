# GreenVolt Staff App — Android-First TODO Tracker

## Legend
- [x] Done  |  [ ] Pending  |  [~] In Progress  |  [!] Blocked

---

## Milestone 0 — Code Complete (Screens & API)
- [x] Auth screen with JWT login and role-based routing
- [x] Staff portal: Jobs list, Job detail (status, photos, remarks, PDF), Schedule
- [x] Admin portal: Jobs, Customers list + detail, Staff management, Analytics, Profile
- [x] Customer portal: Home, Services, Subscription, Payments, Profile (editable)
- [x] Push notification deep-linking (job tap → job detail)
- [x] Secure token storage with localStorage fallback on web
- [x] API client with auth token injection on all requests

---

## Milestone 1 — Android Production Config  ← CURRENT

### App Config (app.json / eas.json)
- [x] Set `versionCode`, `compileSdkVersion`, `targetSdkVersion` (35), `minSdkVersion` (26)
- [x] Declare all required Android permissions (CAMERA, POST_NOTIFICATIONS, etc.)
- [x] Block unnecessary permissions (READ_CONTACTS, READ_CALL_LOG)
- [x] `allowBackup: false` (security — prevents ADB backup of auth tokens)
- [x] Add App Link intent filter (greenvolt.in/app)
- [x] Add `photosPermission` to expo-image-picker plugin
- [x] Set `defaultChannel` for expo-notifications
- [x] EAS preview + production profiles with `EXPO_PUBLIC_API_URL` set
- [x] Set `resourceClass: medium` on all build profiles

### Code Quality & Architecture
- [x] Centralize `API_BASE_URL` into `src/lib/constants.ts` (was duplicated in 3 files)
- [x] `ErrorBoundary` component wrapping the full app
- [x] `OfflineBanner` component with slide-in animation
- [x] `useNetworkStatus` hook (polls /api/healthz, reacts to AppState changes)
- [x] Android hardware back-button handler in root layout
- [x] `.env.example` with all EXPO_PUBLIC_* variables documented

### Still needed — Milestone 1 completion
- [ ] **Set up Firebase project** and download `google-services.json` into `apps/staff-app/`
  > Required for FCM push notifications on Android (Expo push tokens won't reach real devices without it)
  > 1. Go to console.firebase.google.com → New project "GreenVolt"
  > 2. Add Android app with package `in.greenvolt.staff`
  > 3. Download `google-services.json` → place in `apps/staff-app/`
  > 4. Add `"./google-services.json"` to `app.json` → `android.googleServicesFile`
- [ ] **Create EAS account** (`eas login`) and link project (`eas init`)
- [ ] **Generate signing keystore** — `eas credentials` (Android) and save it securely
- [ ] **Create `.gitignore` entries** for `google-services.json` and `google-service-account.json`

---

## Milestone 2 — Development Build on Real Device

### Setup
- [ ] Run `pnpm --filter @workspace/staff-app exec eas build --profile development --platform android`
- [ ] Install the development `.apk` on a real Android device
- [ ] Register the device via `eas device:create` and add to `devices.json`

### Test Cases — Authentication
- [ ] Login as `staff` role → lands on /(staff)/jobs
- [ ] Login as `admin` role → lands on /(admin)/jobs
- [ ] Login as `customer` role → lands on /(customer)
- [ ] Expired/invalid token → redirects to login screen
- [ ] Logout clears token and navigates to login

### Test Cases — Staff Portal
- [ ] Jobs screen loads with pull-to-refresh working
- [ ] Empty state shows "No jobs assigned" when list is empty
- [ ] Tap job card → navigates to Job Detail
- [ ] Job Detail shows status, customer info, scheduled date
- [ ] "Start Job" button advances status pending → in_progress
- [ ] "Mark Complete" button advances status in_progress → completed
- [ ] Camera permission dialog appears on first photo capture
- [ ] Before-service photo captures and uploads successfully
- [ ] After-service photo captures and uploads successfully
- [ ] Photo tap-to-retake works
- [ ] Remarks text input saves correctly
- [ ] "Download Service Report" opens PDF in browser/viewer
- [ ] Schedule screen groups jobs by date correctly
- [ ] Today's jobs have the green "Today" badge
- [ ] Schedule empty state shows when no upcoming jobs
- [ ] Profile shows name, email, role badge, staff ID
- [ ] Logout from profile works

### Test Cases — Admin Portal
- [ ] Jobs list shows all jobs with staff and status
- [ ] Admin can reassign staff on job detail
- [ ] Customers list loads with search working
- [ ] Customer search filters by name in real-time
- [ ] Customer detail shows profile + service history
- [ ] Tap service card in customer detail → navigates to job detail
- [ ] Staff screen lists all staff with active/inactive toggle
- [ ] Confirm dialog shown before toggling active status
- [ ] Analytics screen loads revenue + all 8 metric cards
- [ ] Pull-to-refresh on analytics works
- [ ] Admin profile shows "ADMIN" badge, logout works

### Test Cases — Customer Portal
- [ ] Home screen shows welcome, subscription badge, next appointment
- [ ] Subscription badge changes colour when ≤30 days to expiry
- [ ] Quick-action grid navigates to each tab
- [ ] Services list shows service history
- [ ] Service detail shows photos when present
- [ ] "Download PDF Report" only visible on completed services
- [ ] Subscription screen shows plan details and expiry countdown
- [ ] Renewal request submits and shows success alert
- [ ] Payments screen shows total paid + payment cards
- [ ] Profile allows editing phone and address
- [ ] Save shows inline pending state and updates on success
- [ ] Push notification toggle saves preference

### Test Cases — Cross-Cutting
- [ ] Offline banner slides in when connection is lost
- [ ] Offline banner slides out when connection is restored
- [ ] API errors show user-friendly error (not a crash)
- [ ] Android hardware back button navigates back correctly
- [ ] Back button on tab root does NOT exit the app accidentally

---

## Milestone 3 — Performance & Polish

### Android Performance
- [ ] Enable Hermes JavaScript engine (already default in Expo SDK 50+, verify)
- [ ] Profile app startup time — target < 3 s cold start
- [ ] Profile FlatList scroll performance (no dropped frames on jobs/customers list)
- [ ] Reduce image upload size if > 2 MB (add compression to `pickAndUpload`)
- [ ] Test on a low-end Android device (2–3 GB RAM, e.g. Redmi/Moto entry-level)

### UI Polish for Android
- [ ] Add `StatusBar` component with `translucent` and `barStyle="light-content"` on green headers
- [ ] Use `SafeAreaProvider` + `SafeAreaView` to handle notch/gesture bars
- [ ] Verify keyboard avoidance on login, remarks, profile edit fields
- [ ] Test on multiple screen sizes: small (5"), normal (6"), large (6.7"+), tablet (8"+)
- [ ] Add `android_ripple` feedback to `Pressable`/`TouchableOpacity` on Android
- [ ] Verify tab bar does not overlap content on phones with gesture navigation bar

### Loading & Empty States
- [ ] All FlatList screens have a loading skeleton (or spinner) before first data
- [ ] All FlatList screens have an empty-state message
- [ ] Retry button on failed fetch screens (not just on job detail)

---

## Milestone 4 — Play Store Submission

### Store Listing Assets
- [ ] App icon — 512×512 px PNG (no alpha channel)
- [ ] Feature graphic — 1024×500 px JPG/PNG
- [ ] Screenshots — at least 2, recommended 8 (phone + 7" tablet)
  - [ ] Login screen
  - [ ] Staff: Jobs list
  - [ ] Staff: Job Detail with photos
  - [ ] Admin: Analytics dashboard
  - [ ] Admin: Customer list
  - [ ] Customer: Home screen
  - [ ] Customer: Subscription screen
  - [ ] Offline banner in action
- [ ] Short description (≤80 chars): "Solar service management for GreenVolt technicians, admins & customers."
- [ ] Full description (≤4000 chars)

### Play Store Policy Compliance
- [ ] **Privacy Policy URL** — create a privacy policy page and set URL in Play Console
  > Required for apps that handle personal data (email, phone, location)
- [ ] **Data Safety form** — complete in Play Console (declares: account info, photos, device ID)
- [ ] **Content rating** — complete IARC questionnaire (expected: Everyone / low maturity)
- [ ] **Target audience** — confirm 18+ (B2B app, solar technicians)
- [ ] **App permissions justification** — explain camera use in Play Console declaration
- [ ] Review Expo SDK permissions and remove any not actually used
- [ ] Verify `allowBackup: false` is in final build (SecureStore data should not be backed up)

### EAS Build & Submit
- [ ] Run production build: `eas build --profile production --platform android`
- [ ] Download `.aab` and manually verify it opens on device via `bundletool`
- [ ] Run `eas submit --platform android` to upload to Play Console
- [ ] Set up Internal Testing track first, invite testers
- [ ] Promote to Closed Testing after internal sign-off
- [ ] Promote to Production after passing review

---

## Milestone 5 — Post-Launch & iOS Planning

### Monitoring
- [ ] Confirm Sentry DSN is set in EAS production env
- [ ] Verify crash reports flow into Sentry after first production build
- [ ] Set up Sentry alert rules for P0/P1 crashes
- [ ] Monitor push notification delivery rate (Expo Push receipts API)

### OTA Updates
- [ ] Configure EAS Update: `eas update --channel production --message "Initial release"`
- [ ] Verify OTA update appears on device without reinstall
- [ ] Set up a `staging` EAS channel for QA before pushing to production

### iOS Planning (future)
- [ ] Verify all Android-specific guards (`Platform.OS === 'android'`) have iOS equivalents
- [ ] Replace `Alert.alert` with platform-aware modals if iOS UX diverges
- [ ] Set up Apple Developer account and provisioning profiles
- [ ] Update `app.json` `ios.bundleIdentifier` and verify entitlements
- [ ] Test push notifications via APNs (separate from FCM)

---

## Play Store Readiness Checklist (pre-submission)

| Item | Status |
|------|--------|
| `versionCode` set | ✅ (1) |
| `targetSdkVersion` ≥ 34 | ✅ (35) |
| `minSdkVersion` declared | ✅ (26 = Android 8.0) |
| `allowBackup: false` | ✅ |
| All permissions declared in `app.json` | ✅ |
| Unnecessary permissions blocked | ✅ |
| `google-services.json` in place | ❌ Needs Firebase setup |
| Signing keystore created | ❌ Needs `eas credentials` |
| Privacy policy URL | ❌ Not yet created |
| Data Safety form | ❌ Play Console action needed |
| Store listing screenshots | ❌ Not yet created |
| Feature graphic | ❌ Not yet created |
| EAS account linked | ❌ Needs `eas login` + `eas init` |
| Production build `.aab` | ❌ Not yet built |
