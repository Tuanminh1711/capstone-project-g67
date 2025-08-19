# Hướng dẫn Debug Lỗi "Có lỗi xảy ra khi nhận diện cây"

## 🚨 Vấn đề hiện tại

Khi upload ảnh từ điện thoại vào tính năng **AI Plant Identification**, hệ thống hiển thị lỗi:
```
Có lỗi xảy ra khi nhận diện cây
```

## 🔍 Cách Debug

### 1. **Mở Developer Tools (F12)**
- Mở Console tab để xem logs
- Mở Network tab để xem API requests

### 2. **Upload ảnh và xem logs**
- Chọn ảnh từ điện thoại
- Xem console logs:
  ```
  Selected file for plant identification: {name, size, type, lastModified}
  Sending file for plant identification: {name, size, type, lastModified}
  Making request to: [API_ENDPOINT]
  Request headers: [HEADERS]
  ```

### 3. **Kiểm tra Network Tab**
- Xem request POST đến `/api/ai/identify-plant`
- Kiểm tra:
  - Request URL
  - Request headers (Authorization)
  - Request payload (FormData)
  - Response status
  - Response body

### 4. **Sử dụng Debug Info**
- Click "🔧 Hiển thị Debug Info" để xem thông tin file
- Kiểm tra:
  - Tên file
  - Kích thước (MB)
  - Loại file (MIME type)
  - Ngày sửa đổi

### 5. **Test API Connection**
- Click "🔧 Test API Connection" để kiểm tra kết nối
- Xem console logs cho kết quả test

## 🐛 Các lỗi có thể gặp

### **Lỗi 404 - Not Found**
```
API endpoint không tìm thấy
```
**Nguyên nhân**: Backend chưa có endpoint `/api/ai/identify-plant`
**Giải pháp**: Kiểm tra backend có implement endpoint này chưa

### **Lỗi 401 - Unauthorized**
```
Token hết hạn hoặc không hợp lệ
```
**Nguyên nhân**: JWT token không hợp lệ hoặc hết hạn
**Giải pháp**: Đăng nhập lại để lấy token mới

### **Lỗi 403 - Forbidden**
```
Tính năng AI nhận diện cây chỉ dành cho tài khoản VIP
```
**Nguyên nhân**: User không có quyền VIP
**Giải pháp**: Nâng cấp tài khoản lên VIP

### **Lỗi 500 - Internal Server Error**
```
Lỗi server. Vui lòng thử lại sau.
```
**Nguyên nhân**: Lỗi backend khi xử lý ảnh
**Giải pháp**: Kiểm tra backend logs

### **Lỗi 0 - Network Error**
```
Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.
```
**Nguyên nhân**: Không thể kết nối đến backend
**Giải pháp**: Kiểm tra backend có đang chạy không

## 🔧 Các bước kiểm tra

### **Bước 1: Kiểm tra Console Logs**
```
1. Mở Developer Tools (F12)
2. Chọn Console tab
3. Upload ảnh từ điện thoại
4. Xem các log messages
```

### **Bước 2: Kiểm tra Network Requests**
```
1. Mở Developer Tools (F12)
2. Chọn Network tab
3. Upload ảnh từ điện thoại
4. Tìm request POST đến /api/ai/identify-plant
5. Kiểm tra request và response
```

### **Bước 3: Kiểm tra Backend**
```
1. Kiểm tra backend có đang chạy không
2. Kiểm tra endpoint /api/ai/identify-plant có tồn tại không
3. Kiểm tra backend logs khi có request
```

### **Bước 4: Test API Connection**
```
1. Click "🔧 Test API Connection"
2. Xem console logs
3. Xem toast message
```

## 📱 Thông tin cần thu thập

Khi báo cáo lỗi, cung cấp:

1. **Console Logs**: Copy toàn bộ logs từ console
2. **Network Tab**: Screenshot hoặc thông tin request/response
3. **Debug Info**: Thông tin file từ debug panel
4. **Error Message**: Message lỗi hiển thị trên UI
5. **Loại điện thoại**: Model và OS version
6. **Browser**: Tên và version
7. **Ảnh test**: Ảnh gây ra lỗi (nếu có thể)

## 🚀 Các bước tiếp theo

1. **Chạy test API connection** để kiểm tra kết nối
2. **Kiểm tra console logs** để xem lỗi chi tiết
3. **Kiểm tra network tab** để xem API request/response
4. **So sánh với ảnh từ máy tính** để tìm sự khác biệt
5. **Kiểm tra backend logs** nếu có quyền truy cập

## 💡 Gợi ý

- **Ảnh từ điện thoại** thường có định dạng HEIC, WebP
- **Kích thước ảnh** có thể lớn hơn ảnh từ máy tính
- **Metadata ảnh** có thể khác biệt (orientation, EXIF)
- **Browser mobile** có thể có limitations khác với desktop

Hãy sử dụng các công cụ debug đã được cung cấp để tìm ra nguyên nhân chính xác của lỗi!
