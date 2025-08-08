export interface ConversationDTO {
  conversationId: string;
  otherUserId: number;
  otherUsername: string;
  otherUserRole: string;
  lastMessage?: string;
  lastMessageTime?: string;
  hasUnreadMessages?: boolean;
}