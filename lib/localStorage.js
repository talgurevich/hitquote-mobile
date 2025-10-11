import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  LOCAL_CUSTOMERS: 'local_customers',
  LOCAL_PRODUCTS: 'local_products',
  LOCAL_PROPOSALS: 'local_proposals',
  IS_GUEST: 'is_guest_mode',
};

// Guest mode helpers
export const setGuestMode = async (isGuest) => {
  console.log('💾 Setting guest mode to:', isGuest);
  await AsyncStorage.setItem(KEYS.IS_GUEST, JSON.stringify(isGuest));
};

export const isGuestMode = async () => {
  const value = await AsyncStorage.getItem(KEYS.IS_GUEST);
  const result = value === 'true';
  return result;
};

// Local customers
export const getLocalCustomers = async () => {
  try {
    const data = await AsyncStorage.getItem(KEYS.LOCAL_CUSTOMERS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading local customers:', error);
    return [];
  }
};

export const saveLocalCustomer = async (customer) => {
  try {
    const customers = await getLocalCustomers();
    const newCustomer = {
      ...customer,
      _id: `local_${Date.now()}`,
      _local: true,
      created_at: new Date().toISOString(),
    };
    customers.push(newCustomer);
    await AsyncStorage.setItem(KEYS.LOCAL_CUSTOMERS, JSON.stringify(customers));
    return newCustomer;
  } catch (error) {
    console.error('Error saving local customer:', error);
    throw error;
  }
};

export const updateLocalCustomer = async (customerId, updates) => {
  try {
    const customers = await getLocalCustomers();
    const index = customers.findIndex(c => c._id === customerId);
    if (index !== -1) {
      customers[index] = { ...customers[index], ...updates };
      await AsyncStorage.setItem(KEYS.LOCAL_CUSTOMERS, JSON.stringify(customers));
      return customers[index];
    }
    throw new Error('Customer not found');
  } catch (error) {
    console.error('Error updating local customer:', error);
    throw error;
  }
};

export const deleteLocalCustomer = async (customerId) => {
  try {
    const customers = await getLocalCustomers();
    const filtered = customers.filter(c => c._id !== customerId);
    await AsyncStorage.setItem(KEYS.LOCAL_CUSTOMERS, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting local customer:', error);
    throw error;
  }
};

// Local products
export const getLocalProducts = async () => {
  try {
    const data = await AsyncStorage.getItem(KEYS.LOCAL_PRODUCTS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading local products:', error);
    return [];
  }
};

export const saveLocalProduct = async (product) => {
  try {
    const products = await getLocalProducts();
    const newProduct = {
      ...product,
      _id: `local_${Date.now()}`,
      _local: true,
      created_at: new Date().toISOString(),
    };
    products.push(newProduct);
    await AsyncStorage.setItem(KEYS.LOCAL_PRODUCTS, JSON.stringify(products));
    return newProduct;
  } catch (error) {
    console.error('Error saving local product:', error);
    throw error;
  }
};

export const updateLocalProduct = async (productId, updates) => {
  try {
    const products = await getLocalProducts();
    const index = products.findIndex(p => p._id === productId);
    if (index !== -1) {
      products[index] = { ...products[index], ...updates };
      await AsyncStorage.setItem(KEYS.LOCAL_PRODUCTS, JSON.stringify(products));
      return products[index];
    }
    throw new Error('Product not found');
  } catch (error) {
    console.error('Error updating local product:', error);
    throw error;
  }
};

export const deleteLocalProduct = async (productId) => {
  try {
    const products = await getLocalProducts();
    const filtered = products.filter(p => p._id !== productId);
    await AsyncStorage.setItem(KEYS.LOCAL_PRODUCTS, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting local product:', error);
    throw error;
  }
};

// Clear all local data (after successful migration)
export const clearLocalData = async () => {
  await AsyncStorage.multiRemove([
    KEYS.LOCAL_CUSTOMERS,
    KEYS.LOCAL_PRODUCTS,
    KEYS.LOCAL_PROPOSALS,
  ]);
};
