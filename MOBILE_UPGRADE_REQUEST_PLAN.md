# Mobile App: Upgrade Request Implementation Plan

## Overview
Add upgrade request functionality to the mobile app Settings screen, matching the web app implementation.

---

## How It Works in Web App

### User Flow:
1. User views tier info in Settings page
2. Sees current tier (Free/Premium/Business) with quota usage
3. If on Free tier → shows two upgrade options:
   - **Premium**: 100 quotes/month (purple card)
   - **Business**: Unlimited quotes (green card)
4. User selects desired tier and clicks upgrade button
5. Request sent to admin with selected tier
6. Shows status:
   - **Pending**: "בקשתך לשדרוג ל-[Premium/Business] נבדקת על ידי האדמין"
   - **Approved**: "הבקשה אושרה! החבילה שלך שודרגה ל-[Premium/Business]"
   - **Rejected**: "הבקשה נדחתה" + admin notes (can request again)

### Technical Flow:
1. POST `/api/upgrade-request` with:
   ```json
   {
     "authUserId": "uuid",
     "email": "user@example.com",
     "displayName": "User Name",
     "requestedPlan": "premium"
   }
   ```
2. Backend:
   - Checks for existing pending request
   - Creates record in `upgrade_requests` table
   - Sends Slack notification to admin
   - Sends email notification to admin
3. Admin reviews in `/admin/upgrade-requests`
4. Admin approves → calls `/api/admin/update-tier`
5. User's `account_tiers` table updated automatically

---

## Mobile App Implementation Plan

### Phase 1: Backend Setup (Already Done ✅)
- ✅ `upgrade_requests` table exists
- ✅ API routes exist (`/api/upgrade-request` GET/POST)
- ✅ Admin panel exists (`/admin/upgrade-requests`)
- ✅ Tier update API exists (`/api/admin/update-tier`)

### Phase 2: Mobile UI Changes

#### 2.1 Update SettingsScreen (App.js)

**Add State Variables:**
```javascript
const [upgradeRequest, setUpgradeRequest] = useState(null);
const [requestingUpgrade, setRequestingUpgrade] = useState(false);
```

