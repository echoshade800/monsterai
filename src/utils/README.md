# Function Tools 使用说明

## 概述

`function-tools.js` 文件集中管理所有AI对话中可用的Function Tools，包括工具定义和实现。

## 文件结构

```javascript
utils/function-tools.js
├── 工具函数实现 (getWeatherInfo, ...)
├── 工具定义数组 (FUNCTION_TOOLS)
├── 工具路由映射 (TOOL_HANDLERS)
└── 工具执行器 (executeToolFunction)
```

## 如何添加新工具

### 1. 实现工具函数

在文件开头的"工具函数实现"部分添加新函数：

```javascript
/**
 * 获取位置信息
 * @param {Object} args - 参数对象
 * @returns {Promise<string>} 位置信息
 */
export const getLocationInfo = async (args) => {
  // 实现你的逻辑
  return "位置信息结果";
};
```

### 2. 添加工具定义

在 `FUNCTION_TOOLS` 数组中添加新工具的定义：

```javascript
export const FUNCTION_TOOLS = [
  // ... 现有工具
  {
    type: "function",
    name: "get_location_info",
    description: "获取设备当前位置信息",
    parameters: {
      type: "object",
      properties: {
        // 定义参数
      },
      required: []
    }
  },
];
```

### 3. 注册工具处理器

在 `TOOL_HANDLERS` 中添加映射：

```javascript
export const TOOL_HANDLERS = {
  'get_weather_info': getWeatherInfo,
  'get_location_info': getLocationInfo, // 新增
};
```

## 工具定义规范

### 参数类型

- `type`: "function" (固定值)
- `name`: 工具名称（snake_case）
- `description`: 清晰的工具描述，AI会根据此描述决定是否调用
- `parameters`: OpenAI Function Calling 标准格式
  - `type`: "object"
  - `properties`: 参数定义对象
  - `required`: 必需参数数组

### 参数属性类型

- `string`: 字符串
- `number`: 数字
- `boolean`: 布尔值
- `array`: 数组
- `object`: 对象

### 示例

```javascript
{
  type: "function",
  name: "calculate_bmi",
  description: "根据身高和体重计算BMI指数",
  parameters: {
    type: "object",
    properties: {
      height: {
        type: "number",
        description: "身高（厘米）"
      },
      weight: {
        type: "number",
        description: "体重（千克）"
      },
      age: {
        type: "number",
        description: "年龄（可选）"
      }
    },
    required: ["height", "weight"]
  }
}
```

## 在其他文件中使用

### 导入

```javascript
import { FUNCTION_TOOLS, executeToolFunction } from '../../utils/function-tools';
```

### 使用工具定义

```javascript
// 在API请求中使用
const response = await fetch(API_URL, {
  method: 'POST',
  body: JSON.stringify({
    tools: FUNCTION_TOOLS,
    // ... 其他参数
  })
});
```

### 执行工具函数

```javascript
try {
  const result = await executeToolFunction(toolName, args);
  console.log('工具执行结果:', result);
} catch (error) {
  console.error('工具执行失败:', error);
}
```

## 最佳实践

1. **清晰的描述**: description 要准确描述工具的功能，帮助AI正确判断何时使用
2. **参数验证**: 在工具函数内部进行参数验证
3. **错误处理**: 使用 try-catch 处理可能的错误
4. **异步操作**: 所有工具函数都应该返回Promise
5. **类型注释**: 使用JSDoc注释说明参数和返回值类型
6. **命名规范**: 
   - 工具名称使用 snake_case
   - 函数名称使用 camelCase
   - 两者保持语义一致

## 调试

执行工具时会自动打印日志：

```javascript
console.log('执行工具函数 ${toolName} 失败:', error);
```

可以在控制台查看工具执行情况。

## 现有工具

- `get_weather_info`: 获取天气信息
- `get_user_info`: 获取用户信息
- `take_photo`: 拍照功能

### 拍照工具详细说明

**工具名称**: `take_photo`

**功能描述**: 使用设备相机拍照，支持多种用途

**参数**:
- `purpose` (可选): 拍照目的，如 "food diary", "exercise progress", "document", "memory"

**使用场景**:
- 用户说："帮我拍张照片记录今天的食物"
- 用户说："我想拍张照片记录我的运动成果"
- 用户说："帮我拍张照片"

**返回信息**:
- 拍照成功/失败状态
- 照片文件大小和尺寸
- 拍摄时间
- 保存位置信息

**权限要求**:
- 相机权限 (Camera Permission)
- 相册权限 (Photo Library Permission)

## 后续扩展建议

- `get_location_info`: 获取设备位置
- `calculate_bmi`: 计算BMI
- `get_health_data`: 获取健康数据
- `set_reminder`: 设置提醒
- `search_food`: 搜索食物信息
- `track_exercise`: 记录运动数据
- `select_from_gallery`: 从相册选择照片
- `record_audio`: 录音功能
- `scan_barcode`: 扫描二维码/条形码