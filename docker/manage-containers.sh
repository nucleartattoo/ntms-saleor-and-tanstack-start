#!/bin/bash
# Saleor NTMS - Apple Container 专用基础设施容器管理脚本 (防端口与命名冲突)

set -e

ACTION=${1:-status}
CONTAINER_BIN="/opt/homebrew/bin/container"

if [ ! -x "$CONTAINER_BIN" ]; then
  echo "❌ 未检测到 Apple Container CLI: $CONTAINER_BIN"
  exit 1
fi

start_containers() {
  echo "🚀 [NTMS] 正在启动专用基础服务 (PostgreSQL:5434, Redis:6381, Dashboard:9002)..."

  # 1. PostgreSQL (Port 5434:5432)
  if ! "$CONTAINER_BIN" list -a | grep -q ntms-postgres; then
    echo "📦 正在拉起 ntms-postgres (5434:5432)..."
    "$CONTAINER_BIN" run -d --name ntms-postgres -p 5434:5432 \
      -e POSTGRES_PASSWORD=saleorpassword \
      -e POSTGRES_USER=saleor \
      -e POSTGRES_DB=saleor \
      postgres:16-alpine || true
  elif ! "$CONTAINER_BIN" list | grep -q ntms-postgres; then
    echo "🔄 正在启动现有 ntms-postgres 容器..."
    "$CONTAINER_BIN" start ntms-postgres
  else
    echo "✅ ntms-postgres 容器已在运行中"
  fi

  # 2. Redis (Port 6381:6379)
  if ! "$CONTAINER_BIN" list -a | grep -q ntms-redis; then
    echo "📦 正在拉起 ntms-redis (6381:6379)..."
    "$CONTAINER_BIN" run -d --name ntms-redis -p 6381:6379 \
      redis:7-alpine || true
  elif ! "$CONTAINER_BIN" list | grep -q ntms-redis; then
    echo "🔄 正在启动现有 ntms-redis 容器..."
    "$CONTAINER_BIN" start ntms-redis
  else
    echo "✅ ntms-redis 容器已在运行中"
  fi

  # 3. Saleor Official Dashboard (Port 9002:80, 对接 NTMS Saleor Core 8003)
  if ! "$CONTAINER_BIN" list -a | grep -q ntms-dashboard; then
    echo "📦 正在拉起 ntms-dashboard (9002:80)..."
    "$CONTAINER_BIN" run -d --name ntms-dashboard -p 9002:80 \
      -e API_URL=http://localhost:8003/graphql/ \
      ghcr.io/saleor/saleor-dashboard:latest || true
  elif ! "$CONTAINER_BIN" list | grep -q ntms-dashboard; then
    echo "🔄 正在启动现有 ntms-dashboard 容器..."
    "$CONTAINER_BIN" start ntms-dashboard
  else
    echo "✅ ntms-dashboard 容器已在运行中"
  fi

  # 自动应用仪表盘注销修补
  DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  if [ -f "$DIR/patch-dashboard.py" ]; then
    python3 "$DIR/patch-dashboard.py" || true
  fi

  echo ""
  echo "✅ [NTMS] Apple Container 服务就绪状态："
  "$CONTAINER_BIN" list | grep -E "ID|ntms-"
}

stop_containers() {
  echo "🛑 正在停止 NTMS 专用基础容器..."
  "$CONTAINER_BIN" stop ntms-postgres 2>/dev/null || true
  "$CONTAINER_BIN" stop ntms-redis 2>/dev/null || true
  "$CONTAINER_BIN" stop ntms-dashboard 2>/dev/null || true
  echo "✅ 容器已停止。"
}

clean_containers() {
  echo "🧹 正在彻底删除 NTMS 专用基础容器..."
  "$CONTAINER_BIN" delete -f ntms-postgres 2>/dev/null || true
  "$CONTAINER_BIN" delete -f ntms-redis 2>/dev/null || true
  "$CONTAINER_BIN" delete -f ntms-dashboard 2>/dev/null || true
  echo "✅ 容器已清理。"
}

case "$ACTION" in
  start)
    start_containers
    ;;
  stop)
    stop_containers
    ;;
  clean)
    clean_containers
    ;;
  status)
    "$CONTAINER_BIN" list
    ;;
  *)
    echo "用法: $0 {start|stop|clean|status}"
    exit 1
    ;;
esac
