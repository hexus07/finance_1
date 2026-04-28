const API_BASE_URL = 'http://localhost:8000';

class APIClient {
  constructor() {
    this.token = localStorage.getItem('token');
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || response.statusText);
    }

    return response.json();
  }

  // Auth endpoints
  async register(email, password, name) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
  }

  async login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  // Transaction endpoints
  async getTransactions(limit = 50, offset = 0) {
    return this.request(`/transactions?limit=${limit}&offset=${offset}`);
  }

  async createTransaction(data) {
    return this.request('/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTransaction(id, data) {
    return this.request(`/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTransaction(id) {
    return this.request(`/transactions/${id}`, { method: 'DELETE' });
  }

  // Asset endpoints
  async getAssets() {
    return this.request('/assets');
  }

  async createAsset(data) {
    return this.request('/assets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAsset(id, data) {
    return this.request(`/assets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAsset(id) {
    return this.request(`/assets/${id}`, { method: 'DELETE' });
  }

  // Budget and Savings endpoints
async updateBudget(monthlyBudget) {
  return this.request('/auth/me/budget', {
    method: 'PUT',
    body: JSON.stringify({ monthly_budget: monthlyBudget }),
  });
}

async updateSavingsGoal(savingsGoal, description = null) {
  return this.request('/auth/me/savings-goal', {
    method: 'PUT',
    body: JSON.stringify({ 
      savings_goal: savingsGoal,
      savings_goal_description: description
    }),
  });
}
async addToSavings(amount) {
  return this.request('/auth/me/add-to-savings', {
    method: 'POST',
    body: JSON.stringify({ amount }),
  });
}
async refreshAssetPrices() {
  return this.request('/assets/refresh-prices', {
    method: 'POST',
  });
}

async withdrawFromSavings(amount) {
  return this.request('/auth/me/withdraw-from-savings', {  
    method: 'POST',
    body: JSON.stringify({ amount }),
  });
}
async getPortfolioGrowth(days = 7) {
  return this.request(`/assets/portfolio-growth?days=${days}`);
}
}




export const api = new APIClient();

