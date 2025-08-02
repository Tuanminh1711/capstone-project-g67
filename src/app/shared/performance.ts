// Performance optimization utilities

import { ChangeDetectionStrategy, TrackByFunction } from '@angular/core';

/**
 * Generic trackBy function for arrays with id property
 */
export const trackById: TrackByFunction<any> = (index: number, item: any) => 
  item?.id ?? index;

/**
 * TrackBy function for messages/chat
 */
export const trackByMessageId: TrackByFunction<any> = (index: number, message: any) => 
  message?.id ?? message?.timestamp ?? index;

/**
 * TrackBy function for plants
 */
export const trackByPlantId: TrackByFunction<any> = (index: number, plant: any) => 
  plant?.id ?? plant?.plantId ?? index;

/**
 * TrackBy function for categories
 */
export const trackByCategoryId: TrackByFunction<any> = (index: number, category: any) => 
  category?.id ?? category?.categoryId ?? index;

/**
 * Debounce decorator for methods
 */
export function Debounce(delay: number = 300) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    let timeout: any;
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      clearTimeout(timeout);
      timeout = setTimeout(() => originalMethod.apply(this, args), delay);
    };

    return descriptor;
  };
}

/**
 * OnPush change detection strategy constant
 */
export const ON_PUSH = ChangeDetectionStrategy.OnPush;

/**
 * Image loading optimization
 */
export const IMAGE_LOADING_CONFIG = {
  loading: 'lazy' as const,
  decoding: 'async' as const
};

/**
 * Virtual scrolling item size
 */
export const VIRTUAL_SCROLL_ITEM_SIZE = 50;

/**
 * Performance monitoring
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  
  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  markStart(name: string): void {
    if (typeof performance !== 'undefined') {
      performance.mark(`${name}-start`);
    }
  }

  markEnd(name: string): void {
    if (typeof performance !== 'undefined') {
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);
    }
  }

  logMeasures(): void {
    if (typeof performance !== 'undefined') {
      const measures = performance.getEntriesByType('measure');
      console.table(measures.map(m => ({
        name: m.name,
        duration: `${m.duration.toFixed(2)}ms`
      })));
    }
  }
}
