/**
 * Slack Notifications Service for HitQuote Mobile App
 *
 * Sends real-time notifications to Slack channels for monitoring:
 * - User activity (registrations, profile completions, tier upgrades)
 * - Quote activity (created, signed, duplicated)
 * - Admin alerts (upgrade requests, approvals)
 * - Errors (authentication failures, application errors)
 */

// NOTE: These webhook URLs should be set in your environment
// For Expo, use app.json extra config or EAS secrets
const SLACK_WEBHOOKS = {
  user_activity: process.env.SLACK_USER_ACTIVITY_WEBHOOK_URL || __DEV__ ? null : null,
  quote_activity: process.env.SLACK_QUOTE_ACTIVITY_WEBHOOK_URL || __DEV__ ? null : null,
  admin_alerts: process.env.SLACK_ADMIN_ALERTS_WEBHOOK_URL || __DEV__ ? null : null,
  errors: process.env.SLACK_ERRORS_WEBHOOK_URL || __DEV__ ? null : null,
};

/**
 * Send a Slack notification (async, non-blocking, fire-and-forget)
 * @param {string} message - Message to send (supports Slack markdown)
 * @param {'user_activity'|'quote_activity'|'admin_alerts'|'errors'} webhookType - Webhook channel type
 */
export function sendSlackNotification(message, webhookType = 'errors') {
  // Fire-and-forget async function
  (async () => {
    try {
      const webhookUrl = SLACK_WEBHOOKS[webhookType];

      if (!webhookUrl) {
        console.warn(`[Slack] Webhook URL for "${webhookType}" is not configured`);
        return;
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message }),
      });

      if (!response.ok) {
        console.error(`[Slack] Failed to send notification to ${webhookType}:`, response.statusText);
      } else {
        console.log(`[Slack] ✓ Notification sent to ${webhookType}`);
      }
    } catch (error) {
      // Don't crash the app if Slack is down
      console.error(`[Slack] Error sending notification to ${webhookType}:`, error.message);
    }
  })();
}

/**
 * User Activity Notifications
 */
export const SlackUserActivity = {
  /**
   * Notify when a new user registers
   */
  newUserRegistration: (userEmail, displayName, authUserId) => {
    const message = `
:bust_in_silhouette: *New User Registration* :tada:
*Email:* ${userEmail}
*Name:* ${displayName || 'Not provided'}
*Auth ID:* \`${authUserId}\`
*Platform:* Mobile App (iOS/Android)
*Time:* ${new Date().toISOString()}
    `.trim();

    sendSlackNotification(message, 'user_activity');
  },

  /**
   * Notify when user completes their business profile
   */
  profileCompleted: (userEmail, businessName, hasLogo) => {
    const message = `
:white_check_mark: *Profile Completed* :sparkles:
*User:* ${userEmail}
*Business Name:* ${businessName}
*Logo Uploaded:* ${hasLogo ? 'Yes ✓' : 'No'}
*Platform:* Mobile App (iOS/Android)
*Time:* ${new Date().toISOString()}
    `.trim();

    sendSlackNotification(message, 'user_activity');
  },

  /**
   * Notify when user tier is upgraded
   */
  tierUpgraded: (userEmail, oldTier, newTier, adminEmail) => {
    const message = `
:arrow_up: *Tier Upgraded* :rocket:
*User:* ${userEmail}
*Old Tier:* ${oldTier}
*New Tier:* ${newTier}
*Upgraded By:* ${adminEmail}
*Platform:* Mobile App (iOS/Android)
*Time:* ${new Date().toISOString()}
    `.trim();

    sendSlackNotification(message, 'user_activity');
  },

  /**
   * Notify when user logs in (first time after registration)
   */
  firstLogin: (userEmail, provider) => {
    const message = `
:key: *First Login* :wave:
*User:* ${userEmail}
*Auth Provider:* ${provider}
*Platform:* Mobile App (iOS/Android)
*Time:* ${new Date().toISOString()}
    `.trim();

    sendSlackNotification(message, 'user_activity');
  },
};

/**
 * Quote Activity Notifications
 */
