# DeviceInfoManager 使用指南

## 概述

`DeviceInfoManager` 是一个用于管理设备传感器数据的工具类，提供了陀螺仪、加速度计、磁力计、气压计等传感器的统一访问接口。

## 功能特性

- ✅ **陀螺仪 (Gyroscope)**: 获取设备旋转速度
- ✅ **加速度计 (Accelerometer)**: 获取设备加速度和倾斜角度
- ✅ **磁力计 (Magnetometer)**: 获取设备朝向和方位角
- ✅ **气压计 (Barometer)**: 获取大气压力和相对高度
- ✅ **设备运动 (DeviceMotion)**: 综合传感器数据
- ✅ **工具方法**: 旋转速度转换、倾斜角度计算、方位角计算等

## 快速开始

### 1. 导入管理器

```javascript
import DeviceInfoManager, { 
  SensorType, 
  UpdateInterval 
} from './utils/device-info-manager';
```

### 2. 初始化传感器

```javascript
const initSensors = async () => {
  const result = await DeviceInfoManager.initialize();
  
  if (result.success) {
    console.log('传感器可用性:', result.availability);
  } else {
    console.error('初始化失败:', result.error);
  }
};
```

### 3. 订阅陀螺仪数据

```javascript
DeviceInfoManager.subscribeToGyroscope((data) => {
  console.log('陀螺仪数据:', data);
  // data: { x, y, z, timestamp }
}, UpdateInterval.NORMAL);
```

### 4. 清理订阅

```javascript
// 组件卸载时记得清理
useEffect(() => {
  // ...订阅传感器
  
  return () => {
    DeviceInfoManager.unsubscribeAll();
  };
}, []);
```

## API 文档

### 常量

#### SensorType

传感器类型常量：

```javascript
SensorType.GYROSCOPE       // 陀螺仪
SensorType.ACCELEROMETER   // 加速度计
SensorType.MAGNETOMETER    // 磁力计
SensorType.BAROMETER       // 气压计
SensorType.DEVICE_MOTION   // 设备运动
```

#### UpdateInterval

更新间隔预设（毫秒）：

```javascript
UpdateInterval.GAME    // 16ms (~60fps) - 适用于游戏
UpdateInterval.UI      // 32ms (~30fps) - 适用于UI更新
UpdateInterval.NORMAL  // 100ms (~10fps) - 正常使用
UpdateInterval.SLOW    // 1000ms (1fps) - 省电模式
```

### 初始化方法

#### `initialize()`

初始化传感器，检查可用性。

**返回值:**
```javascript
{
  success: boolean,
  availability: {
    gyroscope: boolean,
    accelerometer: boolean,
    magnetometer: boolean,
    barometer: boolean,
    deviceMotion: boolean
  },
  error?: string
}
```

**示例:**
```javascript
const result = await DeviceInfoManager.initialize();
if (result.success) {
  console.log('陀螺仪可用:', result.availability.gyroscope);
}
```

### 陀螺仪相关

#### `subscribeToGyroscope(callback, updateInterval)`

订阅陀螺仪数据。

**参数:**
- `callback: Function` - 回调函数，接收数据 `{x, y, z, timestamp}`
- `updateInterval: number` - 更新间隔（毫秒），默认 100ms

**返回值:**
```javascript
{ success: boolean, subscription?: Object, error?: string }
```

**数据格式:**
```javascript
{
  x: number,  // X轴旋转速度（弧度/秒）
  y: number,  // Y轴旋转速度（弧度/秒）
  z: number,  // Z轴旋转速度（弧度/秒）
  timestamp: number  // 时间戳
}
```

**示例:**
```javascript
DeviceInfoManager.subscribeToGyroscope((data) => {
  console.log(`旋转速度 - X: ${data.x}, Y: ${data.y}, Z: ${data.z}`);
}, UpdateInterval.NORMAL);
```

#### `unsubscribeFromGyroscope()`

取消陀螺仪订阅。

**示例:**
```javascript
DeviceInfoManager.unsubscribeFromGyroscope();
```

#### `getRotationRate(gyroData)`

