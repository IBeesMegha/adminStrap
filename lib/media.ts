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
  folder?: string; // Folder path for organizing media
  createdAt: Date;
  updatedAt: Date;
}

export interface UploadMediaParams {
  file?: File;
  url?: string;
  name: string;
  alternativeText?: string;
  caption?: string;
  folder?: string; // Folder path for organizing media
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
    try {
      const formData = new FormData();
      
      if (params.file) {
        formData.append('file', params.file);
      } else if (params.url) {
        formData.append('url', params.url);
      }
      
      formData.append('name', params.name);
      if (params.alternativeText) formData.append('alternativeText', params.alternativeText);
      if (params.caption) formData.append('caption', params.caption);
      if (params.folder) formData.append('folder', params.folder);

      console.log('[mediaApi] Uploading with params:', {
        name: params.name,
        folder: params.folder,
        hasFile: !!params.file,
        hasUrl: !!params.url,
      });

      const response = await fetch('/api/media', {
        method: 'POST',
        body: formData,
      });

      console.log('[mediaApi] Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[mediaApi] Error response:', errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || 'Unknown error' };
        }
        
        throw new Error(errorData.error || `Upload failed with status ${response.status}`);
      }
      
      const responseText = await response.text();
      console.log('[mediaApi] Response text:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('[mediaApi] Failed to parse response:', parseError);
        throw new Error('Invalid response from server');
      }
      
      console.log('[mediaApi] Upload successful, data:', data);
      return data;
    } catch (error: any) {
      console.error('[mediaApi] Upload error:', error);
      throw error;
    }
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
