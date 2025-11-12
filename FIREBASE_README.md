# Firebase 配置说明

本项目已配置 Firebase，包含以下功能：

## 已配置的功能

### ✅ Firebase Authentication（已配置）
- 使用 Firebase JS SDK v12
- 支持邮箱/密码登录
- 使用 AsyncStorage 实现持久化
- 完整的使用示例见 `config/firebase-usage-example.js`

### ✅ Push Notifications（已配置）
- 使用 Expo Notifications
- 已配置 iOS 后台推送权限
- 支持前台和后台通知
- 完整的使用示例见 `config/firebase-usage-example.js`

### ⚠️ Firebase Analytics（需要原生配置）
- Firebase Analytics 在 React Native 环境中需要原生支持
- 目前仅完成基础配置
- 建议使用 `@react-native-firebase/analytics` 进行完整集成

## 项目结构

```
MonsterAI/
├── config/
│   ├── firebase.js                    # Firebase 初始化配置
│   └── firebase-usage-example.js      # 使用示例
├── GoogleService-Info.plist           # iOS Firebase 配置
├── app.json                           # Expo 配置
└── App.js                             # 主应用（包含 Firebase 初始化）
```

## 配置文件

### 1. `config/firebase.js`
Firebase 核心配置文件，包含：
- Firebase App 初始化
- Firebase Auth 配置
- 使用 AsyncStorage 进行持久化

### 2. `app.json`
Expo 配置文件，包含：
- iOS GoogleServicesFile 配置
- expo-notifications 插件
- iOS 后台推送权限

### 3. `App.js`
主应用文件，包含：
- Firebase 初始化
- Push Notifications 注册
- 通知监听器

## 使用指南

### 初始化

Firebase 在应用启动时自动初始化，无需手动操作。

### 使用 Firebase Auth

```javascript
import { auth } from './config/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

// 注册用户
const user = await createUserWithEmailAndPassword(auth, email, password);

// 登录用户
const user = await signInWithEmailAndPassword(auth, email, password);
```

详细示例见 `config/firebase-usage-example.js`

### 使用 Push Notifications

```javascript
import * as Notifications from 'expo-notifications';

// 获取推送 Token
const token = await Notifications.getExpoPushTokenAsync({
  projectId: 'monsterai-20727',
});

// 发送本地通知
await Notifications.scheduleNotificationAsync({
  content: {
    title: '通知标题',
    body: '通知内容',
  },
  trigger: null, // 立即发送
});
```

详细示例见 `config/firebase-usage-example.js`

## 运行应用

### 首次运行

```bash
# 重新生成原生代码
npx expo prebuild --clean

# 运行 iOS
npm run ios
```

### 后续运行

```bash
npm run ios
```

## 注意事项

### iOS 配置
- ✅ GoogleService-Info.plist 已配置
- ✅ 后台推送权限已配置
- ✅ Bundle Identifier: `com.fanthus.monsterai.debug`

### Android 配置
- ⏸️ 暂未配置（按需配置）

### Analytics 集成建议

如需完整的 Analytics 功能，建议：

1. 安装 React Native Firebase Analytics：
```bash
npm install @react-native-firebase/analytics
npm install @react-native-firebase/app
```

2. 更新 `app.json` 添加插件：
```json
{
  "plugins": [
    "@react-native-firebase/app",
    "@react-native-firebase/analytics",
    "expo-notifications"
  ]
}
```

3. 重新构建：
```bash
npx expo prebuild --clean
```

## 故障排除

### 问题：无法获取推送通知权限
**解决方案**：确保在真实设备上测试，模拟器不支持推送通知。

### 问题：Firebase Auth 不持久化
**解决方案**：已使用 AsyncStorage，确保已正确安装 `@react-native-async-storage/async-storage`。

### 问题：Analytics 事件未记录
**解决方案**：当前使用的是基础配置，需要集成 `@react-native-firebase/analytics` 以获得完整功能。

## 依赖包版本

```json
{
  "firebase": "^12.5.0",
  "@react-native-async-storage/async-storage": "^1.24.0",
  "expo-notifications": "~0.32.12",
  "expo-device": "^8.0.9"
}
```

## 更新日志

- **2025-11-11**: 初始配置完成
  - ✅ Firebase Auth 配置
  - ✅ Push Notifications 配置
  - ✅ 移除过时的 expo-firebase-analytics 和 expo-firebase-core
  - ⚠️ Analytics 需要原生配置

## 参考资料

- [Firebase JS SDK 文档](https://firebase.google.com/docs/web/setup)
- [Expo Notifications 文档](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [React Native Firebase 文档](https://rnfirebase.io/)

