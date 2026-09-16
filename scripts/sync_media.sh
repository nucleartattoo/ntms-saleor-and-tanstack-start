#!/bin/bash
# NTMS Saleor - 从 xeon 远程 Kubernetes 集群同步商品图片和媒体资源至本地

set -e

DEST_DIR="/Volumes/samsung2tb980pro/project/Saleor-NTMS/apps/saleor-core/media"
mkdir -p "$DEST_DIR"

echo "========================================================"
echo "🖼️ [NTMS] 正在从 xeon (shop-ntms-saleor) 同步商品媒体资源..."
echo "========================================================"

POD=$(ssh xeon "kubectl -n shop-ntms-saleor get pods -l app=saleor,component=api -o jsonpath='{.items[0].metadata.name}'")
echo "📦 远程 Pod: $POD"

echo "📦 1. 正在远程节点打包 media 目录 (/tmp/ntms-media.tar.gz)..."
ssh xeon "kubectl -n shop-ntms-saleor exec $POD -- tar -czf - -C /app/media products thumbnails > /tmp/ntms-media.tar.gz"

echo "⬇️ 2. 正在高速断点续传下载至本地..."
rsync -P xeon:/tmp/ntms-media.tar.gz /tmp/ntms-media.tar.gz

echo "📂 3. 正在解压至 $DEST_DIR ..."
tar -xzf /tmp/ntms-media.tar.gz -C "$DEST_DIR"

echo "🧹 4. 清理临时压缩包..."
rm -f /tmp/ntms-media.tar.gz
ssh xeon "rm -f /tmp/ntms-media.tar.gz"

echo "🔍 统计本地媒体文件..."
TOTAL_PRODUCTS=$(find "$DEST_DIR/products" -type f 2>/dev/null | wc -l || echo 0)
SIZE=$(du -sh "$DEST_DIR" | awk '{print $1}')

echo "========================================================"
echo "✅ 媒体文件同步完成！"
echo "   - 商品原图数量: $TOTAL_PRODUCTS"
echo "   - 本地占用空间: $SIZE"
echo "========================================================"
