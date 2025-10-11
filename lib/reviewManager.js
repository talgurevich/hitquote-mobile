import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';

const STORAGE_KEYS = {
  FIRST_LAUNCH_DATE: '@review_first_launch_date',
  LAST_REVIEW_PROMPT: '@review_last_prompt_date',
  QUOTE_COUNT: '@review_quote_count',
  SIGNATURE_COUNT: '@review_signature_count',
  HAS_SHOWN_FIRST_QUOTE: '@review_shown_first_quote',
  HAS_SHOWN_FIRST_SIGNATURE: '@review_shown_first_signature',
  HAS_SHOWN_SEVEN_DAYS: '@review_shown_seven_days',
};

// Initialize first launch date if not set
export const initializeReviewTracking = async () => {
  try {
    const firstLaunch = await AsyncStorage.getItem(STORAGE_KEYS.FIRST_LAUNCH_DATE);
    if (!firstLaunch) {
      await AsyncStorage.setItem(STORAGE_KEYS.FIRST_LAUNCH_DATE, new Date().toISOString());
      console.log('📅 Review tracking initialized');
    }
  } catch (error) {
    console.error('Error initializing review tracking:', error);
  }
};

// Check if we should show review prompt
const shouldShowReview = async () => {
  try {
    // Don't show if store review is not available
    const isAvailable = await StoreReview.isAvailableAsync();
    if (!isAvailable) {
      console.log('⚠️ Store review not available on this device');
      return false;
    }

    // Don't show if we've shown it in the last 90 days
    const lastPrompt = await AsyncStorage.getItem(STORAGE_KEYS.LAST_REVIEW_PROMPT);
    if (lastPrompt) {
      const daysSinceLastPrompt = (Date.now() - new Date(lastPrompt).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceLastPrompt < 90) {
        console.log(`⏱️ Last review prompt was ${Math.floor(daysSinceLastPrompt)} days ago, waiting...`);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error checking if should show review:', error);
    return false;
  }
};

// Request review from user
const requestReview = async (reason) => {
  try {
    console.log(`⭐ Requesting review - Reason: ${reason}`);
    await StoreReview.requestReview();
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_REVIEW_PROMPT, new Date().toISOString());
  } catch (error) {
    console.error('Error requesting review:', error);
  }
};

// Track when user creates a quote
export const trackQuoteCreated = async () => {
  try {
    const hasShownFirstQuote = await AsyncStorage.getItem(STORAGE_KEYS.HAS_SHOWN_FIRST_QUOTE);

    if (!hasShownFirstQuote) {
      // This is the first quote!
      console.log('🎉 First quote created!');

      if (await shouldShowReview()) {
        await requestReview('first_quote');
        await AsyncStorage.setItem(STORAGE_KEYS.HAS_SHOWN_FIRST_QUOTE, 'true');
      }
    } else {
      // Increment quote count for potential future use
      const count = await AsyncStorage.getItem(STORAGE_KEYS.QUOTE_COUNT);
      const newCount = (parseInt(count) || 0) + 1;
      await AsyncStorage.setItem(STORAGE_KEYS.QUOTE_COUNT, newCount.toString());
      console.log(`📊 Total quotes created: ${newCount}`);
    }
  } catch (error) {
    console.error('Error tracking quote created:', error);
  }
};

// Track when user gets a signature
export const trackSignatureReceived = async () => {
  try {
    const hasShownFirstSignature = await AsyncStorage.getItem(STORAGE_KEYS.HAS_SHOWN_FIRST_SIGNATURE);

    if (!hasShownFirstSignature) {
      // This is the first signature!
      console.log('🎉 First signature received!');

      if (await shouldShowReview()) {
        await requestReview('first_signature');
        await AsyncStorage.setItem(STORAGE_KEYS.HAS_SHOWN_FIRST_SIGNATURE, 'true');
      }
    } else {
      // Increment signature count for potential future use
      const count = await AsyncStorage.getItem(STORAGE_KEYS.SIGNATURE_COUNT);
      const newCount = (parseInt(count) || 0) + 1;
      await AsyncStorage.setItem(STORAGE_KEYS.SIGNATURE_COUNT, newCount.toString());
      console.log(`✍️ Total signatures received: ${newCount}`);
    }
  } catch (error) {
    console.error('Error tracking signature received:', error);
  }
};

// Check if it's been 7 days since first launch
export const checkSevenDayMilestone = async () => {
  try {
    const hasShownSevenDays = await AsyncStorage.getItem(STORAGE_KEYS.HAS_SHOWN_SEVEN_DAYS);

    if (hasShownSevenDays) {
      return; // Already shown
    }

    const firstLaunch = await AsyncStorage.getItem(STORAGE_KEYS.FIRST_LAUNCH_DATE);
    if (!firstLaunch) {
      return; // First launch not tracked yet
    }

    const daysSinceLaunch = (Date.now() - new Date(firstLaunch).getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceLaunch >= 7) {
      console.log('🎉 7 days milestone reached!');

      if (await shouldShowReview()) {
        await requestReview('seven_days');
        await AsyncStorage.setItem(STORAGE_KEYS.HAS_SHOWN_SEVEN_DAYS, 'true');
      }
    } else {
      console.log(`📅 Days since first launch: ${Math.floor(daysSinceLaunch)}/7`);
    }
  } catch (error) {
    console.error('Error checking seven day milestone:', error);
  }
};

// Reset review tracking (for testing purposes)
export const resetReviewTracking = async () => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.FIRST_LAUNCH_DATE,
      STORAGE_KEYS.LAST_REVIEW_PROMPT,
      STORAGE_KEYS.QUOTE_COUNT,
      STORAGE_KEYS.SIGNATURE_COUNT,
      STORAGE_KEYS.HAS_SHOWN_FIRST_QUOTE,
      STORAGE_KEYS.HAS_SHOWN_FIRST_SIGNATURE,
      STORAGE_KEYS.HAS_SHOWN_SEVEN_DAYS,
    ]);
    console.log('🔄 Review tracking reset');
  } catch (error) {
    console.error('Error resetting review tracking:', error);
  }
};
