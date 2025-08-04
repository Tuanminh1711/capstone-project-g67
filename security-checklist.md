# Security Checklist for Production Server

## 1. SSH Security
- [ ] Change default SSH port (optional)
- [ ] Disable root login
- [ ] Use SSH key authentication only
- [ ] Configure fail2ban for SSH protection

## 2. Firewall Configuration
- [ ] Enable UFW firewall
- [ ] Only allow necessary ports (22, 80, 443, 8080)
- [ ] Block all other incoming traffic

## 3. MySQL Security
- [ ] Change default MySQL root password
- [ ] Remove anonymous users
- [ ] Remove test database
- [ ] Create application-specific user with limited privileges
- [ ] Configure MySQL to bind only to localhost

## 4. Application Security
- [ ] Use strong JWT secret
- [ ] Enable HTTPS (configure SSL certificate)
- [ ] Set secure headers
- [ ] Configure rate limiting
- [ ] Validate all inputs
- [ ] Use environment variables for sensitive data

## 5. System Updates
- [ ] Enable automatic security updates
- [ ] Regular system updates
- [ ] Monitor security advisories

## 6. Monitoring and Logging
- [ ] Configure application logging
- [ ] Set up log rotation
- [ ] Monitor system resources
- [ ] Set up alerts for high resource usage

## 7. Backup Strategy
- [ ] Regular database backups
- [ ] Application file backups
- [ ] Test backup restoration
- [ ] Store backups in secure location

## 8. SSL/HTTPS Configuration
- [ ] Obtain SSL certificate (Let's Encrypt)
- [ ] Configure Nginx as reverse proxy
- [ ] Redirect HTTP to HTTPS
- [ ] Configure secure SSL parameters 