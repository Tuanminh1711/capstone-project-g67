# WebSocket Chat Configuration Update

## Summary of Changes

### Fixed WebSocket Authentication Issues

Đã sửa các vấn đề với WebSocket chat để hỗ trợ authentication và endpoint `/ws-chat` như yêu cầu của backend.

## Changes Made

### 1. Updated WebSocket Endpoint
- **Before**: `/ws`
- **After**: `/ws-chat`
- **Files changed**: 
  - `src/app/shared/url.service.ts`
  - `proxy.conf.json`

### 2. Added Authentication Support
- **Added**: Authorization header support in WebSocket connection
- **Method**: Bearer token in `connectHeaders`
- **Files changed**:
  - `src/app/vip/chat/chat-stomp.service.ts`

### 3. Enhanced Error Handling
- **Added**: Authentication check before connecting
- **Added**: Better error messages for auth failures
- **Added**: Connection refresh capability

### 4. Fixed TypeScript Errors
- **Added**: Missing `destroy$` Subject in ChatComponent
- **Fixed**: Import statements for RxJS operators
- **Removed**: Non-existent `loginSuccess$` subscription

## Technical Details

### WebSocket Connection Flow
1. **Check Authentication**: Verify auth token exists
2. **Create SockJS Client**: With authentication headers
3. **Connect**: Using Bearer token in STOMP headers
4. **Subscribe**: To `/topic/vip-community` channel

### Authentication Headers
```typescript
connectHeaders: {
  'Authorization': `Bearer ${token}`
}
```

### Environment Support
- **Development**: `localhost:4200/ws-chat` → `localhost:8080/ws-chat`
- **Production**: `plantcare.id.vn/ws-chat`

## Backend Requirements Met

✅ **Endpoint**: Now uses `/ws-chat` instead of `/ws`  
✅ **Authorization**: Sends `Authorization: Bearer <token>` header  
✅ **Info Endpoint**: `/ws-chat/info` will include auth headers  

## Files Modified

### Frontend Changes
1. **src/app/shared/url.service.ts**
   - Updated `getWebSocketUrl()` to return `/ws-chat`

2. **src/app/vip/chat/chat-stomp.service.ts**
   - Added `CookieService` injection for token access
   - Enhanced `initializeConnection()` with auth headers
   - Added `refreshConnection()` method
   - Improved error handling for auth failures

3. **src/app/vip/chat/chat.component.ts**
   - Added `destroy$` Subject for subscription management
   - Fixed imports and TypeScript errors
   - Enhanced error handling

4. **proxy.conf.json**
   - Updated WebSocket proxy from `/ws` to `/ws-chat`

## Usage

### Development
1. Start backend with `/ws-chat` endpoint
2. Run frontend: `npm run start`
3. Login with VIP/EXPERT account
4. Access chat at: `http://localhost:4200/vip-chat`

### Production
1. Deploy with proper authentication
2. Ensure `/ws-chat` endpoint is accessible
3. Chat will automatically work with auth headers

## Security Features

- ✅ **Authentication Required**: No connection without valid token
- ✅ **Bearer Token**: Proper Authorization header format
- ✅ **Role-based Access**: VIP/EXPERT only
- ✅ **Auto-disconnect**: On auth failures

## Troubleshooting

### Common Issues

1. **"Cần đăng nhập để sử dụng chat"**
   - **Cause**: No auth token found
   - **Solution**: Login with valid account

2. **WebSocket connection failed**
   - **Cause**: Backend `/ws-chat` not available
   - **Solution**: Check backend WebSocket configuration

3. **STOMP connection errors**
   - **Cause**: Authorization header rejected
   - **Solution**: Verify token format and backend auth

### Debug Logs
Console will show:
- WebSocket URL being used
- Auth token status (found/not found)
- Connection attempts and results
- STOMP protocol messages

## Next Steps

1. **Test** with actual VIP/EXPERT accounts
2. **Verify** WebSocket messages are sent/received correctly
3. **Monitor** backend logs for authentication success
4. **Deploy** to production environment

## Backend Integration

Backend should now receive:
- **WebSocket connections** to `/ws-chat`
- **Authorization headers** with Bearer tokens
- **Proper authentication** for all chat operations
