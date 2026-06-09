# GreenVolt Staff App — UI Revamp Design Spec
**Date:** 2026-06-09 (updated 2026-06-10)
**Scope:** Complete visual overhaul of `apps/staff-app` from current ad-hoc inline styles to the Material 3 design system defined by Google Stitch
**Source designs:**
- Batch 1: `stitch_greenvolt_solar_management_system.zip` — 8 screens
- Batch 2: `stitch_greenvolt_solar_management_system (1).zip` — 11 screens
- **Total Stitch screens: 19 of 35** (remaining 16 extrapolated from design system)

---

## All Screens at a Glance

| # | Screen file | Stitch design | Phase |
|---|---|---|---|
| 1 | `(auth)/login.tsx` | ✅ login | 2 |
| 2 | `(customer)/index.tsx` | ✅ customer_dashboard | 3 |
| 3 | `(customer)/book/index.tsx` | ✅ service_catalog | 3 |
| 4 | `(customer)/book/[id].tsx` | ✅ pick_date_time | 3 |
| 5 | `(customer)/book/review.tsx` | ✅ review_pay | 3 |
| 6 | `(customer)/book/success.tsx` | ✅ booking_success | 3 |
| 7 | `(customer)/services/index.tsx` | ✅ services_list | 4 |
| 8 | `(customer)/services/[id].tsx` | — extrapolated | 4 |
| 9 | `(customer)/payments.tsx` | ✅ payments | 4 |
| 10 | `(customer)/subscription.tsx` | ✅ subscription | 4 |
| 11 | `(customer)/profile.tsx` | ✅ profile | 4 |
| 12 | `(staff)/jobs.tsx` | ✅ staff_my_jobs | 5 |
| 13 | `(staff)/schedule.tsx` | ✅ schedule | 5 |
| 14 | `job/[id].tsx` | ✅ job_details_staff_view | 5 |
| 15 | `(staff)/profile.tsx` | ✅ staff_profile | 5 |
| 16 | `(admin)/analytics.tsx` | ✅ admin_analytics | 6 |
| 17 | `(admin)/jobs.tsx` | ✅ jobs_master_list | 6 |
| 18 | `(admin)/customers/index.tsx` | ✅ customers_master_list | 6 |
| 19 | `(admin)/customers/[id].tsx` | ✅ customer_profile_admin_view | 6 |
| 20 | `(admin)/staff.tsx` | ✅ staff_management | 6 |
| 21 | `(admin)/profile.tsx` | ✅ admin_settings | 6 |
| 22 | `(customer)/(solar)` | — new screen | 7 |
| 23 | `(customer)/(usage)` | — new screen | 7 |
| 24 | `(admin)/(fleet)` | — new screen | 7 |
| 25–35 | Role `_layout` files, shared layout | — | 1–6 |

---

## Phase Overview

| Phase | Name | Screens | Est. effort |
|---|---|---|---|
| 1 | Design System Foundation | — (infra only) | 1–2 days |
| 2 | Auth | 1 | 0.5 days |
| 3 | Customer Booking Flow | 5 | 2–3 days |
| 4 | Customer Portal | 5 | 2–3 days |
| 5 | Staff Portal | 4 | 2–3 days |
| 6 | Admin Portal | 6 | 3–4 days |
| 7 | New Feature Screens | 3+ | TBD (needs product definition) |
| **Total** | | **24+** | **~12–17 days** |

---

## Phase 1 — Design System Foundation

### Goal
Build the entire visual infrastructure before touching any screen. Every subsequent phase imports from this foundation. Zero screen layout changes in Phase 1.

### 1.1 Token File — `src/theme/index.ts`

#### Colors (full Material 3 palette from Stitch DESIGN.md)
```ts
colors: {
  // Primary (Forest Green)
  primary: '#00450d',
  onPrimary: '#ffffff',
  primaryContainer: '#1b5e20',
  onPrimaryContainer: '#90d689',
  primaryFixed: '#acf4a4',
  primaryFixedDim: '#91d78a',
  inversePrimary: '#91d78a',

  // Secondary (Lime accent — used for success, highlights, CTAs)
  secondary: '#4e6700',
  onSecondary: '#ffffff',
  secondaryContainer: '#bcf200',
  onSecondaryContainer: '#526b00',
  secondaryFixed: '#bef500',
  secondaryFixedDim: '#a6d700',

  // Tertiary (Blue — informational, links)
  tertiary: '#243c56',
  onTertiary: '#ffffff',
  tertiaryContainer: '#3c536e',
  onTertiaryContainer: '#aec7e6',

  // Surface scale (all backgrounds)
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

  // Text
  onSurface: '#191c1d',
  onSurfaceVariant: '#41493e',
  inverseSurface: '#2e3132',
  inverseOnSurface: '#eff1f2',

  // Borders
  outline: '#717a6d',
  outlineVariant: '#c0c9bb',

  // Error
  error: '#ba1a1a',
  onError: '#ffffff',
  errorContainer: '#ffdad6',
  onErrorContainer: '#93000a',

  // Status semantic tokens (used by StatusBadge across all roles)
  status: {
    pending:    { bg: '#eceeef', text: '#191c1d', dot: '#717a6d' },
    enRoute:    { bg: '#fffbeb', text: '#b45309', dot: '#f59e0b' },
    inProgress: { bg: '#dbeafe', text: '#1d4ed8', dot: '#3b82f6' },
    completed:  { bg: '#dcfce7', text: '#15803d', dot: '#16a34a' },
    cancelled:  { bg: '#f3f4f6', text: '#6b7280', dot: '#9ca3af' },
    onLeave:    { bg: '#f3f4f6', text: '#6b7280', dot: '#9ca3af' },
    active:     { bg: '#dcfce7', text: '#15803d', dot: '#16a34a' },
  },
}
```

