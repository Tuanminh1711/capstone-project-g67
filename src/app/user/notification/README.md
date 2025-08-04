# Notification System Documentation

## 📋 Tổng quan

Hệ thống thông báo cho ứng dụng PlantCare, bao gồm các tính năng:
- Hiển thị danh sách thông báo có phân trang
- Dropdown thông báo trong navigation bar
- Badge hiển thị số thông báo chưa đọc
- Đánh dấu đã đọc/chưa đọc
- Xóa thông báo
- Real-time updates

## 🏗️ Cấu trúc thư mục

```
src/app/user/notification/
├── notification.model.ts                    # Models & interfaces
├── notification.service.ts                  # Service xử lý API
├── notification-list.component.ts           # Component danh sách full
├── notification-list.component.html
├── notification-list.component.scss
├── notification-badge.component.ts          # Component badge số lượng
├── notification-badge.component.scss
├── notification-dropdown.component.ts       # Component dropdown
├── notification-dropdown.component.html
├── notification-dropdown.component.scss
├── notification-demo.component.ts           # Component demo (dev only)
├── notification.module.ts                   # Module export
└── index.ts                                 # Public API exports
```

## 🔌 API Endpoints

Tương ứng với Backend Spring Boot Controller:

```typescript
GET    /api/notifications              // Lấy danh sách có phân trang
GET    /api/notifications/unread       // Lấy thông báo chưa đọc
GET    /api/notifications/unread-count // Đếm số chưa đọc
POST   /api/notifications/{id}/mark-read     // Đánh dấu đã đọc
POST   /api/notifications/mark-all-read      // Đánh dấu tất cả đã đọc
DELETE /api/notifications/{id}               // Xóa thông báo
```

## 📦 Models

### Notification Interface
```typescript
interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
  relatedEntityId?: number;
  relatedEntityType?: string;
}
```

### NotificationType Enum
```typescript
enum NotificationType {
  SYSTEM = 'SYSTEM',
  PLANT_CARE = 'PLANT_CARE', 
  EXPERT_RESPONSE = 'EXPERT_RESPONSE',
  TICKET_UPDATE = 'TICKET_UPDATE',
  PROMOTION = 'PROMOTION',
  REMINDER = 'REMINDER'
}
```

## 🧩 Components

### 1. NotificationListComponent
**Sử dụng:** Trang `/user/notification` để hiển thị toàn bộ danh sách thông báo

**Features:**
- Phân trang với navigation
- Đánh dấu đã đọc/chưa đọc
- Xóa thông báo
- Loading & error states
- Responsive design
- Click để navigate đến entity liên quan

**Selector:** `<app-notification-list></app-notification-list>`

### 2. NotificationDropdownComponent
**Sử dụng:** Trong navigation bar để hiển thị dropdown thông báo

**Features:**
- Hiển thị 5 thông báo mới nhất chưa đọc
- Badge hiển thị số lượng
- Click outside để đóng
- Đánh dấu đã đọc
- Link đến trang full notification

**Selector:** `<app-notification-dropdown></app-notification-dropdown>`

### 3. NotificationBadgeComponent
**Sử dụng:** Component con của dropdown để hiển thị icon + badge

**Features:**
- Icon notification với animation
- Badge số lượng với pulse effect
- Responsive design

**Selector:** `<app-notification-badge></app-notification-badge>`

## 🔧 Service

### NotificationService

**Reactive State Management:**
```typescript
// Observable streams
unreadCount$: Observable<number>        // Real-time unread count
notifications$: Observable<Notification[]>  // Current notification list

// Methods
getUserNotifications(page, size): Observable<NotificationPage>
getUnreadNotifications(): Observable<Notification[]>
markAsRead(id): Observable<any>
markAllAsRead(): Observable<any>
getUnreadCount(): Observable<number>
deleteNotification(id): Observable<any>
refreshNotifications(): void
getCurrentUnreadCount(): number
```

## 🎨 Styling

### CSS Classes
```scss
// Notification types với màu sắc riêng
.system { color: #636e72; }
.plant-care { color: #00b894; }
.expert { color: #0984e3; }
.ticket { color: #e17055; }
.promotion { color: #fdcb6e; }
.reminder { color: #e84393; }

// States
.unread { border-left: 4px solid #6c5ce7; }
.notification-item:hover { transform: translateY(-1px); }

// Responsive breakpoints
@media (max-width: 768px) { /* Mobile styles */ }
```

## 🚀 Cách sử dụng

### 1. Tích hợp vào Navigation
```typescript
// top-navigator.component.ts
import { NotificationDropdownComponent } from './user/notification';

@Component({
  imports: [NotificationDropdownComponent],
  // ...
})

// top-navigator.html
<app-notification-dropdown></app-notification-dropdown>
```

### 2. Trang Notification Full
```typescript
// Đã được thêm vào app.routes.ts
{ 
  path: 'user/notification', 
  loadComponent: () => import('./user/notification/notification-list.component')
    .then(m => m.NotificationListComponent) 
}
```

### 3. Sử dụng Service
```typescript
// Inject service
constructor(private notificationService: NotificationService) {}

// Subscribe to unread count
this.notificationService.unreadCount$.subscribe(count => {
  console.log('Unread notifications:', count);
});

// Mark as read
this.notificationService.markAsRead(notificationId).subscribe();

// Refresh data
this.notificationService.refreshNotifications();
```

## 🔄 Navigation Logic

Khi click vào notification, sẽ navigate dựa trên `relatedEntityType`:

```typescript
// Auto-navigation based on entity type
'plant' → '/plant-detail/:id'
'ticket' → '/user/ticket/:id'  
'expert' → '/user/expert/:id'
```

## 🧪 Testing

Truy cập `/user/notification-demo` để test tất cả components và features:
- Dropdown notification
- Full notification list
- Service actions
- Real-time updates

## 📱 Responsive Design

- **Desktop:** Full features với hover effects
- **Tablet:** Compact layout
- **Mobile:** Optimized touch interactions, smaller components

## 🛠️ Environment Configuration

Đã được thêm vào `environment.ts`:
```typescript
endpoints: {
  notifications: '/api/notifications'
}
```

## 🎯 Performance

- **Lazy Loading:** Tất cả components đều lazy load
- **Memory Management:** Proper subscription cleanup với takeUntil
- **Pagination:** Server-side pagination để handle large datasets
- **Caching:** Service state management để avoid duplicate requests

## 🔐 Security

- **Authentication:** Tất cả API calls yêu cầu JWT token
- **Authorization:** User chỉ có thể xem notification của mình
- **XSS Protection:** Proper text sanitization trong templates

---

**Developed for PlantCare Application**
**Backend Integration:** Spring Boot NotificationController
**Frontend:** Angular 17+ Standalone Components
