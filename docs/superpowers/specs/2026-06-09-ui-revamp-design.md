# GreenVolt Staff App — UI Revamp Design Spec
**Date:** 2026-06-09  
**Scope:** Complete visual overhaul of `apps/staff-app` from current ad-hoc inline styles to the Material 3 design system defined by Google Stitch  
**Source designs:** `stitch_greenvolt_solar_management_system.zip` (8 screens delivered, 15 remaining in progress)

---

## Overview

The current app has no design system — colors, spacing, and typography are hardcoded inline across 35 screen files. This revamp migrates to a unified token-based design system matching the Stitch designs, then reskins all 35 screens screen-by-screen.

Work is split into three sequential phases:

| Phase | What | Screens touched | Est. effort |
|---|---|---|---|
| 1 | Design system foundation | All 35 (token file only) | 1–2 days |
| 2 | Reskin 8 Stitch-delivered screens | 8 | 3–4 days |
| 3 | Reskin remaining 27 screens | 27 | 5–7 days |

Phases 1 and 2 can begin immediately. Phase 3 begins once the remaining Stitch files are received.

---

## Phase 1 — Design System Foundation

### Goal
Create a single source of truth for all visual tokens so that every screen in Phases 2 and 3 imports from it rather than using inline hex values. No screen layout changes in this phase — purely infrastructure.

### 1.1 Token File

**Create:** `apps/staff-app/src/theme/index.ts`

Exports a single `theme` object with the following sections:

#### Colors
Derived directly from `greenvolt/DESIGN.md`:

```ts
colors: {
  // Primary
  primary: '#00450d',
  onPrimary: '#ffffff',
  primaryContainer: '#1b5e20',
  onPrimaryContainer: '#90d689',
  primaryFixed: '#acf4a4',
  primaryFixedDim: '#91d78a',
  inversePrimary: '#91d78a',

  // Secondary (Lime accent)
  secondary: '#4e6700',
  onSecondary: '#ffffff',
  secondaryContainer: '#bcf200',
  onSecondaryContainer: '#526b00',
  secondaryFixed: '#bef500',
  secondaryFixedDim: '#a6d700',

  // Tertiary (Blue)
  tertiary: '#243c56',
  onTertiary: '#ffffff',
  tertiaryContainer: '#3c536e',
  onTertiaryContainer: '#aec7e6',

  // Surface scale
  background: '#f8fafb',
  surface: '#f8fafb',
  surfaceDim: '#d8dadb',
  surfaceBright: '#f8fafb',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f2f4f5',
  surfaceContainer: '#eceeef',
  surfaceContainerHigh: '#e6e8e9',
  surfaceContainerHighest: '#e1e3e4',
  surfaceVariant: '#e1e3e4',
  surfaceTint: '#2a6b2c',

  // On-surface
  onSurface: '#191c1d',
  onSurfaceVariant: '#41493e',
  inverseSurface: '#2e3132',
  inverseOnSurface: '#eff1f2',

  // Outline
  outline: '#717a6d',
  outlineVariant: '#c0c9bb',

  // Error
  error: '#ba1a1a',
  onError: '#ffffff',
  errorContainer: '#ffdad6',
  onErrorContainer: '#93000a',

  // Status semantic aliases (used across all status badges)
  statusPending:    { bg: '#eceeef', text: '#191c1d' },
  statusInProgress: { bg: '#dbeafe', text: '#1d4ed8' },
  statusEnRoute:    { bg: '#fffbeb', text: '#b45309' },
  statusCompleted:  { bg: '#dcfce7', text: '#15803d' },
  statusCancelled:  { bg: '#f3f4f6', text: '#6b7280' },
}
```

#### Typography
All Inter-based, matching Stitch's type scale. `expo-google-fonts` package needed (see 1.2).

