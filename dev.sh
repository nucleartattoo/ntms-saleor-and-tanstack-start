#!/usr/bin/env bash
# ==============================================================================
# Nuclear Tattoo Management System (NTMS) - Local Development Launcher
# Runs Saleor 3.23 Backend, TanStack Storefront, and Apple Containers concurrently
# ==============================================================================

set -eo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CORE_DIR="$ROOT_DIR/apps/saleor-core"
STOREFRONT_DIR="$ROOT_DIR/apps/storefront"
DOCKER_MGR="$ROOT_DIR/docker/manage-containers.sh"
LOG_DIR="$ROOT_DIR/.logs"

mkdir -p "$LOG_DIR"

MODE="foreground"
if [ "$1" == "start" ] || [ "$1" == "--daemon" ] || [ "$1" == "-d" ]; then
  MODE="daemon"
elif [ "$1" == "stop" ]; then
  echo "🛑 [NTMS] 正在停止本地开发环境..."
  pids=$(lsof -ti :8003 -ti :3002 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo "  - 正在停止 Saleor Core 与 Storefront (PIDs: $pids)..."
    kill $pids 2>/dev/null || true
  fi
  if [ "$2" == "--all" ] || [ "$2" == "-a" ]; then
    "$DOCKER_MGR" stop
  fi
  echo "✅ 已停止服务。"
  exit 0
elif [ "$1" == "status" ]; then
  echo "📊 [NTMS] 服务运行状态："
  echo "  - PostgreSQL (5434):  $(nc -z 127.0.0.1 5434 2>/dev/null && echo '🟢 Running' || echo '🔴 Stopped')"
  echo "  - Redis (6381):       $(nc -z 127.0.0.1 6381 2>/dev/null && echo '🟢 Running' || echo '🔴 Stopped')"
  echo "  - Dashboard (9002):   $(nc -z 127.0.0.1 9002 2>/dev/null && echo '🟢 Running' || echo '🔴 Stopped')"
  echo "  - Saleor API (8003):  $(nc -z 127.0.0.1 8003 2>/dev/null && echo '🟢 Running' || echo '🔴 Stopped')"
  echo "  - Storefront (3002):  $(nc -z 127.0.0.1 3002 2>/dev/null && echo '🟢 Running' || echo '🔴 Stopped')"
  exit 0
fi

CLEANED=0
cleanup() {
  if [ "$CLEANED" -eq 1 ]; then
    return
  fi
  CLEANED=1
  echo ""
  echo "🛑 [NTMS] Shutting down local development environment..."
  if [ -n "$CORE_PID" ] && kill -0 "$CORE_PID" 2>/dev/null; then
    echo "  - Stopping Saleor Core (PID: $CORE_PID)..."
    kill "$CORE_PID" 2>/dev/null || true
  fi
  if [ -n "$FRONT_PID" ] && kill -0 "$FRONT_PID" 2>/dev/null; then
    echo "  - Stopping Storefront (PID: $FRONT_PID)..."
    kill "$FRONT_PID" 2>/dev/null || true
  fi
  echo "✅ Local processes stopped. Containers remain running for instant restart."
  echo "   (To stop containers, run: ./docker/manage-containers.sh stop)"
  exit 0
}

if [ "$MODE" == "foreground" ]; then
  trap cleanup SIGINT SIGTERM
fi

echo "========================================================================"
echo "⚡ Starting Nuclear Tattoo Management System (NTMS) Full Stack"
echo "========================================================================"

# 1. Check and start Apple Containers
echo "🐳 [1/4] Ensuring Apple Containers are running..."
"$DOCKER_MGR" start

# 2. Port check and orphan process cleanup
free_port() {
  local port=$1
  local pids
  pids=$(lsof -ti :"$port" 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo "⚠️ Port $port in use by PID(s): $pids. Releasing..."
    kill -9 $pids 2>/dev/null || true
    sleep 1
  fi
}

echo "🔌 [2/4] Checking and clearing development ports (8003, 3002)..."
free_port 8003
free_port 3002

# 3. Launch Saleor Core Backend
echo "🚀 [3/4] Launching Saleor Core API (0.0.0.0:8003)..."
cd "$CORE_DIR"
uv run python manage.py runserver 0.0.0.0:8003 > "$LOG_DIR/backend.log" 2>&1 &
CORE_PID=$!

echo "   Waiting for Saleor GraphQL API to become responsive..."
for i in {1..30}; do
  if curl -s "http://127.0.0.1:8003/graphql/" >/dev/null 2>&1 || nc -z 127.0.0.1 8003 2>/dev/null; then
    echo "   ✅ Saleor Core API is healthy (PID: $CORE_PID)."
    break
  fi
  sleep 1
done

# 4. Launch TanStack Storefront Frontend
echo "🌐 [4/4] Launching TanStack Storefront (port 3002)..."
cd "$STOREFRONT_DIR"
npm run dev > "$LOG_DIR/frontend.log" 2>&1 &
FRONT_PID=$!

echo "   Waiting for Storefront server to become responsive..."
for i in {1..20}; do
  if curl -s "http://127.0.0.1:3002" >/dev/null 2>&1 || nc -z 127.0.0.1 3002 2>/dev/null; then
    echo "   ✅ TanStack Storefront is healthy (PID: $FRONT_PID)."
    break
  fi
  sleep 1
done

echo "========================================================================"
echo "🎉 NTMS Full-Stack Local Development Environment is Ready!"
echo "========================================================================"
echo ""
echo "  🛍️  Storefront:     http://localhost:3002"
echo "  🔮  GraphQL API:    http://localhost:8003/graphql/"
echo "  📊  Dashboard:      http://localhost:9002"
echo "  🗄️  PostgreSQL:     localhost:5434 (db: saleor, user: saleor)"
echo "  ⚡  Redis:          localhost:6381"
echo ""
echo "  🔑 Default Admin:  admin@nucleartattoosupply.com (Pass: NTMS2026!)"
echo "  🔑 Backup Admin:   admin@example.com (Pass: admin)"
echo ""
echo "  📑 Logs available at:"
echo "     - Backend:       tail -f $LOG_DIR/backend.log"
echo "     - Frontend:      tail -f $LOG_DIR/frontend.log"
echo ""
if [ "$MODE" == "foreground" ]; then
  echo "Press Ctrl+C to terminate the local servers."
  echo "========================================================================"
  wait
else
  echo "Stack is running persistently in daemon mode."
  echo "To check status: ./dev.sh status"
  echo "To stop:         ./dev.sh stop"
  echo "========================================================================"
fi
