# Tier Management System - Quick Reference

## User Signup Flow

### New Users
1. **Sign up** with Apple / Google / Email+Password
2. **Auto-assigned** Free tier (10 quotes/month)
3. Database trigger creates `account_tiers` row automatically
4. No exceptions - all new users start as Free

### Existing Users (Tal & Moran)
- Manually assigned **Premium tier** (100 quotes/month) during migration
- SQL script runs during Phase 1 implementation

---

## Tier Limits

| Tier | Monthly Quotes | Who Gets It |
|------|----------------|-------------|
| **Free** | 10 | All new users (automatic) |
| **Premium** | 100 | Admin upgrade only |
| **Business** | Unlimited | Admin upgrade only |

---

## How Users Can Upgrade

### ❌ **NOT ALLOWED**:
- Self-service upgrade buttons
- Payment integration (deferred to future)
- Mobile app tier changes
- "Upgrade Now" CTAs

### ✅ **ONLY ALLOWED**:
- **Admin panel on web app** (`/admin/tiers`)
- Admin (tal.gurevich@gmail.com) manually changes tiers
- Users contact admin to request upgrade

---

## User Experience

### Mobile App
**When quota exceeded:**
```
❌ מכסת ההצעות התמלאה

השתמשת ב-10 מתוך 10 הצעות החודש.

כדי להגדיל את המכסה, אנא פנה לאתר הרשת שלנו.

[אישור]
```

**In Settings:**
```
📊 שימוש בהצעות חודש זה
7 / 10 הצעות

[Progress bar showing 70%]

⚠️ נותרו לך 3 הצעות בלבד החודש
```

**NO upgrade buttons, NO payment options**

### Web App

**For Regular Users:**
- Dashboard widget shows: "Quotes this month: 7/10"
- No upgrade CTA
- Simple error when quota exceeded

**For Admin Only (tal.gurevich@gmail.com):**
- "Admin" link appears in navigation
- Access to `/admin/tiers` page
- Can view all users and change their tiers

---

## Admin Panel Features

### Location
`https://hitquote.app/admin/tiers` (web only)

### Access
- Only `tal.gurevich@gmail.com` can access
- Other users redirected to dashboard

### Features
1. **User List Table**:
   - Email
   - Name
   - Current Tier (badge: Free/Premium/Business)
   - Quota Usage (e.g., "7/10")
   - Signup Date
   - Action dropdown

2. **Filters**:
   - Search by email
   - Filter by tier (All/Free/Premium/Business)

3. **Tier Changes**:
   - Dropdown: Free (10) / Premium (100) / Business (∞)
   - Confirmation dialog before changing
   - Success message after change
   - User can create more quotes immediately

4. **Audit Log** (future enhancement):
   - Date, Admin, User Email, Old → New Tier

---

## Database Implementation

### Trigger: Auto-assign Free Tier
```sql
CREATE TRIGGER create_tier_on_user_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_tier_for_new_user();
```

**Result**: Every new signup automatically gets free tier

### Function: Check Quota
```sql
SELECT * FROM check_user_quota(auth_user_id);
```

**Returns**:
- `can_create_quote` (true/false)
- `current_count` (e.g., 7)
- `monthly_limit` (e.g., 10)
- `tier_name` (e.g., 'free')
- `remaining_quotes` (e.g., 3)

### Trigger: Enforce Quota
```sql
CREATE TRIGGER check_quota_before_proposal_insert
  BEFORE INSERT ON proposal
  FOR EACH ROW
  EXECUTE FUNCTION enforce_quote_quota();
```

**Result**: Quote creation blocked at database level when limit exceeded

---

## Code Integration

### Mobile App
```javascript
// lib/accountTierUtils.js
export async function checkQuotaBeforeCreate(userId) {
  const { data } = await supabase.rpc('check_user_quota', { p_user_id: userId });
  return {
    canCreate: data[0].can_create_quote,
    current: data[0].current_count,
    limit: data[0].monthly_limit,
    tier: data[0].tier_name,
    remaining: data[0].remaining_quotes
  };
}
```

```javascript
// App.js - Before creating quote
const quotaStatus = await checkQuotaBeforeCreate(userId);

if (!quotaStatus.canCreate) {
  Alert.alert(
    'מכסת ההצעות התמלאה',
    `השתמשת ב-${quotaStatus.current} מתוך ${quotaStatus.limit} הצעות החודש.\n\nכדי להגדיל את המכסה, אנא פנה לאתר הרשת שלנו.`,
    [{ text: 'אישור', style: 'default' }]
  );
  return; // Block quote creation
}
```

### Web App - Admin Panel
```javascript
// app/admin/tiers/page.js
const handleTierChange = async (userId, email, oldTier, newTier) => {
  const confirmed = confirm(`שנה את ${email} מ-${oldTier} ל-${newTier}?`);
  if (!confirmed) return;

  await supabase
    .from('account_tiers')
    .update({
      tier: newTier,
      monthly_quote_limit: newTier === 'free' ? 10 : newTier === 'premium' ? 100 : -1
    })
    .eq('auth_user_id', userId);

  alert('רמת החשבון עודכנה בהצלחה!');
};
```

---

## Testing Checklist

### New User Signup
- [ ] Sign up with email/password → Auto-assigned Free tier
- [ ] Sign up with Apple → Auto-assigned Free tier
- [ ] Sign up with Google → Auto-assigned Free tier
- [ ] Check `account_tiers` table has new row with tier='free', limit=10

### Quota Enforcement
- [ ] Free user creates 10 quotes → Success
- [ ] Free user tries 11th quote → Blocked with error message
- [ ] Admin upgrades user to Premium via admin panel
- [ ] User immediately can create 11th quote (no app restart needed)

### Admin Panel
- [ ] Only tal.gurevich@gmail.com can access `/admin/tiers`
- [ ] Other users redirected to dashboard
- [ ] Admin can see all users in table
- [ ] Admin can filter by tier
- [ ] Admin can search by email
- [ ] Admin can change tier via dropdown
- [ ] Confirmation dialog appears before change
- [ ] Success message after tier change
- [ ] User's quota updates immediately

### Mobile App
- [ ] Quota widget shows correct usage (e.g., "7/10")
- [ ] Warning appears when < 3 quotes remaining
- [ ] Quota exceeded error shows correct message
- [ ] NO "Upgrade Now" buttons anywhere
- [ ] NO payment options

### Web App
- [ ] Dashboard widget shows quota usage
- [ ] NO upgrade CTAs for regular users
- [ ] Admin link only visible to tal.gurevich@gmail.com

---

## Migration Notes

### Existing Users (Tal & Moran)
```sql
-- Run during Phase 1 migration
INSERT INTO account_tiers (auth_user_id, tier, monthly_quote_limit, is_active, payment_provider)
SELECT auth_user_id, 'premium', 100, true, 'manual'
FROM user_profiles
WHERE email IN ('tal.gurevich@gmail.com', 'moran.marmus@gmail.com');
```

### New Users (Automatic)
- Database trigger handles this
- No manual intervention needed

---

## Future Enhancements (Deferred)

### Phase 4: PayPlus Payment Integration
- Self-service upgrade flow
- Automated billing
- Subscription management
- Invoice generation

### Phase 5: Advanced Features
- Trial periods
- Promotional codes
- Annual billing discounts
- Team/multi-user plans

**For now**: Admin panel only, no payments.

---

**Document Version**: 1.0
**Last Updated**: 2025-10-02
**Status**: Implementation Ready