#### Typography (Inter-based, 9 roles)
```ts
typography: {
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

#### Spacing (8px grid)
```ts
spacing: { xs: 4, sm: 12, md: 16, lg: 24, xl: 32, gutter: 24, pagePadding: 16 }
```

#### Border Radius
```ts
radius: { sm: 4, default: 8, md: 12, lg: 16, xl: 24, full: 9999 }
```

#### Elevation (Material 3 tonal layering via shadows)
```ts
elevation: {
  card:  { shadowColor: '#191c1d', shadowOffset: {width:0, height:1}, shadowOpacity: 0.03, shadowRadius: 4,  elevation: 1 },
  modal: { shadowColor: '#191c1d', shadowOffset: {width:0, height:2}, shadowOpacity: 0.06, shadowRadius: 8,  elevation: 3 },
}
```

### 1.2 Font Installation
```bash
pnpm --filter @workspace/staff-app add @expo-google-fonts/inter expo-font
```
Load 4 weights in `app/_layout.tsx` via `useFonts`: Regular 400, Medium 500, SemiBold 600, Bold 700. App shows loading screen until fonts ready (existing Sentry init already gates the render).

### 1.3 Icon Strategy
Switch from Ionicons to **MaterialCommunityIcons** (`@expo/vector-icons` — already installed via Expo).

Create `src/theme/icons.ts` — a mapping table of every icon used in the app to its MCIcons name. All screens import icon names from this map, never hardcode strings. This means a future icon swap is one-file change.

Key mappings:
| Concept | Current (Ionicons) | New (MCIcons) |
|---|---|---|
| solar panel | `sunny` | `solar-power` |
| jobs | `briefcase-outline` | `briefcase-outline` |
| schedule | `calendar-outline` | `calendar-today` |
| profile | `person-outline` | `account-circle-outline` |
| location | `location-outline` | `map-marker-outline` |
| clock | `time-outline` | `clock-outline` |
| navigate | `navigate-outline` | `navigation` |
| settings | `settings-outline` | `cog-outline` |
| logout | `log-out-outline` | `logout` |

### 1.4 Shared UI Primitives — `src/components/ui/`

| Component | Description |
|---|---|
| `StatusBadge` | Pill badge reading from `theme.colors.status.*`. Props: `status`, optional `size` |
| `MetricCard` | Label + `metricXl` value + optional trend pill (% up/down). Used on analytics + payments |
| `SectionHeader` | `labelMd` uppercase title + optional "View All" right link |
| `PrimaryButton` | Full-width forest green button. Props: `label`, `onPress`, `loading`, `disabled`, `icon` |
| `OutlineButton` | Transparent + green border. Same props as PrimaryButton |
| `LimeButton` | `secondaryContainer` (#bcf200) bg + dark text. Used for key CTAs (Complete Job, Confirm Booking) |
| `Card` | White container with `elevation.card` shadow + 1px `outlineVariant` border + `radius.lg` |
| `AppHeader` | Top bar: GreenVolt logo left, optional right slot (avatar / notification bell / back button) |
| `Avatar` | Circular initials avatar. Props: `name`, `size`, `bgColor` |
| `InfoRow` | Icon + label + value row. Used in profile/detail cards |
| `EmptyState` | Centered icon + title + subtitle. Used on empty lists |

### 1.5 Tab Bar Config Updates (in role `_layout.tsx` files)

| Role | Current tabs | New tabs (Stitch) |
|---|---|---|
| Customer | Home, Services, Payments, Account | Dashboard, Solar, Usage, Profile |
| Staff | My Jobs, Schedule, Profile | Jobs, Schedule, Account |
| Admin | Jobs, Customers, Analytics, Account | Dashboard (Overview), Staff, Fleet, Settings |

Tab label + icon changes only in this phase — routes unchanged, content unchanged.

### Phase 1 Deliverables
- `src/theme/index.ts`
- `src/theme/icons.ts`
- `src/components/ui/` (11 primitives)
- Font loading in `_layout.tsx`
- Tab bar label/icon updates in 3 role layouts
- **Zero screen content changes**

---

## Phase 2 — Auth: Login Screen

**File:** `app/(auth)/login.tsx`
**Stitch source:** `login/code.html`

### Layout

Full-screen `background` fill with two decorative blurred circles (top-right `primaryContainer`, bottom-left `secondaryContainer`, 30% opacity) for depth.

**Header section (centered, top third):**
- `Card` 64×64 with `solar_power` icon — brand mark
- "GreenVolt" in `headlineLg`, `primary` color
- Subtitle: "Efficient stewardship of your solar telemetry." in `bodyMd`, `onSurfaceVariant`

**Form card (`Card` component, full width, `pagePadding` margin):**
- "Welcome Back" in `titleLg`
- Email field: outlined style, floating `labelMd` label, mail icon prefix
- Password field: outlined style, lock icon prefix, eye icon toggle suffix
- "Forgot Password?" right-aligned `labelMd` link in `primary`
- `PrimaryButton` "Login" with arrow-right icon

**Below card:**
- "Don't have an account? Sign Up" `bodyMd` centered link

**No bottom navigation bar** (pre-auth screen).

### Notes
- Error state: `errorContainer` bg strip appears below password field with error message
- Loading state: PrimaryButton shows spinner, inputs disabled
- No changes to auth logic or API calls

---

## Phase 3 — Customer Booking Flow

**5 screens. Self-contained flow. Highest user-facing impact.**

### Screen 3.1 — Service Catalog (`(customer)/book/index.tsx`)
**Stitch source:** `service_catalog`

**Top:**
- `AppHeader` with back arrow
- Step indicator: "STEP 1 OF 4" left-aligned `labelMd` `outlineVariant` + "Select Service" right-aligned

**Body:**
- `headlineSm` "Our Services"
- `bodyMd` subtitle "Select a maintenance package to keep your system at peak performance."

**Service cards (vertical list):**
Each `Card`:
- Category `labelMd` uppercase + `onSurfaceVariant` (e.g. "MAINTENANCE")
- Service name `titleLg`
- Description `bodyMd`
- Duration row: clock icon + "2h" + certified icon + "Certified Pro"
- Price `headlineSm` bold + "Total with GST" `labelMd` `onSurfaceVariant`
- `PrimaryButton` "Book Now" right-aligned
- POPULAR badge: `secondaryContainer` bg, `onSecondaryContainer` text, top-right absolute corner

### Screen 3.2 — Pick Date & Time (`(customer)/book/[id].tsx`)
**Stitch source:** `pick_date_time`

**Top:**
- `AppHeader` with back + X close
- "Step 2 of 4" centered `labelMd`
- 4-step progress line: filled circles (✓) for completed, numbered for upcoming, connected by lines. Active = `primaryContainer`, complete = `primary`

**Selected service card (outlined `Card`):**
- Service icon circle + service name `titleLg` + "Est. duration: X hours" `bodyMd`

**Date picker:**
- Month + year `headlineSm` + prev/next chevrons
- Horizontal strip of day columns (Mon/Tue/Wed...) — each shows day label `labelMd` + date number `titleLg`
- Selected date: `primaryContainer` filled rounded square
- Unavailable dates: `onSurfaceVariant` with strikethrough

**Time slots:**
- "Available Time Slots" `labelLg`
- 2×2 grid of outlined buttons (9:00 AM, 11:30 AM, 2:00 PM, 4:30 PM)
- Selected slot: `primaryContainer` bg + checkmark icon + `primary` text

**Notes:**
- "Notes for Technician (Optional)" `labelLg`
- Multi-line outlined `TextInput` with placeholder

**Sticky bottom:**
- `LimeButton` "Proceed to Review →"

> **Layout note:** This is a rebuild from the current vertical date picker. The horizontal date strip is the key visual difference.

### Screen 3.3 — Review & Pay (`(customer)/book/review.tsx`)
**Stitch source:** `review_pay`

**Top:**
- `AppHeader` with back
- "Review & Pay" `titleLg` + "Step 3 of 4" `labelMd`
- Step progress indicator (step 3 active)

**Service Summary `Card`:**
- Service name `titleLg` + `CONFIRMED` lime badge
- Date + time `bodyMd` with calendar icon

**Price Breakdown `Card`:**
- Line items table: Service Charge / Visit Charge / GST / Discount (each with amount right-aligned)
- Divider
- Total row: `titleLg` bold

**Offers & Promos `Card`:**
- Outlined coupon input + "Apply" `PrimaryButton`
- "Hint: Try SOLAR10" `labelMd` `onSurfaceVariant`
- Applied coupon: lime pill badge with × remove

**Payment Method `Card`:**
- Radio list, 5 options each with icon:
  1. UPI — "Google Pay, PhonePe, Paytm"
  2. Credit / Debit Card — "Visa, Mastercard, RuPay"
  3. Net Banking — "All major banks"
  4. Wallet — "Amazon Pay, Mobikwik"
  5. Cash on Service — "Pay after completion"
- Selected option row: `surfaceContainerLow` bg highlight + filled radio

**Sticky bottom:**
- Left: "Total Amount" `labelMd` + amount `titleLg` bold + "View detailed bill" `labelMd` link
- Right: `LimeButton` "Confirm Booking →"

### Screen 3.4 — Booking Success (`(customer)/book/success.tsx`)
**Stitch source:** `booking_success`

**Full-screen centered layout:**
- Large lime (`secondaryContainer`) circle with dark green checkmark — 96px diameter
- "Booking Confirmed!" `headlineMd`
- Booking ID pill: `#` icon + "BOOKING ID: GV-XXXXX" `labelMd`, `surfaceContainerHigh` bg

