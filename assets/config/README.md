# 配置文件更新说明

本目录包含 Agent 和 MiniApp 的配置文件及更新脚本。

## 目录结构

```
assets/config/
├── agents/              # Agent 配置文件
│   ├── agent_list_config_debug.json
│   └── agent_list_config_prod.json
├── miniapps/            # MiniApp 配置文件
│   ├── miniapp_list_config_debug.json
│   └── miniapp_list_config_prod.json
├── update_config.sh     # 通用更新脚本
└── README.md           # 本文件
```

## 更新脚本使用

### 方式一：使用通用脚本（推荐）

在项目根目录执行：

```bash
# 更新 Agent 配置
./assets/config/update_config.sh agent dev    # 开发环境
./assets/config/update_config.sh agent prod   # 生产环境（谨慎操作!）

# 更新 MiniApp 配置
./assets/config/update_config.sh miniapp dev  # 开发环境
./assets/config/update_config.sh miniapp prod # 生产环境（谨慎操作!）
```

## 验证方式

### Agent 配置验证

- 开发环境: https://dzdbhsix5ppsc.cloudfront.net/monster/agent_list_config_debug.json
- 生产环境: https://dzdbhsix5ppsc.cloudfront.net/monster/agent_list_config_prod.json

### MiniApp 配置验证

- 开发环境: https://dzdbhsix5ppsc.cloudfront.net/monster/miniapp_list_config_debug.json
- 生产环境: https://dzdbhsix5ppsc.cloudfront.net/monster/miniapp_list_config_prod.json

## 注意事项

1. **生产环境更新需要确认**：更新生产环境配置时，脚本会要求输入 `yes` 确认
2. **自动清除缓存**：脚本会自动清除 CloudFront 缓存，确保更新立即生效
3. **文件检查**：脚本会检查本地配置文件是否存在，避免上传失败

