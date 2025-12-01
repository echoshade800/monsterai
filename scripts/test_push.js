#!/usr/bin/env node

/**
 * iOS 原生推送通知测试脚本 (APNs)
 * 
 * 使用方法:
 *   node scripts/test_push.js <device_token> [options]
 * 
 * 示例:
 *   node scripts/test_push.js "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" --key-path ./AuthKey_XXXXXXXXXX.p8 --key-id XXXXXXXXXX --team-id XXXXXXXXXX
 *   node scripts/test_push.js "xxxxxxxx..." --key-path ./AuthKey.p8 --key-id ABC123 --team-id DEF456 --bundle-id com.fanthus.monsterai.debug
 */

const http2 = require('http2');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// APNs 服务器地址
const APNS_SERVERS = {
  development: 'api.sandbox.push.apple.com',
  production: 'api.push.apple.com',
};

// 默认配置
const DEFAULT_CONFIG = {
  title: '测试推送通知',
  body: '这是一条测试推送消息',
  sound: 'default',
  badge: 1,
  environment: 'development', // development 或 production
  bundleId: 'com.fanthus.monsterai.debug',
  priority: 10, // 10 = immediate, 5 = power-efficient
  contentAvailable: false,
  mutableContent: false,
  // APNs 认证信息（默认值）
  keyPath: path.join(__dirname, 'AuthKey_5S9ZU4U53Z.p8'),
  keyId: '5S9ZU4U53Z',
  teamId: '7PLGSDP5AT',
};

// Base64URL 编码（JWT 使用）
function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// 生成 JWT Token (用于 .p8 密钥认证)
function generateJWT(keyPath, keyId, teamId) {
  try {
    const privateKey = fs.readFileSync(keyPath, 'utf8');
    
    const header = {
      alg: 'ES256',
      kid: keyId,
    };
    
    const payload = {
      iss: teamId,
      iat: Math.floor(Date.now() / 1000),
    };
    
    // 使用 Node.js crypto 模块生成 JWT
    const headerBase64 = base64UrlEncode(JSON.stringify(header));
    const payloadBase64 = base64UrlEncode(JSON.stringify(payload));
    const signatureInput = `${headerBase64}.${payloadBase64}`;
    
    // ES256 使用 ECDSA with SHA-256
    // 使用 createSign 和 ECDSA 私钥
    const sign = crypto.createSign('SHA256');
    sign.update(signatureInput);
    sign.end();
    
    // 使用 ECDSA 私钥签名，ES256 需要 IEEE P1363 格式
    let signature;
    try {
      // Node.js 12+ 支持 dsaEncoding 选项
      signature = sign.sign(
        {
          key: privateKey,
          dsaEncoding: 'ieee-p1363',
        },
        'base64'
      );
    } catch (e) {
      // 如果上面的方法失败，尝试直接签名
      signature = sign.sign(privateKey, 'base64');
    }
    
    // 转换为 Base64URL
    const signatureBase64Url = signature
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    
    return `${headerBase64}.${payloadBase64}.${signatureBase64Url}`;
  } catch (error) {
    throw new Error(`生成 JWT 失败: ${error.message}\n提示: 请确保 .p8 密钥文件格式正确，且 Key ID 和 Team ID 正确`);
  }
}

