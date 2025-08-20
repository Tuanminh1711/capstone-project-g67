export const environment = {
  production: false,
  apiUrl: '/api',  // Sử dụng proxy trong development
  baseUrl: '',  // Sử dụng URL tương đối trong development
  webSocketUrl: 'http://localhost:8080/ws-chat', // WebSocket URL cho development
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