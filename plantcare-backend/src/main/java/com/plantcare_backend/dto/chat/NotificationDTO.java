package com.plantcare_backend.dto.chat;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationDTO {
    private String title;
    private String message;
    private String link;
    private Long timestamp;
    private String type;
}
