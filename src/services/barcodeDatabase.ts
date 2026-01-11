// Multi-database barcode lookup service
// Queries multiple free databases in sequence for maximum coverage

export interface ProductInfo {
  name: string;
  category?: string;
  quantity?: string;
  unit?: string;
  imageUrl?: string;
  brand?: string;
  source?: string; // Which database found the product
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
    
    return {
      name: item.title || item.brand + ' ' + item.model || 'Unknown Product',
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
 * Main function: Fetch product by barcode from multiple databases
 * Tries each database in sequence until a product is found
 */
export async function fetchProductByBarcode(barcode: string): Promise<ProductInfo | null> {
  console.log(`🔍 Looking up barcode: ${barcode}`);
  
  // Clean the barcode (remove any spaces or dashes)
  const cleanBarcode = barcode.replace(/[\s-]/g, '');
  
  // Try Open Food Facts first (best for groceries)
  console.log('  → Trying Open Food Facts...');
  let product = await fetchFromOpenFoodFacts(cleanBarcode);
  if (product) {
    console.log(`  ✅ Found in Open Food Facts: ${product.name}`);
    return product;
  }
  
  // Try UPC Item DB (good general coverage)
  console.log('  → Trying UPC Item DB...');
  product = await fetchFromUPCItemDB(cleanBarcode);
  if (product) {
    console.log(`  ✅ Found in UPC Item DB: ${product.name}`);
    return product;
  }
  
  // Try Open Beauty Facts (for non-food items)
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
