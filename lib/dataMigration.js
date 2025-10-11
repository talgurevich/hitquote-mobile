import { supabase } from './supabaseClient';
import { getLocalCustomers, getLocalProducts, clearLocalData } from './localStorage';

export const migrateLocalDataToSupabase = async (userId) => {
  try {
    console.log('🔄 Starting data migration from guest to authenticated user...');

    const customers = await getLocalCustomers();
    const products = await getLocalProducts();

    let migratedCustomers = 0;
    let migratedProducts = 0;
    const errors = [];

    // Migrate customers
    for (const customer of customers) {
      const { _local, _id, ...customerData } = customer;
      const { error } = await supabase.from('customer').insert({
        ...customerData,
        user_id: userId,
        created_at: customerData.created_at || new Date().toISOString(),
      });

      if (error) {
        console.error('Error migrating customer:', error);
        errors.push({ type: 'customer', data: customer, error });
      } else {
        migratedCustomers++;
      }
    }

    // Migrate products
    for (const product of products) {
      const { _local, _id, ...productData } = product;
      const { error } = await supabase.from('product').insert({
        ...productData,
        user_id: userId,
        created_at: productData.created_at || new Date().toISOString(),
      });

      if (error) {
        console.error('Error migrating product:', error);
        errors.push({ type: 'product', data: product, error });
      } else {
        migratedProducts++;
      }
    }

    // Only clear local data if migration was completely successful
    if (errors.length === 0) {
      await clearLocalData();
      console.log('✅ Migration complete and local data cleared');
    } else {
      console.warn('⚠️ Migration completed with errors. Local data preserved.');
    }

    return {
      success: errors.length === 0,
      customersCount: migratedCustomers,
      productsCount: migratedProducts,
      totalItems: customers.length + products.length,
      errors,
    };
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return {
      success: false,
      error: error.message,
      customersCount: 0,
      productsCount: 0,
      totalItems: 0,
      errors: [error],
    };
  }
};
