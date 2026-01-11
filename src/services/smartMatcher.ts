// Smart Matching Service for Receipt OCR
// Matches OCR-extracted text against existing pantry items and shopping list
// Uses fuzzy string matching and optionally OpenAI for complex matches

import { apiService } from './api';
import type { GroceryItem } from './api';

export interface MatchResult {
  originalText: string;
  matchedName: string;
  confidence: number; // 0-100
  source: 'pantry' | 'shopping-list' | 'ocr-only' | 'ai-matched';
  matchedItem?: GroceryItem;
}

// Cache for pantry/shopping list items to avoid repeated API calls
let cachedPantryItems: GroceryItem[] | null = null;
let cachedShoppingList: GroceryItem[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 60000; // 1 minute cache

/**
 * Levenshtein distance for fuzzy string matching
 */
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  return dp[m][n];
}

/**
 * Calculate similarity score between two strings (0-100)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  // Exact match
  if (s1 === s2) return 100;
  
  // One contains the other
  if (s1.includes(s2) || s2.includes(s1)) {
    const containsScore = Math.min(s1.length, s2.length) / Math.max(s1.length, s2.length) * 100;
    return Math.max(containsScore, 70); // At least 70 if one contains the other
  }
  
  // Check if main words match (ignoring common modifiers)
  const ignoreWords = new Set(['the', 'a', 'an', 'organic', 'fresh', 'frozen', 'canned', 'dried', 'raw', 'cooked']);
  const words1 = s1.split(/\s+/).filter(w => !ignoreWords.has(w) && w.length > 2);
  const words2 = s2.split(/\s+/).filter(w => !ignoreWords.has(w) && w.length > 2);
  
  // Check for matching words
  const matchingWords = words1.filter(w1 => 
    words2.some(w2 => w1 === w2 || w1.includes(w2) || w2.includes(w1))
  );
  
  if (matchingWords.length > 0) {
    const wordMatchScore = (matchingWords.length / Math.max(words1.length, words2.length)) * 100;
    if (wordMatchScore >= 50) return wordMatchScore;
  }
  
  // Levenshtein-based similarity
  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 100;
  
  const distance = levenshteinDistance(s1, s2);
  const similarity = ((maxLen - distance) / maxLen) * 100;
  
  return Math.round(similarity);
}

/**
 * Normalize item name for better matching
 * Handles common OCR errors and variations
 */
function normalizeItemName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ')
    .trim()
    // Common OCR error corrections
    .replace(/\boats?\b/g, 'oats')
    .replace(/\bbutter\b/g, 'butter')
    .replace(/\bbutler\b/g, 'butter') // OCR error
    .replace(/\baarut\b/g, 'peanut') // OCR error
    .replace(/\baarut butler\b/g, 'peanut butter')
    .replace(/\bquik\b/g, 'quick')
    .replace(/\bolve\b/g, 'olive')
    .replace(/\bvnegar\b/g, 'vinegar')
    .replace(/\bvinager\b/g, 'vinegar')
    .replace(/\bchiken\b/g, 'chicken')
    .replace(/\bchicen\b/g, 'chicken')
    .replace(/\bbean\b/g, 'beans')
    .replace(/\blamon\b/g, 'lemon')
    .replace(/\bsaan\b/g, 'beans') // OCR error for "Bean"
    .replace(/\boninon\b/g, 'onion')
    .replace(/\bonoin\b/g, 'onion');
}

/**
 * Refresh the cache of pantry items and shopping list
 */
async function refreshCache(): Promise<void> {
  const now = Date.now();
  if (cachedPantryItems && cachedShoppingList && now - cacheTimestamp < CACHE_DURATION) {
    return; // Cache is still valid
  }
  
  try {
    console.log('🔄 Refreshing pantry/shopping list cache...');
    const [pantry, shoppingList] = await Promise.all([
      apiService.getGroceries().catch(() => []),
      apiService.getShoppingList().catch(() => [])
    ]);
    
    cachedPantryItems = pantry;
    cachedShoppingList = shoppingList;
    cacheTimestamp = now;
    
    console.log(`📦 Cached ${pantry.length} pantry items and ${shoppingList.length} shopping list items`);
  } catch (error) {
    console.error('Failed to refresh cache:', error);
    // Keep existing cache if available
    if (!cachedPantryItems) cachedPantryItems = [];
    if (!cachedShoppingList) cachedShoppingList = [];
  }
}

/**
 * Find the best match for an OCR-extracted item name
 */
