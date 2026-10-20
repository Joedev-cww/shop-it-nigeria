# Shop It feature review

Reviewed 20 October 2026. This is not a production security certification.

## Changes completed

- Uploaded logo added to the header, footer, and browser icon.
- All 18 generated sample products and six sample shops archived out of the live catalog, preserving records and categories. Real sellers were not targeted.
- Home and browse now show an empty catalog.

## Phase 1: implemented foundations, not complete

Implemented: email/password signup and password reset UI, social sign-in UI, stored phone number, categories, typo-tolerant search, price/category/campus/rating filters and sorting; product galleries, descriptions, Naira prices, seller shops and ratings; wishlist, share action, stock-alert subscriptions; basic shop creation, listing creation, compressed photos, status visibility controls, vacation mode, listing fee breakdown, delivery option fields, saved default area, and a low-data setting.

Partial or missing:
- Phone OTP is not implemented; phone collection is not verification. Hosted sign-in and email delivery settings were not reverified in this review.
- ID and guardian fields, private storage policies, and approval states exist, but seller ID submission/review and guardian verification are not complete usable flows. Shop approval does not yet enforce a completed verification review.
- Seller product editing, shop-logo upload, and full stock management need completion and authenticated end-to-end testing.
- Badges use stored shop statistics; verified completed-sale/review logic does not yet exist.
- Delivery preview uses listing fees, not a complete area-based delivery system; custom orders are a listing option, not a working structured-order form.
- Stock alert subscriptions are stored; restock notifications are not sent.
- Service fee and display price are enforced in the database. The seller form also calculates an illustrative fee preview in the browser; this does not meet the requirement that every calculation be server-side only.

## Phase 2: not built

Cart, Buy Now checkout, Paystack/Flutterwave payments, webhook verification, escrow, five-day release, refund/retry handling, order tracking/receipt confirmation/cancellation, completed-purchase reviews, order history, coupons/bundles/referrals, fee-refund rules, grouped delivery, pickup hubs, packed-item evidence, gift notes, and courier address handoff remain outstanding. Current purchase buttons are placeholders; displayed payment-protection text is not proof that escrow is operational.

## Phase 3: not built

Pending/Available wallets, append-only double-entry ledger, transfers to Nigerian banks/Opay, verified-account name matching, ₦1,000 withdrawal minimum, new-seller daily limits, first-withdrawal review, withdrawal OTP, payout-account OTP and 24-hour cooling, alerts, transaction history, freeze controls, and configurable withdrawal fees remain outstanding.

## Phase 4: foundations only

Text contact filters and role/access policies exist. Locked chat, preset replies, filtered-message escalation, AI reply suggestions, OCR contact scanning, reporting on all surfaces, identity-masked order/chat views, moderation queues, disputes/evidence/timelines, support tickets/inbox, prohibited-item enforcement, and legal/help/protection pages remain outstanding.

## Phase 5: foundations only

Role definitions, some database fee/category controls, basic page metadata, skeletons, and empty states exist. No working admin panel, CSV reporting, homepage management, announcements/maintenance, notifications, seller levels, full analytics, PWA, Pidgin translation, sitemap, or comprehensive soft-deletion audit system exists.

## Security: incomplete and unverified

Access policies, server-enforced product pricing, limited text filters, private-file access paths, and photo re-encoding are foundations only. Mandatory seller/admin MFA, optional buyer MFA, breached-password checks, CAPTCHA/rate limits/lockouts, session/device alerts, malware/OCR checks, admin/money audit logs, fraud detection, NDPA consent/deletion/legal review, encrypted backup restore tests, deployment HTTPS/HSTS/CSP/header configuration, dependency scanning, and production monitoring need implementation or hosted verification. Payment and withdrawal security cannot be claimed until those flows exist and are tested.

## Checks performed for this change

- Existing format and routing tests: 11 passed.
- Logo loaded and no product/shop cards appeared on home and browse at phone and desktop sizes.
- This does not verify signup, seller identity approval, listing creation, or any financial flow.

## Next approval and dependencies

Finish Phase 1 gaps before advancing to Phase 2. Major new phase work needs user approval; live OTP/messaging and Paystack or Flutterwave setup will require provider configuration and credentials through secure forms, never chat or committed code.