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
 * Use OpenAI to match OCR text to known items (optional enhancement)
 */
async function matchWithOpenAI(
  ocrItems: string[],
  knownItems: string[]
): Promise<Map<string, string>> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY || 
                 (window as any).OPENAI_API_KEY || 
                 localStorage.getItem('openai_api_key');
  
  if (!apiKey) {
    console.log('⚠️ OpenAI API key not configured, skipping AI matching');
    return new Map();
  }
  
  try {
    console.log('🤖 Using OpenAI to match OCR items...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a grocery item matcher. Given OCR-extracted text from a receipt and a list of known grocery items, match each OCR item to the most likely known item.

Rules:
- Only match if you're confident (>70% sure)
- Account for OCR errors (e.g., "aarut butler" = "peanut butter", "Quick oats $17%" = "Quick Oats")
- Ignore prices, quantities, and special characters
- Return JSON object mapping OCR text to matched item name, or null if no confident match

Known items: ${knownItems.join(', ')}`
          },
          {
            role: 'user',
            content: `Match these OCR items:\n${ocrItems.map((item, i) => `${i + 1}. "${item}"`).join('\n')}\n\nReturn JSON: {"matches": {"ocr_text": "matched_item_or_null", ...}}`
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      })
    });
    
    if (!response.ok) {
      console.error('OpenAI API error:', response.status);
      return new Map();
    }
    
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      const matches = new Map<string, string>();
      
      if (parsed.matches) {
        for (const [ocr, matched] of Object.entries(parsed.matches)) {
          if (matched && matched !== 'null') {
            matches.set(ocr, matched as string);
          }
        }
      }
      
      console.log(`🤖 AI matched ${matches.size}/${ocrItems.length} items`);
      return matches;
    }
  } catch (error) {
    console.error('OpenAI matching failed:', error);
  }
  
  return new Map();
}

/**
 * Main function: Match OCR-extracted items against known inventory
 */
export async function matchReceiptItems(
  ocrItems: Array<{ name: string; quantity: number; unit: string; category: string }>
): Promise<Array<{ name: string; quantity: number; unit: string; category: string; confidence: number; source: string; originalName?: string }>> {
  console.log('🧠 Starting smart matching for', ocrItems.length, 'items');
  
  // Refresh cache
  await refreshCache();
  
  // Combine pantry and shopping list for matching
  const allKnownItems = [...(cachedPantryItems || []), ...(cachedShoppingList || [])];
  const knownItemNames = allKnownItems.map(item => item.name);
  
  console.log(`📋 Matching against ${allKnownItems.length} known items`);
  
  // First pass: fuzzy string matching
  const results: Array<{ name: string; quantity: number; unit: string; category: string; confidence: number; source: string; originalName?: string }> = [];
  const unmatchedItems: string[] = [];
  
  for (const ocrItem of ocrItems) {
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
      console.log(`✅ Matched "${ocrItem.name}" → "${bestMatch.item.name}" (${bestMatch.score}% confidence, ${source})`);
      results.push({
        name: bestMatch.item.name,
        quantity: ocrItem.quantity,
        unit: bestMatch.item.unit || ocrItem.unit,
        category: bestMatch.item.category || ocrItem.category,
        confidence: bestMatch.score,
        source,
        originalName: ocrItem.name !== bestMatch.item.name ? ocrItem.name : undefined
      });
    } else {
      // No good match, keep for AI matching or use original
      unmatchedItems.push(ocrItem.name);
      results.push({
        ...ocrItem,
        confidence: bestMatch ? bestMatch.score : 0,
        source: 'ocr-only',
        originalName: ocrItem.name
      });
    }
  }
  
  // Second pass: AI matching for unmatched items (if API key is available)
  if (unmatchedItems.length > 0 && knownItemNames.length > 0) {
    const aiMatches = await matchWithOpenAI(unmatchedItems, knownItemNames);
    
    // Update results with AI matches
    for (let i = 0; i < results.length; i++) {
      if (results[i].source === 'ocr-only' && aiMatches.has(results[i].originalName || results[i].name)) {
        const matchedName = aiMatches.get(results[i].originalName || results[i].name)!;
        const matchedItem = allKnownItems.find(item => 
          item.name.toLowerCase() === matchedName.toLowerCase()
        );
        
        if (matchedItem) {
          console.log(`🤖 AI matched "${results[i].name}" → "${matchedItem.name}"`);
          results[i] = {
            ...results[i],
            name: matchedItem.name,
            category: matchedItem.category,
            unit: matchedItem.unit,
            confidence: 85,
            source: 'ai-matched'
          };
        }
      }
    }
  }
  
  // Apply OCR error corrections to remaining unmatched items
  for (let i = 0; i < results.length; i++) {
    if (results[i].source === 'ocr-only') {
      const corrected = applyOcrCorrections(results[i].name);
      if (corrected !== results[i].name) {
        console.log(`🔧 OCR correction: "${results[i].name}" → "${corrected}"`);
        results[i].originalName = results[i].name;
        results[i].name = corrected;
        results[i].confidence = 50;
      }
    }
  }
  
  return results;
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
