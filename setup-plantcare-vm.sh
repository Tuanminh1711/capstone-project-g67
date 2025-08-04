#!/bin/bash

echo "🚀 Setting up PlantCare VM environment..."

# Update system
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

# Secure MySQL installation
echo "🔒 Securing MySQL installation..."
sudo mysql_secure_installation

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
sudo mysql -e "CREATE DATABASE IF NOT EXISTS plantcare_db;"
sudo mysql -e "CREATE USER IF NOT EXISTS 'plantcare_user'@'localhost' IDENTIFIED BY 'PlantCare@2024';"
sudo mysql -e "GRANT ALL PRIVILEGES ON plantcare_db.* TO 'plantcare_user'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"

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

# Enable auto-shutdown (8 PM daily)
echo "⏰ Setting up auto-shutdown..."
sudo tee /etc/systemd/system/auto-shutdown.service > /dev/null <<EOF
[Unit]
Description=Auto shutdown VM at 8 PM
After=network.target

[Service]
Type=oneshot
ExecStart=/usr/sbin/shutdown -h +0

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload

echo "✅ Server setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Upload your Spring Boot JAR file to /opt/plantcare/"
echo "2. Update application.yml with MySQL connection details"
echo "3. Start the service: sudo systemctl start plantcare"
echo "4. Enable auto-start: sudo systemctl enable plantcare"
echo ""
echo "🌐 VM Details:"
echo "Public IP: 20.2.84.27"
echo "SSH: ssh azureuser@20.2.84.27"
echo "Application URL: http://20.2.84.27:8080/api" 