**Service Summary `Card`:**
- "Service Summary" `titleLg`
- Divider
- Service row: solar icon + "Service" label + service name bold
- Schedule row: calendar icon + "Schedule" label + date + time
- Divider
- Total Amount row: `headlineSm` bold right-aligned

**SMS note strip:**
- `surfaceContainerLow` bg, chat icon + "You will receive an SMS confirmation shortly." `bodyMd`

**Buttons:**
- `PrimaryButton` "View My Services" with list icon
- `OutlineButton` "Back to Home"

---

## Phase 4 — Customer Portal

**5 screens. Customer's day-to-day app experience.**

### Screen 4.1 — Customer Dashboard (`(customer)/index.tsx`)
**Stitch source:** `customer_dashboard`

**`AppHeader`:** GreenVolt logo left, avatar right

**Welcome section:**
- "Hello, [Name]!" `headlineLg`
- Location row: map-marker icon + city `bodyMd` `onSurfaceVariant`
- Capacity pill: flash icon + "5 kW Capacity" `labelMd` `primaryContainer` bg

**Next Service `Card`:**
- "Next Service" `labelMd` + `CONFIRMED` lime badge
- Service name `titleLg`
- Date `bodyMd`
- Technician row: avatar icon + "Technician: [Name]"

**QUICK ACTIONS section:**
- `SectionHeader` "Quick Actions"
- Horizontal scroll row of 5 icon+label pills (Services, Payments, Subscription, Book Now, Support)
- Each pill: MCIcons icon + `labelMd`, `surfaceContainerLow` bg, `radius.full`

