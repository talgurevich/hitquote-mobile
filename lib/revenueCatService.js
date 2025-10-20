import Purchases from 'react-native-purchases';

const REVENUE_CAT_API_KEY = 'appl_UDgYymgxwpvLtNbPnCooMaATWMr';

class RevenueCatService {
  async initialize(userId) {
    try {
      await Purchases.configure({
        apiKey: REVENUE_CAT_API_KEY,
        appUserID: userId,
      });
      console.log('RevenueCat initialized successfully');
      return true;
    } catch (error) {
      console.error('RevenueCat initialization failed:', error);
      return false;
    }
  }

  async getOfferings() {
    try {
      const offerings = await Purchases.getOfferings();
      if (offerings.current !== null) {
        return offerings.current;
      }
      return null;
    } catch (error) {
      console.error('Error getting offerings:', error);
      return null;
    }
  }

  async purchasePackage(pkg) {
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      return customerInfo;
    } catch (error) {
      if (error.userCancelled) {
        console.log('User cancelled the purchase');
      } else {
        console.error('Purchase error:', error);
      }
      throw error;
    }
  }

  async restorePurchases() {
    try {
      const customerInfo = await Purchases.restorePurchases();
      return customerInfo;
    } catch (error) {
      console.error('Restore purchases error:', error);
      throw error;
    }
  }

  async getCustomerInfo() {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      return customerInfo;
    } catch (error) {
      console.error('Error getting customer info:', error);
      return null;
    }
  }

  getActiveSubscription(customerInfo) {
    console.log('🔍 [RevenueCat] getActiveSubscription called with:', JSON.stringify(customerInfo, null, 2));

    if (!customerInfo) {
      console.log('⚠️ [RevenueCat] customerInfo is null/undefined');
      return null;
    }

    // Check subscriptionsByProductIdentifier for detailed info
    const subscriptions = customerInfo.subscriptionsByProductIdentifier;
    console.log('🔍 [RevenueCat] subscriptionsByProductIdentifier:', subscriptions);

    if (!subscriptions) {
      console.log('⚠️ [RevenueCat] No subscriptions found');
      return null;
    }

    // Find the active subscription with the latest expiration
    let latestActiveSubscription = null;
    let latestExpirationTime = 0;

    for (const [productId, subscription] of Object.entries(subscriptions)) {
      console.log('🔍 [RevenueCat] Checking subscription:', productId, 'isActive:', subscription.isActive);

      if (subscription.isActive) {
        const expirationTime = new Date(subscription.expiresDate).getTime();
        console.log('🔍 [RevenueCat] Active subscription found:', productId, 'expires:', subscription.expiresDate);

        if (expirationTime > latestExpirationTime) {
          latestActiveSubscription = productId;
          latestExpirationTime = expirationTime;
          console.log('🔍 [RevenueCat] This is now the latest active subscription');
        }
      }
    }

    console.log('🔍 [RevenueCat] Latest active subscription:', latestActiveSubscription);

    // Map product IDs to tier names
    if (latestActiveSubscription === 'com.hitquote.premium.monthly') {
      console.log('✅ [RevenueCat] Matched premium tier');
      return 'premium';
    } else if (latestActiveSubscription === 'com.hitquote.business.monthly') {
      console.log('✅ [RevenueCat] Matched business tier');
      return 'business';
    }

    console.log('⚠️ [RevenueCat] No active subscription matched any known tier');
    return null;
  }

  async setUserId(userId) {
    try {
      await Purchases.logIn(userId);
      console.log('RevenueCat user ID set:', userId);
    } catch (error) {
      console.error('Error setting user ID:', error);
    }
  }

  async logout() {
    try {
      await Purchases.logOut();
      console.log('RevenueCat logged out');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }
}

export default new RevenueCatService();