// 解析命令行参数
function parseArgs() {
  const args = process.argv.slice(2);
  const config = { ...DEFAULT_CONFIG };
  
  if (args.length === 0) {
    console.error('❌ 错误: 请提供 device_token');
    console.log('\n使用方法:');
    console.log('  node scripts/test_push.js <device_token> [options]');
    console.log('\nAPNs 认证选项 (已设置默认值，可选覆盖):');
    console.log('  --key-path <路径>      APNs 认证密钥文件路径 (.p8 文件)');
    console.log('                        默认: ./scripts/AuthKey_5S9ZU4U53Z.p8');
    console.log('  --key-id <ID>         APNs Key ID (默认: 5S9ZU4U53Z)');
    console.log('  --team-id <ID>        Apple Team ID (默认: 7PLGSDP5AT)');
    console.log('\n可选选项:');
    console.log('  --bundle-id <ID>      应用 Bundle ID (默认: com.fanthus.monsterai.debug)');
    console.log('  --title <标题>        推送标题 (默认: "测试推送通知")');
    console.log('  --body <内容>         推送内容 (默认: "这是一条测试推送消息")');
    console.log('  --sound <声音>        推送声音 (默认: "default")');
    console.log('  --badge <数字>        应用角标数字 (默认: 1)');
    console.log('  --priority <优先级>   推送优先级: 10 (立即) 或 5 (省电) (默认: 10)');
    console.log('  --environment <环境>  推送环境: development 或 production (默认: development)');
    console.log('  --data <JSON>         自定义数据 (JSON 字符串)');
    console.log('  --content-available   启用 content-available (后台更新)');
    console.log('  --mutable-content     启用 mutable-content (通知扩展)');
    console.log('\n示例:');
    console.log('  # 使用默认配置（最简单）');
    console.log('  node scripts/test_push.js "xxxxxxxx..."');
    console.log('');
    console.log('  # 自定义推送内容');
    console.log('  node scripts/test_push.js "xxxxxxxx..." --title "提醒" --body "您有新消息"');
    console.log('');
    console.log('  # 覆盖默认认证信息');
    console.log('  node scripts/test_push.js "xxxxxxxx..." \\');
    console.log('    --key-path ./AuthKey_XXXXXXXXXX.p8 \\');
    console.log('    --key-id XXXXXXXXXX \\');
    console.log('    --team-id XXXXXXXXXX');
    console.log('\n注意:');
    console.log('  - Device Token 应该是 64 字符的十六进制字符串（不是 Expo Token）');
    console.log('  - 开发环境使用 api.sandbox.push.apple.com');
    console.log('  - 生产环境使用 api.push.apple.com');
    process.exit(1);
  }
  
  config.deviceToken = args[0];
  
  // 验证 device token 格式
  if (!/^[0-9a-fA-F]{64}$/.test(config.deviceToken)) {
    console.warn('⚠️  警告: Device Token 格式可能不正确（应该是 64 字符的十六进制字符串）');
  }
  
  // 解析选项
  for (let i = 1; i < args.length; i += 2) {
    const key = args[i];
    const value = args[i + 1];
    
    if (!value && !key.startsWith('--content-available') && !key.startsWith('--mutable-content')) {
      console.error(`❌ 错误: 选项 ${key} 缺少值`);
      process.exit(1);
    }
    
    switch (key) {
      case '--key-path':
        config.keyPath = path.resolve(value);
        break;
      case '--key-id':
        config.keyId = value;
        break;
      case '--team-id':
        config.teamId = value;
        break;
      case '--bundle-id':
        config.bundleId = value;
        break;
      case '--title':
        config.title = value;
        break;
      case '--body':
        config.body = value;
        break;
      case '--sound':
        config.sound = value;
        break;
      case '--badge':
        const badge = parseInt(value, 10);
        if (isNaN(badge)) {
          console.error(`❌ 错误: badge 必须是数字`);
          process.exit(1);
        }
        config.badge = badge;
        break;
      case '--priority':
        const priority = parseInt(value, 10);
        if (priority !== 10 && priority !== 5) {
          console.error(`❌ 错误: priority 必须是 10 (立即) 或 5 (省电)`);
          process.exit(1);
        }
        config.priority = priority;
        break;
      case '--environment':
        if (value !== 'development' && value !== 'production') {
          console.error(`❌ 错误: environment 必须是 "development" 或 "production"`);
          process.exit(1);
        }
        config.environment = value;
        break;
      case '--data':
        try {
          config.data = JSON.parse(value);
        } catch (e) {
          console.error(`❌ 错误: --data 必须是有效的 JSON 字符串`);
          process.exit(1);
        }
        break;
      case '--content-available':
        config.contentAvailable = true;
        i--; // 不需要读取下一个参数
        break;
      case '--mutable-content':
        config.mutableContent = true;
        i--; // 不需要读取下一个参数
        break;
      default:
        console.warn(`⚠️  警告: 未知选项 ${key}`);
    }
  }
  
  // 验证必需参数（使用默认值或用户提供的值）
  if (!config.keyPath) {
    console.error('❌ 错误: 必须提供 --key-path 或确保默认密钥文件存在');
    process.exit(1);
  }
  if (!config.keyId) {
    console.error('❌ 错误: 必须提供 --key-id');
    process.exit(1);
  }
  if (!config.teamId) {
    console.error('❌ 错误: 必须提供 --team-id');
    process.exit(1);
  }
  
  // 验证密钥文件是否存在
  if (!fs.existsSync(config.keyPath)) {
    console.error(`❌ 错误: 密钥文件不存在: ${config.keyPath}`);
    console.error(`提示: 请确保文件存在，或使用 --key-path 指定正确的路径`);
    process.exit(1);
  }
  
  return config;
}