function findBestMatch(ocrText: string, items: GroceryItem[]): { item: GroceryItem; score: number } | null {
  if (items.length === 0) return null;
  
  const normalizedOcr = normalizeItemName(ocrText);
  let bestMatch: GroceryItem | null = null;
  let bestScore = 0;
  
  for (const item of items) {
    const normalizedItem = normalizeItemName(item.name);
    const score = calculateSimilarity(normalizedOcr, normalizedItem);
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = item;
    }
    
    // Also check individual words for partial matches
    const ocrWords = normalizedOcr.split(' ');
    const itemWords = normalizedItem.split(' ');
    
    for (const ocrWord of ocrWords) {
      if (ocrWord.length < 3) continue;
      for (const itemWord of itemWords) {
        if (itemWord.length < 3) continue;
        const wordScore = calculateSimilarity(ocrWord, itemWord);
        if (wordScore > 80 && wordScore > bestScore * 0.8) {
          // Strong word match gives a boost
          const boostedScore = Math.min(100, score + 20);
          if (boostedScore > bestScore) {
            bestScore = boostedScore;
            bestMatch = item;
          }
        }
      }
    }
  }
  
  return bestMatch ? { item: bestMatch, score: bestScore } : null;
}

/**
 * Check if OpenAI API key is configured
 */
function getOpenAIKey(): string | null {
  return (import.meta.env.VITE_OPENAI_API_KEY as string) || 
         (window as any).OPENAI_API_KEY || 
         localStorage.getItem('openai_api_key') ||
         null;
}

/**
 * Use OpenAI to intelligently clean and match OCR text
 * This is the primary matching method when API key is available
 */
