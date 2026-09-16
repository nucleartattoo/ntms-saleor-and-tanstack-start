#!/bin/bash
# NTMS Saleor - 从 xeon 远程 Kubernetes 集群流式同步 PostgreSQL 数据库至本地 Apple Container

set -e

CONTAINER_BIN="/opt/homebrew/bin/container"
CONTAINER_NAME="ntms-postgres"

echo "========================================================"
echo "📦 [NTMS] 正在从 xeon (shop-ntms-saleor) 同步 PostgreSQL 数据..."
echo "========================================================"

# 1. 确保 ntms-postgres 容器正在运行
if ! "$CONTAINER_BIN" list | grep -q "$CONTAINER_NAME"; then
  echo "🚀 启动本地 $CONTAINER_NAME..."
  /Volumes/samsung2tb980pro/project/Saleor-NTMS/docker/manage-containers.sh start
  sleep 2
fi

# 2. 从 xeon 执行 pg_dump 并流式注入本地容器
echo "⬇️ 正在拉取远程数据库并导入本地 (此过程通常耗时 5-15 秒)..."
ssh xeon "kubectl -n shop-ntms-saleor exec saleor-db-0 -- pg_dump -U saleor -d saleor --clean --if-exists --no-owner --no-acl" \
  | "$CONTAINER_BIN" exec -i "$CONTAINER_NAME" psql -U saleor -d saleor -q

# 3. 统计本地数据验证
echo "🔍 验证本地数据完整性..."
"$CONTAINER_BIN" exec "$CONTAINER_NAME" psql -U saleor -d saleor -c "
  SELECT
    (SELECT count(*) FROM product_product) as total_products,
    (SELECT count(*) FROM product_productvariant) as total_variants,
    (SELECT count(*) FROM product_category) as total_categories,
    (SELECT count(*) FROM channel_channel) as total_channels,
    (SELECT count(*) FROM account_user WHERE is_staff = true) as staff_users;
"

echo "========================================================"
echo "✅ [NTMS] 数据库同步与导入完成！"
echo "========================================================"
