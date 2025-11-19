#!/bin/bash

# 通用配置更新脚本
# 用法: ./update_config.sh [agent|miniapp] [dev|prod]
# 示例: ./update_config.sh agent dev   (更新 Agent 开发环境配置)
#       ./update_config.sh miniapp prod  (更新 MiniApp 生产环境配置，谨慎操作!)

set -e

# 检查参数
if [ $# -lt 2 ]; then
    echo "错误: 请指定类型和环境参数"
    echo "用法: $0 [agent|miniapp] [dev|prod]"
    echo ""
    echo "示例:"
    echo "  $0 agent dev      (更新 Agent 开发环境配置)"
    echo "  $0 agent prod     (更新 Agent 生产环境配置，谨慎操作!)"
    echo "  $0 miniapp dev    (更新 MiniApp 开发环境配置)"
    echo "  $0 miniapp prod   (更新 MiniApp 生产环境配置，谨慎操作!)"
    exit 1
fi

TYPE=$1
ENV=$2

# 验证类型参数
if [ "$TYPE" != "agent" ] && [ "$TYPE" != "miniapp" ]; then
    echo "错误: 无效的类型参数 '$TYPE'"
    echo "请使用 'agent' 或 'miniapp'"
    exit 1
fi

# 验证环境参数
if [ "$ENV" != "dev" ] && [ "$ENV" != "prod" ]; then
    echo "错误: 无效的环境参数 '$ENV'"
    echo "请使用 'dev' 或 'prod'"
    exit 1
fi

# 根据类型设置变量
if [ "$TYPE" == "agent" ]; then
    CONFIG_PREFIX="agent_list_config"
    CONFIG_DIR="agents"
    TYPE_NAME="Agent"
else
    CONFIG_PREFIX="miniapp_list_config"
    CONFIG_DIR="miniapps"
    TYPE_NAME="MiniApp"
fi

# 根据环境设置配置文件名称
if [ "$ENV" == "dev" ]; then
    CONFIG_FILE="${CONFIG_PREFIX}_debug.json"
    echo "🔄 更新 ${TYPE_NAME} 开发环境配置..."
else
    CONFIG_FILE="${CONFIG_PREFIX}_prod.json"
    echo "⚠️  更新 ${TYPE_NAME} 生产环境配置 (谨慎操作!)"
    read -p "确认要继续吗? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        echo "已取消操作"
        exit 0
    fi
fi

# 配置文件路径
LOCAL_FILE="./assets/config/${CONFIG_DIR}/${CONFIG_FILE}"
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
echo "🎉 完成! ${TYPE_NAME} 配置已更新到 $ENV 环境"
echo "   验证 URL: https://dzdbhsix5ppsc.cloudfront.net/monster/${CONFIG_FILE}"

