# Hướng dẫn tích hợp AI cho nhận diện cây

## Tổng quan

Dự án PlantCare đã được tích hợp AI để nhận diện cây từ ảnh sử dụng Plant.id API. Tính năng này cho phép:

1. **Nhận diện cây từ ảnh** - Sử dụng AI để xác định loại cây
2. **Validate ảnh thực vật** - Kiểm tra xem ảnh có chứa thực vật không
3. **Tìm kiếm trong database** - Match kết quả AI với dữ liệu có sẵn

## Cấu trúc đã thêm

```
src/main/java/com/plantcare_backend/
├── controller/ai/
│   └── AIPlantController.java          # API endpoints cho AI
├── service/
│   ├── AIPlantService.java             # Interface cho AI service
│   └── impl/
│       └── AIPlantServiceImpl.java     # Implementation với Plant.id API
├── dto/
│   ├── request/ai/
│   │   └── PlantIdentificationRequestDTO.java
│   └── response/ai/
│       └── PlantIdentificationResponseDTO.java
```

## API Endpoints

### 1. Nhận diện cây từ ảnh
```
POST /api/ai/identify-plant
Content-Type: multipart/form-data

Parameters:
- image: MultipartFile (required)
- language: String (optional, default: "vi")
- maxResults: Integer (optional, default: 5)

Response:
{
  "status": 200,
  "message": "Plant identification completed successfully",
  "data": {
    "requestId": "uuid",
    "status": "SUCCESS",
    "message": "Plant identification completed",
    "results": [
      {
        "scientificName": "Ficus elastica",
        "commonName": "Rubber Plant",
        "vietnameseName": "Cây cao su",
        "confidence": 0.95,
        "description": "Popular indoor plant...",
        "careInstructions": "Water when soil is dry...",
        "isExactMatch": true,
        "plantId": 123
      }
    ]
  }
}
```

### 2. Validate ảnh thực vật
```
POST /api/ai/validate-plant-image
Content-Type: multipart/form-data

Parameters:
- image: MultipartFile (required)

Response:
{
  "status": 200,
  "message": "Image contains a plant",
  "data": true
}
```

### 3. Tìm kiếm cây trong database
```
GET /api/ai/search-plants?plantName=Ficus

Response:
{
  "status": 200,
  "message": "Plant search completed successfully",
  "data": {
    "requestId": "uuid",
    "status": "SUCCESS",
    "message": "Found 2 plants in database",
    "results": [...]
  }
}
```

## Cấu hình

### 1. Thêm environment variables
```bash
# Plant.id API Configuration
PLANTCARE_AI_PLANT_ID_API_KEY=your-plant-id-api-key
PLANTCARE_AI_PLANT_ID_BASE_URL=https://api.plant.id/v2
PLANTCARE_AI_TIMEOUT=30000
```

### 2. Cập nhật application.yml
```yaml
plantcare:
  ai:
    plant-id:
      api-key: ${PLANTCARE_AI_PLANT_ID_API_KEY:your-plant-id-api-key}
      base-url: ${PLANTCARE_AI_PLANT_ID_BASE_URL:https://api.plant.id/v2}
      timeout: ${PLANTCARE_AI_TIMEOUT:30000}
```

## Cách sử dụng

### 1. Đăng ký Plant.id API
1. Truy cập https://web.plant.id/
2. Đăng ký tài khoản miễn phí
3. Lấy API key từ dashboard
4. Thêm API key vào environment variables

### 2. Test API
```bash
# Test nhận diện cây
curl -X POST \
  http://localhost:8080/api/ai/identify-plant \
  -H 'Content-Type: multipart/form-data' \
  -F 'image=@/path/to/plant-image.jpg' \
  -F 'language=vi' \
  -F 'maxResults=5'

# Test validate ảnh
curl -X POST \
  http://localhost:8080/api/ai/validate-plant-image \
  -H 'Content-Type: multipart/form-data' \
  -F 'image=@/path/to/plant-image.jpg'

# Test tìm kiếm database
curl -X GET \
  'http://localhost:8080/api/ai/search-plants?plantName=Ficus'
```

## Workflow tích hợp

```
User upload image → Validate plant image → Call Plant.id API → 
Parse AI results → Match with database → Return combined results
```

## Lưu ý quan trọng

### 1. Rate Limits
- Plant.id free tier: 500 requests/month
- Cần implement caching để giảm API calls
- Có thể upgrade lên paid plan cho production

### 2. Error Handling
- API timeout: 30 seconds
- Image size limit: 10MB
- Supported formats: JPG, PNG, BMP

### 3. Performance
- Implement caching cho kết quả AI
- Sử dụng async processing cho large images
- Monitor API usage và costs

## Tích hợp với Frontend

### 1. Upload và nhận diện
```javascript
const formData = new FormData();
formData.append('image', file);
formData.append('language', 'vi');
formData.append('maxResults', '5');

const response = await fetch('/api/ai/identify-plant', {
  method: 'POST',
  body: formData
});

const result = await response.json();
// Hiển thị kết quả nhận diện
```

### 2. Auto-complete search
```javascript
const searchPlants = async (plantName) => {
  const response = await fetch(`/api/ai/search-plants?plantName=${plantName}`);
  const result = await response.json();
  return result.data.results;
};
```

## Cải tiến tương lai

1. **Local AI Model** - Train model riêng cho cây Việt Nam
2. **Disease Detection** - Phát hiện bệnh cây từ ảnh
3. **Multi-language Support** - Hỗ trợ nhiều ngôn ngữ
4. **Offline Mode** - Hoạt động không cần internet
5. **Batch Processing** - Xử lý nhiều ảnh cùng lúc

## Troubleshooting

### 1. API Key không hợp lệ
```
Error: Plant identification failed: Invalid API key
Solution: Kiểm tra lại PLANTCARE_AI_PLANT_ID_API_KEY
```

### 2. Timeout errors
```
Error: Plant identification failed: Read timeout
Solution: Tăng PLANTCARE_AI_TIMEOUT hoặc giảm image size
```

### 3. Rate limit exceeded
```
Error: Plant identification failed: Rate limit exceeded
Solution: Upgrade plan hoặc implement caching
```

## Monitoring

### 1. Logs
```bash
# Xem AI service logs
tail -f logs/plantcare-backend.log | grep "AI"
```

### 2. Metrics
- API call success rate
- Average response time
- Error rate by endpoint
- Monthly API usage

## Security

1. **API Key Protection** - Không commit API key vào code
2. **Input Validation** - Validate tất cả input từ user
3. **Rate Limiting** - Implement rate limiting cho AI endpoints
4. **File Upload Security** - Validate file type và size 