**System Overview `Card`:**
- "System Overview" `titleLg`
- 2×2 grid of labeled value cells: Capacity / Installation / Active Plan / Last Service

**Subscription `Card`:**
- Plan name `titleLg` + "Expires in X days" `labelMd` right
- Plan description `bodyMd` `onSurfaceVariant`
- `PrimaryButton` "Renew Subscription"

**Recent Services section:**
- `SectionHeader` "Recent Services" + "View All" link
- List of service rows: service name + date left, `StatusBadge` right

**Bottom tab bar:** Dashboard (active) / Solar / Usage / Profile

### Screen 4.2 — My Services (`(customer)/services/index.tsx`)
**Stitch source:** `services_list`

**`AppHeader`** + "Request Service" `PrimaryButton` top-right

**Active Services section:**
- `SectionHeader` "Active Services"
- Service cards with: technician avatar + name + role, service name `titleLg`, date + calendar icon, `StatusBadge`, description `bodyMd`

**Past Services section:**
- `SectionHeader` "Past Services"
- Same card layout, `StatusBadge` showing Completed

**Empty state:** `EmptyState` component

**Bottom tab bar:** Usage tab active (maps to Services)

### Screen 4.3 — Service Detail (`(customer)/services/[id].tsx`)
**Extrapolated from design system — no Stitch screen**

`Card` layout following established patterns:
- Status `Card`: service type `titleLg` + `StatusBadge`
- Details `Card`: scheduled date, completed date, technician name (with `Avatar`), notes, remarks — each as `InfoRow`
- Photos `Card`: 2-slot dashed grid (Before / After) — display only (no camera on customer side)
- PDF Download: `OutlineButton` "Download Report" (completed jobs only)

### Screen 4.4 — Payments (`(customer)/payments.tsx`)
**Stitch source:** `payments`