async function smartMatchWithOpenAI(
  ocrItems: Array<{ name: string; quantity: number; unit: string; category: string }>,
  knownItems: string[]
): Promise<Array<{ originalName: string; cleanedName: string; matchedTo: string | null; category: string; confidence: number }>> {
  const apiKey = getOpenAIKey();
  
  if (!apiKey) {
    console.log('⚠️ OpenAI API key not configured, using fuzzy matching only');
    return [];
  }
  
  try {
    console.log('🤖 Using OpenAI for smart matching...');
    console.log(`   Processing ${ocrItems.length} OCR items against ${knownItems.length} known items`);
    
    const hasKnownItems = knownItems.length > 0;
    
    const systemPrompt = hasKnownItems 
      ? `You are an expert grocery receipt OCR processor. Your job is to:
1. Clean up OCR errors in item names (e.g., "aarut butler" → "Peanut Butter", "Quick oats $17%" → "Quick Oats")
2. Match items to known inventory when possible
3. Categorize items appropriately

Known inventory items: ${knownItems.slice(0, 100).join(', ')}${knownItems.length > 100 ? '...' : ''}

For each OCR item, return:
- cleanedName: The corrected/cleaned item name (proper capitalization, no prices/junk)
- matchedTo: The EXACT name from known items if it matches, or null if no match
- category: One of: Fresh Produce, Dairy & Eggs, Meat & Seafood, Pantry Staples, Bakery, Beverages, Frozen Foods, Snacks, Household, Personal Care, Other
- confidence: 0-100 how confident you are in the match/cleanup`
      : `You are an expert grocery receipt OCR processor. Your job is to:
1. Clean up OCR errors in item names (e.g., "aarut butler" → "Peanut Butter", "Quick oats $17%" → "Quick Oats", "chiken" → "Chicken")
2. Remove prices, percentages, and junk characters
3. Categorize items appropriately

For each OCR item, return:
- cleanedName: The corrected/cleaned item name (proper capitalization, no prices/junk)
- matchedTo: null (no known inventory to match against)
- category: One of: Fresh Produce, Dairy & Eggs, Meat & Seafood, Pantry Staples, Bakery, Beverages, Frozen Foods, Snacks, Household, Personal Care, Other
- confidence: 0-100 how confident you are in the cleanup`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Process these OCR-extracted receipt items:\n${ocrItems.map((item, i) => `${i + 1}. "${item.name}"`).join('\n')}\n\nReturn JSON array: [{"originalName": "...", "cleanedName": "...", "matchedTo": "..." or null, "category": "...", "confidence": 0-100}, ...]`
          }
        ],
        temperature: 0.2,
        max_tokens: 1500
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      return [];
    }
    
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    console.log('🤖 OpenAI response received');
    
    // Parse JSON response - handle both array and object formats
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      console.log(`🤖 AI processed ${parsed.length} items`);
      return parsed;
    }
    
    // Try object format with "items" key
    const objMatch = content.match(/\{[\s\S]*\}/);
    if (objMatch) {
      const parsed = JSON.parse(objMatch[0]);
      if (Array.isArray(parsed.items)) {
        console.log(`🤖 AI processed ${parsed.items.length} items`);
        return parsed.items;
      }
    }
    
    console.warn('⚠️ Could not parse OpenAI response:', content.substring(0, 200));
  } catch (error) {
    console.error('OpenAI smart matching failed:', error);
  }
  
  return [];
}

/**
 * Legacy function for backward compatibility - now uses smartMatchWithOpenAI
 */
async function matchWithOpenAI(
  ocrItems: string[],
  knownItems: string[]
): Promise<Map<string, string>> {
  // Convert to new format and call smart match
  const items = ocrItems.map(name => ({ name, quantity: 1, unit: 'units', category: 'Other' }));
  const results = await smartMatchWithOpenAI(items, knownItems);
  
  const matches = new Map<string, string>();
  for (const result of results) {
    if (result.matchedTo) {
      matches.set(result.originalName, result.matchedTo);
    } else if (result.cleanedName !== result.originalName) {
      matches.set(result.originalName, result.cleanedName);
    }
  }
  
  return matches;
}

/**
 * Main function: Match OCR-extracted items against known inventory
 * Uses OpenAI as the PRIMARY method when available, with fuzzy matching as fallback
 */
export async function matchReceiptItems(
  ocrItems: Array<{ name: string; quantity: number; unit: string; category: string }>
): Promise<Array<{ name: string; quantity: number; unit: string; category: string; confidence: number; source: string; originalName?: string }>> {
  console.log('🧠 Starting smart matching for', ocrItems.length, 'items');
  
  // Refresh cache to get latest pantry/shopping list
  await refreshCache();
  
  // Combine pantry and shopping list for matching
  const allKnownItems = [...(cachedPantryItems || []), ...(cachedShoppingList || [])];
  const knownItemNames = allKnownItems.map(item => item.name);
  
  console.log(`📋 Matching against ${allKnownItems.length} known items`);
  
  // Check if OpenAI is available
  const hasOpenAI = !!getOpenAIKey();
  
  if (hasOpenAI) {
    console.log('🤖 OpenAI API key detected - using AI-powered matching');
    
    // PRIMARY: Use OpenAI for ALL items (best accuracy)
    const aiResults = await smartMatchWithOpenAI(ocrItems, knownItemNames);
    
    if (aiResults.length > 0) {
      // Successfully got AI results - use them
      const results: Array<{ name: string; quantity: number; unit: string; category: string; confidence: number; source: string; originalName?: string }> = [];
      
      for (let i = 0; i < ocrItems.length; i++) {
        const ocrItem = ocrItems[i];
        const aiResult = aiResults[i];
        
        if (aiResult) {
          // AI processed this item
          const matchedToInventory = aiResult.matchedTo && allKnownItems.find(
            item => item.name.toLowerCase() === aiResult.matchedTo!.toLowerCase()
          );
          
          if (matchedToInventory) {
            // Matched to existing inventory item
            console.log(`🤖 AI matched "${ocrItem.name}" → "${matchedToInventory.name}" (${aiResult.confidence}% confidence)`);
            results.push({
              name: matchedToInventory.name,
              quantity: ocrItem.quantity,
              unit: matchedToInventory.unit || ocrItem.unit,
              category: matchedToInventory.category,
              confidence: aiResult.confidence,
              source: 'ai-matched',
              originalName: ocrItem.name !== matchedToInventory.name ? ocrItem.name : undefined
            });
          } else {
            // AI cleaned the name but no inventory match
            const cleanedName = aiResult.cleanedName || ocrItem.name;
            console.log(`🧹 AI cleaned "${ocrItem.name}" → "${cleanedName}" (category: ${aiResult.category})`);
            results.push({
              name: cleanedName,
              quantity: ocrItem.quantity,
              unit: ocrItem.unit,
              category: aiResult.category || ocrItem.category,
              confidence: aiResult.confidence,
              source: 'ai-cleaned',
              originalName: ocrItem.name !== cleanedName ? ocrItem.name : undefined
            });
          }
        } else {
          // AI didn't return a result for this item, use fuzzy matching fallback
          const result = fuzzyMatchItem(ocrItem, allKnownItems);
          results.push(result);
        }
      }
      
      return results;
    }
    
    console.log('⚠️ OpenAI returned no results, falling back to fuzzy matching');
  }
  
  // FALLBACK: Fuzzy string matching (when OpenAI is not available or fails)
  console.log('🔍 Using fuzzy string matching');
  
  const results: Array<{ name: string; quantity: number; unit: string; category: string; confidence: number; source: string; originalName?: string }> = [];
  
  for (const ocrItem of ocrItems) {
    const result = fuzzyMatchItem(ocrItem, allKnownItems);
    results.push(result);
  }
  
  return results;
}

/**
 * Fuzzy match a single OCR item against known items
 */
function fuzzyMatchItem(
  ocrItem: { name: string; quantity: number; unit: string; category: string },
  allKnownItems: GroceryItem[]
): { name: string; quantity: number; unit: string; category: string; confidence: number; source: string; originalName?: string } {
  // Try to find a match in known items
  const pantryMatch = findBestMatch(ocrItem.name, cachedPantryItems || []);
  const shoppingMatch = findBestMatch(ocrItem.name, cachedShoppingList || []);
  
  // Use the better match
  let bestMatch = pantryMatch;
  let source = 'pantry';
  
  if (shoppingMatch && (!pantryMatch || shoppingMatch.score > pantryMatch.score)) {
    bestMatch = shoppingMatch;
    source = 'shopping-list';
  }
  
  if (bestMatch && bestMatch.score >= 60) {
    // Good match found
    console.log(`✅ Fuzzy matched "${ocrItem.name}" → "${bestMatch.item.name}" (${bestMatch.score}% confidence, ${source})`);
    return {
      name: bestMatch.item.name,
      quantity: ocrItem.quantity,
      unit: bestMatch.item.unit || ocrItem.unit,
      category: bestMatch.item.category || ocrItem.category,
      confidence: bestMatch.score,
      source,
      originalName: ocrItem.name !== bestMatch.item.name ? ocrItem.name : undefined
    };
  }
  
  // No good match - apply OCR corrections
  const corrected = applyOcrCorrections(ocrItem.name);
  if (corrected !== ocrItem.name) {
    console.log(`🔧 OCR correction: "${ocrItem.name}" → "${corrected}"`);
    return {
      ...ocrItem,
      name: corrected,
      confidence: 50,
      source: 'ocr-corrected',
      originalName: ocrItem.name
    };
  }
  
  // Return original with low confidence
  return {
    ...ocrItem,
    confidence: bestMatch ? bestMatch.score : 0,
    source: 'ocr-only',
    originalName: ocrItem.name
  };
}

/**
 * Apply common OCR error corrections
 */
function applyOcrCorrections(text: string): string {
  // Common OCR errors → corrections
  const corrections: [RegExp, string][] = [
    [/\baarut\s*butler\b/gi, 'Peanut Butter'],
    [/\baarut\s*butter\b/gi, 'Peanut Butter'],
    [/\bpearut\s*butter\b/gi, 'Peanut Butter'],
    [/\bquick\s*oats?\s*\$?\d+%?/gi, 'Quick Oats'],
    [/\bquik\s*oats?\b/gi, 'Quick Oats'],
    [/\bchiken\b/gi, 'Chicken'],
    [/\bchicen\b/gi, 'Chicken'],
    [/\bolve\s*oil\b/gi, 'Olive Oil'],
    [/\bolive\s*oil\s*&?\s*v[io]ne?gar\b/gi, 'Olive Oil & Vinegar'],
    [/\bvnegar\b/gi, 'Vinegar'],
    [/\bvinager\b/gi, 'Vinegar'],
    [/\blamon\b/gi, 'Lemon'],
    [/\bsaan\b/gi, 'Beans'],
    [/\bbea[nm]\s*\(?\s*green\s*\)?/gi, 'Green Beans'],
    [/\bonoin\b/gi, 'Onion'],
    [/\boninon\b/gi, 'Onion'],
    // Clean up price artifacts
    [/\s*\$\d+\.?\d*%?\s*$/g, ''],
    [/\s*\d+%\s*$/g, ''],
    // Clean up weird characters
    [/[^\w\s&()-]/g, ''],
  ];
  
  let result = text;
  for (const [pattern, replacement] of corrections) {
    result = result.replace(pattern, replacement);
  }
  
  // Proper case the result
  result = result.trim();
  if (result && result === result.toLowerCase()) {
    result = result.charAt(0).toUpperCase() + result.slice(1);
  }
  
  return result;
}

/**
 * Force refresh the cache (useful when pantry is updated)
 */
export function clearMatcherCache(): void {
  cachedPantryItems = null;
  cachedShoppingList = null;
  cacheTimestamp = 0;
  console.log('🗑️ Smart matcher cache cleared');
}
