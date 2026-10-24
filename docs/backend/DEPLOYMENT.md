# DEPLOYMENT.md — Panduan Deployment Produksi & Cloud VPS

---

## 1. Prasyarat Server VPS

- **Spesifikasi Rekomendasi:** Minimal 2 vCPU, 4 GB RAM, 40 GB SSD (Ubuntu 22.04 LTS).
- **Domain & SSL:** Domain/subdomain aktif (misal: `api.volatisafe.id`) dengan sertifikat SSL Let's Encrypt / Certbot.
- **Port Terbuka di Firewall (UFW):**
  - `80/tcp` & `443/tcp`: HTTP/HTTPS untuk REST API & Web Dashboard.
  - `1883/tcp` / `8883/tcp`: MQTT / MQTTS untuk Gateway LoRa lapangan.

---

## 2. Arsitektur Deployment Docker Compose

```yaml
# docker/docker-compose.prod.yml
version: "3.8"

services:
  timescaledb:
    image: timescale/timescaledb:latest-pg15
    restart: always
    environment:
      POSTGRES_DB: volatisafe_prod
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - timescaledb_data:/var/lib/postgresql/data
    ports:
      - "127.0.0.1:5432:5432"

  mosquitto:
    image: eclipse-mosquitto:2
    restart: always
    ports:
      - "1883:1883"
    volumes:
      - ./mosquitto.conf:/mosquitto/config/mosquitto.conf
      - mosquitto_data:/mosquitto/data

  backend:
    build:
      context: ../backend
      dockerfile: Dockerfile
    restart: always
    env_file: .env.production
    depends_on:
      - timescaledb
      - mosquitto
    ports:
      - "127.0.0.1:8000:8000"

volumes:
  timescaledb_data:
  mosquitto_data:
```

---

## 3. Konfigurasi Nginx Reverse Proxy & SSL

```nginx
server {
    server_name api.volatisafe.id;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Proxy WebSocket Live Streaming
    location /ws/v1/live {
        proxy_pass http://127.0.0.1:8000/ws/v1/live;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }

    listen 443 ssl;
    # SSL cert managed by certbot
}
```

---

## 4. Perintah Operasional Rutin

```bash
# 1. Jalankan semua kontainer di latar belakang
docker compose -f docker/docker-compose.prod.yml up -d

# 2. Cek status health container
curl -k https://api.volatisafe.id/api/v1/health

# 3. Pantau log ingesti telemetri live
docker compose -f docker/docker-compose.prod.yml logs -f backend
```
