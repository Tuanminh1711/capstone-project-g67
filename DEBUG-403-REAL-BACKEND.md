# 🔍 Debug 403 Error - Backend Thực

## Bước 1: Mở trang edit profile
- Truy cập: `http://localhost:51061/profile/edit`
- Debug panel sẽ xuất hiện góc trên phải

## Bước 2: Kiểm tra token trong Console
Mở Console (F12) và chạy:
```javascript
debugCurrentToken()
```

**Kết quả mong đợi:**
- ✅ Token exists
- ✅ Token chưa expired
- 👤 User ID có giá trị

## Bước 3: Test API GET profile
```javascript
testProfileAPI()
```

**Nếu thành công (200):** Backend nhận token OK
**Nếu lỗi 403:** Token không đúng hoặc thiếu quyền
**Nếu lỗi 401:** Token hết hạn hoặc không hợp lệ

## Bước 4: Test API UPDATE profile
```javascript
testUpdateProfileAPI()
```

**Nếu lỗi 403 ở đây:** Backend có thể yêu cầu:
- User chỉ được update profile của chính mình
- Token cần có role/permission đặc biệt
- User ID trong token phải match với profile ID

## Bước 5: Kiểm tra Backend
```javascript
testBackendHealth()
```

## Các nguyên nhân thường gặp của 403:

### 1. User ID không match:
- Token có user ID = 123
- Nhưng đang cố update profile của user ID = 456
- **Giải pháp:** Đảm bảo chỉ edit profile của chính user đó

### 2. Token thiếu permissions:
- Backend yêu cầu role = "USER" hoặc "ADMIN"
- Token không có claim này
- **Giải pháp:** Kiểm tra JWT payload có đúng roles không

### 3. Backend validate sai:
- Backend không parse Authorization header đúng
- Backend không verify JWT signature đúng
- **Giải pháp:** Check backend logs

### 4. Request body không đúng format:
- Backend expect field khác
- Required fields bị thiếu
- **Giải pháp:** Check API documentation

## Debug trong code:

### Kiểm tra token được gửi:
```javascript
// Trong API interceptor đã log:
console.log('🔐 Token added to request:', token);
```

### Kiểm tra request data:
```javascript
// Trong edit-user-profile component:
console.log('📤 Sending update request:', updateData);
```

### Kiểm tra response error:
```javascript
// Error log sẽ hiển thị:
console.group('❌ Error updating profile');
console.error('Status:', error.status);
console.error('Error body:', error.error);
console.groupEnd();
```

## Giải pháp nhanh:

### Nếu token hết hạn:
```javascript
localStorage.removeItem('token');
// Đăng nhập lại
```

### Nếu cần debug sâu hơn:
1. Check Network tab trong DevTools
2. Xem request headers có Authorization không
3. Xem response body backend trả về gì
4. Check backend logs nếu có access

## API Endpoints kiểm tra:
- GET `/api/user-profile/me` - Lấy thông tin user hiện tại
- PUT `/api/user-profile/update` - Cập nhật profile
- GET `/api/health` - Kiểm tra backend health

**Mục tiêu:** Xác định chính xác backend từ chối request vì lý do gì để fix đúng vấn đề.
