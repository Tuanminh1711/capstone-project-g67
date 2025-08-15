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

    // If it's a full HTTP/HTTPS URL (Azure Blob), use it directly in both dev and prod
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      console.log('🌐 Using Azure URL directly:', imageUrl);
      return imageUrl;
    }

    // If it's an API path (/api/user-plants/...), use it directly through proxy
    if (imageUrl.startsWith('/api/')) {
      console.log('🔗 Using API URL through proxy:', imageUrl);
      return imageUrl;
    }

    // If it's a relative path or blob name, construct appropriate URL
    if (environment.production) {
      // In production, construct full Azure URL if needed
      return this.constructAzureUrl(imageUrl);
    } else {
      // In development, try to construct API path first
      console.log('🔄 Creating fallback for:', imageUrl);
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
      
      console.log(`🔄 Using local fallback: ${originalUrl} → ${localPath}`);
      return localPath;
    } catch (error) {
      console.warn('Failed to create local fallback for:', originalUrl, error);
      return this.defaultPlantImage;
    }
  }

  /**
   * Construct full Azure URL if needed
   */
  private constructAzureUrl(imagePath: string): string {
    if (imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    // Construct Azure blob URL (adjust based on your storage account)
    const storageAccount = 'plantcarestorage';
    const containerName = 'plantcare-storage';
    return `https://${storageAccount}.blob.core.windows.net/${containerName}/${imagePath}`;
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
      console.warn('Image failed to load:', failedUrl);
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
    console.log('🧹 Cleared failed images cache');
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
}
