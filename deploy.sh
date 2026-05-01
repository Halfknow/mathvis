#!/bin/bash
# MathViz 部署脚本 — 自托管方案
# 使用方法: bash deploy.sh
# 依赖: Node.js 22+, nginx 或 caddy

set -e

echo "=== MathViz 部署 ==="

# 1. 构建
echo "[1/3] Building site..."
npm run build

# 2. 预览/部署目录
DIST_DIR="./dist"
echo "[2/3] Build output: $DIST_DIR"

# 3. 显示部署选项
echo "[3/3] Deploy options:"
echo ""
echo "Option A: Simple static server"
echo "  npx serve dist -p 3000"
echo ""
echo "Option B: Nginx config (add to /etc/nginx/sites-available/mathviz):"
cat << 'NGINX'
server {
    listen 80;
    server_name mathviz.local;

    root /var/www/mathviz;
    index index.html;

    # Static assets — long cache
    location ~* \.(js|css|woff2?|png|jpg|webp|svg|ico)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Video files — long cache, range requests
    location ~* \.(webm|mp4)$ {
        expires 30d;
        add_header Cache-Control "public";
        add_header Accept-Ranges bytes;
    }

    # HTML — short cache
    location ~* \.html$ {
        expires 1h;
        add_header Cache-Control "public";
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ $uri/index.html =404;
    }
}
NGINX

echo ""
echo "Option C: Caddy (simplest)"
cat << 'CADDY'
mathviz.local {
    root * /var/www/mathviz
    file_server
    encode gzip
}
CADDY

echo ""
echo "To deploy: cp -r dist/* /var/www/mathviz/"
echo "Done."
