# MK Ludo

## Current State
- Dark navy/gold themed Ludo battle site with 5 pages: Lobby, Wallet, Battle Room, Admin, Register
- Bottom navbar has 3 tabs: Lobby, Wallet, Admin
- Header shows logo + wallet balance + logout button
- Lobby shows hero banner image + stats strip + Open Battles list
- Wallet shows balance card + deposit/withdraw tabs + transaction history
- No Refer & Earn page, no Profile page, no Support page, no Side Drawer menu

## Requested Changes (Diff)

### Add
- **Side Drawer menu** (hamburger icon in header) with items: My Profile, Play, My Wallet, Refer and Earn, History, Support, All Policy
- **Refer & Earn page** (`/refer`): purple-to-blue gradient banner "Refer & Earn", referral code box with COPY button (dashed blue border), WhatsApp share button (green), "Your Performance" section with Referred Players + Referral Earning stat cards
- **Profile page** (`/profile`): colorful game-character banner with username, mobile number field, email placeholder, KYC status card (green "Verified" badge)
- **Support page** (`/support`): "Need Help? 24/7" purple banner with customer support image, Contact Us cards for WhatsApp and Email, Call Now card with phone number button
- **Bottom navbar** expanded to 5 tabs: Home, My Wallet, Refer (center highlighted pill), Support, Profile
- **Announcement banner** on Home: black bar showing WhatsApp support number
- **Home game cards**: 2-column grid with "Ludo Classic" card and "Support" card (black bg with game art), LIVE badges on each card
- **Header**: black background, hamburger menu (left), logo (center), wallet chip (₹balance) + bonus chip (gift icon) side by side (right)
- **Wallet page redesign**: "My Balance" title + "Total: ₹X.X" pill on top, then two cards — DEPOSIT CASH (green amount, green Add Cash button) and WINNING CASH (red/orange amount, blue Withdraw button) — matching 3Star layout exactly
- **Winning Cash** concept: track BattleWin transactions separately from deposit balance in the UI (display as separate section in wallet)

### Modify
- **Layout.tsx**: replace current header with black header matching 3Star style; expand bottom nav to 5 tabs (Home, Wallet, Refer, Support, Profile); add hamburger side drawer
- **LobbyPage.tsx**: remove hero image banner, add announcement text bar, add 2-column game card grid (Ludo Classic + Support cards with LIVE badge), keep Open Battles + Running Battles sections with exact 3Star card style (white/black cards, "Playing For | PlayerA & PlayerB" header, Entry Fee + Winning Prize layout)
- **WalletPage.tsx**: redesign to match 3Star My Balance layout with two separate balance cards

### Remove
- Current hero banner image section from LobbyPage
- Current single wallet balance card (replace with dual DEPOSIT CASH / WINNING CASH cards)
- Logout button from header (moved to side drawer)

## Implementation Plan
1. Add new routes for /refer, /profile, /support in App.tsx
2. Create ReferPage.tsx with referral code, WhatsApp share, performance stats
3. Create ProfilePage.tsx with banner, mobile/email fields, KYC status
4. Create SupportPage.tsx with help banner, WhatsApp/Email/Call cards
5. Update Layout.tsx: black header with hamburger + logo + dual balance chips, 5-tab bottom nav, side drawer
6. Update LobbyPage.tsx: announcement bar, 2-col game cards with LIVE badge, 3Star-style battle cards
7. Update WalletPage.tsx: My Balance header with total pill, DEPOSIT CASH card + WINNING CASH card, Add Cash / Withdraw buttons
8. Generate MK Ludo logo image for header if needed
