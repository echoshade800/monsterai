/**
 * DeviceInfoManager 使用示例
 * 演示如何使用设备信息管理器获取陀螺仪等传感器数据
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, ScrollView } from 'react-native';
import DeviceInfoManager, { SensorType, UpdateInterval } from './device-info-manager';

export default function DeviceInfoExample() {
  const [sensorAvailability, setSensorAvailability] = useState(null);
  const [gyroscopeData, setGyroscopeData] = useState(null);
  const [accelerometerData, setAccelerometerData] = useState(null);
  const [magnetometerData, setMagnetometerData] = useState(null);
  const [rotationRate, setRotationRate] = useState(null);
  const [tiltAngles, setTiltAngles] = useState(null);
  const [heading, setHeading] = useState(null);
  const [isMoving, setIsMoving] = useState(false);
  const [isRotating, setIsRotating] = useState(false);

  useEffect(() => {
    // 初始化传感器
    initializeSensors();

    // 组件卸载时清理
    return () => {
      DeviceInfoManager.unsubscribeAll();
    };
  }, []);

  /**
   * 初始化传感器
   */
  const initializeSensors = async () => {
    try {
      const result = await DeviceInfoManager.initialize();
      if (result.success) {
        setSensorAvailability(result.availability);
        console.log('传感器初始化成功:', result.availability);
      } else {
        console.error('传感器初始化失败:', result.error);
      }
    } catch (error) {
      console.error('初始化传感器时出错:', error);
    }
  };

  /**
   * 示例1: 订阅陀螺仪数据
   */
  const startGyroscope = () => {
    const result = DeviceInfoManager.subscribeToGyroscope((data) => {
      setGyroscopeData(data);
      
      // 获取旋转速度（度/秒）
      const rotation = DeviceInfoManager.getRotationRate(data);
      setRotationRate(rotation);

      // 检测是否在旋转
      const rotating = DeviceInfoManager.isDeviceRotating(data);
      setIsRotating(rotating);
    }, UpdateInterval.NORMAL);

    if (result.success) {
      console.log('陀螺仪订阅成功');
    } else {
      console.error('陀螺仪订阅失败:', result.error);
    }
  };

  /**
   * 示例2: 订阅加速度计数据
   */
  const startAccelerometer = () => {
    const result = DeviceInfoManager.subscribeToAccelerometer((data) => {
      setAccelerometerData(data);

      // 计算倾斜角度
      const angles = DeviceInfoManager.getTiltAngles(data);
      setTiltAngles(angles);

      // 检测是否在移动
      const moving = DeviceInfoManager.isDeviceMoving(data);
      setIsMoving(moving);
    }, UpdateInterval.NORMAL);

    if (result.success) {
      console.log('加速度计订阅成功');
    } else {
      console.error('加速度计订阅失败:', result.error);
    }
  };

  /**
   * 示例3: 订阅磁力计数据
   */
  const startMagnetometer = () => {
    const result = DeviceInfoManager.subscribeToMagnetometer((data) => {
      setMagnetometerData(data);

      // 计算设备朝向
      const deviceHeading = DeviceInfoManager.getHeading(data);
      setHeading(deviceHeading);
    }, UpdateInterval.NORMAL);

    if (result.success) {
      console.log('磁力计订阅成功');
    } else {
      console.error('磁力计订阅失败:', result.error);
    }
  };

  /**
   * 示例4: 订阅设备运动数据（综合传感器）
   */
  const startDeviceMotion = () => {
    const result = DeviceInfoManager.subscribeToDeviceMotion((data) => {
      console.log('设备运动数据:', data);
      // 这里可以获取包括加速度、旋转、方向等所有数据
    }, UpdateInterval.NORMAL);

    if (result.success) {
      console.log('设备运动传感器订阅成功');
    } else {
      console.error('设备运动传感器订阅失败:', result.error);
    }
  };

  /**
   * 停止所有传感器
   */
  const stopAllSensors = () => {
    DeviceInfoManager.unsubscribeAll();
    setGyroscopeData(null);
    setAccelerometerData(null);
    setMagnetometerData(null);
    setRotationRate(null);
    setTiltAngles(null);
    setHeading(null);
    console.log('所有传感器已停止');
  };

  /**
   * 获取最后一次的传感器数据
   */
  const getLastSensorData = () => {
    const lastGyro = DeviceInfoManager.getLastData(SensorType.GYROSCOPE);
    const lastAccel = DeviceInfoManager.getLastData(SensorType.ACCELEROMETER);
    const lastMag = DeviceInfoManager.getLastData(SensorType.MAGNETOMETER);
    
    console.log('最后的陀螺仪数据:', lastGyro);
    console.log('最后的加速度计数据:', lastAccel);
    console.log('最后的磁力计数据:', lastMag);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>设备传感器管理器示例</Text>

      {/* 传感器可用性 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>传感器可用性</Text>
        {sensorAvailability ? (
          <>
            <Text>陀螺仪: {sensorAvailability.gyroscope ? '✅ 可用' : '❌ 不可用'}</Text>
            <Text>加速度计: {sensorAvailability.accelerometer ? '✅ 可用' : '❌ 不可用'}</Text>
            <Text>磁力计: {sensorAvailability.magnetometer ? '✅ 可用' : '❌ 不可用'}</Text>
            <Text>气压计: {sensorAvailability.barometer ? '✅ 可用' : '❌ 不可用'}</Text>
            <Text>设备运动: {sensorAvailability.deviceMotion ? '✅ 可用' : '❌ 不可用'}</Text>
          </>
        ) : (
          <Text>正在检查...</Text>
        )}
      </View>

      {/* 控制按钮 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>控制</Text>
        <Button title="开始陀螺仪" onPress={startGyroscope} />
        <Button title="开始加速度计" onPress={startAccelerometer} />
        <Button title="开始磁力计" onPress={startMagnetometer} />
        <Button title="开始设备运动" onPress={startDeviceMotion} />
        <Button title="停止所有传感器" onPress={stopAllSensors} color="red" />
        <Button title="获取最后数据" onPress={getLastSensorData} color="gray" />
      </View>

      {/* 陀螺仪数据 */}
      {gyroscopeData && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>陀螺仪数据 (弧度/秒)</Text>
          <Text>X: {gyroscopeData.x.toFixed(4)}</Text>
          <Text>Y: {gyroscopeData.y.toFixed(4)}</Text>
          <Text>Z: {gyroscopeData.z.toFixed(4)}</Text>
          <Text style={styles.status}>
            {isRotating ? '🔄 设备正在旋转' : '⏸️ 设备静止'}
          </Text>
        </View>
      )}

      {/* 旋转速度 */}
      {rotationRate && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>旋转速度 (度/秒)</Text>
          <Text>X: {rotationRate.x.toFixed(2)}°/s</Text>
          <Text>Y: {rotationRate.y.toFixed(2)}°/s</Text>
          <Text>Z: {rotationRate.z.toFixed(2)}°/s</Text>
        </View>
      )}

      {/* 加速度计数据 */}
      {accelerometerData && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>加速度计数据 (m/s²)</Text>
          <Text>X: {accelerometerData.x.toFixed(4)}</Text>
          <Text>Y: {accelerometerData.y.toFixed(4)}</Text>
          <Text>Z: {accelerometerData.z.toFixed(4)}</Text>
          <Text style={styles.status}>
            {isMoving ? '🏃 设备正在移动' : '⏸️ 设备静止'}
          </Text>
        </View>
      )}

      {/* 倾斜角度 */}
      {tiltAngles && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>倾斜角度</Text>
          <Text>俯仰角 (Pitch): {tiltAngles.pitch.toFixed(2)}°</Text>
          <Text>翻滚角 (Roll): {tiltAngles.roll.toFixed(2)}°</Text>
        </View>
      )}

      {/* 磁力计数据 */}
      {magnetometerData && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>磁力计数据 (μT)</Text>
          <Text>X: {magnetometerData.x.toFixed(2)}</Text>
          <Text>Y: {magnetometerData.y.toFixed(2)}</Text>
          <Text>Z: {magnetometerData.z.toFixed(2)}</Text>
        </View>
      )}

      {/* 设备朝向 */}
      {heading !== null && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>设备朝向</Text>
          <Text>方位角: {heading.toFixed(2)}°</Text>
          <Text>
            方向: {
              heading < 45 || heading >= 315 ? '北' :
              heading < 135 ? '东' :
              heading < 225 ? '南' : '西'
            }
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  status: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
});

