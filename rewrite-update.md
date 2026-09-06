# System Rewrite Update

This document highlights the major architectural, security, and operational changes between the original GitHub system and the newly developed rewrite (the current repository).

## 1. Authentication & Security

- **Original System (Legacy):** Standard Laravel Breeze implementation focusing on passwords. Manual password resets by email or admin intervention without granular 2FA controls.
- **New Rewrite (Modernized):** Implements **True 2FA via WebAuthn** using `laravel/passkeys`, supporting biometric and hardware security keys for maximum security. Granular admin controls added to `Admin\PlayerController` to specifically revoke 2FA passkeys if a user loses their device.

## 2. Stock Transfers

- **Original System (Legacy):** Handled by a dedicated, separate `StockTransferController` which routed physical inventory transfers between business units.
- **New Rewrite (Modernized):** Centralized directly into the `BreweryController` via a new `queueTransfer` method. This aligns transfers conceptually with the brewery that produces the stock, streamlining the backend architecture and reducing controller bloat.

## 3. Brewery UI

- **Original System (Legacy):** Standard CRUD table views that separated brewing logic from post-production logic.
- **New Rewrite (Modernized):** Completely overhauled unified React/Inertia interface (`Brewery/Index.tsx`). It now features inline forms for both queuing brews and queuing transfers, along with real-time tracking of "Produced Stock" and "Already Queued" pending actions.

## 4. Financial Tracking

- **Original System (Legacy):** Tax deductions and operational costs were often calculated and deducted directly from cash balances upon turn progression.
- **New Rewrite (Modernized):** Introduces a dedicated `Liability` model. Taxes and operational costs are accrued as liabilities during the turn, providing a more accurate accounting model of delayed cash outflows and deferred tax payments.
