# Database Migrations

## Monthly Quote Counters

### Purpose
The `monthly_quote_counters` table provides a persistent, increment-only counter for tracking quotes created per month. Unlike counting from the `proposal` table, this counter:

- **Never decreases** when quotes are deleted
- **Persists** across deletions and modifications
- **Works for both** mobile and web apps
- **Prevents** counting discrepancies between platforms

### How to Apply

#### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `create_monthly_quote_counters.sql`
4. Paste into the SQL editor
5. Click **Run**

#### Option 2: Supabase CLI
```bash
supabase db push create_monthly_quote_counters.sql
```

### Schema Details

**Table: `monthly_quote_counters`**
- `id` - UUID primary key
- `user_id` - UUID reference to user (from `users` table)
- `year` - Integer (e.g., 2025)
- `month` - Integer (1-12)
- `quote_count` - Integer, defaults to 0
- `created_at` - Timestamp
- `updated_at` - Timestamp (auto-updated)

**Constraints:**
- Unique constraint on (user_id, year, month) ensures one counter per user per month
- Month must be between 1 and 12

**Security:**
- Row Level Security (RLS) enabled
- Users can only read/write their own counters

### Usage

The mobile app automatically:
1. **Increments** the counter when a quote is created
2. **Creates** a new counter if it's the first quote of the month
3. **Displays** the count in Settings > Profile tab

The counter will show "Quotes this month: X" and will accurately reflect all quotes created in the current month, regardless of deletions.

### Migration for Web App

After applying this migration, you should update the web app to use the same counter system for consistency between platforms.
