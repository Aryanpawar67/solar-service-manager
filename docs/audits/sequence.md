 Audit Complete — 4 Reports Written
  
  docs/audits/admin-audit.md | docs/audits/customer-audit.md | docs/audits/staff-audit.md | docs/audits/auth-shared-audit.md

 
 Critical (P0) — Fix These First
  
  ┌──────────────────────┬──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
  │         Area         │                                                            Issue                                                             │
  ├──────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ Auth                 │ Forgot-password returns reset token in plaintext JSON response — anyone on the network can hijack any account                │
  ├──────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ Auth                 │ Register endpoint: two sequential DB inserts with no transaction — partial failure creates orphaned records, blocks          │
  │                      │ re-registration                                                                                                              │
  ├──────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ Customer             │ JWT token exposed in PDF download URL (?token=...) — leaks into logs, browser history, Referer headers                       │
  ├──────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ Customer             │ /api/services/:id/report has no ownership check — any customer can fetch any other customer's report by ID                   │
  ├──────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ Customer             │ "Pay Now" button only shows an Alert.alert() — no actual payment flow wired up                                               │
  ├──────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ Admin                │ analytics.tsx reads d?.unreadContacts but API returns newContactsUnread — Unread Contacts stat card always shows 0           │
  ├──────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ Admin/Staff/Customer │ services.ts line 218: return res.status(201).json(service) before the notification block — all job creation notifications    │
  │                      │ (SMS + push) are dead code and never fire                                                                                    │
  ├──────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ Staff                │ Push tokens never register for staff — PUT /api/me/push-token is guarded by requireRole("customer"), staff always get 403    │
  └──────────────────────┴──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

  ---
  High (P1) — Security & Core Functionality

  ┌──────────┬───────────────────────────────────────────────────────────────────────────────────────────────────────┐
  │   Area   │                                                 Issue                                                 │
  ├──────────┼───────────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ Auth     │ No auth/role guards in (admin), (staff), (customer) layout files — deep-link bypasses role routing    │
  ├──────────┼───────────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ Auth     │ Token expiry only checked at cold-start — 8h background session stays "authenticated"                 │
  ├──────────┼───────────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ Auth     │ me.ts applies requireRole without requireAuth first — unauthenticated requests get 403 instead of 401 │
  ├──────────┼───────────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ Auth     │ No logout button exists anywhere in the UI                                                            │
  ├──────────┼───────────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ Admin    │ PUT/DELETE /api/staff/:id, analytics, and customer mutation routes missing requireRole("admin")       │
  ├──────────┼───────────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ Admin    │ Staff role field cannot be edited after creation                                                      │
  ├──────────┼───────────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ Customer │ Profile edit saves to address column but dashboard reads city — address never shows                   │
  ├──────────┼───────────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ Customer │ Notification toggles (Email/SMS) are pure local state — call no API, lost on reload                   │
  ├──────────┼───────────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ Customer │ Orphaned pending payment records when Razorpay modal is cancelled (no webhook cleanup)                │
  ├──────────┼───────────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ Staff    │ advanceStatus (job status changes) has no error callback — failures are completely silent             │
  ├──────────┼───────────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ Staff    │ Profile screen always shows "—" for Phone and Service Region — no fetch is made                       │
  └──────────┴───────────────────────────────────────────────────────────────────────────────────────────────────────┘

  ---
  Medium (P2) — UX & Data Gaps

  ┌──────────┬─────────────────────────────────────────────────────────────────────────────────────┐
  │   Area   │                                        Issue                                        │
  ├──────────┼─────────────────────────────────────────────────────────────────────────────────────┤
  │ Admin    │ "Cancelled" filter tab missing from Jobs screen                                     │
  ├──────────┼─────────────────────────────────────────────────────────────────────────────────────┤
  │ Admin    │ limit: 200 in jobs but API caps at 100, no pagination                               │
  ├──────────┼─────────────────────────────────────────────────────────────────────────────────────┤
  │ Admin    │ serviceCount on customer cards always "—" (field not returned by API)               │
  ├──────────┼─────────────────────────────────────────────────────────────────────────────────────┤
  │ Customer │ Date booking uses toISOString() (UTC) — IST users early morning book the wrong date │
  ├──────────┼─────────────────────────────────────────────────────────────────────────────────────┤
  │ Customer │ Payments trend "+12.5% vs last month" is hardcoded                                  │
  ├──────────┼─────────────────────────────────────────────────────────────────────────────────────┤
  │ Customer │ "Load More Transactions" shows an Alert instead of fetching page 2                  │
  ├──────────┼─────────────────────────────────────────────────────────────────────────────────────┤
  │ Staff    │ Notification toggles reset to true on every app launch                              │
  ├──────────┼─────────────────────────────────────────────────────────────────────────────────────┤
  │ Staff    │ Navigate button on job cards opens "View Details" instead of maps                   │
  ├──────────┼─────────────────────────────────────────────────────────────────────────────────────┤
  │ Auth     │ OfflineBanner not safe-area-aware — hidden behind notches                           │
  ├──────────┼─────────────────────────────────────────────────────────────────────────────────────┤
  │ Auth     │ TabIcon component copy-pasted in all 3 role layout files                            │
  ├──────────┼─────────────────────────────────────────────────────────────────────────────────────┤
  │ Auth     │ ErrorBoundary doesn't call Sentry.captureException                                  │
  └──────────┴─────────────────────────────────────────────────────────────────────────────────────┘
