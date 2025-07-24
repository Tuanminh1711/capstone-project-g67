export const environment = {
  production: true,
  apiUrl: 'http://40.81.23.51:8080/api',  // Đúng IP và port backend
  baseUrl: 'http://40.81.23.51:8080',
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