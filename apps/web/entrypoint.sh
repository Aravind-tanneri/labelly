#!/bin/sh
set -e

CERT_DIR="/etc/letsencrypt/live/labelly.duckdns.org"

if [ -f "$CERT_DIR/fullchain.pem" ] && [ -f "$CERT_DIR/privkey.pem" ]; then
    echo "[nginx] Let's Encrypt certificate found. Configuring HTTPS for labelly.duckdns.org..."
    cat << 'EOF' > /etc/nginx/conf.d/default.conf
server {
    listen 80;
    server_name labelly.duckdns.org;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name labelly.duckdns.org;
    client_max_body_size 25M;
    client_body_buffer_size 1M;
    client_body_timeout 180s;
    client_header_timeout 180s;

    ssl_certificate /etc/letsencrypt/live/labelly.duckdns.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/labelly.duckdns.org/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }

    location ~ ^/(api|uploads|reports|images|health)/? {
        proxy_pass http://server:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_cache_bypass $http_upgrade;

        proxy_connect_timeout 180s;
        proxy_send_timeout 180s;
        proxy_read_timeout 180s;
    }
}
EOF
else
    echo "[nginx] No SSL certificate found. Operating in HTTP mode..."
    cat << 'EOF' > /etc/nginx/conf.d/default.conf
server {
    listen 80;
    client_max_body_size 25M;
    client_body_buffer_size 1M;
    client_body_timeout 180s;
    client_header_timeout 180s;

    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }

    location ~ ^/(api|uploads|reports|images|health)/? {
        proxy_pass http://server:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;

        proxy_connect_timeout 180s;
        proxy_send_timeout 180s;
        proxy_read_timeout 180s;
    }
}
EOF
fi

exec nginx -g "daemon off;"
