#!/bin/bash

# 更新 Agent 配置脚本
# 用法: ./update_agent_config.sh [dev|prod]
# 示例: ./update_agent_config.sh dev   (更新开发环境)
#       ./update_agent_config.sh prod  (更新生产环境，谨慎操作!)

set -e

# 检查参数
if [ $# -eq 0 ]; then
    echo "错误: 请指定环境参数"
    echo "用法: $0 [dev|prod]"
    echo "示例: $0 dev   (更新开发环境)"
    echo "      $0 prod  (更新生产环境，谨慎操作!)"
    exit 1
fi

ENV=$1

# 验证环境参数
if [ "$ENV" != "dev" ] && [ "$ENV" != "prod" ]; then
    echo "错误: 无效的环境参数 '$ENV'"
    echo "请使用 'dev' 或 'prod'"
    exit 1
fi

# 根据环境设置变量
if [ "$ENV" == "dev" ]; then
    CONFIG_FILE="agent_list_config_debug.json"
    echo "🔄 更新开发环境配置..."
else
    CONFIG_FILE="agent_list_config_prod.json"
    echo "⚠️  更新生产环境配置 (谨慎操作!)"
    read -p "确认要继续吗? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        echo "已取消操作"
        exit 0
    fi
fi

# 配置文件路径
LOCAL_FILE="./assets/config/agents/${CONFIG_FILE}"
S3_PATH="s3://vsa-bucket-public-new/monster/${CONFIG_FILE}"
CLOUDFRONT_PATH="/monster/${CONFIG_FILE}"
DISTRIBUTION_ID="EFR5H7M1UNIXN"

# 检查本地文件是否存在
if [ ! -f "$LOCAL_FILE" ]; then
    echo "错误: 配置文件不存在: $LOCAL_FILE"
    exit 1
fi

# 上传到 S3
echo "📤 上传配置文件到 S3..."
aws s3 cp "$LOCAL_FILE" "$S3_PATH"

if [ $? -eq 0 ]; then
    echo "✅ 文件上传成功"
else
    echo "❌ 文件上传失败"
    exit 1
fi

# 清除 CloudFront 缓存
echo "🗑️  清除 CloudFront 缓存..."
INVALIDATION_ID=$(aws cloudfront create-invalidation \
    --distribution-id "$DISTRIBUTION_ID" \
    --paths "$CLOUDFRONT_PATH" \
    --query 'Invalidation.Id' \
    --output text)

if [ $? -eq 0 ]; then
    echo "✅ 缓存清除请求已提交"
    echo "   失效 ID: $INVALIDATION_ID"
    echo "   路径: $CLOUDFRONT_PATH"
else
    echo "❌ 缓存清除失败"
    exit 1
fi

echo ""
echo "🎉 完成! 配置已更新到 $ENV 环境"
echo "   验证 URL: https://dzdbhsix5ppsc.cloudfront.net/monster/${CONFIG_FILE}"
