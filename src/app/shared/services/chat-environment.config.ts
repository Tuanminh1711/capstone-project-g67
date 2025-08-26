/**
 * Chat Environment Configuration
 * Quản lý cấu hình chat cho cả môi trường local và production
 */

export interface ChatEnvironmentConfig {
  // API Endpoints
  endpoints: {
    conversations: string;
    experts: string;
    history: string;
    privateMessages: string;
    markRead: string;
    userDetail: string; // Thêm endpoint cho user detail
  };
  
  // WebSocket Configuration
  websocket: {
    communityTopic: string;
    privateQueue: string;
    errorQueue: string;
  };
  
  // Fallback Configuration
  fallback: {
    enableMockData: boolean;
    mockExpertsCount: number;
    retryAttempts: number;
    retryDelay: number;
  };
  
  // Environment Detection
  environment: {
    isProduction: boolean;
    isDevelopment: boolean;
    apiBaseUrl: string;
  };
}

/**
 * Development Environment Configuration
 */
export const DEV_CHAT_CONFIG: ChatEnvironmentConfig = {
  endpoints: {
    conversations: '/api/chat/mess/conversations',
    experts: '/api/chat/mess/experts',
    history: '/api/chat/mess/history',
    privateMessages: '/api/chat/mess/private',
    markRead: '/api/chat/mess/mark-read',
    userDetail: '/api/admin/userdetail' // Sửa lại endpoint đúng
  },
  
  websocket: {
    communityTopic: '/topic/vip-community',
    privateQueue: '/user/queue/private-messages',
    errorQueue: '/user/queue/errors'
  },
  
  fallback: {
    enableMockData: false, // Không dùng mock data trong development
    mockExpertsCount: 0,
    retryAttempts: 3,
    retryDelay: 1000
  },
  
  environment: {
    isProduction: false,
    isDevelopment: true,
    apiBaseUrl: 'http://localhost:8080'
  }
};

/**
 * Production Environment Configuration
 */
export const PROD_CHAT_CONFIG: ChatEnvironmentConfig = {
  endpoints: {
    conversations: '/api/chat/mess/conversations',
    experts: '/api/chat/mess/experts',
    history: '/api/chat/mess/history',
    privateMessages: '/api/chat/mess/private',
    markRead: '/api/chat/mess/mark-read',
    userDetail: '/api/admin/userdetail' // Thêm endpoint cho user detail
  },
  
  websocket: {
    communityTopic: '/topic/vip-community',
    privateQueue: '/user/queue/private-messages',
    errorQueue: '/user/queue/errors'
  },
  
  fallback: {
    enableMockData: true, // Bật mock data trong production khi API không khả dụng
    mockExpertsCount: 5,
    retryAttempts: 2,
    retryDelay: 2000
  },
  
  environment: {
    isProduction: true,
    isDevelopment: false,
    apiBaseUrl: 'https://plantcare.id.vn'
  }
};

/**
 * Get current chat configuration based on environment
 */
export function getCurrentChatConfig(): ChatEnvironmentConfig {
  const isProduction = window.location.hostname.includes('plantcare.id.vn');
  return isProduction ? PROD_CHAT_CONFIG : DEV_CHAT_CONFIG;
}

/**
 * Chat Feature Flags
 */
export const CHAT_FEATURES = {
  // Core Features
  COMMUNITY_CHAT: true,
  PRIVATE_CHAT: true,
  EXPERT_LIST: true,
  CONVERSATION_HISTORY: true,
  
  // Advanced Features
  MESSAGE_SEARCH: false,
  FILE_SHARING: false,
  VOICE_MESSAGES: false,
  VIDEO_CALL: false,
  
  // Fallback Features
  OFFLINE_MESSAGING: false,
  MESSAGE_CACHING: true,
  RETRY_MECHANISM: true
};

/**
 * Chat Error Messages
 */
export const CHAT_ERROR_MESSAGES = {
  // API Errors
  API_UNAVAILABLE: 'Chat service is temporarily unavailable. Please try again later.',
  NETWORK_ERROR: 'Network connection error. Please check your internet connection.',
  UNAUTHORIZED: 'You are not authorized to access chat. Please log in again.',
  
  // Feature Errors
  FEATURE_DISABLED: 'This feature is currently disabled.',
  INSUFFICIENT_PERMISSIONS: 'You do not have permission to use this feature.',
  
  // User Guidance
  CONTACT_SUPPORT: 'If the problem persists, please contact support.',
  REFRESH_PAGE: 'Try refreshing the page or logging in again.',
  
  // Vietnamese Messages
  VIETNAMESE: {
    API_UNAVAILABLE: 'Dịch vụ chat tạm thời không khả dụng. Vui lòng thử lại sau.',
    NETWORK_ERROR: 'Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet.',
    UNAUTHORIZED: 'Bạn không có quyền truy cập chat. Vui lòng đăng nhập lại.',
    FEATURE_DISABLED: 'Tính năng này hiện tại bị vô hiệu hóa.',
    INSUFFICIENT_PERMISSIONS: 'Bạn không có quyền sử dụng tính năng này.',
    CONTACT_SUPPORT: 'Nếu vấn đề vẫn tiếp tục, vui lòng liên hệ hỗ trợ.',
    REFRESH_PAGE: 'Thử làm mới trang hoặc đăng nhập lại.'
  }
};

/**
 * Chat Performance Configuration
 */
export const CHAT_PERFORMANCE = {
  // Message Loading
  MESSAGE_BATCH_SIZE: 50,
  MAX_MESSAGES_IN_MEMORY: 200,
  MESSAGE_CLEANUP_INTERVAL: 300000, // 5 minutes
  
  // WebSocket
  WEBSOCKET_RECONNECT_DELAY: 3000,
  MAX_RECONNECT_ATTEMPTS: 5,
  HEARTBEAT_INTERVAL: 30000, // 30 seconds
  
  // UI Updates
  DEBOUNCE_DELAY: 300,
  SCROLL_THROTTLE: 100,
  CHANGE_DETECTION_STRATEGY: 'OnPush'
};
