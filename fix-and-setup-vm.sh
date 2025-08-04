#!/bin/bash

echo "🚀 Starting VM setup and environment installation..."

# Update system packages
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Java 17
echo "☕ Installing Java 17..."
sudo apt install -y openjdk-17-jdk openjdk-17-jre

# Verify Java installation
echo "✅ Java version:"
java -version

# Install MySQL Server
echo "🗄️ Installing MySQL Server..."
sudo apt install -y mysql-server

# Start and enable MySQL service
echo "🔄 Starting MySQL service..."
sudo systemctl start mysql
sudo systemctl enable mysql

# Secure MySQL installation (automated)
echo "🔒 Securing MySQL installation..."
sudo mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'Root@2024';"
sudo mysql -e "DELETE FROM mysql.user WHERE User='';"
sudo mysql -e "DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1', '::1');"
sudo mysql -e "DROP DATABASE IF EXISTS test;"
sudo mysql -e "DELETE FROM mysql.db WHERE Db='test' OR Db='test\\_%';"
sudo mysql -e "FLUSH PRIVILEGES;"

# Install additional tools
echo "🛠️ Installing additional tools..."
sudo apt install -y git curl wget unzip

# Install Maven
echo "📚 Installing Maven..."
sudo apt install -y maven

# Verify Maven installation
echo "✅ Maven version:"
mvn -version

# Create application directory
echo "📁 Creating application directory..."
sudo mkdir -p /opt/plantcare
sudo chown azureuser:azureuser /opt/plantcare

# Create logs directory
sudo mkdir -p /opt/plantcare/logs
sudo chown azureuser:azureuser /opt/plantcare/logs

# Create uploads directory
sudo mkdir -p /opt/plantcare/uploads
sudo chown azureuser:azureuser /opt/plantcare/uploads

# Configure firewall
echo "🔥 Configuring firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 8080/tcp
sudo ufw allow 3306/tcp
sudo ufw --force enable

# Create MySQL database and user
echo "🗄️ Setting up MySQL database..."
sudo mysql -u root -p'Root@2024' -e "CREATE DATABASE IF NOT EXISTS plantcare_db;"
sudo mysql -u root -p'Root@2024' -e "CREATE USER IF NOT EXISTS 'plantcare_user'@'localhost' IDENTIFIED BY 'PlantCare@2024';"
sudo mysql -u root -p'Root@2024' -e "GRANT ALL PRIVILEGES ON plantcare_db.* TO 'plantcare_user'@'localhost';"
sudo mysql -u root -p'Root@2024' -e "FLUSH PRIVILEGES;"

# Create systemd service file
echo "⚙️ Creating systemd service file..."
sudo tee /etc/systemd/system/plantcare.service > /dev/null <<EOF
[Unit]
Description=PlantCare Spring Boot Application
After=network.target mysql.service

[Service]
Type=simple
User=azureuser
WorkingDirectory=/opt/plantcare
ExecStart=/usr/bin/java -jar plantcare-backend.jar
Restart=always
RestartSec=10
Environment="SPRING_PROFILES_ACTIVE=prod"
Environment="JAVA_OPTS=-Xmx1024m -Xms512m"

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd
sudo systemctl daemon-reload

# Create application configuration
echo "⚙️ Creating application configuration..."
sudo tee /opt/plantcare/application-prod.yml > /dev/null <<EOF
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/plantcare_db?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
    username: plantcare_user
    password: PlantCare@2024
    driver-class-name: com.mysql.cj.jdbc.Driver
    hikari:
      maximum-pool-size: 10
      minimum-idle: 5
      connection-timeout: 30000
      idle-timeout: 600000
      max-lifetime: 1800000
  
  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: false
    properties:
      hibernate:
        dialect: org.hibernate.dialect.MySQL8Dialect
        format_sql: false
  
  flyway:
    enabled: true
    baseline-on-migrate: true
    locations: classpath:db/migration

server:
  port: 8080
  servlet:
    context-path: /api

logging:
  level:
    com.plantcare_backend: INFO
    org.springframework.security: INFO
    org.hibernate.SQL: WARN
    org.hibernate.type.descriptor.sql.BasicBinder: WARN
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss} - %msg%n"
    file: "%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n"
  file:
    name: /opt/plantcare/logs/plantcare.log
    max-size: 10MB
    max-history: 30

management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics
  endpoint:
    health:
      show-details: when-authorized

jwt:
  secret: PlantCareSecretKey2024ForProductionUseOnlyMakeItLongAndSecure
  expiration: 86400000

file:
  upload:
    path: /opt/plantcare/uploads/
    max-size: 10485760

rate-limit:
  requests-per-minute: 100
EOF

sudo chown azureuser:azureuser /opt/plantcare/application-prod.yml

# Set proper permissions
sudo chown -R azureuser:azureuser /opt/plantcare

echo "✅ Server setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Upload your Spring Boot JAR file to /opt/plantcare/"
echo "2. Start the service: sudo systemctl start plantcare"
echo "3. Enable auto-start: sudo systemctl enable plantcare"
echo ""
echo "🌐 VM Details:"
echo "Public IP: 20.2.84.27"
echo "SSH: ssh azureuser@20.2.84.27"
echo "Application URL: http://20.2.84.27:8080/api"
echo "Health Check: http://20.2.84.27:8080/api/actuator/health" 