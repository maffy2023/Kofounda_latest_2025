# Use a simple, reliable nginx image
FROM nginx:alpine

# Copy a custom index.html that looks good
COPY nginx-files/ /usr/share/nginx/html/

# Copy a custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# The default command starts nginx automatically
CMD ["nginx", "-g", "daemon off;"] 
