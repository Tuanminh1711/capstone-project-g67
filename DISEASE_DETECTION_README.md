# Hướng dẫn sử dụng tính năng Nhận diện bệnh cây trồng

## Tổng quan
Tính năng nhận diện bệnh cây trồng sử dụng AI để phát hiện và chẩn đoán bệnh cây thông qua:
1. **Phân tích hình ảnh**: Sử dụng Plant.id API để phân tích hình ảnh cây bị bệnh
2. **Phân tích triệu chứng**: Dựa trên mô tả triệu chứng để chẩn đoán bệnh

## Cải tiến đã thực hiện

### Backend (Java Spring Boot)

#### 1. Cải thiện logic phát hiện bệnh
- **Trước**: Gọi `simulateDiseaseDetection()` giả lập kết quả
- **Sau**: Gọi trực tiếp Plant.id API thông qua `analyzeImageWithPlantId()`
- Thêm xử lý lỗi chi tiết và fallback logic
- Cải thiện validation cho plantId

#### 2. Cải thiện xử lý lỗi
- Thêm try-catch blocks cho tất cả các operation
- Logging chi tiết cho debugging
- Fallback logic khi API gặp sự cố
- Validation đầy đủ cho input data

#### 3. Cải thiện response mapping
- Map đầy đủ các trường từ Plant.id API
- Thêm các trường mới: causes, prevention, treatmentGuide
- Cải thiện confidence score calculation
- Thêm alternative diseases suggestions

#### 4. Tạo các service mới
- `SynonymService`: Xử lý từ đồng nghĩa và matching
- `DiseaseDetectionProperties`: Cấu hình cho disease detection
- Cải thiện `AIDiseaseDetectionServiceImpl`

### Frontend (Angular)

#### 1. Cải thiện UI/UX
- **Trước**: Giao diện đơn giản, thiếu thân thiện
- **Sau**: Design hiện đại với Bootstrap 5, responsive
- Thêm loading states cho tất cả operations
- Cải thiện error handling và user feedback

#### 2. Cải thiện từ ngữ
- **Trước**: Một số từ ngữ chưa chính xác
- **Sau**: Sử dụng từ ngữ chuyên nghiệp, dễ hiểu
- Thêm tooltips và hướng dẫn chi tiết
- Cải thiện validation messages

#### 3. Cải thiện form validation
- Thêm required validation cho các trường bắt buộc
- Real-time validation feedback
- Cải thiện error messages
- Thêm file size và type validation

#### 4. Cải thiện component logic
- Thêm drag & drop cho image upload
- Cải thiện image preview
- Thêm plant selection (tùy chọn)
- Cải thiện error handling

## Cách sử dụng

### 1. Chẩn đoán qua hình ảnh
1. Chọn tab "Chẩn đoán qua hình ảnh"
2. Tải lên hình ảnh cây bị bệnh (kéo thả hoặc click chọn)
3. Chọn loại cây (tùy chọn) để tăng độ chính xác
4. Click "Phân tích bệnh"
5. Xem kết quả chẩn đoán

### 2. Chẩn đoán qua triệu chứng
1. Chọn tab "Chẩn đoán qua triệu chứng"
2. Mô tả chi tiết các dấu hiệu bất thường
3. Chọn loại cây (tùy chọn)
4. Click "Phân tích triệu chứng"
5. Xem kết quả chẩn đoán

## Cấu trúc dữ liệu

### DiseaseDetectionResult
```typescript
interface DiseaseDetectionResult {
  detectedDisease: string;           // Tên bệnh
  confidenceScore: number;           // Độ tin cậy (0-100%)
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';
  symptoms: string;                  // Triệu chứng
  causes?: string;                   // Nguyên nhân
  recommendedTreatment: string;      // Hướng dẫn điều trị
  prevention?: string;               // Biện pháp phòng ngừa
  detectionMethod: 'IMAGE' | 'SYMPTOMS' | 'HYBRID' | 'UNKNOWN';
  aiModelVersion: string;           // Phiên bản AI
  alternativeDiseases: string[];     // Các bệnh có thể khác
  treatmentGuide?: TreatmentGuide;   // Hướng dẫn chi tiết
  timestamp: string;                // Thời gian phát hiện
}
```

### TreatmentGuide
```typescript
interface TreatmentGuide {
  steps: TreatmentStep[];            // Các bước điều trị
  estimatedDuration: string;         // Thời gian ước tính
  medications?: string[];            // Thuốc cần thiết
  notes?: string[];                  // Lưu ý
  whenToSeeExpert?: string;          // Khi nào gặp chuyên gia
}
```

## API Endpoints

### 1. Phát hiện bệnh từ hình ảnh
```
POST /api/v1/ai-disease-detection/image
Content-Type: multipart/form-data

Parameters:
- image: File (required)
- plantId: Long (optional)
```

