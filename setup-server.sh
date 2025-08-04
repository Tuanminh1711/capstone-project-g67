#!/bin/bash

# Update system
echo "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Java 17 (OpenJDK)
echo "Installing Java 17..."
sudo apt install -y openjdk-17-jdk openjdk-17-jre

# Verify Java installation
echo "Java version:"
java -version

# Install MySQL Server
echo "Installing MySQL Server..."
sudo apt install -y mysql-server

# Start and enable MySQL service
echo "Starting MySQL service..."
sudo systemctl start mysql
sudo systemctl enable mysql

# Secure MySQL installation
echo "Securing MySQL installation..."
sudo mysql_secure_installation

# Install additional tools
echo "Installing additional tools..."
sudo apt install -y git curl wget unzip

# Install Maven (for building Spring Boot projects)
echo "Installing Maven..."
sudo apt install -y maven

# Verify Maven installation
echo "Maven version:"
mvn -version

# Create application directory
echo "Creating application directory..."
sudo mkdir -p /opt/plantcare
sudo chown azureuser:azureuser /opt/plantcare

# Configure firewall
echo "Configuring firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 8080/tcp
sudo ufw allow 3306/tcp
sudo ufw --force enable

# Create MySQL database and user for the application
echo "Setting up MySQL database..."
sudo mysql -e "CREATE DATABASE IF NOT EXISTS plantcare_db;"
sudo mysql -e "CREATE USER IF NOT EXISTS 'plantcare_user'@'localhost' IDENTIFIED BY 'your_secure_password';"
sudo mysql -e "GRANT ALL PRIVILEGES ON plantcare_db.* TO 'plantcare_user'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"

# Create systemd service file for Spring Boot application
echo "Creating systemd service file..."
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
Environment="JAVA_OPTS=-Xmx512m -Xms256m"

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd
sudo systemctl daemon-reload

echo "Server setup completed!"
echo "Next steps:"
echo "1. Upload your Spring Boot JAR file to /opt/plantcare/"
echo "2. Update application.yml with MySQL connection details"
echo "3. Start the service: sudo systemctl start plantcare"
echo "4. Enable auto-start: sudo systemctl enable plantcare" 