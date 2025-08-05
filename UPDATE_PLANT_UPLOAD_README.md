# Update Plant Component với Upload Ảnh

## Tổng quan
Đã thêm tính năng upload ảnh vào component update-plant, cho phép người dùng cập nhật ảnh của cây trong vườn cá nhân.

## Tính năng đã implement

### 1. Frontend Features
- ✅ **File Upload Interface**: Drag & drop area để chọn ảnh
- ✅ **Image Preview**: Xem trước ảnh đã chọn trước khi upload
- ✅ **File Validation**: 
  - Chỉ chấp nhận file ảnh (image/*)
  - Giới hạn kích thước tối đa 5MB mỗi ảnh
  - Tối đa 5 ảnh cùng lúc
- ✅ **Progress Indicators**: Loading states và thông báo tiến trình
- ✅ **Error Handling**: Xử lý lỗi upload và validation

### 2. Technical Implementation
- ✅ **Sequential Upload**: Upload từng ảnh một để tránh overload server
- ✅ **Memory Management**: Tự động clean up blob URLs để tránh memory leak
- ✅ **Type Safety**: TypeScript interfaces và proper typing
- ✅ **Reactive Forms**: Integration với Angular reactive forms
- ✅ **Service Layer**: Separation of concerns với dedicated service methods

### 3. Backend Integration
- ✅ **Upload Endpoint**: `/api/user-plants/upload-plant-image`
- ✅ **Update Endpoint**: `/api/user-plants/update` (với imageUrls)
- ✅ **Response Handling**: Proper error và success response handling

## Workflow của Upload Process

```
1. User chọn ảnh → onImageSelected()
2. Validate files (type, size, quantity)
3. Create preview URLs cho user
4. User submit form → onSubmit()
5. Nếu có ảnh mới:
   a. Upload từng ảnh → uploadPlantImage()
   b. Collect URLs từ response
   c. Update plant info + imageUrls → updateUserPlant()
6. Nếu không có ảnh mới:
   - Chỉ update plant info
7. Success: Clear form, navigate về my-garden
```

## File Structure

### Modified Files:
```
src/app/user/plant/update-plant/
├── update-plant.component.html    # Added image upload UI
├── update-plant.component.scss    # Added upload styling
└── update-plant.component.ts      # Added upload logic

src/app/user/plant/my-garden/
└── my-garden.service.ts           # Added upload methods
```

### Key Methods Added:

#### Component Methods:
- `onImageSelected(event)` - Handle file selection
- `triggerFileInput()` - Trigger file input click
- `removeSelectedImage(index)` - Remove image from selection
- `uploadImagesAndUpdatePlant()` - Main upload workflow
- `updatePlantWithImages()` - Update plant with image URLs
- `clearImagePreviews()` - Memory cleanup

#### Service Methods:
- `uploadPlantImage(file)` - Upload single image
- `updateUserPlant()` - Updated to handle imageUrls

## UI Components

### 1. File Upload Area
```html
<div class="file-upload-area" (click)="triggerFileInput()">
  <div class="upload-content">
    <i class="upload-icon">📸</i>
    <p class="upload-text">Nhấn để chọn ảnh mới</p>
    <small class="upload-hint">Hỗ trợ nhiều ảnh, định dạng JPG, PNG</small>
  </div>
</div>
```

### 2. Image Preview Grid
```html
<div class="image-preview-grid">
  @for (image of selectedImages; track image; let i = $index) {
    <div class="image-preview-item">
      <img [src]="getImagePreview(image)" />
      <button (click)="removeSelectedImage(i)">✕</button>
    </div>
  }
</div>
```

## Validation Rules
- **File Type**: Chỉ chấp nhận image/*
- **File Size**: Tối đa 5MB mỗi file
- **Quantity**: Tối đa 5 ảnh cùng lúc
- **Required**: Ảnh là optional, có thể chỉ update thông tin

## Error Handling
- **Network Errors**: Retry mechanism và user-friendly messages
- **Validation Errors**: Inline error messages
- **Partial Success**: Nếu một số ảnh upload fail, vẫn tiếp tục với ảnh khác
- **Memory Management**: Auto cleanup blob URLs

## Responsive Design
- **Mobile**: Touch-friendly upload area
- **Tablet**: Grid layout adapts to screen size
- **Desktop**: Full feature set với hover effects

## Future Enhancements
- [ ] Drag & drop file upload
- [ ] Image compression before upload
- [ ] Bulk image operations
- [ ] Image cropping/editing
- [ ] Progress bars cho từng ảnh
- [ ] Retry failed uploads

## Testing Checklist
- ✅ Upload single image
- ✅ Upload multiple images
- ✅ File validation (type, size)
- ✅ Preview functionality
- ✅ Remove image from selection
- ✅ Form submission with images
- ✅ Form submission without images
- ✅ Error handling
- ✅ Memory cleanup
- ✅ Mobile responsive
- ✅ Loading states

## Backend Requirements
Backend cần support:
1. `POST /api/user-plants/upload-plant-image` - Upload single image
2. `PUT /api/user-plants/update` - Update plant info với imageUrls field

Response format cho upload:
```json
{
  "status": 200,
  "message": "Upload thành công",
  "data": "image-url-string"
}
```
