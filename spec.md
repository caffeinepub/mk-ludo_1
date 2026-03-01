# MK Ludo

## Current State
The app has four screens: Lobby, Wallet, Battle Room, and Admin Panel. Users register with a username only. The backend `User` and `UserProfile` types have `username`, `accountNumber`, `walletBalance`, and `registeredTimestamp`. The `register(username)` function stores the user without a mobile number. The `RegisterPage.tsx` form only collects username.

## Requested Changes (Diff)

### Add
- `mobileNumber` field (Text) to the `User` and `UserProfile` backend types
- `register(username, mobileNumber)` updated function signature to accept mobile number at registration time
- Mobile number input field in the `RegisterPage.tsx` form (Indian format, 10 digits, validation)
- `useSaveMobileNumber` mutation hook (optional future use)

### Modify
- `register` backend function to accept and store `mobileNumber`
- `saveCallerUserProfile` to include `mobileNumber`
- `UserProfile.fromUser` to include `mobileNumber`
- `RegisterPage.tsx` to add a mobile number input alongside username
- `useRegister` mutation in `useQueries.ts` to pass `(username, mobileNumber)` to `actor.register`

### Remove
- Nothing

## Implementation Plan
1. Update `main.mo`: add `mobileNumber: Text` to `User` and `UserProfile`, update `register`, `saveCallerUserProfile`, and `UserProfile.fromUser`
2. Regenerate backend bindings via `generate_motoko_code`
3. Update `RegisterPage.tsx` to show mobile number field with 10-digit Indian phone validation
4. Update `useRegister` mutation in `useQueries.ts` to accept `{ username, mobileNumber }` and call `actor.register(username, mobileNumber)`
5. Build and deploy
