// Predictive Restock & Dynamic Pricing Advisor Service

interface ConsumptionPattern {
  itemId: string;
  itemName: string;
  category: string;
  dailyConsumptionRate: number; // items consumed per day on average
  weeklyPattern: number[]; // consumption pattern across 7 days (0=Sunday)
  seasonalMultiplier: number; // seasonal adjustment factor
  lastRestocked: Date;
  averageRestockQuantity: number;
  priceHistory: PricePoint[];
  reliability: number; // confidence score 0-1
}

interface PricePoint {
  date: Date;
  price: number;
  store: string;
  unit: string;
}

interface RestockPrediction {
  itemId: string;
  itemName: string;
  category: string;
  currentStock: number;
  predictedRunOutDate: Date;
  recommendedRestockDate: Date;
  recommendedQuantity: number;
  confidence: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  estimatedCost: number;
  bestStore: string;
  reasoning: string[];
}

interface HouseholdProfile {
  householdSize: number;
  dietaryPreferences: string[];
  cookingFrequency: number; // meals per week
  specialEvents: { date: Date; expectedGuests: number }[];
}

export class PredictiveRestockService {
  private consumptionPatterns: Map<string, ConsumptionPattern> = new Map();
  private householdProfile: HouseholdProfile;

  constructor(householdProfile?: HouseholdProfile) {
    this.householdProfile = householdProfile || {
      householdSize: 2, // default assumption
      dietaryPreferences: [],
      cookingFrequency: 14, // 2 meals per day
      specialEvents: []
    };
  }

  // Analyze consumption patterns from historical data
  analyzeConsumptionPatterns(pantryHistory: any[], purchaseHistory: any[]): void {
    const itemData = new Map<string, {
      stockChanges: { date: Date; change: number; reason: string }[];
      purchases: { date: Date; quantity: number; price: number; store: string }[];
    }>();

    // Process purchase history
    purchaseHistory.forEach(purchase => {
      if (!itemData.has(purchase.itemId)) {
        itemData.set(purchase.itemId, { stockChanges: [], purchases: [] });
      }
      itemData.get(purchase.itemId)!.purchases.push({
        date: new Date(purchase.date),
        quantity: purchase.quantity,
        price: purchase.price || 0,
        store: purchase.store || 'Unknown'
      });
      
      // Add stock increase from purchase
      itemData.get(purchase.itemId)!.stockChanges.push({
        date: new Date(purchase.date),
        change: purchase.quantity,
        reason: 'purchase'
      });
    });

    // Process pantry history for consumption tracking
    pantryHistory.forEach(record => {
      if (!itemData.has(record.itemId)) {
        itemData.set(record.itemId, { stockChanges: [], purchases: [] });
      }
      
      // Look for stock decreases (consumption)
      if (record.previousCount && record.currentCount < record.previousCount) {
        itemData.get(record.itemId)!.stockChanges.push({
          date: new Date(record.date),
          change: record.currentCount - record.previousCount,
          reason: 'consumption'
        });
      }
    });

    // Calculate consumption patterns
    itemData.forEach((data, itemId) => {
      const pattern = this.calculateConsumptionPattern(itemId, data);
      if (pattern) {
        this.consumptionPatterns.set(itemId, pattern);
      }
    });
  }

