//
// Use this file to import your target's public headers that you would like to expose to Swift.
//
#import <React/RCTDefines.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import <React/RCTInitializing.h>

// React Native 核心模块
#import <React/RCTRootView.h>
#import <React/RCTPlatform.h>
#import <React/RCTDevSettings.h>
#import <React/RCTBundleURLProvider.h>
#import <React/RCTLinkingManager.h>

// React Native App Delegate 模块
//#import <React-RCTAppDelegate/RCTReactNativeFactory.h>
//#import <React-RCTAppDelegate/RCTAppSetupUtils.h>
#import <React/RCTBridge.h>
#import <React/RCTRootView.h>
#import <React/RCTBundleURLProvider.h>

// Expo 模块
#import <Expo-Swift.h>

//// 自定义模块
//#import "MiniAppViewController.h"
//#import "MiniAppH5ViewController.h"

// React Core 模块
#import "React/React-Core-umbrella.h"

// 调试工具
#if DEBUG
#if __has_include(<FLEX/FLEX.h>)
#import <FLEX/FLEX.h>
#endif
#endif
