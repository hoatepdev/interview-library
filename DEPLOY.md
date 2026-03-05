# Deployment Guide

## Overview

| Service  | Platform | Trigger |
|----------|----------|---------|
| Frontend | Vercel   | Push to `main` (changes in `apps/frontend/` hoặc `packages/shared/`) |
| Backend  | VPS (Docker) | Push to `main` (changes in `apps/backend/` hoặc `packages/shared/`) |

---

## 1. Frontend — Vercel

### Bước 1: Tạo Vercel project

1. Vào [vercel.com](https://vercel.com) → **Add New Project** → Import GitHub repo
2. Chọn **Root Directory**: `apps/frontend`
3. Framework: **Next.js** (tự detect)
4. Thêm Environment Variable:
   ```
   NEXT_PUBLIC_API_URL = https://api.your-domain.com/api
   ```
   *(hoặc `https://your-vps-ip:9001/api` nếu chưa có domain)*
5. Deploy lần đầu từ Vercel dashboard

### Bước 2: Lấy Vercel credentials cho GitHub Actions

```bash
# Cài vercel CLI
npm i -g vercel

# Login và link project
cd apps/frontend
vercel link

# Lấy token tại: https://vercel.com/account/tokens
```

Sau khi `vercel link`, mở `.vercel/project.json` để lấy `projectId` và `orgId`.

### Bước 3: Thêm GitHub Secrets

Vào repo GitHub → **Settings → Secrets and variables → Actions**:

| Secret | Giá trị |
|--------|---------|
| `VERCEL_TOKEN` | Token từ vercel.com/account/tokens |
| `NEXT_PUBLIC_API_URL` | `https://api.your-domain.com/api` |

> **Lưu ý**: Vercel cũng tự động deploy khi push nếu bạn kết nối GitHub trong dashboard.
> GitHub Actions workflow (`deploy-frontend.yml`) giúp kiểm soát deploy conditions rõ ràng hơn.

---

## 2. Backend — VPS

### Bước 1: Setup VPS lần đầu

```bash
# SSH vào VPS
ssh user@your-vps-ip

# Chạy setup script (Ubuntu 22.04/24.04)
curl -sSL https://raw.githubusercontent.com/YOUR_USERNAME/interview-library/main/scripts/vps-setup.sh | bash
```

Sau đó chỉnh sửa `.env`:
```bash
nano ~/interview-library/.env
```

Điền đầy đủ các giá trị trong file `.env.production.example`.

### Bước 2: Tạo Docker Hub repository

1. Vào [hub.docker.com](https://hub.docker.com) → **Create Repository**
2. Đặt tên: `interview-library-backend`
3. Visibility: **Private**

### Bước 3: Tạo SSH key cho GitHub Actions

```bash
# Trên VPS hoặc máy local
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy

# Copy public key vào authorized_keys trên VPS
cat ~/.ssh/github_actions_deploy.pub >> ~/.ssh/authorized_keys

# Private key sẽ thêm vào GitHub Secrets
cat ~/.ssh/github_actions_deploy
```

### Bước 4: Thêm GitHub Secrets

| Secret | Giá trị |
|--------|---------|
| `DOCKERHUB_USERNAME` | Docker Hub username |
| `DOCKERHUB_TOKEN` | Docker Hub Access Token (Settings → Security → New Access Token) |
| `VPS_HOST` | IP hoặc domain của VPS |
| `VPS_USER` | SSH username (thường là `ubuntu` hoặc `root`) |
| `VPS_SSH_KEY` | Nội dung private key (`~/.ssh/github_actions_deploy`) |

### Bước 5: Deploy lần đầu thủ công

```bash
ssh user@your-vps-ip
cd ~/interview-library

# Build và start lần đầu (trước khi có CI/CD)
docker compose -f docker-compose.prod.yml up -d

# Chạy migrations
docker compose -f docker-compose.prod.yml exec backend \
  node -e "
    const { AppDataSource } = require('./apps/backend/dist/database/data-source');
    AppDataSource.initialize().then(() => AppDataSource.runMigrations()).then(() => {
      console.log('Migrations done'); process.exit(0);
    }).catch(e => { console.error(e); process.exit(1); });
  "

# Kiểm tra logs
docker compose -f docker-compose.prod.yml logs -f backend
```

---

## 3. Cấu hình OAuth Callbacks

Sau khi có domain/IP, cập nhật callback URLs:

**Google Cloud Console** (`console.cloud.google.com`):
- Authorized redirect URIs: `https://api.your-domain.com/api/auth/google/callback`

**GitHub OAuth App** (`github.com/settings/developers`):
- Authorization callback URL: `https://api.your-domain.com/api/auth/github/callback`

Và cập nhật trong `.env` trên VPS.

---

## 4. (Tùy chọn) Nginx Reverse Proxy + SSL

Nếu muốn dùng domain thay vì IP:port:

```bash
sudo apt-get install -y nginx certbot python3-certbot-nginx

# Tạo config
sudo nano /etc/nginx/sites-available/interview-library
```

```nginx
server {
    server_name api.your-domain.com;

    location / {
        proxy_pass http://localhost:9001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/interview-library /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Cài SSL
sudo certbot --nginx -d api.your-domain.com
```

---

## 5. Kiểm tra sau deploy

```bash
# Health check backend
curl https://api.your-domain.com/api/health

# Kiểm tra frontend
open https://your-app.vercel.app
```

---

## Troubleshooting

**Backend không start:**
```bash
docker compose -f docker-compose.prod.yml logs backend
```

**Database connection failed:**
```bash
# Kiểm tra postgres container
docker compose -f docker-compose.prod.yml logs postgres
# Kiểm tra .env DB_HOST phải là "postgres" (tên service)
```

**CORS error từ frontend:**
- Kiểm tra `FRONTEND_URL` trong `.env` trên VPS khớp với Vercel URL

**Session không hoạt động:**
- Đảm bảo `SESSION_SECRET` đã được set
- Nếu dùng HTTPS, `secure: true` trong cookie đã được set tự động khi `NODE_ENV=production`
