# Shop It Nigeria

Build a mobile-first marketplace website called "Shop It" where teenagers and students in Nigeria sell handmade items (beads, fragrance, bags, etc.). Currency: Naira (₦). Keep the design simple, clean, modern and fast on slow networks. Build in phases and ask before making big changes.



## USER ROLES

Buyer, Seller, Admin (sub-roles: Moderator, Finance, Support).



## BUYER FEATURES

- Sign up with email + phone (OTP verification)

- Browse categories, search (typo-tolerant), filters (price, category, campus/location, rating), sort (newest, price, top rated)

- Product page: multiple photos, description, price, delivery cost preview, seller shop name and rating, reviews

- "Buy Now" for a single item, plus a cart for multiple items

- Wishlist, share to WhatsApp/Instagram, "new arrivals", "sold out, notify me"

- Order tracking: Paid → Packed → Shipped → Delivered

- "Item received" button (releases payment) and "Report a problem" button (opens dispute)

- Reviews only for completed orders

- Cancel order before the seller marks it packed (automatic refund)

- Order history, saved delivery areas, notification settings



## SELLER FEATURES

- Seller signup with ID verification (admin approves before listing)

- Sellers under 18 need guardian consent. Payouts only to a guardian or verified account.

- Shop page: logo, bio, campus tag, social links (display only)

- Dashboard: add/edit products (auto-compress photos), stock levels, orders, earnings, wallet, simple sales stats (best sellers, views, orders per week)

- Seller enters their own price only. The system adds the Shop It fee automatically.

- Seller sees the breakdown: price, fee, what they earn

- Badges: Verified, Fast Responder, 10 Sales, Top Rated

- Seller levels: more completed sales and good ratings unlock lower fees and homepage features

- Custom orders (names on beads, colours, sizes) through a structured form

- "Vacation mode" to pause the shop

- Auto-hide a product when stock hits zero



## PRICING AND FEE

- Display price = seller price + Shop It service fee

- Default fee: flat ₦500 per item, editable by admin, with optional tiered fee (under ₦2,000 = ₦200, ₦2,000 to ₦10,000 = ₦500, above ₦10,000 = 5%)

- Checkout shows: Item price + Shop It service fee (buyer protection) + delivery fee = Total

- Coupon codes, bundle discounts, referral rewards, first-month zero-fee promo toggle

- Fee refund rules on cancelled and refunded orders, set by admin

- All price, fee and total calculations are done server-side only



## PAYMENTS AND ESCROW

- Paystack or Flutterwave only. Never store card details.

- Escrow: buyer's money is held until the buyer confirms "Item received"

- Auto-release after 5 days if the buyer does not respond, unless a dispute is open

- Refund flow if the item never arrives or is not as described

- Payment failure and retry handling, with clear messages



## SELLER WALLET

- Two balances: Pending (paid, not yet confirmed) and Available (withdrawable)

- Money moves to Available only after buyer confirmation or auto-release

- Withdraw to Opay or any Nigerian bank via the Paystack/Flutterwave Transfers API

- Account name must match the seller's verified ID name

- Minimum withdrawal ₦1,000. Daily limit for new sellers.

- First withdrawal held 24 to 48 hours for review

- OTP before every withdrawal. OTP + 24-hour cooling period before a new payout account can be used.

- Instant email/SMS alert on every withdrawal or payout-account change

- Full transaction history (sale, fee, withdrawal, refund)

- Admin can freeze a wallet

- Withdrawal fee rule configurable by admin (e.g. free above ₦5,000, paid by Shop It)



## DELIVERY

- Seller sets options per product: pickup, local delivery with fee, or buyer arranges rider

- Seller uploads a photo of the packed item before dispatch

- Delivery details handled inside the app only



## DELIVERY COST RULES

- Show the delivery cost on the product page, based on the buyer's selected area, before they add to cart. No surprise charges at payment.

- Checkout always shows the full breakdown: Item price + Shop It service fee + delivery fee = Total.

- Sellers can set a minimum order amount for delivery. Below it, the item is "Pickup only" or "Add more items to unlock delivery".

- Cart nudge: "Add ₦X more from this seller to make delivery worth it". Combine delivery into one fee per seller when a buyer orders several items from them.

- Pickup points (campus hub or popular area) as a cheaper alternative to door delivery.

- Warn the buyer if delivery plus fee is more than 50% of the item price, and suggest pickup or bundling.

- Prompt sellers to sell low-priced items in sets (e.g. bead sets) instead of single pieces.



## PRIVACY AND ANTI-BYPASS (important)

- Buyer identity is hidden from sellers. Seller sees only "Buyer #ID", item, quantity, delivery area and preferences (colour, size). No name, photo, phone, or exact address.

- Exact delivery address goes only to the courier/rider flow once assigned, never shown as plain text to the seller.

- Seller's exact location is hidden from buyers. Only shop name, campus/area and ratings show.

