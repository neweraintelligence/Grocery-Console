const API_BASE_URL = 'http://localhost:3001/api';

export interface GroceryItem {
  id?: string;
  name: string;
  category: string;
  currentCount: number;
  minCount: number;
  unit: string;
  lastUpdated?: string;
  notes?: string;
}

export interface ShoppingListItem extends GroceryItem {
  needed: number;
}

class ApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Grocery items
  async getGroceries(): Promise<GroceryItem[]> {
    return this.request<GroceryItem[]>('/groceries');
  }

  async addGrocery(item: Omit<GroceryItem, 'id' | 'lastUpdated'>): Promise<void> {
    await this.request('/groceries', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  }

  async updateGrocery(id: string, item: Omit<GroceryItem, 'id' | 'lastUpdated'>): Promise<void> {
    await this.request(`/groceries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(item),
    });
  }

  async deleteGrocery(id: string): Promise<void> {
    await this.request(`/groceries/${id}`, {
      method: 'DELETE',
    });
  }

  // Shopping list
  async getShoppingList(): Promise<ShoppingListItem[]> {
    return this.request<ShoppingListItem[]>('/shopping-list');
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string; googleSheetsConnected: boolean }> {
    return this.request('/health');
  }
}

export const apiService = new ApiService();