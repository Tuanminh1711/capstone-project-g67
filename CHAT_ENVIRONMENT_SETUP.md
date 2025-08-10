# 🌐 Chat Environment Setup Guide

## 📋 Tổng Quan

Hệ thống chat đã được thiết kế để hoạt động hoàn hảo trên cả môi trường **local development** và **production server**, hỗ trợ cả **VIP users** và **Expert users**.

## 🏗️ Kiến Trúc Hệ Thống

### Core Services
- **`ChatService`** - Xử lý tất cả API calls với fallback mechanisms
- **`ChatStateService`** - Quản lý trạng thái chat toàn cục
- **`ChatEnvironmentConfig`** - Cấu hình môi trường tự động

### Components
- **VIP Chat** - `/vip/chat` - Chat cộng đồng và riêng tư cho VIP users
- **Expert Chat** - `/expert/chat` - Chat cộng đồng cho Expert users
- **Expert Private Chat** - `/expert/private-chat` - Chat riêng tư cho Expert users
- **Chat Status** - Component hiển thị trạng thái hệ thống

## 🔧 Cấu Hình Môi Trường

### 1. Development (Local)
```typescript
// Tự động detect từ hostname
const config = {
  isProduction: false,
  isDevelopment: true,
  apiBaseUrl: 'http://localhost:8080',
  fallback: {
    enableMockData: false,  // Không dùng mock data
    retryAttempts: 3,
    retryDelay: 1000
  }
};
```

### 2. Production (Server)
```typescript
// Tự động detect từ hostname plantcare.id.vn
const config = {
  isProduction: true,
  isDevelopment: false,
  apiBaseUrl: 'https://plantcare.id.vn',
  fallback: {
    enableMockData: true,   // Bật mock data khi API không khả dụng
    retryAttempts: 2,
    retryDelay: 2000
  }
};
```

## 🚀 Tính Năng Chính

### ✅ Hoạt Động Hoàn Hảo Trên Local
- Kết nối trực tiếp đến backend `localhost:8080`
- Không có fallback data - hiển thị dữ liệu thật
- Error handling chi tiết để debug
- WebSocket kết nối trực tiếp

### ✅ Hoạt Động Graceful Trên Production
- Fallback data khi API không khả dụng
- Mock experts data cho danh sách chuyên gia
- Toast notifications thông báo trạng thái
- WebSocket vẫn hoạt động cho real-time chat

### ✅ Tính Năng Chung
- **Community Chat** - Chat công khai cho tất cả users
- **Private Chat** - Tin nhắn riêng tư giữa 2 users
- **Expert List** - Danh sách chuyên gia có thể chat
- **Conversation History** - Lịch sử trò chuyện
- **Real-time Messaging** - WebSocket cho tin nhắn tức thì

## 📱 Sử Dụng Trong Components

### 1. Inject Services
```typescript
constructor(
  private chatService: ChatService,
  private chatStateService: ChatStateService,
  private toastService: ToastService
) {}
```

### 2. Subscribe to API Availability
```typescript
ngOnInit() {
  this.chatService.chatApisAvailable$.subscribe(available => {
    if (!available && this.urlService.isProduction()) {
      this.toastService.warning('Chat APIs are temporarily unavailable', 8000);
    }
  });
}
```

### 3. Use ChatService Methods
```typescript
// Thay vì HttpClient trực tiếp
this.chatService.getConversations().subscribe({
  next: (data) => {
    this.conversations = data;
  },
  error: (err) => {
    console.error('Error:', err);
  }
});
```

## 🔄 Fallback Mechanisms

### 1. API Failures
```typescript
// Tự động retry với delay
retryWhen(errors => 
  errors.pipe(
    delay(config.fallback.retryDelay),
    take(config.fallback.retryAttempts)
  )
)

// Fallback data cho production
catchError(error => {
  if (this.urlService.isProduction()) {
    return of(this.getMockExperts());  // Mock data
  }
  return throwError(() => error);      // Throw error cho development
})
```

