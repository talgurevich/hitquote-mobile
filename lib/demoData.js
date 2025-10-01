// Demo data for Apple TestFlight Review
// This provides sample data when users access the app via demo mode

export const DEMO_CUSTOMERS = [
  {
    id: 'demo-customer-1',
    name: 'Apple Inc.',
    email: 'tim.cook@apple.com',
    phone: '+1-408-996-1010',
    address: 'One Apple Park Way, Cupertino, CA 95014',
    created_at: '2024-01-15T10:00:00Z',
    user_id: 'demo-user-apple-review'
  },
  {
    id: 'demo-customer-2',
    name: 'Microsoft Corporation',
    email: 'satya.nadella@microsoft.com',
    phone: '+1-425-882-8080',
    address: 'One Microsoft Way, Redmond, WA 98052',
    created_at: '2024-01-20T14:30:00Z',
    user_id: 'demo-user-apple-review'
  },
  {
    id: 'demo-customer-3',
    name: 'Google LLC',
    email: 'sundar.pichai@google.com',
    phone: '+1-650-253-0000',
    address: '1600 Amphitheatre Parkway, Mountain View, CA 94043',
    created_at: '2024-02-01T09:15:00Z',
    user_id: 'demo-user-apple-review'
  },
  {
    id: 'demo-customer-4',
    name: 'Tesla Motors',
    email: 'elon.musk@tesla.com',
    phone: '+1-650-681-5000',
    address: '3500 Deer Creek Road, Palo Alto, CA 94304',
    created_at: '2024-02-10T16:45:00Z',
    user_id: 'demo-user-apple-review'
  }
];

export const DEMO_PRODUCTS = [
  {
    id: 'demo-product-1',
    name: 'iPhone 15 Pro Max Setup & Configuration',
    base_price: 1200,
    options: 'Storage: 256GB, 512GB, 1TB|Color: Natural Titanium, Blue Titanium, White Titanium, Black Titanium|AppleCare: 2 Years, 3 Years',
    category: 'Mobile Devices',
    user_id: 'demo-user-apple-review',
    created_at: '2024-01-10T08:00:00Z'
  },
  {
    id: 'demo-product-2',
    name: 'MacBook Pro Development Setup',
    base_price: 2500,
    options: 'RAM: 16GB, 32GB, 64GB|Storage: 512GB SSD, 1TB SSD, 2TB SSD|Processor: M3 Pro, M3 Max|Software: Xcode, VS Code, Docker',
    category: 'Computers',
    user_id: 'demo-user-apple-review',
    created_at: '2024-01-12T10:30:00Z'
  },
  {
    id: 'demo-product-3',
    name: 'Cloud Infrastructure Setup',
    base_price: 800,
    options: 'Provider: AWS, Azure, Google Cloud|Region: US-East, US-West, Europe|Instance: Small, Medium, Large|Storage: 100GB, 500GB, 1TB',
    category: 'Cloud Services',
    user_id: 'demo-user-apple-review',
    created_at: '2024-01-15T14:20:00Z'
  },
  {
    id: 'demo-product-4',
    name: 'Mobile App Development Package',
    base_price: 5000,
    options: 'Platform: iOS, Android, Cross-Platform|Features: Basic, Advanced, Enterprise|Timeline: 3 months, 6 months, 12 months|Support: 6 months, 12 months, 24 months',
    category: 'Software Development',
    user_id: 'demo-user-apple-review',
    created_at: '2024-01-18T11:45:00Z'
  },
  {
    id: 'demo-product-5',
    name: 'Network Security Audit',
    base_price: 1500,
    options: 'Scope: Basic Scan, Full Audit, Penetration Test|Report: Summary, Detailed, Executive|Follow-up: 30 days, 60 days, 90 days',
    category: 'Security Services',
    user_id: 'demo-user-apple-review',
    created_at: '2024-01-22T13:15:00Z'
  },
  {
    id: 'demo-product-6',
    name: 'Website Redesign & Optimization',
    base_price: 3500,
    options: 'Pages: 5-10, 11-20, 21-50|Design: Template-based, Custom, Premium|SEO: Basic, Advanced, Enterprise|Maintenance: 3 months, 6 months, 12 months',
    category: 'Web Development',
    user_id: 'demo-user-apple-review',
    created_at: '2024-01-25T15:30:00Z'
  }
];

export const DEMO_QUOTES = [
  {
    id: 'demo-quote-1',
    customer_id: 'demo-customer-1',
    status: 'pending',
    total: 8400,
    quote_date: '2024-03-01T10:00:00Z',
    valid_until: '2024-04-01T10:00:00Z',
    notes: 'Initial setup for new corporate headquarters. Includes training and 90-day support.',
    user_id: 'demo-user-apple-review',
    created_at: '2024-03-01T10:00:00Z',
    customer: {
      id: 'demo-customer-1',
      name: 'Apple Inc.',
      email: 'tim.cook@apple.com'
    }
  },
  {
    id: 'demo-quote-2',
    customer_id: 'demo-customer-2',
    status: 'approved',
    total: 12500,
    quote_date: '2024-02-15T14:30:00Z',
    valid_until: '2024-03-15T14:30:00Z',
    notes: 'Enterprise mobile app development for internal tools. Includes iOS and Android versions.',
    user_id: 'demo-user-apple-review',
    created_at: '2024-02-15T14:30:00Z',
    customer: {
      id: 'demo-customer-2',
      name: 'Microsoft Corporation',
      email: 'satya.nadella@microsoft.com'
    }
  },
  {
    id: 'demo-quote-3',
    customer_id: 'demo-customer-3',
    status: 'rejected',
    total: 4200,
    quote_date: '2024-02-20T09:15:00Z',
    valid_until: '2024-03-20T09:15:00Z',
    notes: 'Security audit for cloud infrastructure. Client decided to use internal team instead.',
    user_id: 'demo-user-apple-review',
    created_at: '2024-02-20T09:15:00Z',
    customer: {
      id: 'demo-customer-3',
      name: 'Google LLC',
      email: 'sundar.pichai@google.com'
    }
  },
  {
    id: 'demo-quote-4',
    customer_id: 'demo-customer-4',
    status: 'pending',
    total: 6800,
    quote_date: '2024-03-05T16:45:00Z',
    valid_until: '2024-04-05T16:45:00Z',
    notes: 'Website redesign for Tesla charging network portal. Includes mobile optimization.',
    user_id: 'demo-user-apple-review',
    created_at: '2024-03-05T16:45:00Z',
    customer: {
      id: 'demo-customer-4',
      name: 'Tesla Motors',
      email: 'elon.musk@tesla.com'
    }
  }
];

