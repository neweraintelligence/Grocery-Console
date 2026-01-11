// Open Food Facts API service - Free and open source product database
// API Documentation: https://openfoodfacts.github.io/api-documentation/

export interface ProductInfo {
  name: string;
  category?: string;
  quantity?: string;
  unit?: string;
  imageUrl?: string;
  brand?: string;
}

/**
 * Fetch product information from Open Food Facts using barcode
 * @param barcode - The barcode (EAN/UPC) to look up
 * @returns Product information or null if not found
 */
export async function fetchProductByBarcode(barcode: string): Promise<ProductInfo | null> {
  try {
    // Open Food Facts API endpoint
    const url = `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`Open Food Facts API error: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    // Check if product was found
    if (data.status === 0 || !data.product) {
      console.log(`Product not found for barcode: ${barcode}`);
      return null;
    }
    
    const product = data.product;
    
    // Extract product information
    const productInfo: ProductInfo = {
      name: product.product_name || product.product_name_en || product.generic_name || 'Unknown Product',
      category: product.categories_tags?.[0]?.replace(/^en:/, '') || 
                product.categories?.split(',')[0]?.trim() || 
                'Other',
      quantity: product.quantity || product.product_quantity,
      unit: product.quantity_unit || 'units',
      imageUrl: product.image_url || product.image_front_url || product.image_small_url,
      brand: product.brands || product.brand || ''
    };
    
    // Clean up category name
    if (productInfo.category) {
      productInfo.category = productInfo.category
        .split(':')
        .pop()
        ?.replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ') || 'Other';
    }
    
    return productInfo;
  } catch (error) {
    console.error('Error fetching product from Open Food Facts:', error);
    return null;
  }
}

/**
 * Map Open Food Facts categories to our app categories
 */
export function mapToAppCategory(offCategory: string): string {
  const category = offCategory.toLowerCase();
  
  // Fresh produce
  if (category.includes('fruit') || category.includes('vegetable') || 
      category.includes('fresh') || category.includes('produce')) {
    return 'Fresh Produce';
  }
  
  // Dairy & Eggs
  if (category.includes('dairy') || category.includes('milk') || 
      category.includes('cheese') || category.includes('yogurt') ||
      category.includes('egg')) {
    return 'Dairy & Eggs';
  }
  
  // Meat & Seafood
  if (category.includes('meat') || category.includes('fish') || 
      category.includes('seafood') || category.includes('poultry')) {
    return 'Meat & Seafood';
  }
  
  // Pantry Staples
  if (category.includes('pantry') || category.includes('grain') || 
      category.includes('cereal') || category.includes('pasta') ||
      category.includes('rice') || category.includes('spice')) {
    return 'Pantry Staples';
  }
  
  // Bakery
  if (category.includes('bakery') || category.includes('bread') || 
      category.includes('pastry')) {
    return 'Bakery';
  }
  
  // Beverages
  if (category.includes('beverage') || category.includes('drink') || 
      category.includes('juice') || category.includes('soda')) {
    return 'Beverages';
  }
  
  // Frozen Foods
  if (category.includes('frozen')) {
    return 'Frozen Foods';
  }
  
  // Snacks
  if (category.includes('snack') || category.includes('chip') || 
      category.includes('cracker')) {
    return 'Snacks';
  }
  
  return 'Other';
}