  private calculateConsumptionPattern(itemId: string, data: any): ConsumptionPattern | null {
    const stockChanges = data.stockChanges.sort((a: any, b: any) => a.date.getTime() - b.date.getTime());
    const purchases = data.purchases.sort((a: any, b: any) => a.date.getTime() - b.date.getTime());
    
    if (stockChanges.length < 3) return null; // Not enough data

    // Calculate daily consumption rate
    const consumptionEvents = stockChanges.filter(change => change.change < 0);
    if (consumptionEvents.length === 0) return null;

    const totalConsumption = consumptionEvents.reduce((sum: number, event: any) => sum + Math.abs(event.change), 0);
    const timeSpanDays = (stockChanges[stockChanges.length - 1].date.getTime() - stockChanges[0].date.getTime()) / (1000 * 60 * 60 * 24);
    const dailyConsumptionRate = totalConsumption / Math.max(timeSpanDays, 1);

    // Calculate weekly pattern
    const weeklyPattern = new Array(7).fill(0);
    consumptionEvents.forEach((event: any) => {
      const dayOfWeek = event.date.getDay();
      weeklyPattern[dayOfWeek] += Math.abs(event.change);
    });
    const maxDayConsumption = Math.max(...weeklyPattern);
    if (maxDayConsumption > 0) {
      weeklyPattern.forEach((consumption, index) => {
        weeklyPattern[index] = consumption / maxDayConsumption;
      });
    }

    // Calculate average restock quantity
    const averageRestockQuantity = purchases.length > 0 
      ? purchases.reduce((sum: number, purchase: any) => sum + purchase.quantity, 0) / purchases.length
      : 5; // default

    // Create price history
    const priceHistory: PricePoint[] = purchases.map((purchase: any) => ({
      date: purchase.date,
      price: purchase.price,
      store: purchase.store,
      unit: 'units' // Could be enhanced to track actual units
    }));

    // Calculate reliability based on data consistency
    const reliability = Math.min(1, stockChanges.length / 10); // More data = higher reliability

    return {
      itemId,
      itemName: '', // Will be filled from pantry data
      category: '', // Will be filled from pantry data
      dailyConsumptionRate,
      weeklyPattern,
      seasonalMultiplier: 1.0, // Could be enhanced with seasonal analysis
      lastRestocked: purchases.length > 0 ? purchases[purchases.length - 1].date : new Date(),
      averageRestockQuantity,
      priceHistory,
      reliability
    };
  }

  // Generate restock predictions for all items
  generateRestockPredictions(pantryItems: any[]): RestockPrediction[] {
    const predictions: RestockPrediction[] = [];
    const now = new Date();

    pantryItems.forEach(item => {
      const pattern = this.consumptionPatterns.get(item.id);
      if (!pattern && item.currentCount > item.minCount) {
        // No consumption pattern but item is well stocked
        return;
      }

      const prediction = this.predictItemRestock(item, pattern, now);
      if (prediction) {
        predictions.push(prediction);
      }
    });

    // Sort by urgency and predicted run-out date
    return predictions.sort((a, b) => {
      const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const urgencyDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      if (urgencyDiff !== 0) return urgencyDiff;
      return a.predictedRunOutDate.getTime() - b.predictedRunOutDate.getTime();
    });
  }

