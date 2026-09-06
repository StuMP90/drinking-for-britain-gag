# Drinking for Britain (Gag Edition) — System Summary

This document provides a technical summary of the system developed in the current repository (`/var/www/smgithub/drinking-for-britain-gag`).

## 1. System Overview

**Drinking for Britain** is a turn-based pub and brewery management simulator. Players take on the role of hospitality entrepreneurs, managing pubs, breweries, staff, stock, and finances on a week-by-week basis. The game emphasizes the financial realities of the UK hospitality industry, specifically modeling various taxes and duties.

The application is built as a Single Page Application (SPA) using:
- **Backend**: Laravel 13 (PHP 8.3) with Eloquent ORM.
- **Frontend**: React 18, Inertia.js, Tailwind CSS, and Laravel Breeze components.
- **Database**: Relational database (SQLite/PostgreSQL/MySQL) storing structured operational data and serialized settings.

## 2. Core Features & Architecture

### 2.1 Authentication & Security
The authentication system is built on Laravel Breeze but heavily customized to support **True 2FA via WebAuthn Passkeys**. 
- Users authenticate with a username and password.
- Optionally, users can register passkeys (via `laravel/passkeys`) to enable hardware or biometric 2FA.
- An admin override exists to remove 2FA from a player's account if they lose their passkey.

### 2.2 Turn-Based Game Engine
The core of the game is driven by `GameController::store`. When a player submits a turn, the engine processes:
1. **Queued Actions**: Resolves `TurnAction` records such as brewing beer or transferring stock from breweries to pubs.
2. **Sales & Demand**: Calculates sales at each pub based on customer capacity, staffing levels (and staff satisfaction), pricing, and pub amenities (like Sports TV).
3. **Financials & Taxes**: Calculates revenue, COGS, and deducts running costs (rent, utilities, insurance, wages). It also calculates and accrues tax liabilities (VAT, Corporation Tax, PAYE/NI, Alcohol Duty) which are stored in the `Liability` model.

### 2.3 Operations & Asset Management
- **Pubs**: Managed via `PubController`. Pubs can be Leasehold or Freehold, and come in Community, Town, or City sizes. They require staff to operate and hold inventory (`Stock`).
- **Breweries**: Managed via `BreweryController`. Breweries convert raw `Ingredient` stock into finished `Stock` using predefined recipes (`MarketListing`). Players queue brews and queue transfers of finished stock to their pubs.
- **Staffing**: `StaffController` manages hiring, firing, and wage setting. Staff have a satisfaction metric that impacts their efficiency and pub sales.
- **Market**: `MarketController` handles wholesale purchasing of ingredients and products. Prices are dynamic and stored in `MarketListing`.

## 3. Codebase Structure

### 3.1 Models
- `User`: Player account, handles passkeys and balance.
- `Pub`, `Brewery`: Core operational assets.
- `Stock`, `Ingredient`: Inventory tracking (polymorphic relationships).
- `Staff`: Employees assigned to pubs or breweries.
- `Turn`, `TurnAction`: Game state progression and queued actions.
- `TaxPayment`, `Liability`: Financial tracking for taxes and duties.
- `MarketListing`: Available products, ingredients, and recipes.
- `Setting`: Global economic and game parameters.
- `BaseModel`: Base class ensuring consistent UK date formats.

### 3.2 Controllers
- `GameController`: Turn processing engine.
- `BreweryController`: Brewery management, inline queuing of brews (`queueBrew`) and stock transfers (`queueTransfer`).
- `PubController`: Pub management, upgrades, freehold purchasing, and retail pricing.
- `MarketController`: Wholesale purchasing.
- `Admin\PlayerController`: Admin player management (pause, reset, delete, remove 2FA).
- `Admin\SettingsController`: Global settings management.

### 3.3 Frontend (React / Inertia)
Located in `resources/js/Pages`:
- `Dashboard.tsx`: Financial summary and turn progression.
- `Brewery/Index.tsx`: Comprehensive UI for managing breweries, viewing ingredient/produced stock, and inline forms for queuing brews and transfers.
- `Pub/Index.tsx`: Managing pub operations, staff, and pricing.
- `Market/Index.tsx`: Purchasing interface.
- `Auth/TwoFactorChallenge.tsx`, `Profile/Partials/PasskeysManager.tsx`: Passkey/2FA management UI.