- Real identities visible only to admin for disputes, fraud checks and legal requests.



**Locked chat**

- Chat only inside the platform, attached to a product or order

- Main interaction is preset quick-reply buttons ("Is this available?", "Can you deliver to [area]?", "Ready to pay", "Item received") plus structured forms for custom orders

- A small filtered free-text box. Before sending, block and replace with "[blocked]":

  - Phone numbers, including spaced, dashed, mixed with letters/emojis, or spelled out ("zero eight zero")

  - Account numbers, emails, links, @handles

  - Words like WhatsApp, Telegram, IG, call me, DM, Opay, "send to"

- First attempt = warning. Repeated attempts = flag account, temporary chat lock, admin review.

- AI may suggest reply options to pick from, but must never generate free text sent between users.

- Banner: "Never pay or chat outside Shop It. You lose your protection."

- Block contact details in product titles, descriptions, bios and images (scan text, and run OCR on uploaded images where possible)

- Chat history is stored and available to admin for disputes



## SECURITY (high priority)

- HTTPS everywhere, HSTS, secure headers (CSP, X-Frame-Options, etc.)

- Passwords hashed with Argon2 or bcrypt. Password rules and breached-password check.

- Optional 2FA for buyers, mandatory 2FA for sellers and admins

- Email and phone verification at signup

- Protection against SQL injection, XSS, CSRF and IDOR. Parameterised queries, input validation, output encoding, and an ownership check on every request.

- Rate limiting and CAPTCHA on login, signup, OTP, chat and checkout. Lock account after repeated failed logins.

- Secure sessions: short-lived tokens, refresh tokens, logout on all devices, new-device login alerts

- Verify all Paystack/Flutterwave webhooks by signature. Never trust the frontend for payment status.

- Idempotency on payments and withdrawals to prevent double payouts

- Wallet ledger is append-only (double-entry). Never edit balances directly.

- Safe image uploads: restrict type/size, re-encode images, strip EXIF/GPS, store outside the web root, scan for malware

- Encrypt sensitive data (ID documents, bank details) at rest. Restrict admin access.

- Audit logs of every admin and money action

- Role-based access control, least privilege for admins

- Fraud detection: flag new accounts with large orders, many accounts from one device/IP, fast repeated withdrawals, mass refunds, fake review patterns, sellers who only get 5-star reviews from brand-new accounts

- Secrets in environment variables, never in code. Dependency vulnerability scanning.

- Daily encrypted backups with tested restores. Error monitoring and alerts.

- Comply with the Nigeria Data Protection Act (NDPA): privacy policy, consent, data deletion on request



## TRUST AND SAFETY

- Report button on every product, seller, review and chat

- Reviews only from verified completed purchases

- Dispute centre: buyer and seller submit evidence (photos, order history), admin decides, with clear timelines

- Admin moderation queue: approve sellers and listings, remove fakes, ban/flag repeat offenders, handle reports

- Prohibited items list (illegal, counterfeit, unsafe). Auto-flag keywords.

- New sellers' first listings are reviewed before going live

- "Buyer Protection" explainer page: what is covered and how to claim

- Scam awareness tips shown at signup, checkout and in chat

- Pages: Terms of Service, Privacy Policy, Refund and Dispute Policy, Prohibited Items, Seller Guide (photo, pricing and packaging tips), FAQ



## SUPPORT

- Help centre with FAQ and "Contact support" ticket form inside the app

- Support inbox for admins with ticket status (open, pending, resolved)

- Automatic emails/SMS/push for: order placed, packed, shipped, delivered, dispute updates, withdrawals, security alerts



## ADMIN PANEL

- Dashboard: sales, fees earned, escrow balance, pending payouts, disputes, flagged users

- Controls: fee settings, coupons, seller approval, wallet freeze, banning, categories, homepage sections (Seller of the Week, seasonal sections like Valentine, Christmas, Back to School), announcement banner, maintenance mode

- Reports exportable as CSV

- Soft delete (nothing permanently deleted without a record)



## EXTRAS

- Low-data mode, PWA (installable on phones), Pidgin + English language option

- Gift option with a message note

- SEO basics: clean URLs, product and shop page meta tags, sitemap, share previews

- Accessibility: readable font sizes, good contrast, big tap targets

- Skeleton loaders and friendly empty states and error messages



## TECH

Suggest and use a modern stack (e.g. Next.js or React + Node/Laravel + PostgreSQL), with a clear folder structure, environment configs, and basic automated tests for payments, wallet and permissions.



## PHASES

1. Auth, products, catalog, seller shops

2. Cart, checkout, Paystack/Flutterwave, escrow, orders, delivery rules

3. Wallet, withdrawals, OTP, security hardening

4. Locked chat, masking, moderation, disputes, support

5. Admin panel, notifications, analytics, SEO, polish



Start with phase 1. After each phase, list what was built and what is next. Write clean, commented code.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/d06b57b9-f449-4c5a-9d09-25673d09fb5b).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
