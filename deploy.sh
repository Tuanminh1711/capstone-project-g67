#!/bin/bash

# Deploy script for PlantCare Spring Boot application
echo "Starting deployment process..."

# Variables
APP_NAME="plantcare-backend"
APP_DIR="/opt/plantcare"
JAR_FILE="$APP_NAME.jar"
BACKUP_DIR="$APP_DIR/backups"
LOG_DIR="$APP_DIR/logs"

# Create necessary directories
echo "Creating directories..."
sudo mkdir -p $BACKUP_DIR $LOG_DIR
sudo chown azureuser:azureuser $BACKUP_DIR $LOG_DIR

# Stop the service if running
echo "Stopping existing service..."
sudo systemctl stop plantcare

# Backup existing JAR if exists
if [ -f "$APP_DIR/$JAR_FILE" ]; then
    echo "Backing up existing JAR..."
    cp "$APP_DIR/$JAR_FILE" "$BACKUP_DIR/${JAR_FILE}.$(date +%Y%m%d_%H%M%S)"
fi

# Copy new JAR file (assuming it's in current directory)
if [ -f "./target/$JAR_FILE" ]; then
    echo "Copying new JAR file..."
    cp "./target/$JAR_FILE" "$APP_DIR/"
    sudo chown azureuser:azureuser "$APP_DIR/$JAR_FILE"
    sudo chmod +x "$APP_DIR/$JAR_FILE"
else
    echo "Error: JAR file not found in ./target/$JAR_FILE"
    exit 1
fi

# Update application configuration
echo "Updating application configuration..."
if [ -f "./application-prod.yml" ]; then
    cp "./application-prod.yml" "$APP_DIR/"
    sudo chown azureuser:azureuser "$APP_DIR/application-prod.yml"
fi

# Start the service
echo "Starting service..."
sudo systemctl start plantcare
sudo systemctl enable plantcare

# Check service status
echo "Checking service status..."
sleep 5
sudo systemctl status plantcare --no-pager

# Check if service is running
if sudo systemctl is-active --quiet plantcare; then
    echo "✅ Deployment successful! Service is running."
    echo "📊 Service logs: sudo journalctl -u plantcare -f"
    echo "🌐 Application URL: http://your-vm-ip:8080/api"
else
    echo "❌ Deployment failed! Service is not running."
    echo "📋 Recent logs:"
    sudo journalctl -u plantcare --no-pager -n 20
    exit 1
fi

echo "Deployment completed!" 