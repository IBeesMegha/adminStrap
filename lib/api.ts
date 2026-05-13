// API utility functions for frontend

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'API request failed');
    }

    return response.json();
  }

  // Collection Types
  async getCollectionTypes() {
    return this.request('/collection-types');
  }

  async getCollectionType(name: string) {
    return this.request(`/collection-types/${name}`);
  }

  async createCollectionType(data: any) {
    return this.request('/collection-types', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCollectionType(name: string, data: any) {
    return this.request(`/collection-types/${name}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCollectionType(name: string) {
    return this.request(`/collection-types/${name}`, {
      method: 'DELETE',
    });
  }

  // Collection Entries
  async getCollectionEntries(collectionName: string) {
    return this.request(`/collections/${collectionName}`);
  }

  async getCollectionEntry(collectionName: string, id: string) {
    return this.request(`/collections/${collectionName}/${id}`);
  }

  async createCollectionEntry(collectionName: string, data: any) {
    return this.request(`/collections/${collectionName}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCollectionEntry(
    collectionName: string,
    id: string,
    data: any
  ) {
    return this.request(`/collections/${collectionName}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCollectionEntry(collectionName: string, id: string) {
    return this.request(`/collections/${collectionName}/${id}`, {
      method: 'DELETE',
    });
  }

  // Single Types
  async getSingleTypes() {
    return this.request('/single-types');
  }

  async getSingleType(name: string) {
    return this.request(`/single-types/${name}`);
  }

  async createSingleType(data: any) {
    return this.request('/single-types', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSingleType(name: string, data: any) {
    return this.request(`/single-types/${name}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteSingleType(name: string) {
    return this.request(`/single-types/${name}`, {
      method: 'DELETE',
    });
  }

  // Components
  async getComponents() {
    return this.request('/components');
  }

  async getComponent(name: string) {
    return this.request(`/components/${name}`);
  }

  async createComponent(data: any) {
    return this.request('/components', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateComponent(name: string, data: any) {
    return this.request(`/components/${name}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteComponent(name: string) {
    return this.request(`/components/${name}`, {
      method: 'DELETE',
    });
  }
}

// Export singleton instance
export const api = new ApiClient();
