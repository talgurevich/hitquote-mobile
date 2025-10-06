# Slack Notifications Setup Guide for HitQuote
## Web App & Mobile App

This guide explains how to set up and configure Slack notifications for both the HitQuote web app and mobile app.

---

## Table of Contents

1. [Overview](#overview)
2. [Slack App Setup](#slack-app-setup)
3. [Web App Configuration](#web-app-configuration)
4. [Mobile App Configuration](#mobile-app-configuration)
5. [Notification Types](#notification-types)
6. [Integration Points](#integration-points)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

---

## Overview

HitQuote uses Slack Incoming Webhooks to send real-time notifications for:

- **User Activity**: New registrations, profile completions, tier upgrades
- **Quote Activity**: Quote created, signed, duplicated
- **Admin Alerts**: Upgrade requests, approvals, quota limits
- **Errors**: Authentication failures, API errors, critical issues

### Architecture

Both apps use the same Slack webhooks and share the same notification channels for unified monitoring.

```
┌─────────────┐
│  Web App    │────┐
└─────────────┘    │
                   ├──→ Slack Webhooks ──→ Slack Channels
┌─────────────┐    │
│ Mobile App  │────┘
└─────────────┘
```

---

## Slack App Setup

### Step 1: Create Slack Workspace Channels

Create these 4 channels in your Slack workspace:

1. `#user-activity` - User registrations, profile updates, tier changes
2. `#quote-activity` - Quote created, signed, duplicated
3. `#admin-alerts` - Upgrade requests, quota limits, admin actions
4. `#errors` - Authentication errors, API errors, critical bugs

### Step 2: Create Slack App

1. Go to [Slack API Dashboard](https://api.slack.com/apps)
2. Click **"Create New App"** → **"From scratch"**
3. Enter:
   - **App Name**: `HitQuote Notifications`
   - **Workspace**: Your Slack workspace
4. Click **"Create App"**

### Step 3: Enable Incoming Webhooks

1. In your app settings, go to **"Incoming Webhooks"**
2. Toggle **"Activate Incoming Webhooks"** to **ON**
3. Click **"Add New Webhook to Workspace"**
4. Select `#user-activity` channel → Click **"Allow"**
5. **Copy the webhook URL** (looks like `https://hooks.slack.com/services/T.../B.../XXX`)
6. Repeat for all 4 channels:
   - `#user-activity`
   - `#quote-activity`
   - `#admin-alerts`
   - `#errors`

### Step 4: Save Webhook URLs

You should now have 4 webhook URLs. Save them securely - you'll need them for configuration.

---

## Web App Configuration

### Environment Variables

Add these to your `.env.local` file (or Heroku Config Vars for production):

```bash
# Slack Webhook URLs
SLACK_USER_ACTIVITY_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/USER/WEBHOOK
SLACK_QUOTE_ACTIVITY_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/QUOTE/WEBHOOK
SLACK_ADMIN_ALERTS_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/ADMIN/WEBHOOK
SLACK_ERRORS_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/ERRORS/WEBHOOK
```

### Heroku Deployment

Set environment variables in Heroku:

```bash
heroku config:set SLACK_USER_ACTIVITY_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/USER/WEBHOOK" -a your-app-name
heroku config:set SLACK_QUOTE_ACTIVITY_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/QUOTE/WEBHOOK" -a your-app-name
heroku config:set SLACK_ADMIN_ALERTS_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/ADMIN/WEBHOOK" -a your-app-name
heroku config:set SLACK_ERRORS_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/ERRORS/WEBHOOK" -a your-app-name
```

### Verify Installation

The web app has Slack notifications already integrated at these points:

✅ **User Registration** - `app/api/init-business/route.js:145`
✅ **Profile Completion** - `app/settings/page.js:382-386`
✅ **Tier Upgrade** - `app/api/admin/update-tier/route.js:66`
✅ **Upgrade Request** - `app/api/upgrade-request/route.js:144`

---

## Mobile App Configuration

### Expo Configuration

For mobile app, add to `app.json`:

```json
{
  "expo": {
    "extra": {
      "slackUserActivityWebhookUrl": "https://hooks.slack.com/services/YOUR/USER/WEBHOOK",
      "slackQuoteActivityWebhookUrl": "https://hooks.slack.com/services/YOUR/QUOTE/WEBHOOK",
      "slackAdminAlertsWebhookUrl": "https://hooks.slack.com/services/YOUR/ADMIN/WEBHOOK",
      "slackErrorsWebhookUrl": "https://hooks.slack.com/services/YOUR/ERRORS/WEBHOOK"
    }
  }
}
```

### Access in Code

Update `/lib/slackService.js` to use Expo Constants:

```javascript
import Constants from 'expo-constants';

const SLACK_WEBHOOKS = {
  user_activity: Constants.expoConfig?.extra?.slackUserActivityWebhookUrl,
  quote_activity: Constants.expoConfig?.extra?.slackQuoteActivityWebhookUrl,
  admin_alerts: Constants.expoConfig?.extra?.slackAdminAlertsWebhookUrl,
  errors: Constants.expoConfig?.extra?.slackErrorsWebhookUrl,
};
```

### EAS Build Secrets (Recommended for Production)

For production builds, use EAS Secrets:

```bash
eas secret:create --scope project --name SLACK_USER_ACTIVITY_WEBHOOK_URL --value "https://hooks.slack.com/services/YOUR/USER/WEBHOOK"
eas secret:create --scope project --name SLACK_QUOTE_ACTIVITY_WEBHOOK_URL --value "https://hooks.slack.com/services/YOUR/QUOTE/WEBHOOK"
eas secret:create --scope project --name SLACK_ADMIN_ALERTS_WEBHOOK_URL --value "https://hooks.slack.com/services/YOUR/ADMIN/WEBHOOK"
eas secret:create --scope project --name SLACK_ERRORS_WEBHOOK_URL --value "https://hooks.slack.com/services/YOUR/ERRORS/WEBHOOK"
```

### Mobile Integration Points

The mobile app has the Slack service created at `/lib/slackService.js`. You need to add calls at these key points in `App.js`:

#### 1. New User Registration
After successful sign-in with Google/Apple:
```javascript
import { SlackUserActivity } from './lib/slackService';

// After user signs in
SlackUserActivity.newUserRegistration(user.email, user.displayName, user.id);
```

#### 2. Quote Created
After saving a new quote:
```javascript
import { SlackQuoteActivity } from './lib/slackService';

// After proposal is saved
SlackQuoteActivity.quoteCreated(
  userEmail,
  proposalNumber,
  customerName,
  totalWithVat
);
```

#### 3. Authentication Errors
In catch blocks for auth failures:
```javascript
import { SlackErrors } from './lib/slackService';

try {
  // auth code
} catch (error) {
  SlackErrors.authError(email, error.message, 'Google Sign-In');
}
```

---

## Notification Types

### User Activity Notifications

#### `SlackUserActivity.newUserRegistration(email, displayName, authUserId)`
Sent when a new user registers/signs up.

**Example:**
```
:bust_in_silhouette: New User Registration :tada:
Email: user@example.com
Name: John Doe
Auth ID: abc123...
Platform: Web App / Mobile App
Time: 2025-10-06T10:30:00Z
```

#### `SlackUserActivity.profileCompleted(email, businessName, hasLogo)`
Sent when user completes business profile setup.

**Example:**
```
:white_check_mark: Profile Completed :sparkles:
User: user@example.com
Business Name: Acme Corp
Logo Uploaded: Yes ✓
Platform: Web App
Time: 2025-10-06T10:35:00Z
```

#### `SlackUserActivity.tierUpgraded(email, oldTier, newTier, adminEmail)`
Sent when admin upgrades user tier.

**Example:**
```
:arrow_up: Tier Upgraded :rocket:
User: user@example.com
Old Tier: free
New Tier: premium
Upgraded By: admin@hitquote.com
Platform: Web App
Time: 2025-10-06T11:00:00Z
```

### Quote Activity Notifications

#### `SlackQuoteActivity.quoteCreated(email, proposalNumber, customerName, total)`
Sent when a quote is created.

**Example:**
```
:page_facing_up: New Quote Created
Created By: user@example.com
Quote #: 20251001234
Customer: ABC Ltd
Total: ₪5,000
Platform: Mobile App (iOS/Android)
Time: 2025-10-06T14:20:00Z
```

#### `SlackQuoteActivity.quoteSigned(email, proposalNumber, customerName, total, signatureMethod)`
Sent when a quote is digitally signed.

**Example:**
```
:white_check_mark: Quote Signed :tada:
Business: user@example.com
Quote #: 20251001234
Customer: ABC Ltd
Total: ₪5,000
Signature: Digital
Platform: Mobile App
Time: 2025-10-06T15:45:00Z
```

### Admin Alert Notifications

#### `SlackAdminAlerts.upgradeRequested(email, displayName, requestedPlan)`
Sent when user requests tier upgrade.

**Example:**
```
:raised_hand: Upgrade Request Submitted
User: user@example.com
Name: John Doe
Requested Plan: premium
Status: Pending Review
Platform: Web App
Time: 2025-10-06T12:00:00Z

Action Required: Review at /admin/upgrade-requests
```

#### `SlackAdminAlerts.upgradeApproved(email, approvedTier, adminEmail)`
Sent when admin approves upgrade.

#### `SlackAdminAlerts.quotaLimitReached(email, tier, limit)`
Sent when user hits monthly quote limit.

### Error Notifications

#### `SlackErrors.authError(email, errorMessage, errorType)`
Authentication failures.

#### `SlackErrors.apiError(endpoint, method, statusCode, errorMessage, userId)`
API errors.

#### `SlackErrors.databaseError(operation, table, errorMessage, userId)`
Database operation failures.

#### `SlackErrors.criticalError(errorMessage, stackTrace, context)`
Critical application errors with full stack traces.

---

## Integration Points

### Web App (Already Integrated ✅)

| Event | File | Line | Function |
|-------|------|------|----------|
| New User Registration | `app/api/init-business/route.js` | 145 | `SlackUserActivity.newUserRegistration()` |
| Profile Completed | `app/settings/page.js` | 382 | `SlackUserActivity.profileCompleted()` |
| Tier Upgraded | `app/api/admin/update-tier/route.js` | 66 | `SlackAdminAlerts.upgradeApproved()` |
| Upgrade Requested | `app/api/upgrade-request/route.js` | 144 | `SlackAdminAlerts.upgradeRequested()` |

### Mobile App (Service Ready, Integration Needed)

Service created at: `/lib/slackService.js`

**Recommended integration points in `App.js`:**

1. After Google Sign-In success → `SlackUserActivity.newUserRegistration()`
2. After Apple Sign-In success → `SlackUserActivity.newUserRegistration()`
3. After quote save → `SlackQuoteActivity.quoteCreated()`
4. After PDF generation → `SlackQuoteActivity.pdfGenerated()`
5. In auth error handlers → `SlackErrors.authError()`

---

## Testing

### Test Slack Integration

Create a test file `/lib/testSlack.js`:

```javascript
import { SlackUserActivity, SlackQuoteActivity, SlackAdminAlerts } from './slackService';

// Test user activity notification
SlackUserActivity.newUserRegistration(
  'test@example.com',
  'Test User',
  'test-auth-id-123'
);

// Test quote activity notification
SlackQuoteActivity.quoteCreated(
  'test@example.com',
  '20251001234',
  'Test Customer',
  5000
);

// Test admin alert
SlackAdminAlerts.upgradeRequested(
  'test@example.com',
  'Test User',
  'premium'
);

console.log('✓ Test notifications sent! Check your Slack channels.');
```

Run with:
```bash
node lib/testSlack.js
```

### Verify in Slack

Check each channel:
- `#user-activity` - Should see test user registration
- `#quote-activity` - Should see test quote created
- `#admin-alerts` - Should see test upgrade request

---

## Troubleshooting

### Notifications Not Appearing?

#### 1. Check Webhook URLs
```bash
# Web App (locally)
echo $SLACK_USER_ACTIVITY_WEBHOOK_URL

# Web App (Heroku)
heroku config:get SLACK_USER_ACTIVITY_WEBHOOK_URL

# Mobile App
Check app.json → extra → slackUserActivityWebhookUrl
```

#### 2. Test with cURL
```bash
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"Test from cURL"}' \
  YOUR_WEBHOOK_URL
```

If this works, your webhook is valid. If not, regenerate the webhook in Slack.

#### 3. Check Console Logs
```bash
# Web App
# Look for: [Slack] ✓ Notification sent to...
# Or: [Slack] Webhook URL for "..." is not configured

# Mobile App
# Check React Native debugger console for Slack logs
```

#### 4. Verify Environment Variables Are Loaded

Add to your code temporarily:
```javascript
console.log('Slack webhooks configured:', {
  user_activity: !!process.env.SLACK_USER_ACTIVITY_WEBHOOK_URL,
  quote_activity: !!process.env.SLACK_QUOTE_ACTIVITY_WEBHOOK_URL,
  admin_alerts: !!process.env.SLACK_ADMIN_ALERTS_WEBHOOK_URL,
  errors: !!process.env.SLACK_ERRORS_WEBHOOK_URL,
});
```

### Rate Limiting

Slack webhooks have limits:
- **1 message per second** per webhook
- Current implementation is fire-and-forget (no queue)
- For high-volume apps, consider implementing a queue

### Security Best Practices

✅ **DO:**
- Store webhooks in environment variables
- Add `.env.local` to `.gitignore`
- Use Heroku Config Vars for production
- Use EAS Secrets for mobile production builds
- Rotate webhooks if accidentally exposed

❌ **DON'T:**
- Commit webhook URLs to git
- Share webhooks publicly
- Log webhook URLs in production

---

## Summary

✅ **Slack service created** for both web and mobile
✅ **Web app integrated** at key events
✅ **Mobile app service ready** (integration points documented)
✅ **4 notification channels** for organized monitoring
✅ **Fire-and-forget async** (non-blocking, won't crash app)
✅ **Unified monitoring** across both platforms

### Next Steps

1. ✅ Create Slack app and channels (done)
2. ✅ Get 4 webhook URLs (done)
3. ✅ Configure web app environment variables
4. ✅ Deploy web app to Heroku
5. ⏳ Configure mobile app (app.json or EAS Secrets)
6. ⏳ Add integration points to mobile App.js
7. ✅ Test with test notifications
8. ✅ Monitor channels for real activity

---

## Support

For issues or questions:
- Check Slack API docs: https://api.slack.com/messaging/webhooks
- Review service code: `lib/slackService.js`
- Test with cURL first
- Check console logs for errors

Happy monitoring! 🚀