### 2. Phát hiện bệnh từ triệu chứng
```
POST /api/v1/ai-disease-detection/symptoms
Content-Type: application/json

Body:
{
  "description": "string (required)",
  "plantId": "long (optional)"
}
```

## Xử lý lỗi

### HTTP Status Codes
- **200**: Thành công
- **400**: Bad Request - Dữ liệu đầu vào không hợp lệ
- **401**: Unauthorized - Chưa đăng nhập
- **403**: Forbidden - Không có quyền truy cập
- **413**: Payload Too Large - File quá lớn
- **422**: Unprocessable Entity - Validation error
- **429**: Too Many Requests - Vượt quá giới hạn
- **500**: Internal Server Error - Lỗi server
- **502/503/504**: Service Unavailable - AI service không khả dụng

### Error Messages
- Tất cả error messages đều bằng tiếng Việt
- Có hướng dẫn cụ thể để khắc phục
- Logging chi tiết cho developer

## Cấu hình

### Backend Configuration
```yaml
plantcare:
  disease-detection:
    symptom-matching:
      enable-severity-weighting: true
      minimum-confidence-threshold: 0.4
      max-alternative-diseases: 3
      enable-synonym-matching: true
    ai-model:
      plant-id-api-key: ${PLANT_ID_API_KEY}
      timeout-seconds: 30
      retry-attempts: 3
    notification:
      enable-urgent-alerts: true
      alert-threshold: HIGH
```

### Frontend Configuration
```typescript
// environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080',
  maxFileSize: 10 * 1024 * 1024, // 10MB
  supportedImageTypes: ['image/jpeg', 'image/png', 'image/jpg']
};
```

## Monitoring & Logging

### Backend Logging
- Log level: INFO cho production, DEBUG cho development
- Structured logging với MDC (Mapped Diagnostic Context)
- Performance metrics cho API calls
- Error tracking với stack traces

### Frontend Logging
- Console logging cho development
- Error tracking với user context
- Performance monitoring cho image upload
- User interaction analytics

## Testing

### Backend Tests
- Unit tests cho tất cả services
- Integration tests cho API endpoints
- Mock tests cho external APIs
- Performance tests cho image processing

### Frontend Tests
- Unit tests cho components
- Integration tests cho services
- E2E tests cho user workflows
- Accessibility tests

## Deployment

### Backend
- Docker container với JRE 17+
- Health checks cho AI services
- Auto-scaling dựa trên load
- Circuit breaker pattern cho external APIs

### Frontend
- Static hosting với CDN
- Progressive Web App (PWA) features
- Service worker cho offline support
- Performance optimization với lazy loading

## Troubleshooting

### Common Issues

#### 1. Image không được upload
- Kiểm tra file size (tối đa 10MB)
- Kiểm tra file format (JPG, PNG, JPEG)
- Kiểm tra network connection
- Kiểm tra browser console errors

#### 2. AI service không hoạt động
- Kiểm tra Plant.id API key
- Kiểm tra network connectivity
- Kiểm tra API rate limits
- Kiểm tra backend logs

#### 3. Kết quả không chính xác
- Cải thiện chất lượng hình ảnh
- Thêm thông tin về loại cây
- Mô tả triệu chứng chi tiết hơn
- Kiểm tra confidence score

### Debug Mode
```typescript
// Enable debug logging
localStorage.setItem('debug', 'true');

// Check API responses
console.log('API Response:', response);

// Monitor performance
console.time('Image Processing');
// ... processing ...
console.timeEnd('Image Processing');
```

## Future Enhancements

### Planned Features
1. **Multi-language support**: Hỗ trợ tiếng Anh và các ngôn ngữ khác
2. **Offline mode**: Cache kết quả và hoạt động offline
3. **Batch processing**: Xử lý nhiều hình ảnh cùng lúc
4. **Expert consultation**: Kết nối với chuyên gia nông nghiệp
5. **Treatment tracking**: Theo dõi quá trình điều trị
6. **Disease history**: Lịch sử bệnh của cây trồng

### Technical Improvements
1. **AI model updates**: Cập nhật model mới nhất
2. **Performance optimization**: Cải thiện tốc độ xử lý
3. **Mobile app**: Native mobile applications
4. **API versioning**: Version control cho APIs
5. **Microservices**: Tách thành các service riêng biệt

## Support

### Documentation
- API documentation: `/swagger-ui.html`
- Code documentation: Javadoc + JSDoc
- User manual: In-app help system

### Contact
- Technical issues: tech-support@plantcare.com
- Feature requests: product@plantcare.com
- Bug reports: bugs@plantcare.com

### Community
- GitHub repository: [plantcare-backend](https://github.com/plantcare/backend)
- Discussion forum: [community.plantcare.com](https://community.plantcare.com)
- User feedback: [feedback.plantcare.com](https://feedback.plantcare.com)
