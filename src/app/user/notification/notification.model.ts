export interface Notification {
  id: number;
  userId?: number;
  title: string;
  message: string;
  type: NotificationType | string;
  isRead: boolean;
  status?: 'READ' | 'UNREAD';
  link?: string | null;
  createdAt: string | number;
  updatedAt?: string | number;
  relatedEntityId?: number;
  relatedEntityType?: string;
}

export enum NotificationType {
  SYSTEM = 'SYSTEM',
  PLANT_CARE = 'PLANT_CARE', 
  EXPERT_RESPONSE = 'EXPERT_RESPONSE',
  TICKET_UPDATE = 'TICKET_UPDATE',
  PROMOTION = 'PROMOTION',
  REMINDER = 'REMINDER'
}

export interface NotificationPage {
  content: Notification[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export interface NotificationResponse {
  code: number;
  message: string;
  data: NotificationPage | Notification[] | number;
}
