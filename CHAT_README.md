# Chat Feature Configuration

## Overview
Tính năng chat VIP/Expert hiện đã được cấu hình để hoạt động trên cả môi trường development và production.

## Environment Support

### Development (localhost:4200)
- WebSocket endpoint: `/ws` (proxy to localhost:8080)
- Chat history API: `/chat/history` (proxy to localhost:8080)
- Full chat functionality enabled

### Production (plantcare.id.vn)
- WebSocket endpoint: `https://plantcare.id.vn/ws`
- Chat history API: `https://plantcare.id.vn/chat/history`
- Full chat functionality enabled

## Backend Requirements

Đảm bảo backend có các endpoints sau:

1. **WebSocket Configuration**
   ```java
   @Configuration
   @EnableWebSocketMessageBroker
   public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
       @Override
       public void configureMessageBroker(MessageBrokerRegistry config) {
           config.enableSimpleBroker("/topic");
           config.setApplicationDestinationPrefixes("/app");
       }

       @Override
       public void registerStompEndpoints(StompEndpointRegistry registry) {
           registry.addEndpoint("/ws")
                   .setAllowedOriginPatterns("*")
                   .withSockJS();
       }
   }
   ```

2. **Chat Controller Endpoints**
   - `POST /app/chat.sendMessage` - Send message via WebSocket
   - `GET /chat/history` - Get chat history via HTTP

## Frontend Architecture

### Services
- `UrlService`: Manages environment-aware URLs
- `ChatStompService`: WebSocket connection management
- `ChatComponent`: UI component for chat interface

### Environment Detection
- **Build Configuration**: `environment.production`
- **Runtime Detection**: `window.location.hostname.includes('plantcare.id.vn')`
- **Auto URL Resolution**: Service automatically selects correct backend URLs

## User Access Control
- Only VIP and EXPERT roles can access chat
- Authentication required via AuthService
- Real-time message validation

## Development Setup

1. Start backend on port 8080
2. Run frontend: `npm run start`
3. Chat available at: http://localhost:4200/vip-chat

## Production Deployment

1. Build with production config: `ng build --configuration production`
2. Deploy to plantcare.id.vn
3. Ensure backend WebSocket endpoint is accessible
4. Chat automatically works on production domain

## Security Features
- CORS properly configured for both environments
- Authentication-based access control
- WebSocket message validation
- Environment-aware error handling

## Troubleshooting

### WebSocket Connection Issues
- Check browser console for connection logs
- Verify backend WebSocket endpoint is running
- Ensure CORS is properly configured

### Chat History Not Loading
- Check network tab for API calls
- Verify backend `/chat/history` endpoint
- Check authentication tokens

### Permission Denied
- Ensure user has VIP or EXPERT role
- Check AuthService.getCurrentUserRole()
- Verify authentication state