将陀螺仪数据转换为度/秒。

**参数:**
- `gyroData: Object` - 陀螺仪原始数据

**返回值:**
```javascript
{ x: number, y: number, z: number, timestamp: number }
```

**示例:**
```javascript
const rotationRate = DeviceInfoManager.getRotationRate(gyroData);
console.log(`旋转速度: ${rotationRate.x}°/s`);
```

#### `isDeviceRotating(gyroData, threshold)`

检测设备是否在旋转。

**参数:**
- `gyroData: Object` - 陀螺仪数据
- `threshold: number` - 旋转阈值（弧度/秒），默认 0.1

**返回值:** `boolean`

**示例:**
```javascript
if (DeviceInfoManager.isDeviceRotating(gyroData, 0.1)) {
  console.log('设备正在旋转');
}
```

### 加速度计相关

#### `subscribeToAccelerometer(callback, updateInterval)`

订阅加速度计数据。

**参数:**
- `callback: Function` - 回调函数
- `updateInterval: number` - 更新间隔（毫秒）

**数据格式:**
```javascript
{
  x: number,  // X轴加速度（m/s²）
  y: number,  // Y轴加速度（m/s²）
  z: number,  // Z轴加速度（m/s²）
  timestamp: number
}
```

**示例:**
```javascript
DeviceInfoManager.subscribeToAccelerometer((data) => {
  const tilt = DeviceInfoManager.getTiltAngles(data);
  console.log(`倾斜角度 - Pitch: ${tilt.pitch}°, Roll: ${tilt.roll}°`);
});
```

#### `unsubscribeFromAccelerometer()`

取消加速度计订阅。

#### `getTiltAngles(accelData)`

计算设备倾斜角度。

**参数:**
- `accelData: Object` - 加速度计数据

**返回值:**
```javascript
{
  pitch: number,  // 前后倾斜角度（度）
  roll: number,   // 左右倾斜角度（度）
  timestamp: number
}
```

**示例:**
```javascript
const angles = DeviceInfoManager.getTiltAngles(accelData);
console.log(`俯仰角: ${angles.pitch}°, 翻滚角: ${angles.roll}°`);
```

#### `isDeviceMoving(accelData, threshold)`

检测设备是否在移动。

**参数:**
- `accelData: Object` - 加速度计数据
- `threshold: number` - 运动阈值，默认 0.1

**返回值:** `boolean`

**示例:**
```javascript
if (DeviceInfoManager.isDeviceMoving(accelData)) {
  console.log('设备正在移动');
}
```

### 磁力计相关

#### `subscribeToMagnetometer(callback, updateInterval)`

订阅磁力计数据。

**数据格式:**
```javascript
{
  x: number,  // X轴磁场强度（微特斯拉）
  y: number,  // Y轴磁场强度（微特斯拉）
  z: number,  // Z轴磁场强度（微特斯拉）
  timestamp: number
}
```

**示例:**
```javascript
DeviceInfoManager.subscribeToMagnetometer((data) => {
  const heading = DeviceInfoManager.getHeading(data);
  console.log(`方位角: ${heading}°`);
});
```

#### `unsubscribeFromMagnetometer()`

取消磁力计订阅。

#### `getHeading(magnetometerData)`

计算设备朝向（方位角）。

**参数:**
- `magnetometerData: Object` - 磁力计数据

**返回值:** `number` - 方位角（度，0-360）

**方位对照:**
- 0° (360°): 北
- 90°: 东
- 180°: 南
- 270°: 西

**示例:**
```javascript
const heading = DeviceInfoManager.getHeading(magnetometerData);
const direction = heading < 45 ? '北' : 
                  heading < 135 ? '东' : 
                  heading < 225 ? '南' : '西';
console.log(`朝向: ${direction} (${heading}°)`);
```

### 气压计相关

#### `subscribeToBarometer(callback, updateInterval)`

订阅气压计数据。

**数据格式:**
```javascript
{
  pressure: number,         // 大气压力（百帕）
  relativeAltitude: number, // 相对高度（米）
  timestamp: number
}
```