export const SlackQuoteActivity = {
  /**
   * Notify when a quote is created
   */
  quoteCreated: (userEmail, proposalNumber, customerName, total) => {
    const message = `
:page_facing_up: *New Quote Created*
*Created By:* ${userEmail}
*Quote #:* ${proposalNumber}
*Customer:* ${customerName}
*Total:* ₪${Number(total).toLocaleString()}
*Platform:* Mobile App (iOS/Android)
*Time:* ${new Date().toISOString()}
    `.trim();

    sendSlackNotification(message, 'quote_activity');
  },

  /**
   * Notify when a quote is signed
   */
  quoteSigned: (userEmail, proposalNumber, customerName, total, signatureMethod) => {
    const message = `
:white_check_mark: *Quote Signed* :tada:
*Business:* ${userEmail}
*Quote #:* ${proposalNumber}
*Customer:* ${customerName}
*Total:* ₪${Number(total).toLocaleString()}
*Signature:* ${signatureMethod}
*Platform:* Mobile App (iOS/Android)
*Time:* ${new Date().toISOString()}
    `.trim();

    sendSlackNotification(message, 'quote_activity');
  },

  /**
   * Notify when a quote is duplicated
   */
  quoteDuplicated: (userEmail, originalNumber, newNumber) => {
    const message = `
:clipboard: *Quote Duplicated*
*User:* ${userEmail}
*Original Quote #:* ${originalNumber}
*New Quote #:* ${newNumber}
*Platform:* Mobile App (iOS/Android)
*Time:* ${new Date().toISOString()}
    `.trim();

    sendSlackNotification(message, 'quote_activity');
  },

  /**
   * Notify when PDF is generated
   */
  pdfGenerated: (userEmail, proposalNumber, customerName) => {
    const message = `
:page_with_curl: *PDF Generated*
*User:* ${userEmail}
*Quote #:* ${proposalNumber}
*Customer:* ${customerName}
*Platform:* Mobile App (iOS/Android)
*Time:* ${new Date().toISOString()}
    `.trim();

    sendSlackNotification(message, 'quote_activity');
  },
};

/**
 * Admin Alert Notifications
 */
export const SlackAdminAlerts = {
  /**
   * Notify when a user requests upgrade
   */
  upgradeRequested: (userEmail, displayName, requestedPlan) => {
    const message = `
:raised_hand: *Upgrade Request Submitted*
*User:* ${userEmail}
*Name:* ${displayName || 'Not provided'}
*Requested Plan:* ${requestedPlan}
*Status:* Pending Review
*Platform:* Mobile App (iOS/Android)
*Time:* ${new Date().toISOString()}

_Action Required: Review at web admin panel_
    `.trim();

    sendSlackNotification(message, 'admin_alerts');
  },

  /**
   * Notify about quota limit reached
   */
  quotaLimitReached: (userEmail, tier, limit) => {
    const message = `
:warning: *Quota Limit Reached*
*User:* ${userEmail}
*Tier:* ${tier}
*Monthly Limit:* ${limit}
*Platform:* Mobile App (iOS/Android)
*Time:* ${new Date().toISOString()}

_User cannot create more quotes this month_
    `.trim();

    sendSlackNotification(message, 'admin_alerts');
  },
};

/**
 * Error Notifications
 */
export const SlackErrors = {
  /**
   * Notify about authentication errors
   */
  authError: (userEmail, errorMessage, errorType) => {
    const message = `
:rotating_light: *Authentication Error*
*Type:* ${errorType}
*User:* ${userEmail || 'Unknown'}
*Error:* ${errorMessage}
*Platform:* Mobile App (iOS/Android)
*Time:* ${new Date().toISOString()}
    `.trim();

    sendSlackNotification(message, 'errors');
  },

  /**
   * Notify about API errors
   */
  apiError: (endpoint, method, statusCode, errorMessage, userId) => {
    const message = `
:x: *API Error*
*Endpoint:* ${method} ${endpoint}
*Status Code:* ${statusCode}
*Error:* ${errorMessage}
*User ID:* ${userId || 'Unknown'}
*Platform:* Mobile App (iOS/Android)
*Time:* ${new Date().toISOString()}
    `.trim();

    sendSlackNotification(message, 'errors');
  },

  /**
   * Notify about database errors
   */
  databaseError: (operation, table, errorMessage, userId) => {
    const message = `
:warning: *Database Error*
*Operation:* ${operation}
*Table:* ${table}
*Error:* ${errorMessage}
*User ID:* ${userId || 'Unknown'}
*Platform:* Mobile App (iOS/Android)
*Time:* ${new Date().toISOString()}
    `.trim();

    sendSlackNotification(message, 'errors');
  },

  /**
   * Notify about critical errors
   */
  criticalError: (errorMessage, context) => {
    const message = `
:rotating_light: *CRITICAL ERROR* :rotating_light:
*Error:* ${errorMessage}
*Context:* ${JSON.stringify(context)}
*Platform:* Mobile App (iOS/Android)
*Time:* ${new Date().toISOString()}
    `.trim();

    sendSlackNotification(message, 'errors');
  },
};
