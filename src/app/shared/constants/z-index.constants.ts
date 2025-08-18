/**
 * STANDARDIZED Z-INDEX CONSTANTS
 * 
 * Centralized z-index management to prevent layer conflicts
 * Use these constants instead of hardcoded z-index values
 */

export const ZIndex = {
  // BASE CONTENT LAYERS (0-9)
  BASE: 0,
  CONTENT: 1,
  CONTENT_OVERLAY: 2,
  NAVIGATION: 3,

  // UI COMPONENT LAYERS (10-99)
  UI_BASE: 10,
  UI_ELEVATED: 20,
  UI_FLOATING: 30,
  UI_STICKY: 40,
  UI_FIXED: 50,

  // OVERLAY & DROPDOWN LAYERS (100-999)
  DROPDOWN: 100,
  DROPDOWN_ELEVATED: 200,
  TOOLTIP: 300,
  POPOVER: 400,
  OVERLAY: 500,
  TOP_NAV: 600,
  TOP_NAV_DROPDOWN: 700,

  // MODAL & DIALOG LAYERS (1000-9999)
  MODAL_BACKDROP: 1000,
  MODAL: 1100,
  MODAL_ELEVATED: 1200,
  DIALOG_BACKDROP: 1300,
  DIALOG: 1400,
  DIALOG_ELEVATED: 1500,

  // NOTIFICATION & TOAST LAYERS (3000-3999)
  NOTIFICATION: 3000,
  TOAST: 3100,
  ALERT: 3200,

  // FLOATING ACTION & CHAT LAYERS (9000-9999) - Above everything except dialogs
  FAB: 9999,
  CHAT_WIDGET: 9998,
  CHAT_OVERLAY: 9997,

  // SYSTEM CRITICAL LAYERS (10000+)
  AUTH_BACKDROP: 10000,
  AUTH_DIALOG: 10100,
  EMERGENCY: 10200,
  DEBUG: 10300
} as const;

export type ZIndexLayer = typeof ZIndex[keyof typeof ZIndex];

/**
 * Helper functions for z-index management
 */
export const ZIndexHelper = {
  /**
   * Get z-index for a specific layer
   */
  getLayer: (layer: keyof typeof ZIndex): number => {
    return ZIndex[layer];
  },

  /**
   * Check if one layer is above another
   */
  isAbove: (layer1: keyof typeof ZIndex, layer2: keyof typeof ZIndex): boolean => {
    return ZIndex[layer1] > ZIndex[layer2];
  },

  /**
   * Get CSS z-index string
   */
  toCss: (layer: keyof typeof ZIndex): string => {
    return `z-index: ${ZIndex[layer]};`;
  }
};
