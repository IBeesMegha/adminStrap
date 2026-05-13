// Media Library Types and API helpers

export interface MediaAsset {
  id: string;
  name: string;
  alternativeText?: string;
  caption?: string;
  url: string;
  mime: string;
  size: number; // in bytes
  width?: number;
  height?: number;
  ext: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UploadMediaParams {
  file?: File;
  url?: string;
  name: string;
  alternativeText?: string;
  caption?: string;
}

// API functions for media management
export const mediaApi = {
  // Get all media assets
  async getAll(): Promise<MediaAsset[]> {
    const response = await fetch('/api/media');
    if (!response.ok) throw new Error('Failed to fetch media');
    return response.json();
  },

  // Upload media from file
  async upload(params: UploadMediaParams): Promise<MediaAsset> {
    const formData = new FormData();
    
    if (params.file) {
      formData.append('file', params.file);
    } else if (params.url) {
      formData.append('url', params.url);
    }
    
    formData.append('name', params.name);
    if (params.alternativeText) formData.append('alternativeText', params.alternativeText);
    if (params.caption) formData.append('caption', params.caption);

    const response = await fetch('/api/media', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) throw new Error('Failed to upload media');
    return response.json();
  },

  // Update media details
  async update(id: string, data: Partial<MediaAsset>): Promise<MediaAsset> {
    const response = await fetch(`/api/media/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error('Failed to update media');
    return response.json();
  },

  // Delete media
  async delete(id: string): Promise<void> {
    const response = await fetch(`/api/media/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) throw new Error('Failed to delete media');
  },
};
