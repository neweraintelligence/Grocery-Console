// Multi-database barcode lookup service
// Queries multiple free databases in sequence for maximum coverage
// Also maintains a local cache for user-added products
//
// To enable SearchUPCData (1,000 free lookups/month):
// 1. Sign up at https://searchupcdata.com/api-docs
// 2. Get your free API key (1,000 requests/month)
// 3. Add it to Render environment variables as VITE_SEARCH_UPC_DATA_API_KEY
// Or set it in browser console: window.SEARCH_UPC_DATA_API_KEY = 'YOUR_KEY_HERE'

export interface ProductInfo {
  name: string;
  category?: string;
  quantity?: string;
  unit?: string;
  imageUrl?: string;
  brand?: string;
  source?: string; // Which database found the product
}

// Local storage key for user-added products
const LOCAL_PRODUCTS_KEY = 'grocery-dashboard-local-products';

/**
 * Get products from local storage cache
 */
function getLocalProducts(): Record<string, ProductInfo> {
  try {
    const stored = localStorage.getItem(LOCAL_PRODUCTS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

/**
 * Save a product to local storage cache
 */
export function saveProductToLocal(barcode: string, product: ProductInfo): void {
  try {
    const products = getLocalProducts();
    products[barcode] = { ...product, source: 'Local (User Added)' };
    localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(products));
    console.log(`💾 Saved product to local cache: ${barcode} → ${product.name}`);
  } catch (error) {
    console.error('Failed to save product to local storage:', error);
  }
}

/**
 * Fetch product from local storage cache (user-added products)
 */
function fetchFromLocalCache(barcode: string): ProductInfo | null {
  const products = getLocalProducts();
  const product = products[barcode];
  if (product) {
    return { ...product, source: 'Local (User Added)' };
  }
  return null;
}

/**
 * Fetch product from Open Food Facts (primary - best for food products)
 * ~3 million products, completely free, no API key required
 */
async function fetchFromOpenFoodFacts(barcode: string): Promise<ProductInfo | null> {
  try {
    const url = `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`;
    const response = await fetch(url);
    
    if (!response.ok) return null;
    
    const data = await response.json();
    
    if (data.status === 0 || !data.product) return null;
    
    const product = data.product;
    
    // Only return if we have a valid product name
    const name = product.product_name || product.product_name_en || product.generic_name;
    if (!name || name === 'Unknown Product') return null;
    
    return {
      name,
      category: product.categories_tags?.[0]?.replace(/^en:/, '') || 
                product.categories?.split(',')[0]?.trim() || 
                'Other',
      quantity: product.quantity || product.product_quantity,
      unit: product.quantity_unit || 'units',
      imageUrl: product.image_url || product.image_front_url || product.image_small_url,
      brand: product.brands || product.brand || '',
      source: 'Open Food Facts'
    };
  } catch (error) {
    console.log('Open Food Facts lookup failed:', error);
    return null;
  }
}

/**
 * Fetch product from Open Beauty Facts (for cosmetics, cleaning products, etc.)
 * Free, no API key required
 */
async function fetchFromOpenBeautyFacts(barcode: string): Promise<ProductInfo | null> {
  try {
    const url = `https://world.openbeautyfacts.org/api/v0/product/${barcode}.json`;
    const response = await fetch(url);
    
    if (!response.ok) return null;
    
    const data = await response.json();
    
    if (data.status === 0 || !data.product) return null;
    
    const product = data.product;
    
    const name = product.product_name || product.product_name_en || product.generic_name;
    if (!name || name === 'Unknown Product') return null;
    
    return {
      name,
      category: 'Household',
      quantity: product.quantity || product.product_quantity,
      unit: product.quantity_unit || 'units',
      imageUrl: product.image_url || product.image_front_url,
      brand: product.brands || product.brand || '',
      source: 'Open Beauty Facts'
    };
  } catch (error) {
    console.log('Open Beauty Facts lookup failed:', error);
    return null;
  }
}

/**
 * Fetch product from Open Pet Food Facts (for pet products)
 * Free, no API key required
 */
async function fetchFromOpenPetFoodFacts(barcode: string): Promise<ProductInfo | null> {
  try {
    const url = `https://world.openpetfoodfacts.org/api/v0/product/${barcode}.json`;
    const response = await fetch(url);
    
    if (!response.ok) return null;
    
    const data = await response.json();
    
    if (data.status === 0 || !data.product) return null;
    
    const product = data.product;
    
    const name = product.product_name || product.product_name_en || product.generic_name;
    if (!name || name === 'Unknown Product') return null;
    
    return {
      name,
      category: 'Pet Supplies',
      quantity: product.quantity || product.product_quantity,
      unit: product.quantity_unit || 'units',
      imageUrl: product.image_url || product.image_front_url,
      brand: product.brands || product.brand || '',
      source: 'Open Pet Food Facts'
    };
  } catch (error) {
    console.log('Open Pet Food Facts lookup failed:', error);
    return null;
  }
}

/**
 * Fetch product from UPC Item DB (good general coverage)
 * Free tier: 100 lookups/day
 * No API key required for basic lookups
 */
async function fetchFromUPCItemDB(barcode: string): Promise<ProductInfo | null> {
  try {
    const url = `https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) {
      // Check for rate limiting
      if (response.status === 429) {
        console.log('UPC Item DB rate limit reached');
      }
      return null;
    }
    
    const data = await response.json();
    
    if (!data.items || data.items.length === 0) return null;
    
    const item = data.items[0];
    
    // Validate we have a product name
    const name = item.title || (item.brand && item.model ? `${item.brand} ${item.model}` : null);
    if (!name || name === 'Unknown Product') return null;
    
    return {
      name,
      category: item.category || 'Other',
      quantity: item.weight || item.size,
      unit: 'units',
      imageUrl: item.images?.[0],
      brand: item.brand || '',
      source: 'UPC Item DB'
    };
  } catch (error) {
    console.log('UPC Item DB lookup failed:', error);
    return null;
  }
}

/**
 * Fetch product from SearchUPCData.com (excellent coverage, millions of products)
 * Free tier: 1,000 requests/month
 * Requires API key (optional - will skip if not configured)
 */
async function fetchFromSearchUPCData(barcode: string): Promise<ProductInfo | null> {
  try {
    // Get API key from environment (build-time), window, or localStorage (optional)
    // Priority: Vite env var → window global → localStorage
    // If no key, gracefully skip
    const apiKey = (import.meta.env.VITE_SEARCH_UPC_DATA_API_KEY as string) ||
                   (window as any).SEARCH_UPC_DATA_API_KEY || 
                   localStorage.getItem('search_upc_data_api_key');
    
    if (!apiKey) {
      // No API key configured - skip silently
      return null;
    }
    
    const url = `https://searchupcdata.com/api/products/${barcode}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) {
      if (response.status === 429) {
        console.log('SearchUPCData rate limit reached');
      } else if (response.status === 401) {
        console.log('SearchUPCData: Invalid API key');
      }
      return null;
    }
    
    const data = await response.json();
    
    // Validate we have a product name
    const name = data.name || null;
    if (!name) return null;
    
    return {
      name,
      category: data.category || 'Other',
      quantity: data.size || data.weight,
      unit: 'units',
      imageUrl: data.imageUrl,
      brand: data.brand || '',
      source: 'SearchUPCData'
    };
  } catch (error) {
    console.log('SearchUPCData lookup failed:', error);
    return null;
  }
}

/**
 * Fetch product from World Open Food API (alternative database)
 * Free, no registration required
 */
async function fetchFromWorldOpenFoodAPI(barcode: string): Promise<ProductInfo | null> {
  try {
    const url = `https://world.openfoodfacts.org/api/v2/product/${barcode}?fields=product_name,brands,categories_tags,image_url,quantity`;
    const response = await fetch(url);
    
    if (!response.ok) return null;
    
    const data = await response.json();
    
    if (data.status === 'failure' || !data.product) return null;
    
    const product = data.product;
    const name = product.product_name;
    if (!name) return null;
    
    return {
      name,
      category: product.categories_tags?.[0]?.replace(/^en:/, '') || 'Other',
      quantity: product.quantity,
      unit: 'units',
      imageUrl: product.image_url,
      brand: product.brands || '',
      source: 'Open Food Facts v2'
    };
  } catch (error) {
    console.log('World Open Food API lookup failed:', error);
    return null;
  }
}

/**
 * Fetch product from Go-UPC (good international coverage including Canada)
 * Free tier available
 */
async function fetchFromGoUPC(barcode: string): Promise<ProductInfo | null> {
  try {
    // Go-UPC has a free lookup page we can scrape data from
    // For now, we'll use their API which requires key, so skip if no key
    // This is a placeholder for future implementation with API key
    return null;
  } catch (error) {
    console.log('Go-UPC lookup failed:', error);
    return null;
  }
}

/**
 * Fetch from Nutritionix (good for branded foods)
 * Note: Requires API key for production use
 */
async function fetchFromNutritionix(barcode: string): Promise<ProductInfo | null> {
  try {
    // Nutritionix instant endpoint doesn't require auth for basic lookups
    const url = `https://trackapi.nutritionix.com/v2/search/item?upc=${barcode}`;
    const response = await fetch(url, {
      headers: {
        'x-app-id': 'demo',
        'x-app-key': 'demo'
      }
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    if (!data.foods || data.foods.length === 0) return null;
    
    const food = data.foods[0];
    return {
      name: food.food_name || food.brand_name_item_name,
      category: 'Food',
      brand: food.brand_name || '',
      source: 'Nutritionix'
    };
  } catch (error) {
    // Expected to fail without proper API key
    return null;
  }
}

/**
 * Main function: Fetch product by barcode from multiple databases
 * Tries each database in sequence until a product is found
 * Priority: Local cache → Open Food Facts → UPC Item DB → Barcode Spider → Other databases
 */
export async function fetchProductByBarcode(barcode: string): Promise<ProductInfo | null> {
  console.log(`🔍 Looking up barcode: ${barcode}`);
  
  // Clean the barcode (remove any spaces or dashes)
  const cleanBarcode = barcode.replace(/[\s-]/g, '');
  
  // Check local cache first (user-added products)
  console.log('  → Checking local cache...');
  let product = fetchFromLocalCache(cleanBarcode);
  if (product) {
    console.log(`  ✅ Found in local cache: ${product.name}`);
    return product;
  }
  
  // Try Open Food Facts (best for groceries, good Canadian coverage)
  console.log('  → Trying Open Food Facts...');
  product = await fetchFromOpenFoodFacts(cleanBarcode);
  if (product) {
    console.log(`  ✅ Found in Open Food Facts: ${product.name}`);
    return product;
  }
  
  // Try UPC Item DB (good general coverage, 100/day free)
  console.log('  → Trying UPC Item DB...');
  product = await fetchFromUPCItemDB(cleanBarcode);
  if (product) {
    console.log(`  ✅ Found in UPC Item DB: ${product.name}`);
    return product;
  }
  
  // Try SearchUPCData (excellent coverage, millions of products, 1,000/month free)
  console.log('  → Trying SearchUPCData...');
  product = await fetchFromSearchUPCData(cleanBarcode);
  if (product) {
    console.log(`  ✅ Found in SearchUPCData: ${product.name}`);
    return product;
  }
  
  // Try Open Beauty Facts (for non-food items like cleaning supplies)
  console.log('  → Trying Open Beauty Facts...');
  product = await fetchFromOpenBeautyFacts(cleanBarcode);
  if (product) {
    console.log(`  ✅ Found in Open Beauty Facts: ${product.name}`);
    return product;
  }
  
  // Try Open Pet Food Facts
  console.log('  → Trying Open Pet Food Facts...');
  product = await fetchFromOpenPetFoodFacts(cleanBarcode);
  if (product) {
    console.log(`  ✅ Found in Open Pet Food Facts: ${product.name}`);
    return product;
  }
  
  console.log(`  ❌ Product not found in any database for barcode: ${cleanBarcode}`);
  console.log(`  💡 You can add this product manually and it will be saved for future scans.`);
  return null;
}

/**
 * Map database categories to our app categories
 */
export function mapToAppCategory(dbCategory: string): string {
  const category = dbCategory.toLowerCase();
  
  // Fresh produce
  if (category.includes('fruit') || category.includes('vegetable') || 
      category.includes('fresh') || category.includes('produce') ||
      category.includes('salad') || category.includes('herb')) {
    return 'Fresh Produce';
  }
  
  // Dairy & Eggs
  if (category.includes('dairy') || category.includes('milk') || 
      category.includes('cheese') || category.includes('yogurt') ||
      category.includes('yoghurt') || category.includes('egg') ||
      category.includes('butter') || category.includes('cream')) {
    return 'Dairy & Eggs';
  }
  
  // Meat & Seafood
  if (category.includes('meat') || category.includes('fish') || 
      category.includes('seafood') || category.includes('poultry') ||
      category.includes('chicken') || category.includes('beef') ||
      category.includes('pork') || category.includes('salmon') ||
      category.includes('tuna') || category.includes('shrimp')) {
    return 'Meat & Seafood';
  }
  
  // Pantry Staples
  if (category.includes('pantry') || category.includes('grain') || 
      category.includes('cereal') || category.includes('pasta') ||
      category.includes('rice') || category.includes('spice') ||
      category.includes('sauce') || category.includes('oil') ||
      category.includes('condiment') || category.includes('canned') ||
      category.includes('bean') || category.includes('soup')) {
    return 'Pantry Staples';
  }
  
  // Bakery
  if (category.includes('bakery') || category.includes('bread') || 
      category.includes('pastry') || category.includes('cake') ||
      category.includes('cookie') || category.includes('biscuit')) {
    return 'Bakery';
  }
  
  // Beverages
  if (category.includes('beverage') || category.includes('drink') || 
      category.includes('juice') || category.includes('soda') ||
      category.includes('water') || category.includes('coffee') ||
      category.includes('tea') || category.includes('wine') ||
      category.includes('beer') || category.includes('alcohol')) {
    return 'Beverages';
  }
  
  // Frozen Foods
  if (category.includes('frozen') || category.includes('ice cream') ||
      category.includes('gelato') || category.includes('sorbet')) {
    return 'Frozen Foods';
  }
  
  // Snacks
  if (category.includes('snack') || category.includes('chip') || 
      category.includes('cracker') || category.includes('nut') ||
      category.includes('candy') || category.includes('chocolate') ||
      category.includes('sweet') || category.includes('confection')) {
    return 'Snacks';
  }
  
  // Household
  if (category.includes('household') || category.includes('cleaning') ||
      category.includes('laundry') || category.includes('paper') ||
      category.includes('soap') || category.includes('detergent')) {
    return 'Household';
  }
  
  // Personal Care
  if (category.includes('personal') || category.includes('beauty') ||
      category.includes('cosmetic') || category.includes('hygiene') ||
      category.includes('shampoo') || category.includes('lotion')) {
    return 'Personal Care';
  }
  
  // Pet Supplies
  if (category.includes('pet') || category.includes('dog') ||
      category.includes('cat') || category.includes('animal')) {
    return 'Pet Supplies';
  }
  
  return 'Other';
}
