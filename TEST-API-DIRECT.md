# Test API Direct - COOKIE VERSION

Để kiểm tra backend API trực tiếp, hãy mở Console trong browser và thử:

## 1. Kiểm tra token hiện tại:
```javascript
// Lấy token từ cookie
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}
console.log('Token:', getCookie('auth_token'));
```

## 2. Test API health:
```javascript
fetch('/api/health')
  .then(response => response.text())
  .then(data => console.log('Health check:', data))
  .catch(error => console.error('Error:', error));
```

## 3. Test get current user:
```javascript
// Token sẽ tự động được thêm bởi interceptor
fetch('/api/user-profile/me', {
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => console.log('Current user:', data))
.catch(error => console.error('Error:', error));
```

## 4. Test update profile:
```javascript
// Token sẽ tự động được thêm bởi interceptor
fetch('/api/user-profile/update', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    id: 1, // Thay bằng user ID thực
    fullName: "Test Name",
    phoneNumber: "1234567890",
    livingEnvironment: "INDOOR",
    avatar: "",
    gender: "MALE"
  })
})
.then(response => response.text())
.then(data => console.log('Update result:', data))
.catch(error => console.error('Error:', error));
```

Chạy từng command này trong Console để xem kết quả và xác định vấn đề.