**Summary cards row (2 cards):**
- Total Paid `MetricCard`: `metricXl` amount + "+12.5%" trend pill
- Pending Dues `MetricCard`: amount + "Due by [date]" + `PrimaryButton` "Pay Now"

**Transaction History section:**
- `SectionHeader` "Transaction History"
- Transaction cards: service name + date left, amount `titleLg` + `StatusBadge` right, payment method icon row

**Load More:** `OutlineButton` "Load More Transactions"

**Bottom tab bar:** Usage tab active

### Screen 4.5 — Subscription (`(customer)/subscription.tsx`)
**Stitch source:** `subscription`

**Plan `Card` (hero):**
- "Pro Plan" `headlineMd` + "Active" `StatusBadge`
- Billing: `metricXl` amount + "/ month" `bodyMd`
- Next Renewal date
- Two buttons: `PrimaryButton` "Renew Now" + `OutlineButton` "Change Plan"

**Features `Card`:**
- "Included Features" `titleLg`
- List: each feature = icon + name `bodyLg` + description `bodyMd` `onSurfaceVariant`

**Billing History `Card`:**
- `SectionHeader` "Billing History"
- Table rows: date / description / amount / "Paid" badge / download icon

**Bottom tab bar:** Profile tab active

### Screen 4.6 — Customer Profile (`(customer)/profile.tsx`)
**Stitch source:** `profile`

**`AppHeader`** with notification bell right

**Profile header `Card`:**
- `Avatar` large (initials)
- Name `headlineSm`
- Status: green LED dot + "Online" `labelMd`

**Personal Information `Card`:**
- `InfoRow` x4: Email / Phone / Service City / Status
- Edit mode: tapping row turns to inline `TextInput`

**System Details `Card`:**
- `InfoRow` x2: Total Capacity / Install Date

**Notification Preferences `Card`:**
- Toggle rows: Email Alerts / SMS Notifications / Push Notifications
- Each: label `bodyLg` + `Switch` component

**`OutlineButton`** "Logout securely" with logout icon

**Bottom tab bar:** Profile tab active

---

## Phase 5 — Staff Portal

**4 screens. Field technician's primary workflow.**

### Screen 5.1 — My Jobs (`(staff)/jobs.tsx`)
**Stitch source:** `staff_my_jobs`

**`AppHeader`** with refresh icon right

**Filter chips row:**
- All / Pending / In Progress / Completed
- Active chip: `primaryContainer` bg, `primary` text, filled
- Inactive: `surfaceContainerLow` bg, `onSurfaceVariant` text, outlined

**Job cards (`Card` per job):**
- Customer name `titleLg` + `StatusBadge` top-right
- Service type `bodyMd` `onSurfaceVariant`
- Location row: map-marker icon + address `bodyMd`
- Time row: clock icon + scheduled time `bodyMd`
- Button row: `PrimaryButton` "View Details" (in_progress) or "Start Job" (pending) + square `OutlineButton` navigation icon

**Empty state:** `EmptyState` "No jobs assigned"

**Bottom tab bar:** Jobs (active) / Schedule / Account

### Screen 5.2 — Schedule (`(staff)/schedule.tsx`)
**Stitch source:** `schedule`

**`AppHeader`** + month/year `titleLg` centered

**Weekly date strip:**
- 5 columns (Mon–Fri), each: day label `labelMd` + date number `titleLg`
- Active day: `primaryContainer` rounded square fill
- Today: indicator dot below date number

**Timeline (FlatList of time-blocked cards):**
- Time label `labelMd` `onSurfaceVariant` left margin
- Job `Card` inline: customer/location name `bodyLg` + location `bodyMd` + type badge
- Status visual: past jobs = `surfaceContainerLow` bg + reduced opacity; current = `surfaceContainerLowest` white + full opacity
- Active job card: "Navigate" `PrimaryButton` + "Mark Done" `OutlineButton`

**Bottom tab bar:** Schedule (active) / Jobs / Account

### Screen 5.3 — Job Details (`job/[id].tsx`)
**Stitch source:** `job_details_staff_view`

**Header:** "Job #GV-XXXX" `titleLg` + service type `bodyMd` subtitle + ⋮ menu

**Status stepper (4 steps, horizontal):**
Scheduled → En Route → In Progress → Completed
- Completed steps: filled green circle with checkmark
- Active step: filled `primaryContainer` circle with step number
- Future steps: outlined circle
- Connecting lines fill green as steps complete

**Customer `Card`:**
- `Avatar` + "CUSTOMER" `labelMd` label + name `titleLg`
- Two buttons: `OutlineButton` "Call" (phone icon) + `OutlineButton` "Message" (chat icon)

**Location `Card`:**
- address `bodyLg`
- Static map image (street-level view via Maps Static API or `react-native-maps` snapshot)
- `PrimaryButton` "Navigate" — opens `maps.google.com/?q=address`

