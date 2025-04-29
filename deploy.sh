#!/bin/bash

# Exit on any error
set -e

# Configuration
RESOURCE_GROUP="zeustek_general_resource_group"
VMSS_NAME="Kofounda"
ACR_NAME="kofounda"
IMAGE_NAME="kofounda"
IMAGE_TAG=$(date +%Y%m%d%H%M%S)

echo "🚀 Deploying Kofounda application to Azure..."

# Login to Azure Container Registry
echo "📦 Logging in to Azure Container Registry..."
az acr login --name $ACR_NAME

# Build the Docker image
echo "🔨 Building Docker image..."
docker build -t $ACR_NAME.azurecr.io/$IMAGE_NAME:$IMAGE_TAG .

# Push the Docker image to ACR
echo "📤 Pushing Docker image to Azure Container Registry..."
docker push $ACR_NAME.azurecr.io/$IMAGE_NAME:$IMAGE_TAG

# Also tag as latest
docker tag $ACR_NAME.azurecr.io/$IMAGE_NAME:$IMAGE_TAG $ACR_NAME.azurecr.io/$IMAGE_NAME:latest
docker push $ACR_NAME.azurecr.io/$IMAGE_NAME:latest

# Create a deployment script to run on the VMs
echo "📝 Creating deployment script..."
cat > deploy_vm.sh << 'EOF'
#!/bin/bash
set -e

# Configuration
ACR_NAME="kofounda"
IMAGE_NAME="kofounda"
ACR_USERNAME="${ACR_USERNAME}"
ACR_PASSWORD="${ACR_PASSWORD}"

# Create app directory if it doesn't exist
mkdir -p /home/KofoundaServer/app

# Change to app directory
cd /home/KofoundaServer/app

# Create docker-compose.yml file
cat > docker-compose.yml << 'EOL'
version: '3.8'

services:
  app:
    image: kofounda.azurecr.io/kofounda:latest
    restart: always
    ports:
      - "80:80"
      - "443:443"
    environment:
      - NODE_ENV=production
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_KEY=${SUPABASE_KEY}
    volumes:
      - app_data:/app/data

volumes:
  app_data:
EOL

# Create .env file
cat > .env << 'EOL'
SUPABASE_URL=YOUR_SUPABASE_URL
SUPABASE_KEY=YOUR_SUPABASE_KEY
EOL

# Login to ACR
echo "Logging in to ACR..."
docker login $ACR_NAME.azurecr.io -u $ACR_USERNAME -p $ACR_PASSWORD

# Pull the latest image
echo "Pulling the latest image..."
docker pull $ACR_NAME.azurecr.io/$IMAGE_NAME:latest

# Start the application
echo "Starting the application..."
docker-compose up -d

echo "Deployment completed!"
EOF

# Make the script executable
chmod +x deploy_vm.sh

# Execute the deployment script on all VMs in the scale set
echo "🖥️ Deploying to VM Scale Set instances..."
az vmss run-command invoke --resource-group $RESOURCE_GROUP --name $VMSS_NAME \
  --command-id RunShellScript --scripts @deploy_vm.sh

echo "✅ Deployment completed successfully!"
echo "🌐 Your application is now running at http://51.8.24.11" 