export const DEMO_QUOTE_ITEMS = [
  // Quote 1 items (Apple Inc.)
  {
    id: 'demo-item-1-1',
    proposal_id: 'demo-quote-1',
    product_id: 'demo-product-1',
    product_name: 'iPhone 15 Pro Max Setup & Configuration',
    qty: 50,
    unit_price: 1200,
    line_total: 60000,
    notes: 'Options: 512GB Storage, Natural Titanium, 2 Years AppleCare'
  },
  {
    id: 'demo-item-1-2',
    proposal_id: 'demo-quote-1',
    product_id: 'demo-product-2',
    product_name: 'MacBook Pro Development Setup',
    qty: 25,
    unit_price: 2500,
    line_total: 62500,
    notes: 'Options: 32GB RAM, 1TB SSD, M3 Pro, Full Software Suite'
  },

  // Quote 2 items (Microsoft)
  {
    id: 'demo-item-2-1',
    proposal_id: 'demo-quote-2',
    product_id: 'demo-product-4',
    product_name: 'Mobile App Development Package',
    qty: 2,
    unit_price: 5000,
    line_total: 10000,
    notes: 'Options: Cross-Platform, Enterprise Features, 6 months timeline, 12 months support'
  },
  {
    id: 'demo-item-2-2',
    proposal_id: 'demo-quote-2',
    product_id: 'demo-product-3',
    product_name: 'Cloud Infrastructure Setup',
    qty: 3,
    unit_price: 800,
    line_total: 2400,
    notes: 'Options: Azure, US-East, Medium Instance, 500GB Storage'
  },

  // Quote 3 items (Google)
  {
    id: 'demo-item-3-1',
    proposal_id: 'demo-quote-3',
    product_id: 'demo-product-5',
    product_name: 'Network Security Audit',
    qty: 2,
    unit_price: 1500,
    line_total: 3000,
    notes: 'Options: Full Audit, Detailed Report, 60 days follow-up'
  },
  {
    id: 'demo-item-3-2',
    proposal_id: 'demo-quote-3',
    product_id: 'demo-product-3',
    product_name: 'Cloud Infrastructure Setup',
    qty: 1,
    unit_price: 800,
    line_total: 800,
    notes: 'Options: Google Cloud, US-West, Large Instance, 1TB Storage'
  },

  // Quote 4 items (Tesla)
  {
    id: 'demo-item-4-1',
    proposal_id: 'demo-quote-4',
    product_id: 'demo-product-6',
    product_name: 'Website Redesign & Optimization',
    qty: 1,
    unit_price: 3500,
    line_total: 3500,
    notes: 'Options: 11-20 Pages, Custom Design, Advanced SEO, 6 months maintenance'
  },
  {
    id: 'demo-item-4-2',
    proposal_id: 'demo-quote-4',
    product_id: 'demo-product-1',
    product_name: 'iPhone 15 Pro Max Setup & Configuration',
    qty: 2,
    unit_price: 1200,
    line_total: 2400,
    notes: 'Options: 1TB Storage, Blue Titanium, 3 Years AppleCare - For executive team'
  }
];

export const DEMO_BUSINESS_SETTINGS = {
  id: 'demo-business-1',
  business_name: 'TechSolutions Pro',
  address: '123 Innovation Drive, Tech Valley, CA 94000',
  phone: '+1-555-TECH-PRO',
  email: 'contact@techsolutionspro.com',
  website: 'www.techsolutionspro.com',
  logo_url: '',
  vat_number: 'US123456789',
  default_vat_rate: 10.25,
  default_discount_type: 'percentage',
  default_discount_value: 5,
  payment_terms: 'Net 30 days',
  user_id: 'demo-user-apple-review',
  created_at: '2024-01-01T00:00:00Z'
};

// Helper function to check if current user is demo user
export function isDemoUser(session) {
  return session?.user?.id === 'demo-user-apple-review' ||
         session?.user?.email === 'applereview@demo.com' ||
         session?.user?.user_metadata?.provider === 'demo';
}

// Helper function to get demo data based on user session
export function getDemoData(session) {
  if (!isDemoUser(session)) {
    return null;
  }

  return {
    customers: DEMO_CUSTOMERS,
    products: DEMO_PRODUCTS,
    quotes: DEMO_QUOTES,
    quoteItems: DEMO_QUOTE_ITEMS,
    businessSettings: DEMO_BUSINESS_SETTINGS
  };
}