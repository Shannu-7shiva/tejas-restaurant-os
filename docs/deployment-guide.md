# AURELIA RESTAURANT OS - PRODUCTION DEPLOYMENT GUIDE

## 1. Prerequisites
- Docker & Docker Compose **or** a Linux VM (Ubuntu 22.04 LTS / Debian 12).
- Managed PostgreSQL instance (AWS RDS, DigitalOcean Managed DB, or Supabase).
- Valid domain name with SSL/TLS certificate (Let's Encrypt / Certbot).

---

## 2. Docker Compose Deployment (Recommended)

1. Clone the repository onto your host server:
   ```bash
   git clone <repo-url> /opt/aurelia-os
   cd /opt/aurelia-os
   ```
2. Create production `.env` file:
   ```bash
   cp .env.example .env
   ```
3. Generate a secure secret key:
   ```bash
   openssl rand -hex 32
   ```
   Paste this value into `SECRET_KEY` in `.env`.
4. Launch containers:
   ```bash
   cd deployment
   docker-compose up -d --build
   ```
5. Initialize and seed database:
   ```bash
   docker-compose exec backend python -m app.seed
   ```

---

## 3. Reverse Proxy & HTTPS Configuration
Point your public domain (`app.yourrestaurant.com`) to Nginx with Let's Encrypt:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d app.yourrestaurant.com
```

Ensure WebSocket headers are enabled in your Nginx config:
```nginx
location /ws/ {
    proxy_pass http://localhost:8000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "Upgrade";
    proxy_read_timeout 86400s;
}
```

---

## 4. Post-Deployment Verification Checklist
- [ ] Verify health-check endpoint: `curl https://api.yourdomain.com/api/health`
- [ ] Confirm database connection and seed initial restaurant owner.
- [ ] Open table QR URL on a smartphone connected to mobile data (verifying public routing).
- [ ] Place a test order and verify instantaneous delivery on the Kitchen Display System.
- [ ] Verify SSL cookies and CORS headers.
