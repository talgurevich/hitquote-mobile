# Known Issues - HitQuote Mobile

## 1. Product Catalog Not Syncing Between Web and Mobile

### Problem
Products uploaded via the web app don't appear in the mobile app for the same user.

### Root Cause
- **Web app** uses the new architecture: `business_id` from `businesses` table
- **Mobile app** uses legacy architecture: `user_id` from `users` table
- The `product` table has a `user_id` field that points to the legacy `users` table
- When web app creates products, it uses a different user_id than what mobile app expects

### Example
- User: tal.gurevich@gmail.com
- Mobile app looks for products with: `user_id = [legacy user ID from users table]`
- Web app creates products with: `user_id = [different ID]`

### Files Involved
- Mobile: `/Users/talgurevich/Documents/hitquote-mobile/App.js` (line 2007-2011)
- SQL diagnostic: `/Users/talgurevich/Documents/hitquote-mobile/sql/check_product_user_ids.sql`

### Solution Options

#### Option 1: Update Mobile App to Use Business Architecture (Recommended)
- Change mobile app to query products by `business_id` instead of legacy `user_id`
- Requires updating:
  - `loadProducts()` in CatalogScreen
  - `loadProducts()` in CreateQuoteScreen
  - Product creation/update functions
- Migration: Update existing products to use `business_id`

#### Option 2: Update Web App to Use Legacy User IDs
- Change web app to use the `users` table user_id
- Not recommended - keeps us tied to legacy architecture

#### Option 3: Add Migration to Sync Products
- Create a migration that:
  1. Adds `business_id` column to `product` table
  2. Populates it based on `user_id` → `business_members` mapping
  3. Updates both apps to use `business_id`

### Temporary Workaround
Users need to create products directly in the mobile app for now.

---

## 2. Duplicate User Records

### Problem
Multiple auth.users records exist for the same email when users are deleted and recreated.

### Impact
- Can cause quota issues
- Makes user lookups ambiguous
- Fixed by using `ORDER BY created_at DESC LIMIT 1` in queries

### Solution
Implement proper user deletion that cleans up all related records or use soft deletes.

---

## 3. Monthly Quote Counter in Profile Shows Zero

### Problem
The "הצעות מחיר החודש" (Monthly Quotes) counter in Settings > Profile tab shows 0 even when quotes exist.

### Root Cause
The `loadMonthlyQuoteCount()` function queries the `monthly_quote_counters` table using legacy user_id, which may not be compatible with the new business architecture.

### Location
- File: `/Users/talgurevich/Documents/hitquote-mobile/App.js`
- Function: `loadMonthlyQuoteCount()` (around line 1551)

### Solution
Update the function to use the same quota counting logic as the dashboard and `check_user_quota` RPC function - count directly from the `proposal` table by business_id for the current month.

---

## Next Steps
1. Finish mobile app core features
2. Fix monthly quote counter in profile (use check_user_quota RPC)
3. Migrate product system to use `business_id` (Option 1 above)
4. Update web app to match new architecture
5. Add integration tests to prevent architecture drift
