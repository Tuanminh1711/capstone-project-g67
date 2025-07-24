export const environment = {
  production: false,
  apiUrl: '/api',  // Sử dụng proxy trong development
  baseUrl: 'http://localhost:8080',
  wsUrl: 'http://localhost:8080', // WebSocket URL
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
    }
  }
};