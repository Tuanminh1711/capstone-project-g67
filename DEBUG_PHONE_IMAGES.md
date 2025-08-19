# Hướng dẫn Debug Ảnh từ Điện thoại

## Vấn đề thường gặp

Khi chụp ảnh trực tiếp từ điện thoại, AI nhận diện có thể gặp lỗi trong khi file tải từ máy tính hoạt động bình thường.

## Nguyên nhân có thể

1. **Định dạng ảnh**: Điện thoại có thể tạo ra ảnh HEIC, HEIF, WebP
2. **Metadata ảnh**: Orientation, EXIF data khác biệt
3. **Kích thước ảnh**: Ảnh từ điện thoại thường lớn hơn
4. **Chất lượng ảnh**: Compression và encoding khác biệt

## Cách Debug

### 1. Sử dụng Debug Info

- Chọn ảnh từ điện thoại
- Click "🔧 Hiển thị Debug Info" để xem thông tin chi tiết
- Kiểm tra:
  - Tên file
  - Kích thước (MB)
  - Loại file (MIME type)
  - Ngày sửa đổi

### 2. Kiểm tra Console

Mở Developer Tools (F12) và xem Console tab:
- File info log khi chọn ảnh
- Error details khi upload thất bại
- Network requests và responses

### 3. Kiểm tra Network Tab

Trong Developer Tools > Network:
- Xem request POST đến `/api/vip/disease-detection/detect-from-image`
- Kiểm tra request payload
- Xem response status và error messages

## Các lỗi thường gặp

### Lỗi 413 - Payload Too Large
```
Ảnh quá lớn. Vui lòng chọn ảnh nhỏ hơn.
```
**Giải pháp**: Giảm kích thước ảnh hoặc nén ảnh

### Lỗi 415 - Unsupported Media Type
```
Định dạng ảnh không được hỗ trợ. Vui lòng chọn ảnh JPG hoặc PNG.
```
**Giải pháp**: Chuyển đổi ảnh sang JPG/PNG

### Lỗi 400 - Bad Request
```
Dữ liệu ảnh không hợp lệ.
```
**Giải pháp**: Kiểm tra ảnh có bị corrupt không

### Lỗi 500 - Internal Server Error
```
Lỗi server. Vui lòng thử lại sau.
```
**Giải pháp**: Kiểm tra backend logs

## Cải thiện đã thực hiện

### Frontend
- ✅ Thêm debug info hiển thị thông tin file
- ✅ Cải thiện error handling với messages chi tiết
- ✅ Tự động convert ảnh sang JPEG
- ✅ Logging chi tiết cho debugging

### Backend
- ✅ Hỗ trợ nhiều định dạng ảnh (HEIC, HEIF, WebP)
- ✅ Validation chi tiết với error messages
- ✅ Logging chi tiết cho debugging
- ✅ Trả về error response có cấu trúc

## Cách test

1. **Chụp ảnh từ điện thoại**:
   - Mở camera app
   - Chụp ảnh cây
   - Upload vào hệ thống

2. **Kiểm tra debug info**:
   - Xem thông tin file
   - Kiểm tra console logs

3. **Xem error messages**:
   - Nếu có lỗi, sẽ hiển thị message chi tiết
   - Kiểm tra network tab

4. **So sánh với file từ máy tính**:
   - Tải ảnh tương tự từ máy tính
   - So sánh thông tin file

## Troubleshooting

### Nếu ảnh HEIC không hoạt động
- Hệ thống sẽ tự động convert sang JPEG
- Kiểm tra xem có lỗi gì trong quá trình convert

### Nếu ảnh quá lớn
- Giảm độ phân giải camera
- Sử dụng app nén ảnh
- Chọn ảnh từ thư viện thay vì chụp mới

### Nếu vẫn gặp lỗi
- Kiểm tra console logs
- Kiểm tra network requests
- So sánh với ảnh hoạt động được
- Liên hệ developer với thông tin lỗi chi tiết

## Logs cần thu thập

Khi báo cáo lỗi, cung cấp:
1. Thông tin file (từ debug info)
2. Console logs
3. Network request/response
4. Error message hiển thị
5. Loại điện thoại và OS version
6. Browser và version
