# COOKIE-BASED AUTHENTICATION - MIGRATION GUIDE

## ✅ ĐÃ HOÀN THÀNH

### 1. Tạo CookieService
- Tạo file `src/app/auth/cookie.service.ts`
- Xử lý cookie với bảo mật cao: Secure, SameSite=Strict
- Method: `getAuthToken()`, `setAuthToken()`, `removeAuthToken()`, `hasCookie()`

### 2. Cập nhật JwtUserUtilService
- Import CookieService
- Thay đổi từ `localStorage.getItem('token')` → `cookieService.getAuthToken()`
- Thêm method: `isLoggedIn()`, `getTokenInfo()`

### 3. Cập nhật AuthInterceptor
- Import CookieService bằng `inject()`
- Lấy token từ cookie thay vì localStorage

### 4. Cập nhật ApiInterceptor
- Import CookieService vào constructor
- Lấy token từ cookie thay vì localStorage
- Error handling 401/403 xóa token khỏi cookie

### 5. Cập nhật AuthService
- Import CookieService và JwtUserUtilService
- Login tự động lưu token vào cookie (pipe tap)
- Thêm methods: `logout()`, `isLoggedIn()`, `getCurrentUserId()`, `getCurrentUserRole()`

### 6. Cập nhật LoginComponent
- Xóa import CookieService cũ (ngx-cookie-service)
- Xóa logic lưu token thủ công (AuthService đã tự động lưu)
- Dùng JwtUserUtilService.getRoleFromToken() cho navigation

## 🔒 BẢO MẬT

### Cookie Settings
```typescript
// Cookie được set với:
- Secure: true (chỉ HTTPS cho production)
- SameSite: 'Strict' (chống CSRF)
- HttpOnly: false (cần JS access để đọc JWT)
- Expires: 7 ngày (configurable)
- Path: '/' (toàn site)
```

### So sánh localStorage vs Cookie
```
localStorage:
❌ Có thể bị XSS đánh cắp
❌ Không tự động gửi với HTTP request
❌ Không có SameSite protection

Cookie:
✅ SameSite=Strict chống CSRF
✅ Secure flag chống man-in-the-middle
✅ Tự động expire
✅ Path control
```

## 🧪 KIỂM TRA

### 1. Kiểm tra Login Flow
```javascript
// 1. Login thành công
// 2. Kiểm tra cookie
document.cookie // should contain auth_token=...

// 3. Kiểm tra API call có Authorization header
// Dev Tools → Network → API request headers
```

### 2. Kiểm tra Interceptor
```javascript
// Test API call
fetch('/api/user/profile', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
}).then(r => r.json()).then(console.log);

// Kiểm tra trong Network tab có Authorization header không
```

### 3. Kiểm tra Logout
```javascript
// Gọi logout
authService.logout();

// Kiểm tra cookie đã bị xóa
document.cookie // should not contain auth_token
```

## 🚀 PRODUCTION READY

### Environment Config
```typescript
// environment.prod.ts
export const environment = {
  production: true,
  baseUrl: 'https://your-api-domain.com',
  cookieSecure: true, // Force HTTPS
  cookieSameSite: 'Strict'
};
```

### Backend Requirements
Backend cần:
1. Đọc token từ `Authorization: Bearer <token>` header
2. Set CORS headers cho cookie:
   ```
   Access-Control-Allow-Credentials: true
   Access-Control-Allow-Origin: https://your-frontend-domain.com
   ```

### Security Checklist
- [x] Token stored in cookie with Secure flag
- [x] SameSite=Strict prevents CSRF
- [x] Auto-expire prevents permanent access
- [x] 401/403 errors auto-logout
- [x] No token in localStorage/sessionStorage
- [x] No token logging in production

## 📝 MIGRATION NOTES

### From localStorage to Cookie:
1. **Login**: AuthService tự động lưu token vào cookie
2. **API Calls**: Interceptors tự động add token từ cookie
3. **Logout**: AuthService.logout() xóa cookie
4. **Check Auth**: AuthService.isLoggedIn() kiểm tra cookie
5. **Token Access**: JwtUserUtilService methods lấy từ cookie

### Backward Compatibility:
- Xóa tất cả localStorage.getItem('token')
- Xóa tất cả localStorage.setItem('token')
- LoginComponent không còn lưu token thủ công
- Các file debug có thể vẫn reference localStorage (OK for dev)

## ⚠️ TESTING REQUIRED

1. **Login → Profile Load**: Đảm bảo flow hoạt động end-to-end
2. **Token Expiry**: Test 401 error auto-logout
3. **Page Refresh**: Đảm bảo token persist qua refresh
4. **Multiple Tabs**: Đảm bảo logout ở một tab affect tất cả tabs
5. **Network Errors**: Đảm bảo error handling không break auth state

## 🔧 TROUBLESHOOTING

### Nếu token không được gửi:
1. Kiểm tra cookie được set đúng: `document.cookie`
2. Kiểm tra interceptor order trong app.config.ts
3. Kiểm tra browser dev tools → Application → Cookies

### Nếu 401 errors:
1. Kiểm tra token format trong cookie
2. Kiểm tra Authorization header trong Network tab
3. Kiểm tra backend token validation

### Nếu logout không hoạt động:
1. Kiểm tra cookie bị xóa: `document.cookie`
2. Kiểm tra redirect sau logout
3. Test multiple tabs logout sync