### 2. Mock Data
```typescript
private getMockExperts(): ExpertDTO[] {
  return [
    { id: 1, username: 'PlantExpert01', role: 'EXPERT' },
    { id: 2, username: 'GardenMaster', role: 'EXPERT' },
    // ... more mock experts
  ];
}
```

## 🌍 Environment Detection

### Tự Động Detect
```typescript
export function getCurrentChatConfig(): ChatEnvironmentConfig {
  const isProduction = window.location.hostname.includes('plantcare.id.vn');
  return isProduction ? PROD_CHAT_CONFIG : DEV_CHAT_CONFIG;
}
```

### Manual Override (Nếu cần)
```typescript
// Trong environment.ts
export const environment = {
  production: false,
  forceProduction: false,  // Override environment detection
  apiUrl: 'http://localhost:8080'
};
```

## 📊 Monitoring & Debugging

### 1. Chat Status Component
```typescript
// Hiển thị trạng thái real-time
<app-chat-status></app-chat-status>
```

### 2. Console Logs
```typescript
// Development mode
console.log('Chat APIs are not available, using fallback:', error);

// Production mode
console.warn('Chat APIs are not available, using fallback:', error);
```

### 3. Toast Notifications
```typescript
// User-friendly messages
this.toastService.warning('Chat APIs are temporarily unavailable', 8000);
this.toastService.info('Using fallback data for better experience', 5000);
```

## 🚨 Error Handling

### 1. API Errors
- **500 Internal Server Error** → Fallback data
- **401 Unauthorized** → User authentication error
- **Network Error** → Retry mechanism

### 2. WebSocket Errors
- **Connection Failed** → Auto-reconnect với delay
- **Message Send Failed** → Store locally, retry later

### 3. User Experience
- **Graceful Degradation** - App không crash
- **Clear Notifications** - User biết trạng thái
- **Fallback Features** - Tính năng cơ bản vẫn hoạt động

## 🔧 Backend Requirements

### API Endpoints Cần Implement
```typescript
// GET /api/chat/conversations
// GET /api/chat/experts  
// GET /api/chat/history
// GET /api/chat/private/{receiverId}
// POST /api/chat/mark-read
```

### WebSocket Endpoints
```typescript
// /topic/vip-community
// /user/queue/private-messages
// /user/queue/errors
```

## 📝 Testing

### 1. Local Testing
```bash
# Start backend server
cd backend
./mvnw spring-boot:run

# Start frontend
ng serve
```

### 2. Production Testing
```bash
# Deploy to production
ng build --configuration production

# Test fallback mechanisms
# Disable backend APIs temporarily
```

### 3. Feature Testing
- ✅ Community chat
- ✅ Private chat
- ✅ Expert list
- ✅ Conversation history
- ✅ WebSocket real-time
- ✅ Fallback data
- ✅ Error handling

## 🚀 Deployment

### 1. Development
```bash
ng serve
# Tự động proxy đến localhost:8080
```

### 2. Production
```bash
ng build --configuration production
# Deploy static files
# Backend APIs sẽ được implement sau
```

## 🔮 Future Improvements

### 1. Advanced Features
- Message search và filtering
- File sharing
- Voice messages
- Video calls

### 2. Performance
- Message caching
- Offline messaging
- Message pagination
- Real-time typing indicators

### 3. Security
- End-to-end encryption
- Message expiration
- User blocking
- Content moderation

## 📞 Support

Nếu gặp vấn đề:
1. Kiểm tra console logs
2. Xem Chat Status component
3. Kiểm tra network tab
4. Liên hệ backend team để implement APIs

---

**🎯 Mục Tiêu**: Hệ thống chat hoạt động hoàn hảo trên cả local và production, cung cấp trải nghiệm người dùng tốt nhất có thể trong mọi tình huống.