**Service Overview `Card`:**
- "SERVICE OVERVIEW" `labelMd` uppercase
- Service name `bodyLg` bold + description `bodyMd`

**Site Documentation `Card`:**
- "Site Documentation" `titleLg` + "X/2 Captured" `labelMd` right
- 2-slot dashed grid: Before Service + After Service
- Tapping empty slot: opens camera via `expo-image-picker`
- Tapping captured slot: opens full-screen image preview

**Technician Remarks `Card`:**
- Outlined multiline `TextInput`
- Placeholder: "Enter findings, parts used, or client notes..."
- "Save Remarks" appears as `labelLg` link when text is dirty

**Actions:**
- `OutlineButton` "Generate Preliminary Report" (mid-job — in_progress only)
- Bottom fixed bar: `OutlineButton` "Pause Job" left + `LimeButton` "Complete Job" right

#### New features requiring backend work:
| Feature | Frontend | Backend |
|---|---|---|
| En Route status | 4th stepper step + "Start Journey" CTA | Add `en_route` to status enum, migration |
| Pause Job | Pause CTA + reason prompt modal | Add `paused` to status enum |
| Call/Message | `Linking.openURL('tel:...')` / `sms:...` | Customer phone already in API response |
| Map view | Maps Static API image or RN Maps snapshot | No change |
| Navigate button | `Linking.openURL('https://maps.google.com/?q=...')` | No change |
| Preliminary Report | Partial PDF with current photos + remarks | Extend existing PDF endpoint |

### Screen 5.4 — Staff Profile (`(staff)/profile.tsx`)
**Stitch source:** `staff_profile`

**`AppHeader`** with back + edit icon

**Profile header `Card` (with decorative gradient strip):**
- `Avatar` large + name `headlineSm`
- ID: "GV-TECH-XXXX" `labelMd` `onSurfaceVariant`
- "Technician" `StatusBadge`
- Online indicator: green LED dot + "Online" `labelMd`

**Quick stats row (2 `MetricCard`):**
- Jobs Completed: number `metricXl`
- Rating: star icon + "4.8" `metricXl`

> Note: jobs count and rating are new data points not currently in the API response. API enhancement needed.

**Contact Info `Card`:**
- `InfoRow` x3: Email / Phone / Service Region

**Certifications `Card`:**
- "Certifications" `titleLg`
- Each cert: verified-badge icon + cert name `bodyLg` + "Valid thru YYYY" `labelMd` `onSurfaceVariant`

> Note: Certifications are a new data concept. Needs new DB table + API endpoint.

**Account Settings list:**
- Tappable rows with chevron: Personal Details / Security & Password / Notification Preferences

**Help & Support list:**
- Help & Support / Company Policies (tappable rows)

**`OutlineButton`** "Logout" with logout icon in `error` color

**Bottom tab bar:** Jobs / Schedule / Account (active)

---

## Phase 6 — Admin Portal

**6 screens. Management and oversight tools.**

### Screen 6.1 — Analytics Overview (`(admin)/analytics.tsx`)
**Stitch source:** `admin_analytics`

**`AppHeader`** with notification bell

**Revenue `MetricCard` (hero, full width):**
- "Total Revenue" `labelLg`
- `metricXl` ₹ amount
- "+X%" lime trend pill with trending-up arrow

**Service Status section:**
- `SectionHeader` "Service Status"
- 2×2 `MetricCard` grid: Completed / Pending / In Progress / Unread Contacts
- Unread Contacts: `error` color value + envelope icon

**People Overview section:**
- `SectionHeader` "People Overview"
- 2×2 `MetricCard` grid: Total Customers / Active Subs / Total Staff / Active Staff
- Active Staff + Active Subs: small green LED dot in card

**Bottom tab bar:** Dashboard/Overview (active) / Staff / Fleet / Settings

### Screen 6.2 — Jobs Master List (`(admin)/jobs.tsx`)
**Stitch source:** `jobs_master_list`

**`AppHeader`** with search + notification icons

**Page header:**
- "Admin Jobs List" `headlineSm`
- Subtitle: "Master view of all fleet assignments and service records" `bodyMd`

**Search bar:** outlined input + search icon, "Search jobs, customers, techs..."

**Filter chips:** All Jobs / Pending / In Progress / Completed / Cancelled

**Job cards (`Card` per job):**
- Job ID `labelMd` `onSurfaceVariant` (e.g. JOB-2049)
- Customer name `titleLg` + `StatusBadge` top-right
- Technician row: engineering icon + name (or "Unassigned" italic)
- Service type `bodyMd`
- Date/location row with icons