  private predictItemRestock(item: any, pattern: ConsumptionPattern | undefined, now: Date): RestockPrediction | null {
    const reasoning: string[] = [];
    
    // Base prediction on minimum stock level if no pattern available
    if (!pattern) {
      if (item.currentCount <= item.minCount) {
        const urgency = item.currentCount === 0 ? 'critical' : 
                       item.currentCount < item.minCount * 0.5 ? 'high' : 'medium';
        
        reasoning.push(`Based on minimum stock threshold (${item.minCount})`);
        reasoning.push(`Current stock: ${item.currentCount}`);

        return {
          itemId: item.id,
          itemName: item.name,
          category: item.category,
          currentStock: item.currentCount,
          predictedRunOutDate: new Date(now.getTime() + (item.currentCount * 24 * 60 * 60 * 1000)), // 1 day per item
          recommendedRestockDate: new Date(now.getTime() + (24 * 60 * 60 * 1000)), // Tomorrow
          recommendedQuantity: Math.max(item.minCount * 2, 5),
          confidence: 0.5,
          urgency: urgency as any,
          estimatedCost: 15, // Default estimate
          bestStore: 'Grocery Store',
          reasoning
        };
      }
      return null;
    }

    // Update pattern with item info
    pattern.itemName = item.name;
    pattern.category = item.category;

    // Calculate predicted run-out date
    const adjustedConsumptionRate = pattern.dailyConsumptionRate * this.getSeasonalAdjustment(now) * this.getHouseholdAdjustment();
    const daysUntilRunOut = Math.max(0, item.currentCount / Math.max(adjustedConsumptionRate, 0.1));
    const predictedRunOutDate = new Date(now.getTime() + (daysUntilRunOut * 24 * 60 * 60 * 1000));

    // Calculate recommended restock date (restock before running out)
    const leadTimeDays = 2; // 2 days lead time for shopping
    const bufferDays = 1; // Extra buffer
    const recommendedRestockDate = new Date(predictedRunOutDate.getTime() - ((leadTimeDays + bufferDays) * 24 * 60 * 60 * 1000));

    // Determine urgency
    const daysUntilRecommendedRestock = (recommendedRestockDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    let urgency: 'low' | 'medium' | 'high' | 'critical';
    
    if (item.currentCount === 0) {
      urgency = 'critical';
    } else if (daysUntilRecommendedRestock <= 0) {
      urgency = 'high';
    } else if (daysUntilRecommendedRestock <= 2) {
      urgency = 'medium';
    } else {
      urgency = 'low';
    }

    // Calculate recommended quantity
    const weeksOfSupply = 2; // Target 2 weeks of supply
    const recommendedQuantity = Math.ceil(adjustedConsumptionRate * 7 * weeksOfSupply);

    // Estimate cost
    const averagePrice = pattern.priceHistory.length > 0 
      ? pattern.priceHistory.reduce((sum, price) => sum + price.price, 0) / pattern.priceHistory.length
      : 10; // Default price
    const estimatedCost = recommendedQuantity * averagePrice;

    // Find best store (lowest recent price)
    const recentPrices = pattern.priceHistory.filter(price => 
      (now.getTime() - price.date.getTime()) / (1000 * 60 * 60 * 24) <= 30 // Last 30 days
    );
    const bestStore = recentPrices.length > 0 
      ? recentPrices.reduce((best, current) => current.price < best.price ? current : best).store
      : 'Grocery Store';

    // Build reasoning
    reasoning.push(`Consumption rate: ${adjustedConsumptionRate.toFixed(2)} items/day`);
    reasoning.push(`Will run out: ${predictedRunOutDate.toLocaleDateString()}`);
    reasoning.push(`Confidence: ${Math.round(pattern.reliability * 100)}%`);
    
    if (urgency === 'critical') {
      reasoning.push('⚠️ OUT OF STOCK - Immediate restocking needed!');
    } else if (urgency === 'high') {
      reasoning.push('🔴 Restock window has passed - shop soon!');
    }

    return {
      itemId: item.id,
      itemName: item.name,
      category: item.category,
      currentStock: item.currentCount,
      predictedRunOutDate,
      recommendedRestockDate,
      recommendedQuantity,
      confidence: pattern.reliability,
      urgency,
      estimatedCost,
      bestStore,
      reasoning
    };
  }

  private getSeasonalAdjustment(date: Date): number {
    // Simple seasonal adjustment - could be enhanced
    const month = date.getMonth();
    
    // Higher consumption during winter months (comfort food)
    if (month >= 10 || month <= 2) return 1.1;
    
    // Summer months (more fresh food, less stored goods)
    if (month >= 5 && month <= 8) return 0.9;
    
    return 1.0;
  }

  private getHouseholdAdjustment(): number {
    // Adjust consumption based on household size
    const baseSize = 2;
    return this.householdProfile.householdSize / baseSize;
  }

  // Check if it's Friday and near end of day
  isFridayRestockTime(): boolean {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 5 = Friday
    const hour = now.getHours();
    
    // Friday after 6 PM
    return dayOfWeek === 5 && hour >= 18;
  }

  // Get items for weekly PDF list
  getWeeklyRestockList(pantryItems: any[]): RestockPrediction[] {
    const predictions = this.generateRestockPredictions(pantryItems);
    
    // Filter for items that need restocking within the next week
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    return predictions.filter(prediction => 
      prediction.urgency === 'critical' || 
      prediction.urgency === 'high' ||
      prediction.recommendedRestockDate <= nextWeek
    );
  }
}

// Singleton instance
export const predictiveRestockService = new PredictiveRestockService();