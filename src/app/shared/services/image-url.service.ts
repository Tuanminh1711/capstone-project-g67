import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ImageUrlService {
  private readonly defaultPlantImage = 'assets/image/default-plant.svg';
  private readonly localImagePrefix = 'assets/image/plants/';
  private readonly failedImages = new Set<string>(); // Track failed images to prevent loops

  constructor() {}

  /**
   * Get the appropriate image URL based on environment
   * @param imageUrl - The original image URL from backend
   * @param fallbackImage - Optional fallback image path
   * @returns Processed image URL
   */
  getImageUrl(imageUrl: string | null | undefined, fallbackImage?: string): string {
    // If no image URL provided, use fallback or default
    if (!imageUrl || imageUrl.trim() === '') {
      return fallbackImage || this.defaultPlantImage;
    }

    // If it's already a local asset path, return as-is
    if (imageUrl.startsWith('assets/')) {
      return imageUrl;
    }

    // If this image has already failed, return default immediately
    if (this.failedImages.has(imageUrl)) {
      return this.defaultPlantImage;
    }

    // If it's a full HTTP/HTTPS URL (Azure Blob), use as-is since avatar works fine
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }

    // If it's an API path (/api/user-plants/...), use it directly through proxy
    if (imageUrl.startsWith('/api/')) {
      return imageUrl;
    }

    // If it's a relative path or blob name, construct appropriate URL
    if (environment.production) {
      // In production, construct full Azure URL if needed
      return this.constructAzureUrl(imageUrl);
    } else {
      // In development, try to construct API path first
      return this.getLocalFallback(imageUrl);
    }
  }

  /**
   * Get multiple image URLs
   */
  getImageUrls(imageUrls: string[]): string[] {
    if (!imageUrls || imageUrls.length === 0) {
      return [this.defaultPlantImage];
    }
    
    return imageUrls.map(url => this.getImageUrl(url));
  }

  /**
   * Fix malformed Azure Blob URLs
   * Handles cases where URLs have incorrect path structure like:
   * user-plants%2F{id}.jpg%2F{realId}.jpg -> {realId}.jpg
   */
  private fixAzureBlobUrl(originalUrl: string): string {
    try {
      // If it's not an Azure blob URL, return as-is
      if (!originalUrl.includes('blob.core.windows.net')) {
        return originalUrl;
      }

      // Decode the entire URL first to handle %2F encoding
      const decodedUrl = decodeURIComponent(originalUrl);
      
      // URL processing for malformed Azure blob URLs
      
      const url = new URL(decodedUrl);
      const pathname = url.pathname; // Already decoded now
      
      // Check if the URL has malformed structure like /container/user-plants/{id}.jpg/{realId}.jpg
      if (pathname.includes('/user-plants/') && pathname.includes('.jpg/')) {
        // Detected malformed path structure
        
        // Split the path and find the real image filename
        const pathSegments = pathname.split('/').filter(s => s.length > 0);
        
        // Find the segment that looks like a UUID or real filename (usually the last one)
        let realImageName = '';
        for (let i = pathSegments.length - 1; i >= 0; i--) {
          const segment = pathSegments[i];
          // Look for segment that's a UUID-like string with extension or just has image extension
          if (segment.match(/^[a-f0-9\-]{36}\.(jpg|jpeg|png)$/i) || 
              segment.match(/\.(jpg|jpeg|png)$/i)) {
            realImageName = segment;
            break;
          }
        }
        
        if (realImageName) {
          const containerName = pathSegments[1] || 'plantcare-storage';
          const fixedUrl = `${url.protocol}//${url.host}/${containerName}/${realImageName}`;
          return fixedUrl;
        }
      }
      
      // Check if URL has avatars path structure (similar issue might exist)
      if (pathname.includes('/avatars/') && pathname.includes('.png/')) {
        // Detected malformed avatar path structure
        
        const pathSegments = pathname.split('/').filter(s => s.length > 0);
        let realImageName = '';
        
        for (let i = pathSegments.length - 1; i >= 0; i--) {
          const segment = pathSegments[i];
          if (segment.match(/^[a-f0-9\-]{36}\.(jpg|jpeg|png)$/i) || 
              segment.match(/\.(jpg|jpeg|png)$/i)) {
            realImageName = segment;
            break;
          }
        }
        
        if (realImageName) {
          const containerName = pathSegments[1] || 'plantcare-storage';
          const fixedUrl = `${url.protocol}//${url.host}/${containerName}/${realImageName}`;
          return fixedUrl;
        }
      }
      
      // If no issues found, return the decoded URL (which should work)
      return decodedUrl;
    } catch (error) {
      // Error fixing Azure URL
      return originalUrl;
    }
  }

  /**
   * Extract filename from URL and create simplified local path
   */
  private getLocalFallback(originalUrl: string): string {
    try {
      let filename: string;
      
      // Handle different URL formats
      if (originalUrl.includes('blob.core.windows.net')) {
        // Azure blob URL - extract the actual filename
        const urlPath = new URL(originalUrl).pathname;
        const segments = urlPath.split('/').filter(s => s.length > 0);
        
        // Get the last segment which should be the filename
        const lastSegment = segments[segments.length - 1];
        
        // If it contains URL-encoded path, decode and extract filename
        const decodedSegment = decodeURIComponent(lastSegment);
        const parts = decodedSegment.split('/');
        filename = parts[parts.length - 1];
        
        // Ensure filename has extension
        if (!filename.includes('.')) {
          filename += '.jpg'; // Default extension
        }
      } else if (originalUrl.startsWith('/api/')) {
        // API path - extract filename from path
        const pathParts = originalUrl.split('/');
        filename = pathParts[pathParts.length - 1];
      } else {
        // Direct filename or other format
        filename = originalUrl.split('/').pop() || 'unknown.jpg';
      }
      
      // Clean filename - remove any remaining path separators
      filename = filename.replace(/[\/\\]/g, '_');
      
      // Create simple local asset path
      const localPath = this.localImagePrefix + filename;
      
              // Using local fallback
        return localPath;
    } catch (error) {
      // Failed to create local fallback
      return this.defaultPlantImage;
    }
  }

  /**
   * Construct full Azure URL if needed
   */
  private constructAzureUrl(imagePath: string): string {
    if (imagePath.startsWith('https://')) {
      return this.fixAzureBlobUrl(imagePath);
    }
    
    // Clean the image path - remove any prefix paths that shouldn't be there
    let cleanImagePath = imagePath;
    
    // If the path includes user-plants prefix, extract just the filename
    if (cleanImagePath.includes('user-plants/')) {
      const parts = cleanImagePath.split('/');
      cleanImagePath = parts[parts.length - 1]; // Get the last part (filename)
    }
    
    // Remove any URL encoding
    cleanImagePath = decodeURIComponent(cleanImagePath);
    
    // Construct Azure blob URL with clean path
    const storageAccount = 'plantcarestorage';
    const containerName = 'plantcare-storage';
    const azureUrl = `https://${storageAccount}.blob.core.windows.net/${containerName}/${cleanImagePath}`;
    
    // Constructed Azure URL
    return azureUrl;
  }

  /**
   * Handle image load error - return fallback image and prevent loops
   */
  onImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    if (!imgElement) return;

    const failedUrl = imgElement.src;
    
    // Add failed URL to our tracking set
    this.failedImages.add(failedUrl);
    
    // Only change to default if not already showing default
    if (failedUrl !== this.defaultPlantImage) {
      imgElement.src = this.defaultPlantImage;
    }
  }

  /**
   * Check if image URL is accessible
   */
  async isImageAccessible(imageUrl: string): Promise<boolean> {
    try {
      const response = await fetch(imageUrl, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Clear the failed images cache
   */
  clearFailedImagesCache(): void {
    this.failedImages.clear();
    // Cleared failed images cache
  }

  /**
   * Get the default plant image path
   */
  getDefaultImage(): string {
    return this.defaultPlantImage;
  }

  /**
   * Check if running in development mode
   */
  isDevelopmentMode(): boolean {
    return !environment.production;
  }

  /**
   * Test method to verify URL fixing functionality
   */
  testUrlFix(): void {
    const testUrls = [
      "https://plantcarestorage.blob.core.windows.net/plantcare-storage/user-plants%2F247b2b19-4136-4820-90bb-ea3a77336656.jpg%2F642cf8e1-070b-47ad-ab9f-d390e85ed943.jpg",
      "https://plantcarestorage.blob.core.windows.net/plantcare-storage/avatars%2Feff03e0b-45fa-42a5-881c-e3764293f7ab.png%2F36611dc6-e451-4092-86a2-dceeeaba63a7.png",
      "https://plantcarestorage.blob.core.windows.net/plantcare-storage/cb638d67-1516-4f36-9a0f-eb4f2ad0d004.jpg",
      "user-plants/some-id.jpg/real-image.jpg"
    ];

    // Testing URL fixes
    testUrls.forEach(url => {
      const fixed = this.getImageUrl(url);
      // URL fix test completed
    });
  }
}
