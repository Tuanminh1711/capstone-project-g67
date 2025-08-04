# Backend WebSocket Configuration Required

## Vấn đề hiện tại
Frontend đang cố gắng kết nối WebSocket tới `/ws` endpoint nhưng backend chưa có cấu hình WebSocket.

## Lỗi đang gặp phải
```
GET http://localhost:8080/ws/info?t=1754332596205 500 (Internal Server Error)
```

## Giải pháp - Cần thêm vào Backend Spring Boot

### 1. Thêm dependency vào pom.xml
```xml
<dependency>
    <groupId>org.springframework</groupId>
    <artifactId>spring-websocket</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework</groupId>
    <artifactId>spring-messaging</artifactId>
</dependency>
```

### 2. Tạo WebSocket Configuration
```java
package com.plantcare_backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Enable in-memory message broker to carry messages back to the client
        config.enableSimpleBroker("/topic", "/queue");
        
        // Prefix for messages that are bound for methods annotated with @MessageMapping
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Register STOMP endpoint that clients will use to connect to WebSocket server
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*") // Allow all origins for development
                .withSockJS(); // Enable SockJS fallback options
    }
}
```

### 3. Cập nhật Security Configuration (nếu có)
```java
// Trong SecurityConfig.java, thêm:
@Override
public void configure(WebSecurity web) throws Exception {
    web.ignoring().antMatchers("/ws/**");
}

// Hoặc trong SecurityFilterChain:
.requestMatchers("/ws/**").permitAll()
```

### 4. Kiểm tra ChatController
ChatController hiện tại đã có:
- `@MessageMapping("/chat.sendMessage")` ✅
- `@SendTo("/topic/vip-community")` ✅ 
- `@GetMapping("/chat/history")` ✅

Chỉ cần thêm WebSocketConfig là sẽ hoạt động.

### 5. Test WebSocket
Sau khi thêm config, restart backend server và test:
- Endpoint: `http://localhost:8080/ws`
- SockJS info: `http://localhost:8080/ws/info` (sẽ trả về JSON thay vì 500)

## Frontend đã sẵn sàng
Frontend đã được cấu hình để:
- Kết nối tới `/ws` endpoint
- Xử lý lỗi gracefully  
- Hiển thị thông báo user-friendly
- Fallback khi WebSocket không khả dụng

## Cách test
1. Thêm WebSocketConfig vào backend
2. Restart backend server
3. Mở chat page trên frontend
4. Kiểm tra console - không còn lỗi 500
5. Thử gửi message qua chat interface
