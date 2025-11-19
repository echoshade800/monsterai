//
//  MiniAppFactoryDelegate.m
//  boltexponativewind
//
//  Created by fanthus on 8/20/25.
//

#import "MiniAppFactoryDelegate.h"
#import "MiniAppViewController.h"
#import <react/renderer/runtimescheduler/RuntimeScheduler.h>
#import <react/renderer/runtimescheduler/RuntimeSchedulerCallInvoker.h>
#import <react/runtime/JSRuntimeFactory.h>
#import <react/runtime/JSRuntimeFactoryCAPI.h>
#import <React/RCTHermesInstanceFactory.h>
 #import <React/RCTBridge.h>
 #import <React/RCTBridgeDelegate.h>
// #import "boltexponativewind-Swift.h"


@implementation MiniAppFactoryDelegate

/// 1) 告诉 RN 去哪里拿 JS bundle
- (NSURL *)bundleURL
{
  RCTLogInfo(@"[MiniApp] self.miniBundleURL = %@", self.miniBundleURL);
  return [NSURL URLWithString:self.miniBundleURL];
}

/// 2) Factory 使用的 RootViewController（可替换为你自己的 VC）
- (UIViewController *)createRootViewController {
  return [MiniAppViewController new];
}

@end
