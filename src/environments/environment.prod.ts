export const environment = {
  production: true,
  apiUrl: 'https://your-api-domain.com/api',  // Thay đổi thành domain thực của bạn
  baseUrl: 'https://your-api-domain.com',
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
