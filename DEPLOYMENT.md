# Production Deployment & Launch Manual

This manual provides instructions for deploying the Luxury Watch E-Commerce application to a Linux production server (Ubuntu 22.04 LTS or similar).

---

## 🐋 Deployment via Docker Compose (Recommended)

Docker Compose encapsulates the frontend Nginx server, the Node.js API backend, Redis, and MongoDB in isolated container runtimes.

### 1. Prerequisites
Ensure the target server has Docker and Docker Compose installed:
```bash
sudo apt update
sudo apt install -y docker.io docker-compose-v2
```

### 2. Configure Environment Variables
Create a secure `.env` file in the project's root folder:
```bash
touch .env
```
Fill out the variables based on the template:
```env
NODE_ENV=production
MONGO_URI=mongodb://admin:YOUR_DB_SECURE_PASSWORD@mongodb:27017/watch_ecommerce?authSource=admin
REDIS_URL=redis://:YOUR_REDIS_SECURE_PASSWORD@redis:6379

ACCESS_TOKEN_SECRET=YOUR_RANDOM_LONG_SECRET_ACCESS
REFRESH_TOKEN_SECRET=YOUR_RANDOM_LONG_SECRET_REFRESH

CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret

STRIPE_SECRET_KEY=sk_live_your_stripe_secret
VNP_TMN_CODE=your_vnpay_code
VNP_SECRET=your_vnpay_secret
```

### 3. Launch Services
Compile and start all containers in detached mode:
```bash
docker compose up --build -d
```
Alternatively, you can use the predefined helper scripts in the root `package.json`:
- **Start containers**: `npm run docker:up`
- **Stop containers**: `npm run docker:down`
- **Stream logs**: `npm run docker:logs`

### 4. Monitor Services
- **Check container health**:
  ```bash
  docker compose ps
  ```
- **Stream runtime logs**:
  ```bash
  docker compose logs -f
  ```
- **Stop all services without losing data volumes**:
  ```bash
  docker compose down
  ```

---

## ⚙️ Host Reverse Proxy & SSL Configuration (Nginx & Certbot)

To map custom domain names (e.g. `luxurywatch.vn`) to the Docker network container and secure transport using SSL:

### 1. Install Nginx & Certbot
```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
```

### 2. Create Server Block Config
Create `/etc/nginx/sites-available/luxurywatch.conf`:
```nginx
server {
    listen 80;
    server_name luxurywatch.vn www.luxurywatch.vn;

    # Map Frontend static assets
    location / {
        proxy_pass http://localhost:80; # Points to frontend docker container port
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Map Backend Express API
    location /api {
        proxy_pass http://localhost:5000; # Points to backend docker container port
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
Link and activate the server configuration block:
```bash
sudo ln -s /etc/nginx/sites-available/luxurywatch.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 3. Procure SSL Certificates
Obtain automated Let's Encrypt certificates:
```bash
sudo certbot --nginx -d luxurywatch.vn -d www.luxurywatch.vn
```
Certbot will negotiate the certificate and automatically update the Nginx configuration to redirect all cleartext HTTP traffic to secure HTTPS.

---

## 🗄️ Database Backup & Disaster Recovery

Ensure regular cron jobs run on the host server to export database backups to separate physical media.

### 1. MongoDB Backup Script
Create `/opt/scripts/backup-db.sh`:
```bash
#!/bin/bash
BACKUP_DIR="/opt/backups/mongodb"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
mkdir -p "$BACKUP_DIR"

# Run dump inside the running docker container
docker exec watch-mongodb mongodump \
  --username admin \
  --password adminpassword \
  --authenticationDatabase admin \
  --db watch_ecommerce \
  --out /data/db/backup_${TIMESTAMP}

# Move backup to the host machine volume path and compress
tar -czf ${BACKUP_DIR}/backup_${TIMESTAMP}.tar.gz -C /var/lib/docker/volumes/watch-ecommerce_mongo_data/_data backup_${TIMESTAMP}

# Clean temporary files in docker and keep local backups for only 30 days
docker exec watch-mongodb rm -rf /data/db/backup_${TIMESTAMP}
find "$BACKUP_DIR" -mtime +30 -type f -delete
```
Make it executable and assign a daily cron entry:
```bash
chmod +x /opt/scripts/backup-db.sh
(crontab -l ; echo "0 2 * * * /opt/scripts/backup-db.sh") | crontab -
```
