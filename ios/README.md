


## Product机相关

### 发版基础配置
1. 代码同步到Product机器后要做的基础配置
2. bundleid 修改 com.monster.ai.us
3. GoogleService.plist 替换为正式     #验证方式是看里面bundleid是否正确
4. 执行 npm install & pod install 命令

### Product机器 DEBUG 方法
Product 机器上也需要进行调试，确保生产环境正常，具体配置调试的方法
1. 修改 api.js 中的地址为开发服务地址
2. 执行 npx react-native bundle --platform ios --dev false --entry-file index.tsx --bundle-output ios/rnbundle/main.jsbundle --assets-dest ios/rnbundle 
3. AppDelegate 中加载 bundle 的方法强制指定 bundle 位置

### 打包要注意的事项
1. 恢复 AppDelegate 中的代码，以及删除掉工程中的 bundle 文件
2. 版本号和 build 号修改
3. 先尝试 adhoc 导出运行是否正常
4. 运行正常之后再上传商店