**示例:**
```javascript
DeviceInfoManager.subscribeToBarometer((data) => {
  console.log(`气压: ${data.pressure} hPa`);
  console.log(`相对高度: ${data.relativeAltitude} 米`);
});
```

#### `unsubscribeFromBarometer()`

取消气压计订阅。

### 设备运动相关

#### `subscribeToDeviceMotion(callback, updateInterval)`

订阅设备运动数据（综合传感器数据）。

**数据格式:**
```javascript
{
  acceleration: { x, y, z },              // 加速度（不含重力）
  accelerationIncludingGravity: { x, y, z }, // 加速度（含重力）
  rotation: { alpha, beta, gamma },       // 旋转角度
  rotationRate: { alpha, beta, gamma },   // 旋转速度
  orientation: number,                    // 设备方向
  timestamp: number
}
```

**示例:**
```javascript
DeviceInfoManager.subscribeToDeviceMotion((data) => {
  console.log('设备运动数据:', data);
});
```

#### `unsubscribeFromDeviceMotion()`

取消设备运动传感器订阅。

### 工具方法

#### `setUpdateInterval(sensorType, intervalMs)`

设置传感器更新间隔。

**参数:**
- `sensorType: string` - 传感器类型
- `intervalMs: number` - 更新间隔（毫秒）

**示例:**
```javascript
DeviceInfoManager.setUpdateInterval(SensorType.GYROSCOPE, 16);
```

#### `getLastData(sensorType)`

获取最后一次读取的传感器数据。

**参数:**
- `sensorType: string` - 传感器类型

**返回值:** `Object | null`

**示例:**
```javascript
const lastGyro = DeviceInfoManager.getLastData(SensorType.GYROSCOPE);
console.log('最后的陀螺仪数据:', lastGyro);
```

#### `getSensorAvailability()`

获取所有传感器的可用性状态。

**返回值:**
```javascript
{
  gyroscope: boolean,
  accelerometer: boolean,
  magnetometer: boolean,
  barometer: boolean,
  deviceMotion: boolean
}
```

**示例:**
```javascript
const availability = DeviceInfoManager.getSensorAvailability();
console.log('陀螺仪可用:', availability.gyroscope);
```

#### `unsubscribeAll()`

取消所有传感器订阅。

**示例:**
```javascript
DeviceInfoManager.unsubscribeAll();
```

## 使用场景

### 1. 游戏控制

通过设备倾斜控制游戏角色：

```javascript
useEffect(() => {
  DeviceInfoManager.initialize().then(() => {
    DeviceInfoManager.subscribeToAccelerometer((data) => {
      const angles = DeviceInfoManager.getTiltAngles(data);
      
      // 使用倾斜角度控制游戏
      gameController.moveCharacter({
        horizontal: angles.roll / 45,  // -1 到 1
        vertical: angles.pitch / 45
      });
    }, UpdateInterval.GAME); // 使用高刷新率
  });

  return () => DeviceInfoManager.unsubscribeFromAccelerometer();
}, []);
```

### 2. 指南针应用

显示设备朝向：

```javascript
const [heading, setHeading] = useState(0);

useEffect(() => {
  DeviceInfoManager.initialize().then(() => {
    DeviceInfoManager.subscribeToMagnetometer((data) => {
      const direction = DeviceInfoManager.getHeading(data);
      setHeading(direction);
    });
  });

  return () => DeviceInfoManager.unsubscribeFromMagnetometer();
}, []);

// 显示方位角和方向
const getDirection = (heading) => {
  if (heading < 45 || heading >= 315) return '北';
  if (heading < 135) return '东';
  if (heading < 225) return '南';
  return '西';
};
```

### 3. 运动检测

检测设备移动状态：

```javascript
const [isMoving, setIsMoving] = useState(false);

useEffect(() => {
  DeviceInfoManager.initialize().then(() => {
    DeviceInfoManager.subscribeToAccelerometer((data) => {
      const moving = DeviceInfoManager.isDeviceMoving(data, 0.2);
      setIsMoving(moving);
      
      if (moving) {
        console.log('用户正在移动');
        // 触发相关功能，例如记录运动轨迹
      }
    });
  });

  return () => DeviceInfoManager.unsubscribeFromAccelerometer();
}, []);
```