**Status-dependent CTA button:**
- Pending + unassigned → `PrimaryButton` "Assign Technician" (opens staff picker modal)
- In Progress → `OutlineButton` "View Details"
- Completed → `OutlineButton` "View Report"

> "Assign Technician" is a new inline action not in the current app. Opens a bottom sheet with a staff list and confirms assignment via existing `PATCH /services/:id` endpoint.

**Bottom tab bar:** Dashboard (active) / Staff / Fleet / Settings

### Screen 6.3 — Customers Master List (`(admin)/customers/index.tsx`)
**Stitch source:** `customers_master_list`

**`AppHeader`** with search icon

**Filter tabs:**
- All Customers / Active Solar / Pending Installs / High Usage
- Active: `primaryContainer` pill; inactive: `surfaceContainerLow`

> "Active Solar", "Pending Installs", "High Usage" are new filter categories. Map to API query params on the customers list endpoint.

**Customer cards (`Card`):**
- `Avatar` initials circle
- Name `titleLg` + location `bodyMd` with map-marker icon
- Services count: wb_sunny icon + "X Solar services"
- `StatusBadge` (Active / Pending)
- ⋮ more menu (Edit / View / Deactivate)

**FAB:** `LimeButton` with `+` icon, fixed bottom-right → navigates to Add Customer form

**Bottom tab bar:** Dashboard / Staff (active) / Fleet / Settings

### Screen 6.4 — Customer Profile Admin View (`(admin)/customers/[id].tsx`)
**Stitch source:** `customer_profile_admin_view`

**`AppHeader`** with back + edit icon

**Profile `Card`:**
- `Avatar` large (primary-container border)
- Name `headlineSm` + ID `labelMd`
- Facility / Phone / Joined — `InfoRow` x3
- `OutlineButton` "Contact" with mail icon

**Subscription `Card`:**
- Plan name + bolt icon `titleLg` + `StatusBadge` "Active"
- "Monthly Allocation: X MWh (Y MWh Used)" `bodyMd`
- Progress bar: 4px track, `secondaryContainer` fill — shows % used

**Key Metrics row (2 `MetricCard`):**
- Lifetime Value: `metricXl` amount + trend pill
- Total Energy Handled: `metricXl`

> Lifetime value and energy data are new metrics not in the current API. Backend enhancement needed.

**Service History `Card`:**
- `SectionHeader` "Service History" + "Filter" button
- Table rows: date / service type with icon / `StatusBadge` / chevron-right
- `OutlineButton` "View All Records"

### Screen 6.5 — Staff Management (`(admin)/staff.tsx`)
**Stitch source:** `staff_management`

**`AppHeader`** with search + notification icons

**Page header:** "Staff Directory" `headlineSm` + `PrimaryButton` "Add Staff" (person-add icon)

**Search bar:** "Search by name or ID..."

**Staff cards grid (1 col mobile, 2-3 col tablet):**
Each `Card`:
- `Avatar` circle (initials) + name `titleLg`
- ID `labelMd` `onSurfaceVariant`
- `StatusBadge` (Active / On Leave)
- Current Assignment box: icon + assignment description `bodyMd`
  - If assigned: job name and location
  - If unassigned: "Unassigned — [reason]" italic

> Current assignment is a new display concept. Requires API to return current active job alongside staff record.

### Screen 6.6 — Admin Profile / Settings (`(admin)/profile.tsx`)
**Stitch source:** `admin_settings`

**`AppHeader`**

**Profile `Card` (left-aligned):**
- `Avatar` large (`primaryContainer` bg)
- Name `headlineSm` + "System Admin" badge
- Email `bodyMd`
- `OutlineButton` "Edit Profile" with edit icon

**Admin Control cards (2×2 grid):**
Each `Card` is tappable with hover elevation:

1. **Manage Staff** — group icon + "Add, remove, or modify staff accounts" → navigates to `(admin)/staff`
2. **System Settings** — settings-applications icon + "Configure global platform thresholds, alerts, and API integrations" → placeholder screen (Phase 7)
3. **Role Permissions** — admin-panel-settings icon + "Define custom roles and adjust feature access levels" → placeholder screen (Phase 7)
4. **Logout** — logout icon + "Securely end your administrative session" → `errorContainer` bg card, `error` text

**Bottom tab bar:** Dashboard / Staff / Fleet / Settings (active)

---

## Phase 7 — New Feature Screens

**These screens appear in Stitch tab bars but have no design files yet. They represent entirely new product features requiring both design and backend work. Phase 7 cannot begin until product decisions are made.**

### 7.1 — Solar Tab (`(customer)/solar` + `(admin)/solar`)
Appears in both customer and admin bottom tab bars as "Solar" (wb_sunny icon).

