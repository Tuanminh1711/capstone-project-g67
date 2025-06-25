# PlantCare Frontend

Angular frontend application for PlantCare system.

## 🚀 Development Setup

### Prerequisites
- Node.js 18+
- Angular CLI 17+
- Backend API running on port 8080

### Installation
```bash
npm install
```

### Development Server
```bash
npm start
```
Application will be available at `http://localhost:4200`

### Environment Configuration

#### Development (proxy to localhost:8080)
- Uses proxy configuration for API calls
- All `/api/*` requests are proxied to `http://localhost:8080`

#### Production
- Update `src/environments/environment.prod.ts` with your production API URL
- Build with production configuration

## 🏗️ Build & Deployment

### Local Build
```bash
# Development build
npm run build

# Production build
npm run build:prod
```

### Docker Deployment

#### Build Docker Image
```bash
npm run docker:build
```

#### Run Docker Container
```bash
npm run docker:run
```

#### Full Production Stack
```bash
npm run docker:prod
```

### Manual Production Deployment

1. **Update Environment Configuration**
   ```typescript
   // src/environments/environment.prod.ts
   export const environment = {
     production: true,
     apiUrl: 'https://your-api-domain.com/api',
     baseUrl: 'https://your-api-domain.com',
     // ... other config
   };
   ```

2. **Build for Production**
   ```bash
   npm run build:prod
   ```

3. **Deploy to Web Server**
   - Copy `dist/fe_code/` contents to your web server
   - Configure nginx/apache for Angular routing
   - Set up SSL certificates

## 🔧 Configuration

### API Endpoints
All API endpoints are configured in `src/environments/environment.ts`:
- User Profile: `/api/user/profile`
- Update Profile: `/api/user/updateprofile`
- Change Password: `/api/user/change-password`

### Features
- ✅ User Profile Management
- ✅ Avatar Upload with validation
- ✅ Password Change
- ✅ Responsive Design
- ✅ Error Handling
- ✅ Loading States
- ✅ Environment-based Configuration

### Security Features
- ✅ JWT Token Authentication
- ✅ HTTP Interceptors
- ✅ CORS Handling
- ✅ Input Validation
- ✅ Security Headers (in nginx config)

## 📁 Project Structure
```
src/
├── app/
│   ├── profile/
│   │   ├── edit-user-profile/
│   │   ├── change-password/
│   │   └── user-profile.service.ts
│   ├── shared/
│   │   ├── config.service.ts
│   │   └── api.interceptor.ts
│   └── environments/
├── environments/
│   ├── environment.ts
│   └── environment.prod.ts
└── assets/
```

## 🐳 Docker Configuration

### Dockerfile
- Multi-stage build for optimization
- Nginx for serving static files
- Production-ready configuration

### docker-compose.prod.yml
- Full stack deployment
- Frontend + Backend + Database
- Network configuration
- Volume persistence

## 🔒 Security Considerations

1. **Environment Variables**: Never commit sensitive data to version control
2. **API URLs**: Use environment-specific configurations
3. **HTTPS**: Always use HTTPS in production
4. **CSP Headers**: Configure Content Security Policy
5. **Token Storage**: Secure JWT token handling

## 📝 Environment Variables for Production

```bash
# Frontend Environment
NODE_ENV=production
API_URL=https://your-api-domain.com/api

# Backend Environment (if using docker-compose)
SPRING_PROFILES_ACTIVE=prod
DATABASE_URL=jdbc:postgresql://db:5432/plantcare_db
DATABASE_USERNAME=plantcare_user
DATABASE_PASSWORD=secure_password
```

## 🛠️ Troubleshooting

### CORS Issues
- Development: Uses proxy configuration
- Production: Configure backend CORS settings

### Build Issues
- Clear node_modules: `rm -rf node_modules && npm install`
- Clear Angular cache: `ng cache clean`

### Runtime Issues
- Check browser console for errors
- Verify API endpoint connectivity
- Check environment configuration

## 📱 Browser Support
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
