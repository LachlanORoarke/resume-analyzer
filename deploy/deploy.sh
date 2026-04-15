#!/bin/bash
# 一键部署脚本 - resume-analyzer
set -e

echo "=== 部署 resume-analyzer ==="

# 1. 停掉旧容器
echo "[1/5] 清理旧容器..."
docker stop resume-backend 2>/dev/null && docker rm resume-backend 2>/dev/null || true

# 2. 构建后端镜像
echo "[2/5] 构建后端 Docker 镜像..."
cd /opt/resume-analyzer/backend
docker build -t resume-analyzer-backend .

# 3. 启动后端容器，只监听本机 9000 端口
echo "[3/5] 启动后端容器..."
docker run -d \
  --name resume-backend \
  --restart unless-stopped \
  -p 127.0.0.1:9000:9000 \
  --env-file /opt/resume-analyzer/backend/.env \
  resume-analyzer-backend

echo "后端容器已启动，等 3 秒..."
sleep 3
docker ps | grep resume-backend || { echo "容器启动失败！"; docker logs resume-backend; exit 1; }

# 4. 配置 Nginx
echo "[4/5] 配置 Nginx..."
cp /opt/resume-analyzer/deploy/nginx-resume.conf /etc/nginx/sites-available/resume-analyzer
# 先备份当前 sites-enabled 列表，再清空，让我们的配置独占 80 端口
echo "当前 sites-enabled:"
ls /etc/nginx/sites-enabled/
echo "禁用所有现有站点..."
rm -f /etc/nginx/sites-enabled/*
ln -sf /etc/nginx/sites-available/resume-analyzer /etc/nginx/sites-enabled/resume-analyzer

# 5. 测试并重载 Nginx
echo "[5/5] 重载 Nginx..."
nginx -t && systemctl reload nginx

echo ""
echo "=== 部署完成 ==="
echo "访问地址: http://193.134.209.142"
echo "API 文档: http://193.134.209.142/api/docs  (如果开了的话)"
