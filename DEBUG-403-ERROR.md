# Debug Profile Edit - 403 Forbidden Error

## Tình huống
- Khi cập nhật profile: **403 Forbidden Error**
- Backend API trả về lỗi: "Access denied"

## ⚠️ SSR Compatibility
Tất cả debug tools đã được cấu hình để tương thích với **Server-Side Rendering (SSR)**:
- Chỉ chạy browser-specific code khi `window` và `localStorage` available
- Safe guards cho server-side execution
- No more "window is not defined" errors

## Debug Tools đã thêm

### 1. JWT Debug Service (`src/app/shared/jwt-debug.service.ts`)
- Parse và hiển thị thông tin JWT token
- Kiểm tra token expiration
- Log chi tiết về token

### 2. Debug Auth Component (`src/app/debug/debug-auth.component.ts`)
- Panel debug hiển thị trên trang edit profile
- Nút test các chức năng authentication
- Mock token generator để test

### 3. Enhanced API Interceptor
- Log chi tiết request headers
- Debug authentication token
- Enhanced error handling cho 403 errors

### 4. Enhanced Error Handling
- Detailed logging trong edit-user-profile component
- Group console logs để dễ đọc
- Debug token khi gặp 403 error

## Cách sử dụng Debug Tools

### Trên trang Edit Profile:
1. **Debug Panel** (góc trên bên phải):
   - Hiển thị trạng thái token hiện tại
   - Nút "Debug Token" - log chi tiết token
   - Nút "Mock Token" - tạo token test hợp lệ
   - Nút "Expired Token" - tạo token hết hạn để test
   - Nút "Test API Call" - gọi API trực tiếp

### Trong Console Browser:
```javascript
// Các hàm helper có sẵn:
setMockToken()          // Tạo token test hợp lệ
setExpiredToken()       // Tạo token hết hạn
localStorage.removeItem('token') // Xóa token
```

## Các bước debug lỗi 403:

### Bước 1: Kiểm tra Token
1. Mở trang edit profile
2. Mở Console (F12)
3. Click "Debug Token" trong debug panel
4. Kiểm tra:
   - Token có tồn tại không?
   - Token có hết hạn không?
   - User ID có chính xác không?

### Bước 2: Test với Mock Token
1. Click "Clear Token" để xóa token hiện tại
2. Click "Mock Token" để tạo token test
3. Thử update profile lại
4. Xem log trong console

### Bước 3: Debug API Request
1. Mở Network tab trong DevTools
2. Thử update profile
3. Kiểm tra request headers:
   - `Authorization: Bearer <token>` có được gửi không?
   - `Content-Type: application/json` có đúng không?

### Bước 4: Kiểm tra Backend
1. Backend API endpoint có đúng không?
2. Backend có yêu cầu permission đặc biệt không?
3. Backend có xử lý CORS đúng không?

## Các nguyên nhân có thể của 403 Error:

### 1. Token Issues:
- ❌ Token không tồn tại
- ❌ Token hết hạn
- ❌ Token format không đúng
- ❌ Token signature không hợp lệ

### 2. Authorization Issues:
- ❌ User không có quyền update profile
- ❌ Backend yêu cầu permission khác
- ❌ User ID trong token không match với profile ID

### 3. Backend Configuration:
- ❌ Backend không nhận Authorization header
- ❌ Backend CORS không cho phép headers
- ❌ Backend API endpoint sai

### 4. Proxy Configuration:
- ❌ Proxy không forward Authorization header
- ❌ Proxy configuration sai

## Giải pháp thường gặp:

### Nếu token hết hạn:
```javascript
// Login lại để lấy token mới
localStorage.removeItem('token');
window.location.href = '/login';
```

### Nếu cần test với mock data:
```javascript
// Sử dụng mock token
setMockToken();
```

### Nếu backend cần user ID khác:
- Kiểm tra API documentation
- Đảm bảo user ID trong token match với profile được update

## Log Format:

### Request Log:
```
📡 API Request: PUT /api/user-profile/update
📡 Request headers: ["Authorization: Bearer eyJ...", "Content-Type: application/json"]
📡 Request body: {id: 123, fullName: "...", ...}
```

### Error Log:
```
❌ Error updating profile
  Status: 403
  Status text: Forbidden
  Error body: {message: "Access denied"}
  URL: /api/user-profile/update
```

### Token Debug Log:
```
🔒 JWT Token Debug
  📝 Raw token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  📋 Header: {alg: "HS256", typ: "JWT"}
  📋 Payload: {sub: "123", userId: 123, username: "mockuser", exp: 1735123456}
  ⏰ Expires at: 12/25/2024, 10:30:56 AM
  ⏰ Current time: 12/25/2024, 9:30:56 AM
  ⏰ Is expired: ✅ NO
  👤 User ID: 123
```

Sử dụng các tools này để xác định chính xác nguyên nhân của lỗi 403 và fix accordingly.