// 发送推送通知到 APNs
function sendPushNotification(config) {
  return new Promise((resolve, reject) => {
    // 生成 JWT Token
    let jwtToken;
    try {
      jwtToken = generateJWT(config.keyPath, config.keyId, config.teamId);
    } catch (error) {
      reject(error);
      return;
    }
    
    // 构建推送负载
    const payload = {
      aps: {
        alert: {
          title: config.title,
          body: config.body,
        },
        sound: config.sound,
        badge: config.badge,
      },
    };
    
    // 添加可选字段
    if (config.contentAvailable) {
      payload.aps['content-available'] = 1;
    }
    if (config.mutableContent) {
      payload.aps['mutable-content'] = 1;
    }
    
    // 添加自定义数据
    if (config.data) {
      Object.assign(payload, config.data);
    }
    
    const postData = JSON.stringify(payload);
    
    // 选择服务器
    const server = APNS_SERVERS[config.environment];
    const deviceToken = config.deviceToken.replace(/\s+/g, ''); // 移除空格
    
    console.log('\n📤 发送推送通知到 APNs...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('服务器:', server);
    console.log('环境:', config.environment);
    console.log('Bundle ID:', config.bundleId);
    console.log('设备 Token:', deviceToken);
    console.log('标题:', config.title);
    console.log('内容:', config.body);
    console.log('声音:', config.sound);
    console.log('角标:', config.badge);
    console.log('优先级:', config.priority === 10 ? '立即' : '省电');
    if (config.contentAvailable) {
      console.log('Content-Available: 是');
    }
    if (config.mutableContent) {
      console.log('Mutable-Content: 是');
    }
    if (config.data) {
      console.log('自定义数据:', JSON.stringify(config.data, null, 2));
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // 创建 HTTP/2 客户端
    const client = http2.connect(`https://${server}:443`, {
      rejectUnauthorized: true,
    });
    
    client.on('error', (error) => {
      console.error('❌ HTTP/2 连接错误:', error.message);
      reject(error);
    });
    
    // 构建请求路径
    const requestPath = `/3/device/${deviceToken}`;
    
    // 构建请求头
    const headers = {
      ':method': 'POST',
      ':path': requestPath,
      ':scheme': 'https',
      ':authority': server,
      'authorization': `bearer ${jwtToken}`,
      'apns-topic': config.bundleId,
      'apns-priority': config.priority.toString(),
      'apns-push-type': 'alert',
      'content-type': 'application/json',
      'content-length': Buffer.byteLength(postData).toString(),
    };
    
    // 如果是开发环境，添加 apns-expiration
    if (config.environment === 'development') {
      headers['apns-expiration'] = '0'; // 立即过期（仅用于测试）
    }
    
    // 发送请求
    const req = client.request(headers);
    
    let responseData = '';
    
    req.on('response', (responseHeaders) => {
      const status = responseHeaders[':status'];
      const apnsId = responseHeaders['apns-id'];
      
      console.log('📥 收到响应:');
      console.log('状态码:', status);
      if (apnsId) {
        console.log('APNs ID:', apnsId);
      }
      
      req.on('data', (chunk) => {
        responseData += chunk.toString();
      });
      
      req.on('end', () => {
        client.close();
        
        if (status === '200') {
          console.log('✅ 推送发送成功!');
          if (responseData) {
            try {
              const response = JSON.parse(responseData);
              console.log('响应数据:', JSON.stringify(response, null, 2));
            } catch (e) {
              console.log('响应数据:', responseData);
            }
          }
          resolve({ status, apnsId, data: responseData });
        } else {
          console.error(`❌ 推送发送失败: HTTP ${status}`);
          if (responseData) {
            try {
              const error = JSON.parse(responseData);
              console.error('错误信息:', JSON.stringify(error, null, 2));
              if (error.reason) {
                console.error('错误原因:', error.reason);
              }
            } catch (e) {
              console.error('错误数据:', responseData);
            }
          }
          reject(new Error(`HTTP ${status}: ${responseData}`));
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ 请求错误:', error.message);
      client.close();
      reject(error);
    });
    
    // 写入请求体
    req.write(postData);
    req.end();
  });
}

// 主函数
async function main() {
  try {
    const config = parseArgs();
    await sendPushNotification(config);
    console.log('\n✨ 完成!\n');
  } catch (error) {
    console.error('\n❌ 错误:', error.message);
    process.exit(1);
  }
}

// 运行脚本
if (require.main === module) {
  main();
}

module.exports = { sendPushNotification, generateJWT, parseArgs };
