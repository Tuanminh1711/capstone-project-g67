# Hướng dẫn Test Khắc phục Lỗi Chat

## Vấn đề đã được khắc phục:
- **Tin nhắn 1-1 xuất hiện trong group chat**: Đã tách riêng việc xử lý tin nhắn cộng đồng và tin nhắn riêng tư
- **Backend**: Tin nhắn riêng tư được gửi đến `/user/queue/private-messages`, tin nhắn cộng đồng được gửi đến `/topic/vip-community`
- **Frontend**: Đã tạo các subscription riêng biệt và logic lọc để tránh hiển thị sai tin nhắn

## Các thay đổi chính:

### 1. ChatStompService (VIP Chat)
- Tách riêng `communityMessageSubject` và `privateMessageSubject`
- Thêm `onCommunityMessage()` và `onPrivateMessage()`
- Đảm bảo `chatType` được set đúng cho từng loại tin nhắn

### 2. ExpertChatStompService (Expert Chat)
- Cập nhật để sử dụng WebSocket thực sự
- Tách riêng việc xử lý tin nhắn cộng đồng và tin nhắn riêng tư
- Đồng bộ với logic của VIP chat

### 3. ChatComponent (VIP)
- Sử dụng `onCommunityMessage()` cho tin nhắn cộng đồng
- Sử dụng `onPrivateMessage()` cho tin nhắn riêng tư
- Thêm logic lọc để chỉ hiển thị tin nhắn phù hợp với chế độ hiện tại

### 4. ExpertChatComponent (Expert)
- Cập nhật để sử dụng `ExpertChatStompService`
- Thêm logic lọc tương tự như VIP chat

## Cách Test:

### Test 1: Tin nhắn cộng đồng
1. Đăng nhập với tài khoản VIP
2. Vào phòng chat cộng đồng
3. Gửi một tin nhắn
4. **Kết quả mong đợi**: Tin nhắn chỉ xuất hiện trong group chat, không xuất hiện trong private chat

### Test 2: Tin nhắn riêng tư
1. Đăng nhập với tài khoản VIP
2. Chuyển sang chế độ private chat
3. Chọn một expert và gửi tin nhắn riêng tư
4. **Kết quả mong đợi**: Tin nhắn chỉ xuất hiện trong private chat với expert đó, không xuất hiện trong group chat

### Test 3: Expert nhận tin nhắn
1. Đăng nhập với tài khoản Expert
2. Vào phòng chat expert
3. **Kết quả mong đợi**: 
   - Expert chỉ thấy tin nhắn cộng đồng trong group chat
   - Expert chỉ thấy tin nhắn riêng tư liên quan đến mình

### Test 4: Chuyển đổi giữa các chế độ
1. Đăng nhập với tài khoản VIP
2. Gửi tin nhắn cộng đồng
3. Chuyển sang private chat và gửi tin nhắn riêng tư
4. Quay lại group chat
5. **Kết quả mong đợi**: 
   - Group chat chỉ hiển thị tin nhắn cộng đồng
   - Private chat chỉ hiển thị tin nhắn riêng tư

## Kiểm tra Console Log:
- Mở Developer Tools (F12)
- Chuyển đến tab Console
- Quan sát các log:
  - `📨 Received community message:` cho tin nhắn cộng đồng
  - `📨 Received private message:` cho tin nhắn riêng tư
  - Đảm bảo không có tin nhắn riêng tư xuất hiện trong group chat

## Kiểm tra Database:
1. Truy vấn bảng `chat_messages`
2. Kiểm tra cột `chat_type`:
   - Tin nhắn cộng đồng: `COMMUNITY`
   - Tin nhắn riêng tư: `PRIVATE`
3. Đảm bảo không có tin nhắn riêng tư nào có `chat_type = 'COMMUNITY'`

## Nếu vẫn còn vấn đề:
1. Kiểm tra WebSocket connection trong tab Network
2. Quan sát các frame WebSocket để đảm bảo tin nhắn được gửi đúng kênh
3. Kiểm tra logic lọc trong component có hoạt động đúng không
