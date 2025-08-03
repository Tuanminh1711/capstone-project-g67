export const environment = {
  production: true,
  apiUrl: 'https://plantcare.id.vn/api',  // URL backend production thật
  baseUrl: 'https://plantcare.id.vn',  // Base URL production
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