**Product questions to resolve:**
- Does this show live solar panel telemetry (panel-by-panel output)?
- Is this connected to actual hardware/inverter APIs, or just service history?
- Is it the same screen for admin and customer, or different?

**Likely content (based on Stitch DESIGN.md "data-driven utility platform" language):**
- Real-time or last-known kWh generation
- Panel health status grid
- Generation trend chart (daily/weekly/monthly)
- Any fault alerts

### 7.2 — Usage Tab (`(customer)/usage` + `(admin)/usage`)
Appears as "Usage" (electric_bolt icon) in all role tab bars.

**Product questions to resolve:**
- Is this energy consumption (grid draw) vs generation?
- Does it pull from an external API (inverter/smart meter)?
- What time resolutions are shown (day/month/year)?

### 7.3 — Fleet Tab (`(admin)/fleet`)
Appears in admin tab bar as "Fleet".

**Product questions to resolve:**
- Is Fleet a map view of staff locations?
- Is it vehicle/equipment tracking?
- Or is it a combined staff + job status live view?

### 7.4 — System Settings & Role Permissions
Referenced in the Admin Settings screen (6.6) as tappable cards. Full-page screens needed for each. Content and permissions model not yet defined.

---

## Backend Changes Required

The following code changes are needed outside the React Native app to support new features introduced by the Stitch designs:

| Feature | File(s) | Change |
|---|---|---|
| En Route status | `lib/db/src/schema/services.ts` | Add `en_route` to status enum |
| Paused status | `lib/db/src/schema/services.ts` | Add `paused` to status enum |
| DB migration | `lib/db/` | New migration file for enum changes |
| Assign Technician | `apps/api-server/src/routes/services.ts` | Allow staff_id update on PATCH endpoint |
| Staff job count + rating | `apps/api-server/src/routes/staff.ts` | Add aggregated fields to staff response |
| Staff certifications | `lib/db/src/schema/` + API | New `certifications` table + CRUD endpoints |
| Customer lifetime value | `apps/api-server/src/routes/customers.ts` | Aggregate from payments table |
| Customer current assignment | `apps/api-server/src/routes/staff.ts` | Include active job in staff list response |
| Preliminary report | `apps/api-server/src/routes/` | Extend PDF endpoint to accept partial jobs |

---

## Cross-Cutting Notes

### Dark Mode
Stitch DESIGN.md defines `darkMode: "class"`. **Out of scope for this revamp.** The token system in Phase 1 is structured to support it later (all colors are named semantically, not `dark-something`), but no dark variants will be implemented in Phases 1–6.

### Migration Strategy
Screens are reskinned one phase at a time. Mixed styling (some screens on new system, others on old) is acceptable during the migration — the token file is purely additive.

### Testing per Screen
For each reskinned screen, verify on a physical Android device:
- All data still loads and displays correctly
- Navigation and back gestures work
- Error + empty states render
- Pull-to-refresh works
- No layout overflow on 375px and 390px width

---

## File Change Summary

| File | Phase | Type |
|---|---|---|
| `src/theme/index.ts` | 1 | New |
| `src/theme/icons.ts` | 1 | New |
| `src/components/ui/` (11 files) | 1 | New |
| `app/_layout.tsx` | 1 | Modify |
| Role `_layout.tsx` files (3) | 1 | Modify |
| `app/(auth)/login.tsx` | 2 | Modify |
| `app/(customer)/book/index.tsx` | 3 | Modify |
| `app/(customer)/book/[id].tsx` | 3 | Modify (rebuild) |
| `app/(customer)/book/review.tsx` | 3 | Modify |
| `app/(customer)/book/success.tsx` | 3 | Modify |
| `app/(customer)/index.tsx` | 4 | Modify |
| `app/(customer)/services/index.tsx` | 4 | Modify |
| `app/(customer)/services/[id].tsx` | 4 | Modify |
| `app/(customer)/payments.tsx` | 4 | Modify |
| `app/(customer)/subscription.tsx` | 4 | Modify |
| `app/(customer)/profile.tsx` | 4 | Modify |
| `app/(staff)/jobs.tsx` | 5 | Modify |
| `app/(staff)/schedule.tsx` | 5 | Modify |
| `app/job/[id].tsx` | 5 | Modify + new features |
| `app/(staff)/profile.tsx` | 5 | Modify |
| `app/(admin)/analytics.tsx` | 6 | Modify |
| `app/(admin)/jobs.tsx` | 6 | Modify |
| `app/(admin)/customers/index.tsx` | 6 | Modify |
| `app/(admin)/customers/[id].tsx` | 6 | Modify |
| `app/(admin)/staff.tsx` | 6 | Modify |
| `app/(admin)/profile.tsx` | 6 | Modify |
| Solar/Usage/Fleet screens | 7 | New |
| **Total** | | **13 new, 23 modified** |
