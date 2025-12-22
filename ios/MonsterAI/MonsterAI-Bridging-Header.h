//
// Use this file to import your target's public headers that you would like to expose to Swift.
//

// 基础 React Native 模块 - 必须首先导入
#import <React/RCTDefines.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import <React/RCTInitializing.h>
#import <React/RCTBridge.h>

// React Native 核心模块
#import <React/RCTRootView.h>
#import <React/RCTPlatform.h>
#import <React/RCTDevSettings.h>
#import <React/RCTBundleURLProvider.h>
#import <React/RCTLinkingManager.h>

// React Native App Delegate 模块
//#import <React-RCTAppDelegate/RCTDefaultReactNativeFactoryDelegate.h>
#import <React-RCTAppDelegate-umbrella.h>
//#import <React-RCTAppDelegate/RCTReactNativeFactory.h>
//#import <React-RCTAppDelegate/RCTAppSetupUtils.h>
// Expo 模块
#import <Expo-Swift.h>

// 自定义模块 - 必须在 Swift 头文件之前导入
#import "MiniAppViewController.h"
#import "MiniAppH5ViewController.h"
#import "RNLoggerHelper.h"

// Swift 生成的 Objective-C 头文件 - 必须放在最后


// 调试工具
#if DEBUG
#if __has_include(<FLEX/FLEX.h>)
#import <FLEX/FLEX.h>
#endif
#endif