```ts
typography: {
  displayLg:   { fontFamily: 'Inter_700Bold',   fontSize: 57, lineHeight: 64, letterSpacing: -0.25 },
  headlineLg:  { fontFamily: 'Inter_600SemiBold', fontSize: 32, lineHeight: 40 },
  headlineMd:  { fontFamily: 'Inter_600SemiBold', fontSize: 28, lineHeight: 36 },
  headlineSm:  { fontFamily: 'Inter_600SemiBold', fontSize: 24, lineHeight: 32 },
  titleLg:     { fontFamily: 'Inter_500Medium',   fontSize: 22, lineHeight: 28 },
  bodyLg:      { fontFamily: 'Inter_400Regular',  fontSize: 16, lineHeight: 24 },
  bodyMd:      { fontFamily: 'Inter_400Regular',  fontSize: 14, lineHeight: 20 },
  labelLg:     { fontFamily: 'Inter_600SemiBold', fontSize: 14, lineHeight: 20, letterSpacing: 0.1 },
  labelMd:     { fontFamily: 'Inter_600SemiBold', fontSize: 12, lineHeight: 16, letterSpacing: 0.5 },
  metricXl:    { fontFamily: 'Inter_700Bold',     fontSize: 45, lineHeight: 52, letterSpacing: -1 },
}
```

#### Spacing
8px base grid:

```ts
spacing: {
  xs: 4,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  gutter: 24,
  pagePadding: 16,
}
```

#### Border Radius

```ts
radius: {
  sm: 4,
  default: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
}
```

#### Elevation (shadow presets)

```ts
elevation: {
  card: {
    shadowColor: '#191c1d',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  modal: {
    shadowColor: '#191c1d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
}
```

### 1.2 Font Installation

Install `@expo-google-fonts/inter` and load the 4 weights used (Regular 400, Medium 500, SemiBold 600, Bold 700) in `app/_layout.tsx` via `useFonts`. The app renders a loading screen until fonts are ready — this already exists for Sentry init, so it's a small addition.

```bash
pnpm --filter @workspace/staff-app add @expo-google-fonts/inter expo-font
```

### 1.3 Icon Strategy