/**
 * 使用场景示例
 */

// 场景1: 游戏控制 - 通过设备倾斜控制游戏角色
export const GameControlExample = () => {
  useEffect(() => {
    DeviceInfoManager.initialize().then(() => {
      // 使用高刷新率订阅加速度计
      DeviceInfoManager.subscribeToAccelerometer((data) => {
        const angles = DeviceInfoManager.getTiltAngles(data);
        // 使用 angles.pitch 和 angles.roll 控制游戏角色
        console.log('游戏控制角度:', angles);
      }, UpdateInterval.GAME); // 60fps 更新
    });

    return () => DeviceInfoManager.unsubscribeFromAccelerometer();
  }, []);

  return <View />;
};

// 场景2: 指南针应用 - 显示设备朝向
export const CompassExample = () => {
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    DeviceInfoManager.initialize().then(() => {
      DeviceInfoManager.subscribeToMagnetometer((data) => {
        const heading = DeviceInfoManager.getHeading(data);
        setDirection(heading);
      }, UpdateInterval.NORMAL);
    });

    return () => DeviceInfoManager.unsubscribeFromMagnetometer();
  }, []);

  return (
    <View style={{ justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 48 }}>{direction.toFixed(0)}°</Text>
      <Text>方位角</Text>
    </View>
  );
};

// 场景3: 运动检测 - 检测设备是否在移动
export const MotionDetectionExample = () => {
  const [isMoving, setIsMoving] = useState(false);

  useEffect(() => {
    DeviceInfoManager.initialize().then(() => {
      DeviceInfoManager.subscribeToAccelerometer((data) => {
        const moving = DeviceInfoManager.isDeviceMoving(data, 0.2);
        setIsMoving(moving);
      }, UpdateInterval.NORMAL);
    });

    return () => DeviceInfoManager.unsubscribeFromAccelerometer();
  }, []);

  return (
    <View style={{ justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 24 }}>
        {isMoving ? '🏃 正在移动' : '⏸️ 静止'}
      </Text>
    </View>
  );
};

// 场景4: 旋转检测 - 检测设备是否在旋转
export const RotationDetectionExample = () => {
  const [isRotating, setIsRotating] = useState(false);

  useEffect(() => {
    DeviceInfoManager.initialize().then(() => {
      DeviceInfoManager.subscribeToGyroscope((data) => {
        const rotating = DeviceInfoManager.isDeviceRotating(data, 0.1);
        setIsRotating(rotating);
      }, UpdateInterval.NORMAL);
    });

    return () => DeviceInfoManager.unsubscribeFromGyroscope();
  }, []);

  return (
    <View style={{ justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 24 }}>
        {isRotating ? '🔄 正在旋转' : '⏸️ 静止'}
      </Text>
    </View>
  );
};