### 4. VR/AR 应用

追踪设备旋转：

```javascript
useEffect(() => {
  DeviceInfoManager.initialize().then(() => {
    DeviceInfoManager.subscribeToDeviceMotion((data) => {
      const { rotation, rotationRate } = data;
      
      // 更新 3D 场景相机
      sceneCamera.setRotation({
        x: rotation.beta,
        y: rotation.alpha,
        z: rotation.gamma
      });
    }, UpdateInterval.GAME);
  });

  return () => DeviceInfoManager.unsubscribeFromDeviceMotion();
}, []);
```

### 5. 海拔监测

使用气压计估算海拔高度：

```javascript
useEffect(() => {
  DeviceInfoManager.initialize().then((result) => {
    if (result.availability.barometer) {
      DeviceInfoManager.subscribeToBarometer((data) => {
        console.log(`气压: ${data.pressure.toFixed(2)} hPa`);
        console.log(`相对高度: ${data.relativeAltitude.toFixed(2)} 米`);
      }, UpdateInterval.SLOW);
    }
  });

  return () => DeviceInfoManager.unsubscribeFromBarometer();
}, []);
```

## 注意事项

### 1. 权限要求

iOS 设备通常不需要特殊权限就能访问传感器数据，但某些功能可能需要：
- 磁力计可能需要在 `Info.plist` 中添加相关描述
- 后台使用传感器需要配置后台模式

### 2. 性能优化

- **选择合适的更新间隔**: 根据使用场景选择合适的更新频率
  - 游戏和VR应用使用 `UpdateInterval.GAME`
  - 普通UI更新使用 `UpdateInterval.NORMAL`
  - 后台监控使用 `UpdateInterval.SLOW`

- **及时清理订阅**: 组件卸载时务必取消订阅，避免内存泄漏

```javascript
useEffect(() => {
  // 订阅传感器
  DeviceInfoManager.subscribeToGyroscope(handleData);
  
  // 清理函数
  return () => {
    DeviceInfoManager.unsubscribeFromGyroscope();
  };
}, []);
```

### 3. 电池消耗

传感器持续运行会消耗电池，建议：
- 仅在需要时订阅传感器
- 使用较低的更新频率
- 在应用进入后台时取消订阅

### 4. 设备兼容性

并非所有设备都支持所有传感器：
- 大多数现代智能手机都有陀螺仪和加速度计
- 磁力计在某些设备上可能不准确
- 气压计通常只在高端设备上可用

始终先调用 `initialize()` 检查传感器可用性。

### 5. 坐标系统

不同传感器使用不同的坐标系统：

**陀螺仪/加速度计坐标系:**
- X轴: 设备左右方向（右为正）
- Y轴: 设备前后方向（前为正）
- Z轴: 设备垂直方向（上为正）

**设备方向:**
- Portrait: 竖屏
- Landscape: 横屏

## 故障排除

### 问题1: 传感器初始化失败

**解决方案:**
```javascript
const result = await DeviceInfoManager.initialize();
if (!result.success) {
  console.error('初始化失败:', result.error);
  // 检查设备是否支持传感器
  console.log('可用性:', result.availability);
}
```

### 问题2: 数据不更新

**可能原因:**
1. 订阅未成功
2. 更新间隔设置过长
3. 设备传感器故障

**解决方案:**
```javascript
const result = DeviceInfoManager.subscribeToGyroscope(callback);
if (!result.success) {
  console.error('订阅失败:', result.error);
}
```

### 问题3: 内存泄漏

**解决方案:** 确保在组件卸载时清理所有订阅

```javascript
useEffect(() => {
  // 订阅逻辑
  
  return () => {
    // 清理所有订阅
    DeviceInfoManager.unsubscribeAll();
  };
}, []);
```

## 更多示例

查看完整示例代码：
- `DeviceInfoManager.example.js` - 包含多个使用场景的完整示例

## 技术支持

如有问题或建议，请联系开发团队。

