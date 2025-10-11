# Tier Selection UI Design - Mobile App

## Visual Design

### Layout: Scrollable Tier Cards

```
┌─────────────────────────────────────┐
│  🚀 שדרוג חשבון                     │
│  בחר את החבילה המתאימה לעסק שלך      │
│                                     │
│  ┌───────────────────────────────┐  │
│  │  Free                         │  │
│  │  החבילה הנוכחית שלך ✓         │  │
│  │                               │  │
│  │  ₪0 / חודש                    │  │
│  │  ───────────────────          │  │
│  │  ✓ 10 הצעות מחיר בחודש        │  │
│  │  ✓ יצוא PDF                   │  │
│  │  ✓ ניהול לקוחות              │  │
│  │  ✓ קטלוג מוצרים               │  │
│  │                               │  │
│  │  מתאים למתחילים וטסטים        │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │  Premium                      │  │
│  │  מומלץ 🔥                      │  │
│  │                               │  │
│  │  ₪99 / חודש                   │  │
│  │  ───────────────────          │  │
│  │  ✓ 100 הצעות מחיר בחודש       │  │
│  │  ✓ כל תכונות Free             │  │
│  │  ✓ לוגו מותאם אישית           │  │
│  │  ✓ תבניות PDF מתקדמות         │  │
│  │  ✓ תמיכה מועדפת              │  │
│  │                               │  │
│  │  מתאים לעסקים קטנים-בינוניים  │  │
│  │                               │  │
│  │  [בקש שדרוג ל-Premium]        │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │  Business                     │  │
│  │  הכי משתלם 💎                  │  │
│  │                               │  │
│  │  ₪299 / חודש                  │  │
│  │  ───────────────────          │  │
│  │  ✓ הצעות ללא הגבלה ∞          │  │
│  │  ✓ כל תכונות Premium          │  │
│  │  ✓ ניהול צוות (בקרוב)         │  │
│  │  ✓ API גישה (בקרוב)           │  │
│  │  ✓ תמיכה VIP                 │  │
│  │                               │  │
│  │  מתאים לעסקים גדולים          │  │
│  │                               │  │
│  │  [בקש שדרוג ל-Business]       │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

---

## React Native Component Code

```jsx
// Tier cards with pricing and features
const TierSelectionSection = ({
  currentTier,
  upgradeRequest,
  requestingUpgrade,
  onRequestUpgrade
}) => {
  const tiers = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      priceLabel: '₪0 / חודש',
      quota: '10 הצעות מחיר',
      badge: currentTier === 'free' ? 'החבילה הנוכחית שלך ✓' : null,
      color: '#6b7280',
      bgColor: '#f9fafb',
      borderColor: '#e5e7eb',
      features: [
        '10 הצעות מחיר בחודש',
        'יצוא PDF',
        'ניהול לקוחות',
        'קטלוג מוצרים',
      ],
      description: 'מתאים למתחילים וטסטים',
      showButton: false,
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 99,
      priceLabel: '₪99 / חודש',
      quota: '100 הצעות מחיר',
      badge: currentTier === 'premium' ? 'החבילה הנוכחית שלך ✓' : 'מומלץ 🔥',
      color: '#667eea',
      bgColor: '#f8f9ff',
      borderColor: '#667eea',
      features: [
        '100 הצעות מחיר בחודש',
        'כל תכונות Free',
        'לוגו מותאם אישית',
        'תבניות PDF מתקדמות',
        'תמיכה מועדפת',
      ],
      description: 'מתאים לעסקים קטנים-בינוניים',
      showButton: currentTier !== 'premium',
    },
    {
      id: 'business',
      name: 'Business',
      price: 299,
      priceLabel: '₪299 / חודש',
      quota: 'הצעות ללא הגבלה ∞',
      badge: currentTier === 'business' ? 'החבילה הנוכחית שלך ✓' : 'הכי משתלם 💎',
      color: '#22c55e',
      bgColor: '#f0fdf4',
      borderColor: '#22c55e',
      features: [
        'הצעות ללא הגבלה ∞',
        'כל תכונות Premium',
        'ניהול צוות (בקרוב)',
        'API גישה (בקרוב)',
        'תמיכה VIP',
      ],
      description: 'מתאים לעסקים גדולים',
      showButton: currentTier !== 'business',
    },
  ];

  const isPending = upgradeRequest?.status === 'pending';
  const isRejected = upgradeRequest?.status === 'rejected';

  return (
    <View style={styles.tierSection}>
      <Text style={styles.tierSectionTitle}>🚀 שדרוג חשבון</Text>
      <Text style={styles.tierSectionSubtitle}>
        בחר את החבילה המתאימה לעסק שלך
      </Text>

      {/* Rejected Request Alert */}
      {isRejected && upgradeRequest.admin_notes && (
        <View style={styles.rejectedAlert}>
          <Text style={styles.rejectedAlertTitle}>הבקשה הקודמת נדחתה</Text>
          <Text style={styles.rejectedAlertText}>{upgradeRequest.admin_notes}</Text>
        </View>
      )}

      {/* Pending Request Alert */}
      {isPending && (
        <View style={styles.pendingAlert}>
          <Text style={styles.pendingAlertTitle}>
            ⏳ בקשתך לשדרוג ל-{upgradeRequest.requested_plan === 'premium' ? 'Premium' : 'Business'} נבדקת על ידי האדמין
          </Text>
          <Text style={styles.pendingAlertText}>
            תאריך שליחה: {new Date(upgradeRequest.created_at).toLocaleDateString('he-IL')}
          </Text>
          <Text style={styles.pendingAlertSubtext}>נחזור אליך בהקדם</Text>
        </View>
      )}

      {/* Tier Cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tierCardsContainer}
        style={styles.tierCardsScroll}
      >
        {tiers.map((tier) => (
          <View
            key={tier.id}
            style={[
              styles.tierCard,
              {
                backgroundColor: tier.bgColor,
                borderColor: tier.borderColor,
                borderWidth: currentTier === tier.id ? 3 : 2,
              }
            ]}
          >
            {/* Header */}
            <View style={styles.tierCardHeader}>
              <Text style={[styles.tierName, { color: tier.color }]}>
                {tier.name}
              </Text>
              {tier.badge && (
                <View style={[styles.tierBadge, { backgroundColor: tier.color + '20' }]}>
                  <Text style={[styles.tierBadgeText, { color: tier.color }]}>
                    {tier.badge}
                  </Text>
                </View>
              )}
            </View>

            {/* Price */}
            <View style={styles.tierPrice}>
              <Text style={[styles.tierPriceAmount, { color: tier.color }]}>
                {tier.priceLabel}
              </Text>
              <View style={styles.tierDivider} />
            </View>

            {/* Quota */}
            <Text style={styles.tierQuota}>{tier.quota}</Text>

            {/* Features */}
            <View style={styles.tierFeatures}>
              {tier.features.map((feature, index) => (
                <View key={index} style={styles.tierFeatureRow}>
                  <Text style={styles.tierFeatureCheck}>✓</Text>
                  <Text style={styles.tierFeatureText}>{feature}</Text>
                </View>
              ))}
            </View>

            {/* Description */}
            <Text style={styles.tierDescription}>{tier.description}</Text>

            {/* Action Button */}
            {tier.showButton && !isPending && (
              <TouchableOpacity
                onPress={() => onRequestUpgrade(tier.id)}
                disabled={requestingUpgrade}
                style={[
                  styles.tierButton,
                  {
                    backgroundColor: requestingUpgrade ? '#ccc' : tier.color
                  }
                ]}
              >
                <Text style={styles.tierButtonText}>
                  {requestingUpgrade ? 'שולח...' : `בקש שדרוג ל-${tier.name}`}
                </Text>
              </TouchableOpacity>
            )}

            {/* Current Tier Badge */}
            {currentTier === tier.id && (
              <View style={styles.currentTierBadge}>
                <Text style={styles.currentTierText}>✓ בשימוש כעת</Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Value Proposition */}
      <View style={styles.valueProposition}>
        <Text style={styles.valueText}>
          💡 כל התשלומים מאובטחים | ביטול בכל עת | אין התחייבות
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  tierSection: {
    marginBottom: 24,
  },
  tierSectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 6,
    textAlign: 'center',
  },
  tierSectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  rejectedAlert: {
    backgroundColor: '#fee',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fcc',
  },
  rejectedAlertTitle: {
    fontSize: 14,
    color: '#c33',
    fontWeight: '600',
    marginBottom: 4,
  },
  rejectedAlertText: {
    fontSize: 12,
    color: '#666',
  },
  pendingAlert: {
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ffd966',
  },
  pendingAlertTitle: {
    fontSize: 14,
    color: '#856404',
    fontWeight: '600',
    marginBottom: 4,
  },
  pendingAlertText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  pendingAlertSubtext: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  tierCardsContainer: {
    paddingHorizontal: 4,
  },
  tierCardsScroll: {
    marginBottom: 16,
  },
  tierCard: {
    width: 280,
    marginRight: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  tierCardHeader: {
    marginBottom: 16,
  },
  tierName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  tierBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tierBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tierPrice: {
    marginBottom: 12,
  },
  tierPriceAmount: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
  },
  tierDivider: {
    height: 2,
    backgroundColor: '#e5e7eb',
    marginVertical: 8,
  },
  tierQuota: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  tierFeatures: {
    marginBottom: 16,
  },
  tierFeatureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  tierFeatureCheck: {
    fontSize: 14,
    color: '#22c55e',
    marginRight: 8,
    marginTop: 2,
  },
  tierFeatureText: {
    flex: 1,
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  tierDescription: {
    fontSize: 13,
    color: '#888',
    fontStyle: 'italic',
    marginBottom: 16,
    textAlign: 'center',
  },
  tierButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
  },
  tierButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
  currentTierBadge: {
    marginTop: 12,
    paddingVertical: 8,
    backgroundColor: '#22c55e20',
    borderRadius: 8,
    alignItems: 'center',
  },
  currentTierText: {
    color: '#22c55e',
    fontSize: 14,
    fontWeight: '600',
  },
  valueProposition: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  valueText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
});
```

---

## Key Features:

1. **Horizontal Scrollable Cards**: Swipe through tiers
2. **Visual Hierarchy**: Current tier highlighted with thick border
3. **Color-coded**: Free (gray), Premium (purple), Business (green)
4. **Clear Pricing**: Large, bold prices with ₪ symbol
5. **Feature Lists**: Checkmarks for each feature
6. **Badges**: "מומלץ 🔥", "הכי משתלם 💎", "החבילה הנוכחית ✓"
7. **Call-to-Action**: Clear upgrade buttons
8. **Status Alerts**: Show pending/rejected requests above cards
9. **Value Proposition**: "ביטול בכל עת" messaging

---

## Pricing Rationale:

### ₪99/month for Premium
- **Competitive**: Similar to Israeli SaaS tools (Green Invoice, Zoho Books)
- **Value**: ~₪1 per quote (100 quotes)
- **Psychological**: Under ₪100 threshold
- **Target**: Small businesses doing 20-100 quotes/month

### ₪299/month for Business
- **3x Premium price** but **10x+ the value** (unlimited vs 100)
- **Professional**: Signals serious business tool
- **High-volume**: Businesses doing 300+ quotes/month save money
- **Upsell**: Natural upgrade path from Premium

---

## Notes:
- Prices shown but payment NOT implemented yet
- Admin manually approves upgrades
- Future: Add Stripe/PayPlus integration
- Can A/B test pricing later
