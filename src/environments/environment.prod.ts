export const environment = {
  production: true,
  apiUrl: 'https://plantcare.id.vn',  // Base URL without /api
  baseUrl: 'https://plantcare.id.vn',  // Base URL production
  webSocketUrl: 'https://plantcare.id.vn/ws-chat', // WebSocket URL cho production
  endpoints: {
    auth: '/api/auth',
    user: {
      profile: '/api/user/profile',
      updateProfile: '/api/user/updateprofile',
      changePassword: '/api/user/change-password'
    },
    admin: {
      accounts: '/api/admin/accounts',
      plants: '/api/admin/plants'
    },
    notifications: '/api/notifications',
    reports: '/api/plants-report'
  }
};