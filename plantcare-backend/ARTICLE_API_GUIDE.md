# Article API Guide for Expert

## Overview
Chức năng tạo article cho expert được thiết kế theo pattern tương tự như `createPlantManager` của admin, với đầy đủ validation và error handling.

## Endpoints

### 1. Create Article
**POST** `/api/expert/create-article`

Tạo một article mới bởi expert.

**Request Body:**
```json
{
  "title": "How to Care for Indoor Plants",
  "content": "Indoor plants require special care...",
  "categoryId": "1",
  "imageUrls": [
    "/api/expert/articles/image1.jpg",
    "/api/expert/articles/image2.jpg"
  ]
}
```

**Response:**
```json
{
  "status": 201,
  "message": "Article created successfully",
  "data": 1
}
```

### 2. Upload Article Image
**POST** `/api/expert/upload-article-image`

Upload ảnh cho article.

**Request:**
- Content-Type: `multipart/form-data`
- Parameter: `image` (file)

**Response:**
```json
{
  "status": 200,
  "message": "Upload thành công",
  "data": "/api/expert/articles/uuid-filename.jpg"
}
```

### 3. Get Article Image
**GET** `/api/expert/articles/{filename}`

Lấy ảnh article theo filename.

## Validation Rules

### CreateArticleRequestDTO
- `title`: Không được trống, tối đa 200 ký tự
- `content`: Không được trống, tối đa 5000 ký tự  
- `categoryId`: Không được null
- `imageUrls`: Không được null

### Business Rules
- Category phải tồn tại và có status ACTIVE
- Title không được trùng lặp (case-insensitive)
- Expert phải tồn tại trong hệ thống
- Article được tạo với status DRAFT mặc định

## Error Handling

### Common Errors
- `400 Bad Request`: Validation errors
- `404 Not Found`: Category hoặc Expert không tồn tại
- `500 Internal Server Error`: Server errors

### Error Response Format
```json
{
  "status": 400,
  "message": "Category is not active: Test Category",
  "data": null
}
```

## Implementation Details

### Service Layer (ExpertServiceImpl)
- Validation category tồn tại và active
- Validation title không trùng lặp
- Tạo article với status DRAFT
- Xử lý images nếu có
- Logging đầy đủ

### Controller Layer (ExpertController)
- Validation request body
- Error handling với try-catch
- Activity logging
- Swagger documentation

### Repository Layer
- `ArticleRepository`: CRUD operations cho Article
- `ArticleImageRepository`: CRUD operations cho ArticleImage
- `ArticleCategoryRepository`: CRUD operations cho ArticleCategory

## Database Schema

### Article Table
```sql
CREATE TABLE care_articles (
  article_id BIGINT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL,
  content TEXT,
  category_id BIGINT,
  author_id BIGINT,
  status ENUM('PUBLISHED', 'DRAFT', 'DELETED') DEFAULT 'DRAFT',
  created_by VARCHAR(255),
  created_at VARCHAR(255),
  updated_at VARCHAR(255)
);
```

### ArticleImage Table
```sql
CREATE TABLE article_images (
  image_id BIGINT PRIMARY KEY AUTO_INCREMENT,
  article_id BIGINT NOT NULL,
  image_url VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Usage Example

### 1. Upload Image
```bash
curl -X POST http://localhost:8080/api/expert/upload-article-image \
  -H "Content-Type: multipart/form-data" \
  -F "image=@/path/to/image.jpg"
```

### 2. Create Article
```bash
curl -X POST http://localhost:8080/api/expert/create-article \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "title": "Plant Care Guide",
    "content": "This is a comprehensive guide...",
    "categoryId": "1",
    "imageUrls": ["/api/expert/articles/image1.jpg"]
  }'
```

## Notes
- Article được tạo với status DRAFT mặc định
- Images được lưu trong thư mục `uploads/articles/`
- Activity log được ghi lại cho mọi thao tác
- API tuân thủ RESTful conventions 