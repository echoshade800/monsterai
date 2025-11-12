# Firebase 配置完成 ✅

本项目已完成 Firebase 配置，使用 **React Native Firebase** 原生模块。

## 已配置功能

### ✅ Firebase Authentication
- 使用 `@react-native-firebase/auth`
- 支持邮箱/密码登录
- 自动持久化登录状态
- 监听认证状态变化

### ✅ Firebase Analytics
- 使用 `@react-native-firebase/analytics`
- 自动记录应用事件
- 支持自定义事件
- 支持用户属性设置

### ✅ Push Notifications
- 使用 `expo-notifications`
- 已配置 iOS 后台推送权限
- 支持前台和后台通知
- 自动请求推送权限

## 项目结构

```
MonsterAI/
├── config/
│   ├── firebase.js                    # Firebase 配置导出
│   └── firebase-usage-example.js      # 完整使用示例
├── GoogleService-Info.plist           # iOS Firebase 配置
├── app.json                           # Expo 配置
├── App.js                             # 主应用（包含初始化）
└── ios/Podfile                        # CocoaPods 配置
```

## 关键配置文件

### 1. `package.json`
已安装的 Firebase 依赖：
```json
{
  "@react-native-firebase/app": "^23.5.0",
  "@react-native-firebase/auth": "^23.5.0",
  "@react-native-firebase/analytics": "^23.5.0",
  "@react-native-async-storage/async-storage": "^1.24.0",
  "expo-notifications": "~0.32.12",
  "expo-device": "^8.0.9"
}
```

### 2. `ios/Podfile`
添加了模块化头文件支持：
```ruby
target 'MonsterAI' do
  use_expo_modules!
  use_modular_headers!  # ← 必需，用于 Firebase Swift pods
  ...
end
```

### 3. `app.json`
```json
{
  "expo": {
    "ios": {
      "googleServicesFile": "./GoogleService-Info.plist",
      "bundleIdentifier": "com.fanthus.monsterai.debug",
      "infoPlist": {
        "UIBackgroundModes": ["remote-notification"]
      }
    },
    "plugins": [
      "expo-notifications"
    ]
  }
}
```

## 使用示例

### 认证 (Auth)

```javascript
import { auth } from './config/firebase';

// 注册用户
const user = await auth().createUserWithEmailAndPassword(email, password);

// 登录用户
const user = await auth().signInWithEmailAndPassword(email, password);

// 登出
await auth().signOut();

// 获取当前用户
const currentUser = auth().currentUser;

// 监听认证状态
auth().onAuthStateChanged((user) => {
  if (user) {
    console.log('User logged in:', user.uid);
  } else {
    console.log('User logged out');
  }
});
```

### 分析 (Analytics)

```javascript
import { analytics } from './config/firebase';

// 记录事件
await analytics().logEvent('button_click', {
  button_name: 'submit',
  screen_name: 'home',
});

// 设置用户属性
await analytics().setUserProperty('account_type', 'premium');

// 设置用户 ID
await analytics().setUserId(user.uid);

// 记录屏幕浏览
await analytics().logScreenView({
  screen_name: 'Home',
  screen_class: 'HomeScreen',
});
```

### 推送通知 (Push)

```javascript
import * as Notifications from 'expo-notifications';

// 发送本地通知
await Notifications.scheduleNotificationAsync({
  content: {
    title: "新消息",
    body: "您有一条新消息",
    data: { type: 'message', id: 123 },
  },
  trigger: null, // 立即发送
});

// 延迟通知
await Notifications.scheduleNotificationAsync({
  content: {
    title: "提醒",
    body: "别忘了完成任务",
  },
  trigger: {
    seconds: 60, // 60秒后
  },
});
```

## 运行应用

### 开发环境

```bash
# 启动开发服务器
npm run dev

# 在 iOS 模拟器运行
npm run ios
```

### 构建

```bash
# 清理并重新构建
npx expo prebuild --clean

# 运行 iOS
npm run ios
```

## 已安装的原生依赖

iOS Pods (96 个):
- ✅ Firebase (12.4.0)
- ✅ FirebaseAuth (12.4.0)
- ✅ FirebaseAnalytics (12.4.0)
- ✅ FirebaseCore (12.4.0)
- ✅ RNFBApp (23.5.0)
- ✅ RNFBAuth (23.5.0)
- ✅ RNFBAnalytics (23.5.0)
- ✅ EXNotifications (0.32.12)

## 重要提示

### iOS 配置
- ✅ GoogleService-Info.plist 已配置
- ✅ 后台推送权限已配置
- ✅ 模块化头文件已启用
- ✅ Bundle Identifier: `com.fanthus.monsterai.debug`

### Android 配置
- ⏸️ 暂未配置（按需配置）
- 需要时添加 `google-services.json`

### Analytics 注意事项

RNFBAnalytics 使用了带广告 ID 的 Analytics：
```
RNFBAnalytics: Using FirebaseAnalytics/IdentitySupport with Ad Ids. 
May require App Tracking Transparency. Not allowed for Kids apps.
```

如需移除广告 ID 支持，在 Podfile 中设置：
```ruby
$RNFirebaseAnalyticsWithoutAdIdSupport=true
```

## 故障排除

### 问题 1: FirebaseAuth-Swift.h not found
**解决方案**: 运行 `cd ios && pod install`

### 问题 2: No script URL provided
**解决方案**: 确保 Metro bundler 正在运行 (`npm start`)

### 问题 3: Swift pods 编译错误
**解决方案**: 确保 Podfile 中有 `use_modular_headers!`

### 问题 4: 推送通知不工作
**解决方案**: 
1. 确保在真实设备上测试（模拟器不支持推送）
2. 检查是否授予了通知权限
3. 确保后台模式已配置

## 测试功能

应用启动时会自动：
1. ✅ 初始化 Firebase Analytics
2. ✅ 记录 `app_open` 事件
3. ✅ 监听认证状态
4. ✅ 请求推送通知权限
5. ✅ 获取推送 token

查看控制台输出确认初始化成功。

## 完整示例代码

查看 `config/firebase-usage-example.js` 获取完整的使用示例，包括：
- ✅ 用户注册/登录/登出
- ✅ 认证状态监听
- ✅ Analytics 事件记录
- ✅ 用户属性设置
- ✅ 推送通知发送
- ✅ 本地通知管理

## 配置日期

- **2025-11-11**: 完成 Firebase 配置
  - ✅ React Native Firebase Auth
  - ✅ React Native Firebase Analytics
  - ✅ Expo Notifications
  - ✅ iOS 原生依赖

## 参考文档

- [React Native Firebase 文档](https://rnfirebase.io/)
- [Expo Notifications 文档](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Firebase Console](https://console.firebase.google.com/)

