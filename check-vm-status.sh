#!/bin/bash

echo "🔍 Checking VM status and health..."

# Check system resources
echo "📊 System Resources:"
echo "CPU Usage:"
top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1

echo "Memory Usage:"
free -h

echo "Disk Usage:"
df -h

# Check running services
echo "🔧 Running Services:"
sudo systemctl list-units --type=service --state=running | head -10

# Check network connectivity
echo "🌐 Network Connectivity:"
ping -c 3 google.com

# Check if Java is installed
echo "☕ Java Installation:"
if command -v java &> /dev/null; then
    java -version
else
    echo "❌ Java not installed"
fi

# Check if MySQL is running
echo "🗄️ MySQL Status:"
sudo systemctl status mysql --no-pager

# Check firewall status
echo "🔥 Firewall Status:"
sudo ufw status

# Check if application directory exists
echo "📁 Application Directory:"
if [ -d "/opt/plantcare" ]; then
    ls -la /opt/plantcare/
else
    echo "❌ Application directory not found"
fi

# Check system logs for errors
echo "📋 Recent System Errors:"
sudo journalctl -p err --since "1 hour ago" | tail -5

echo "✅ Status check completed!" 