**Add Load Function:**
```javascript
const loadUpgradeRequestStatus = async () => {
  try {
    if (!session?.user?.id) return;

    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/upgrade-request?authUserId=${session.user.id}`,
      {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      setUpgradeRequest(data.request);
    }
  } catch (err) {
    console.error('Error loading upgrade request status:', err);
  }
};
```

**Add Request Handler:**
```javascript
const handleRequestUpgrade = async (tier) => {
  setRequestingUpgrade(true);

  try {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/upgrade-request`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          authUserId: session.user.id,
          email: session.user.email,
          displayName: session.user.user_metadata?.full_name || session.user.email,
          requestedPlan: tier, // 'premium' or 'business'
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to submit upgrade request');
    }

    const tierName = tier === 'premium' ? 'Premium' : 'Business';
    Alert.alert('הצלחה', `בקשת השדרוג ל-${tierName} נשלחה בהצלחה! נחזור אליך בהקדם.`);
    await loadUpgradeRequestStatus();
  } catch (err) {
    console.error('Error requesting upgrade:', err);
    Alert.alert('שגיאה', 'שגיאה בשליחת בקשת השדרוג: ' + err.message);
  } finally {
    setRequestingUpgrade(false);
  }
};
```

**Call Load Function in useEffect:**
```javascript
useEffect(() => {
  if (session?.user?.id) {
    loadBusinessUser();
    loadBusinessSettings();
    loadUserProfile();
    loadAccountTier();
    loadQuotaInfo();
    loadUpgradeRequestStatus(); // Add this
  }
}, [session]);
```

#### 2.2 Add UI Component in Settings Screen

**Important:** Full visual design with horizontal scrollable tier cards is documented in `/TIER_SELECTION_DESIGN.md`

**Pricing:**
- **Free**: ₪0/חודש (10 quotes)
- **Premium**: ₪99/חודש (100 quotes) - "מומלץ 🔥"
- **Business**: ₪299/חודש (unlimited) - "הכי משתלם 💎"

**Add Tier Selection Section (After Account Tier Section):**

See `/TIER_SELECTION_DESIGN.md` for complete implementation with:
- Horizontal scrollable tier cards
- Feature lists with checkmarks
- Color-coded design (Gray/Purple/Green)
- Badges and pricing display
- Responsive layout for all screen sizes

**Key Implementation Notes:**
```jsx
// Import at top of file
import { ScrollView } from 'react-native';

// Add state in SettingsScreen
const [upgradeRequest, setUpgradeRequest] = useState(null);
const [requestingUpgrade, setRequestingUpgrade] = useState(false);

// Add tier data structure
const tiers = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    priceLabel: '₪0 / חודש',
    quota: '10 הצעות מחיר',
    features: ['10 הצעות מחיר בחודש', 'יצוא PDF', 'ניהול לקוחות', 'קטלוג מוצרים'],
    color: '#6b7280',
    // ... see TIER_SELECTION_DESIGN.md for full config
  },
  // ... Premium and Business tiers
];

// Render horizontal scrollable cards
<ScrollView horizontal showsHorizontalScrollIndicator={false}>
  {tiers.map((tier) => (
    <TierCard
      key={tier.id}
      tier={tier}
      currentTier={accountTier?.tier}
      onSelect={() => handleRequestUpgrade(tier.id)}
    />
  ))}
</ScrollView>
```

Refer to `TIER_SELECTION_DESIGN.md` for complete component code and styles.

### Phase 3: Configuration

**Add Supabase Function URL to Environment:**

The mobile app needs to call the web app's API routes. There are two options:

**Option A: Use Supabase Edge Functions (Recommended)**
- Deploy the API route logic as a Supabase Edge Function
- Call it directly from mobile: `https://[project].supabase.co/functions/v1/upgrade-request`

**Option B: Call Web App API Directly**
- Add web app URL to mobile app config
- Call `https://[your-web-app]/api/upgrade-request`
- Requires CORS configuration on web app

**Recommended: Option A**

Create Supabase Edge Function:
```bash
supabase functions new upgrade-request
```

Deploy the same logic from `/api/upgrade-request/route.js` as an edge function.

---

## Testing Checklist

### Mobile App Testing:
- [ ] Free tier user sees "Request Upgrade" button
- [ ] Premium/Business tier users don't see upgrade section
- [ ] Clicking button shows loading state
- [ ] Success alert appears after submission
- [ ] Pending status shows correctly
- [ ] Duplicate request prevented (shows error)
- [ ] Approved status shows after admin approval
- [ ] Rejected status shows with admin notes

### Integration Testing:
- [ ] Request appears in web admin panel
- [ ] Admin can approve request
- [ ] Tier updates in `account_tiers` table
- [ ] Mobile app shows updated tier on reload
- [ ] Quota limits reflect new tier
- [ ] Slack notification sent on request
- [ ] Email notification sent to admin

---

## Implementation Steps

### Step 1: Create Supabase Edge Function
1. Create function: `supabase functions new upgrade-request`
2. Copy logic from web app API route
3. Deploy: `supabase functions deploy upgrade-request`
4. Test with curl

### Step 2: Add Mobile UI Code
1. Add state variables to SettingsScreen
2. Add `loadUpgradeRequestStatus()` function
3. Add `handleRequestUpgrade()` function
4. Add UI component after Account Tier section
5. Call load function in useEffect

### Step 3: Style & Polish
1. Match web app design language
2. Add proper RTL support
3. Add loading indicators
4. Add error handling
5. Test on iOS and Android

### Step 4: Test End-to-End
1. Submit request from mobile
2. Verify in admin panel
3. Approve request
4. Verify tier update on mobile
5. Test quota enforcement

---

## Future Enhancements

### Phase 4 (Optional):
- [x] Allow requesting specific tier (premium/business) - **IMPLEMENTED**
- [ ] Add in-app notification when request approved
- [ ] Show pricing for each tier (₪99/₪299)
- [ ] Add "Contact Admin" button for questions
- [ ] Add tier comparison modal with feature list

---

## Dependencies

- ✅ Database: `upgrade_requests` table exists
- ✅ Web API: `/api/upgrade-request` route exists
- ✅ Admin Panel: `/admin/upgrade-requests` exists
- ⚠️ Mobile: Need to add Supabase Edge Function OR configure CORS

---

## Estimated Time

- **Supabase Edge Function**: 1-2 hours
- **Mobile UI Implementation**: 2-3 hours
- **Testing & Polish**: 1-2 hours
- **Total**: 4-7 hours

---

## Notes

- The mobile app currently uses the same `account_tiers` table as web
- Quota checking RPC already works across both platforms
- Upgrade requests are admin-reviewed, no automatic payment yet
- Slack notifications already configured in web app
- The tier system is fully operational, just needs mobile UI