Material Symbols Outlined (used in Stitch's HTML) is a web font — it has no first-class Expo/React Native package. Two options:

| Option | Approach | Trade-off |
|---|---|---|
| A — Keep Ionicons | Map every Stitch Material Symbol to the nearest Ionicons equivalent | Zero new dependency, minor visual mismatch on ~10% of icons |
| B — MaterialCommunityIcons | Switch to `@expo/vector-icons` MaterialCommunityIcons which covers ~95% of Material Symbols | One extra icon set, cleaner fidelity |

**Decision: Option B — MaterialCommunityIcons.**  
Ionicons uses outlined iOS-style icons; Material Symbols are Google's design language. MCIcons matches closer. A mapping table will be maintained in `src/theme/icons.ts` so all icon references go through one place.

### 1.4 Shared Components

Create the following small primitives in `src/components/ui/` that encode the token system, so screens never import from `theme` directly for common patterns:

| Component | Description |
|---|---|
| `StatusBadge` | Pill badge for pending/in_progress/en_route/completed/cancelled — reads from `theme.colors.status*` |
| `MetricCard` | Card with label + large metric value + optional trend indicator |
| `SectionHeader` | Label-md section title with optional "View All" link |
| `PrimaryButton` | Full-width green button, loading state, disabled state |
| `OutlineButton` | Transparent with green border |
| `Card` | White container with theme elevation + 1px outline border |
| `AppHeader` | Top header with GreenVolt logo/wordmark + right avatar slot |

### 1.5 Deliverables for Phase 1
- `src/theme/index.ts` (tokens)
- `src/theme/icons.ts` (icon name map)
- `src/components/ui/` (7 primitives above)
- Font loading wired in `_layout.tsx`
- No screen files modified

---

## Phase 2 — Reskin the 8 Stitch Screens

### Goal
Replace the visual layer of the 8 screens that have Stitch designs. Logic, API calls, and navigation stay identical — only `StyleSheet` definitions and component markup change.

All screens will:
- Import from `theme` for all color/spacing/radius/typography values
- Use the new `src/components/ui/` primitives
- Use MaterialCommunityIcons instead of Ionicons

---

### Screen 2.1 — Customer Dashboard (`(customer)/index.tsx`)

**What changes:**
- Background: current dark green gradient header → flat `surfaceContainerLowest` (white) header
- Font: system → Inter, all sizes from `typography` tokens
- Welcome section: keep greeting + name + capacity pill + city, but remove dense "solar banner" decorative element
- Next Service card: keep data, new card style with `statusPending`/`statusConfirmed` badge in lime (`secondaryContainer`)
- Quick Actions row: keep 5 actions, new icon set, new pill style with `surfaceContainerLow` bg
- System Overview: 2×2 grid of `Card` components, clean label + value layout
- Subscription card: keep data, remove gradient, use `Card` + green `PrimaryButton`
- Recent Services: keep list, remove dot indicators, use `StatusBadge` component
- Remove: Offers & rewards scroll section (not in Stitch design)
- Bottom tab bar: 4 tabs → Dashboard / Solar / Usage / Profile (labels update, icons update)

**New bottom tab labels (from Stitch):**
Current: Home, Services, Payments, Account  
New: Dashboard, Solar, Usage, Profile

> Note: "Solar" and "Usage" tabs are shown in Stitch but their content isn't defined yet — they may map to existing Services/Payments screens or be new screens. Treat as renamed tabs for now, content unchanged.

---

### Screen 2.2 — Staff My Jobs (`(staff)/jobs.tsx`)

**What changes:**
- Background: white cards on white → cards on `background` (#f8fafb)
- Filter chips: keep All/Pending/In Progress/Completed, new pill style with `primaryContainer` fill for active
- Job cards: new layout —
  - Customer name in `titleLg`
  - Service type in `bodyMd` + `onSurfaceVariant`
  - Location line with MCIcons `map-marker-outline`
  - Time line with MCIcons `clock-outline`
  - `StatusBadge` top-right
  - Two buttons at bottom: primary `View Details` (or `Start Job`) + square outline navigate button
- Bottom tab bar: Jobs / Schedule / Account (matches Stitch — remove count badges from tabs)

---

### Screen 2.3 — Admin Analytics (`(admin)/analytics.tsx`)

**What changes:**
- Revenue hero card: keep ₹ total + month trend, new card style, lime `+12%` trend pill
- Service Status section: 2×2 `MetricCard` grid — Completed / Pending / In Progress / Unread Contacts
- People Overview section: 2×2 `MetricCard` grid — Total Customers / Active Subs / Total Staff / Active Staff
- Active Staff card: small green LED dot indicator (8px circle, `primaryContainer` color)
- Bottom tab bar: Overview / Staff / Fleet / Settings (Stitch labels — map to existing routes)

> "Fleet" tab is a new concept in Stitch not currently in the app. Treat as placeholder pointing to current admin jobs screen until defined.

---

### Screen 2.4 — Service Catalog (`(customer)/book/index.tsx`)

**What changes:**
- Step indicator at top: "STEP 1 OF 4 — Select Service" in `labelMd` + `outline` color
- Section title: "Our Services" in `headlineSm`, subtitle in `bodyMd`
- Service cards: new layout —
  - Category label in `labelMd` uppercase + `onSurfaceVariant`
  - Service name in `titleLg`
  - Description in `bodyMd`
  - Duration + certification row with icons
  - Price in `headlineSm` bold, "Total with GST" in `labelMd`
  - `POPULAR` badge: lime (`secondaryContainer`) bg, dark text, top-right corner
  - `PrimaryButton` "Book Now" right-aligned
- Remove: horizontal scroll layout — use vertical list

---

### Screen 2.5 — Pick Date & Time (`(customer)/book/[id].tsx`)

**What changes:**
- Step indicator: "Step 2 of 4" with 4-step progress line (circles + connecting lines, green fill for completed)
- Selected service card: icon + service name + estimated duration, outlined card
- Calendar: horizontal day scroll (Mon/Tue/Wed...) with date numbers, selected = `primaryContainer` filled circle
- Month header with prev/next chevrons
- Time slots: 2×2 grid of outline buttons, selected = `primaryContainer` background + checkmark
- Notes: outlined `TextInput` with placeholder
- Sticky bottom: `PrimaryButton` "Proceed to Review →"

**Key difference from current:** current uses a vertical date picker; Stitch uses a compact horizontal date strip. This is a layout rebuild, not just a restyle.

---

### Screen 2.6 — Review & Pay (`(customer)/book/review.tsx`)

**What changes:**
- Step indicator: "Step 3 of 4"
- Service Summary card: service name + `CONFIRMED` lime badge + date/time
- Price Breakdown card: line items table (Service Charge / Visit Charge / GST / Discount / **Total**)
- Offers & Promos card: outlined coupon input + Apply button + hint text
- Payment Method: radio list with icons — UPI / Credit & Debit Card / Net Banking / Wallet / Cash on Service
- Sticky bottom: total amount + `PrimaryButton` "Confirm Booking →"
- Structure nearly identical to current, primarily a restyle

---

### Screen 2.7 — Booking Success (`(customer)/book/success.tsx`)

**What changes:**
- Checkmark circle: current spring-animated green → large lime (`secondaryContainer`) circle with dark green checkmark
- Booking ID: pill badge with `#` prefix
- Service Summary card: icon-labeled rows (Service / Schedule / Total Amount)
- SMS note: gray `surfaceContainerLow` info strip
- Two buttons: `PrimaryButton` "View My Services" + `OutlineButton` "Back to Home"
- Minimal layout changes, primarily color/font restyle

---

### Screen 2.8 — Job Details — Staff View (`job/[id].tsx`)

**What changes (restyle) + what's new (new features):**

**Restyle:**
- Header: "Job #GV-XXXX" + service type subtitle
- Step stepper: Scheduled → En Route → In Progress → Completed (4 steps, not 3)
- Customer card: avatar + name, `Call` and `Message` action buttons
- Location card: address text
- Service Overview card: service name + description
- Site Documentation: 2-slot photo grid (Before / After) with dashed outline placeholders
- Technician Remarks: outlined multiline `TextInput`
- Bottom bar: `OutlineButton` "Pause Job" + lime `PrimaryButton` "Complete Job"

**New features to build:**
1. **En Route status** — new 2nd step in the stepper. Staff can tap "Start Journey" to move job from Scheduled → En Route before arriving. Requires new status value `en_route` in the job status enum and a new API endpoint (`PATCH /services/:id/status`).
2. **Customer contact buttons** — Call button triggers `Linking.openURL('tel:...')`. Message button triggers `Linking.openURL('sms:...')`. Phone number comes from existing customer data already fetched on this screen.
3. **Map view** — Static map image showing job location with a "Navigate" button that opens Google Maps / Apple Maps via deep link. Use `react-native-maps` static snapshot or a Maps Static API image. Navigate button: `Linking.openURL('https://maps.google.com/?q=...')`.
4. **Pause Job** — New status `paused` (or reuse `pending`). Tapping Pause moves job back to pending with a pause reason prompt. Needs API support.
5. **Generate Preliminary Report** — Appears mid-job (in_progress state). Generates a partial PDF report with photos + remarks captured so far. Reuses existing PDF generation logic.

> The new status values (`en_route`, `paused`) require a database migration and API changes. These must be coordinated with Phase 2 backend work.

---

## Phase 3 — Remaining 27 Screens

### Goal
Apply the same design system established in Phases 1–2 to every screen not covered by Stitch. Once the remaining Stitch files are received, each screen will be updated to match. Until then, this section documents what each screen needs based on the design language already established.

Phase 3 is subdivided by role group.

---

### Group A — Auth (1 screen)

#### `(auth)/login.tsx`
**Expected Stitch design:** Yes (requested)

Layout expectation based on design system:
- `background` fill full screen
- GreenVolt logo + wordmark centered top third
- `Card` container with email + password `TextInput` fields (Material 3 outlined style — label floats on border)
- `PrimaryButton` "Sign In"
- No sign-up link (admin-only seeded accounts)
- Error state: `errorContainer` bg strip below inputs

---

### Group B — Customer Screens (5 screens)

#### `(customer)/payments.tsx`
**Expected Stitch design:** Yes (requested)

Layout expectation:
- Total paid summary `Card` at top (large `metricXl` amount + transaction count)
- Flat list of payment cards: amount / description / `StatusBadge` / payment method icon / transaction ID / date
- Pull-to-refresh
- Empty state using `ErrorState` component

#### `(customer)/subscription.tsx`
**Expected Stitch design:** Yes (requested)

Layout expectation:
- Hero `Card`: plan name, status badge, days remaining countdown
- Plan details card: visits/month, amount, start/end dates
- `PrimaryButton` "Request Renewal"

#### `(customer)/profile.tsx`
**Expected Stitch design:** Yes (requested)

Layout expectation:
- Green header strip with avatar circle (initials), name, city
- Solar info `Card`: capacity, installation date
- Contact details `Card` with edit toggle (inline edit mode for phone, address)
- Notification preferences toggle row
- `OutlineButton` "Log Out"
- Version number in `labelMd` + `onSurfaceVariant`

#### `(customer)/services/index.tsx`
**Expected Stitch design:** Yes (requested)

Layout expectation:
- `SectionHeader` with service count
- List of service cards: service type / `StatusBadge` / scheduled date / technician name
- Tap → service detail

#### `(customer)/services/[id].tsx`
**Expected Stitch design:** Yes (requested)

Layout expectation:
- Status `Card`: service type + `StatusBadge`
- Details card: scheduled date, completed date, technician, notes, remarks
- Photos section: before/after image grid
- Download PDF button (completed only) using `OutlineButton`

---

### Group C — Staff Screens (2 screens)

#### `(staff)/schedule.tsx`
**Expected Stitch design:** Yes (requested)

Layout expectation:
- Date section headers (day + date + job count bubble)
- Job cards matching `(staff)/jobs.tsx` card design
- Today highlighted with `primaryContainer` date bubble
- Past jobs: reduced `onSurfaceVariant` opacity

#### `(staff)/profile.tsx`
**Expected Stitch design:** Yes (requested)

Layout expectation:
- Avatar + name + role badge header
- Account details `Card`: email, role, staff ID
- `OutlineButton` "Log Out"
- Version label

---

### Group D — Admin Screens (5 screens)

#### `(admin)/jobs.tsx`
**Expected Stitch design:** Yes (requested)

Layout expectation:
- Filter chips: All / Pending / In Progress / Completed with counts
- Job cards: customer name / `StatusBadge` / service type / assigned staff name / address / date
- Tap → shared `job/[id].tsx` detail screen (admin view shows reassign section)

#### `(admin)/customers/index.tsx`
**Expected Stitch design:** Yes (requested)

Layout expectation:
- Search bar (outlined, MCIcons search icon)
- Customer list cards: avatar circle / name / phone / city / capacity badge
- Tap → customer detail

#### `(admin)/customers/[id].tsx`
**Expected Stitch design:** Yes (requested)

Layout expectation:
- Profile `Card`: avatar / name / phone / capacity badge
- 3-stat row: Total Services / Completed / Capacity
- Customer details `Card`: phone, address, city, installation date, notes
- `SectionHeader` "Service History" with count badge
- Service list cards with status badges

#### `(admin)/staff.tsx`
**Expected Stitch design:** Yes (requested)

Layout expectation:
- Staff list with member count
- Cards: avatar / name / role / phone / work area / active status toggle
- Toggle changes staff active/inactive via existing API

#### `(admin)/profile.tsx`
**Expected Stitch design:** Yes (requested)

Layout expectation:
- Green header: avatar / name / email / "Administrator" badge
- Info `Card`: email, role
- Quick link row → Manage Staff
- `OutlineButton` "Log Out"
- Version label

---

## Cross-Cutting Concerns

### Navigation / Tab Bar Alignment

Stitch introduces different tab labels and groupings from what exists today. The mapping is:

| Role | Current tabs | Stitch tabs |
|---|---|---|
| Customer | Home, Services, Payments, Account | Dashboard, Solar, Usage, Profile |
| Staff | My Jobs, Schedule, Profile | Jobs, Schedule, Account |
| Admin | Jobs, Customers, Analytics, Account | Overview, Staff, Fleet, Settings |

Tab label and icon updates happen in the `_layout.tsx` files for each role group. Route paths do not change — only the displayed labels and icons.

### Status Enum Extension

Phase 2 introduces `en_route` and potentially `paused` as new job status values. This requires:
1. Database migration adding new enum values to the `services` status column
2. API: new `PATCH /services/:id/status` endpoint (or update existing)
3. Frontend: `StatusBadge` and `STATUS_CONFIG` maps updated with new values

This is backend work that must land before the Job Details screen (2.8) goes live.

### Backward Compatibility During Migration

Screens will be migrated one at a time. During Phase 2, some screens will use the new design system and others will not. This is acceptable — the token file is additive and the old inline styles continue to work until replaced.

### Testing

For each reskinned screen, manually verify on a physical Android device:
- All data still loads and displays correctly
- Navigation still works (taps, back gestures)
- Error and empty states render correctly
- Pull-to-refresh works
- No layout overflow or clipped content on standard phone sizes (375px, 390px)

---

## Open Questions

1. **"Solar" and "Usage" tabs** — Stitch shows these in the customer tab bar but no screen designs exist for them. Are these new screens (energy telemetry from panels?) or renamed versions of existing Services/Payments tabs?
2. **"Fleet" tab** — Appears in the admin tab bar in Stitch. What does Fleet show? (Vehicles? Staff locations? Equipment?) Needs product decision before Phase 3.
3. **Map view in Job Details** — Use `react-native-maps` (requires Expo config plugin + native build) or a static Maps API image? Static image is simpler but not interactive. Decision affects Phase 2 build.
4. **En Route / Pause status** — These need backend changes. Should they land in the same sprint as the UI or be deferred?
5. **Dark mode** — Stitch's `DESIGN.md` defines `darkMode: "class"`. Is dark mode in scope for this revamp?

---

## File Change Summary

| File | Phase | Change type |
|---|---|---|
| `src/theme/index.ts` | 1 | New |
| `src/theme/icons.ts` | 1 | New |
| `src/components/ui/StatusBadge.tsx` | 1 | New |
| `src/components/ui/MetricCard.tsx` | 1 | New |
| `src/components/ui/SectionHeader.tsx` | 1 | New |
| `src/components/ui/PrimaryButton.tsx` | 1 | New |
| `src/components/ui/OutlineButton.tsx` | 1 | New |
| `src/components/ui/Card.tsx` | 1 | New |
| `src/components/ui/AppHeader.tsx` | 1 | New |
| `app/_layout.tsx` | 1 | Modify (font loading) |
| `app/(customer)/index.tsx` | 2 | Modify (restyle) |
| `app/(staff)/jobs.tsx` | 2 | Modify (restyle) |
| `app/(admin)/analytics.tsx` | 2 | Modify (restyle) |
| `app/(customer)/book/index.tsx` | 2 | Modify (restyle) |
| `app/(customer)/book/[id].tsx` | 2 | Modify (layout rebuild) |
| `app/(customer)/book/review.tsx` | 2 | Modify (restyle) |
| `app/(customer)/book/success.tsx` | 2 | Modify (restyle) |
| `app/job/[id].tsx` | 2 | Modify (restyle + new features) |
| `app/(auth)/login.tsx` | 3 | Modify (restyle) |
| `app/(customer)/payments.tsx` | 3 | Modify (restyle) |
| `app/(customer)/subscription.tsx` | 3 | Modify (restyle) |
| `app/(customer)/profile.tsx` | 3 | Modify (restyle) |
| `app/(customer)/services/index.tsx` | 3 | Modify (restyle) |
| `app/(customer)/services/[id].tsx` | 3 | Modify (restyle) |
| `app/(staff)/schedule.tsx` | 3 | Modify (restyle) |
| `app/(staff)/profile.tsx` | 3 | Modify (restyle) |
| `app/(admin)/jobs.tsx` | 3 | Modify (restyle) |
| `app/(admin)/customers/index.tsx` | 3 | Modify (restyle) |
| `app/(admin)/customers/[id].tsx` | 3 | Modify (restyle) |
| `app/(admin)/staff.tsx` | 3 | Modify (restyle) |
| `app/(admin)/profile.tsx` | 3 | Modify (restyle) |
| Role `_layout.tsx` files (3) | 3 | Modify (tab labels/icons) |
| **Total** | | **9 new, 24 modified** |
