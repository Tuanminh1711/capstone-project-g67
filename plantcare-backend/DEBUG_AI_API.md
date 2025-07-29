# Debug AI API - Plant.id Integration

## Vấn đề hiện tại
Lỗi `401 Unauthorized` khi gọi Plant.id API. Có thể do:
1. API key không đúng format
2. API key được gửi sai cách
3. API key đã hết hạn hoặc không hợp lệ

## Các bước debug

### 1. Test API key trước
```bash
# Test API key configuration
curl -X GET http://localhost:8080/api/ai/test-api-key
```

### 2. Kiểm tra logs
```bash
# Xem logs chi tiết
tail -f logs/plantcare-backend.log | grep "AI"
```

### 3. Test trực tiếp với Plant.id API
```bash
# Test với curl trực tiếp
curl -X POST https://api.plant.id/v2/identify \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "AIzaSyBo-GKqe0sZHOQVD2_skUqr2HohtZAQSHA",
    "images": ["data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="],
    "organs": ["leaf"]
  }'
```

### 4. Kiểm tra API key trên Plant.id website
1. Truy cập https://web.plant.id/
2. Đăng nhập vào tài khoản
3. Kiểm tra API key trong dashboard
4. Xem usage và rate limits

## Các lỗi có thể gặp

### Lỗi 401 Unauthorized
- **Nguyên nhân**: API key không hợp lệ hoặc sai format
- **Giải pháp**: 
  - Kiểm tra lại API key
  - Đảm bảo key còn hiệu lực
  - Kiểm tra format key

### Lỗi 429 Too Many Requests
- **Nguyên nhân**: Vượt quá rate limit
- **Giải pháp**:
  - Upgrade lên paid plan
  - Implement caching
  - Giảm số lượng requests

### Lỗi 400 Bad Request
- **Nguyên nhân**: Request format sai
- **Giải pháp**:
  - Kiểm tra request body
  - Đảm bảo image format đúng
  - Kiểm tra required fields

## Cấu hình đã sửa

### 1. API key trong body thay vì header
```java
// Trước
headers.set("Api-Key", plantIdApiKey);

// Sau  
body.add("api_key", plantIdApiKey);
```

### 2. Thêm debug method
```java
public void testApiKey() {
    // Test API key với request đơn giản
}
```

### 3. Thêm test endpoint
```
GET /api/ai/test-api-key
```

## Test lại sau khi sửa

### 1. Restart ứng dụng
```bash
mvn spring-boot:run
```

### 2. Test API key
```bash
curl -X GET http://localhost:8080/api/ai/test-api-key
```

### 3. Test plant identification
```bash
curl -X POST http://localhost:8080/api/ai/identify-plant \
  -F "image=@/path/to/plant-image.jpg" \
  -F "language=vi" \
  -F "maxResults=5"
```

## Nếu vẫn lỗi

### 1. Kiểm tra API key format
- Plant.id API key thường có format: `your-api-key-here`
- Không phải Google API key format

### 2. Đăng ký lại API key
1. Truy cập https://web.plant.id/
2. Tạo tài khoản mới
3. Lấy API key mới
4. Cập nhật trong application.yml

### 3. Test với Postman
1. Tạo request POST đến https://api.plant.id/v2/identify
2. Body: form-data
3. Key: api_key, Value: your-api-key
4. Key: images, Type: File, Value: plant image
5. Key: organs, Value: leaf

## Monitoring

### 1. Logs
```bash
# Xem AI service logs
tail -f logs/plantcare-backend.log | grep "AI"

# Xem API calls
tail -f logs/plantcare-backend.log | grep "Plant.id"
```

### 2. Metrics
- API call success rate
- Response time
- Error rate

## Contact Support

Nếu vẫn gặp vấn đề:
1. Kiểm tra Plant.id documentation
2. Contact Plant.id support
3. Thử API khác như Google Vision API 