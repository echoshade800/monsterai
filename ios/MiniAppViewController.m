//
//  MiniAppViewController.m
//  boltexponativewind
//
//  Created by fanthus on 8/19/25.
//

#import "MiniAppViewController.h"
#import <React/RCTRootView.h>
#import <React/RCTBridge.h>
#import <React/RCTBridgeDelegate.h>
#import <React-RCTAppDelegate/RCTAppSetupUtils.h>
#import <React/RCTPlatform.h>
#import <React/RCTDevSettings.h>
#import <React/RCTBridge.h>
#import <React/RCTBridgeModule.h>
#import <React-RCTAppDelegate/RCTAppSetupUtils.h>

#import "boltexponativewind-Swift.h"
#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import <React-RCTAppDelegate/RCTReactNativeFactory.h>   // RN 0.78+ 提供
#import <React/RCTBundleURLProvider.h>    // 取开发时 Metro URL
#import "MiniAppFactoryDelegate.h"
//---------------

@interface MiniAppViewController ()
@property (nonatomic, copy, nullable) NSString *baseURL;
@property (nonatomic, copy) NSString *moduleName;
@property (nonatomic, copy) NSDictionary *param;
@property (nonatomic, strong, nullable) RCTRootView *rootView;
@property (nonatomic, strong) RCTReactNativeFactory *factory;
@end

@implementation MiniAppViewController

- (instancetype)initWithBaseURL:(NSString *)baseURL
                     moduleName:(NSString *)moduleName
                          param:(nonnull NSDictionary *)param {
  if (self = [super initWithNibName:nil bundle:nil]) {
    _baseURL = [baseURL copy];
    _moduleName = [moduleName copy];
    _param = param;
  }
  return self;
}

- (void)viewDidLoad {
  [super viewDidLoad];
  // 确保 React Native 应用环境准备完毕（避免 AccessibilityManager 为 nil 导致的崩溃）
  RCTAppSetupPrepareApp([UIApplication sharedApplication], YES);
  self.view.backgroundColor = [UIColor whiteColor];
  //
  MiniAppFactoryDelegate *delegate = [[MiniAppFactoryDelegate alloc] init];
  delegate.miniBundleURL = self.baseURL;
  self.factory = [[RCTReactNativeFactory alloc] initWithDelegate:delegate];
  UIView *rootView = [self.factory.rootViewFactory viewWithModuleName:self.moduleName initialProperties:nil launchOptions:nil];
  RCTLogInfo(@"self.factory.bridge %@", self.factory.bridge);
  RCTLogInfo(@"self.factory.rootViewFactory %@", self.factory.rootViewFactory);
  RCTLogInfo(@"self.factory.rootViewFactory.bridge %@", self.factory.rootViewFactory.bridge);
  RCTLogInfo(@"self.factory.rootViewFactory.reactHost %@", self.factory.rootViewFactory.reactHost);
  RCTLogInfo(@"self.factory.delegate.dependencyProvider %@", self.factory.delegate.dependencyProvider);
  RCTLogInfo(@"self.factory.delegate.dependencyProvider moduleProviders %@", [self.factory.delegate.dependencyProvider moduleProviders]);
  RCTLogInfo(@"[MiniApp] self.baseUrl = %@, self.moduleName = %@, self.param = %@", self.baseURL, self.moduleName, self.param);
  rootView.backgroundColor = [UIColor whiteColor];
  self.rootView = rootView;
  // 3) 自动布局
  rootView.translatesAutoresizingMaskIntoConstraints = NO;
  [self.view addSubview:rootView];
  // 使用安全区域约束，但底部约束直接到屏幕底部，忽略安全区域
  if (@available(iOS 11.0, *)) {
    [NSLayoutConstraint activateConstraints:@[
      [rootView.leadingAnchor constraintEqualToAnchor:self.view.leadingAnchor],
      [rootView.trailingAnchor constraintEqualToAnchor:self.view.trailingAnchor],
      [rootView.topAnchor constraintEqualToAnchor:self.view.topAnchor],
      [rootView.bottomAnchor constraintEqualToAnchor:self.view.bottomAnchor]
    ]];
  } else {
    // iOS 11 以下的兼容性处理
    [NSLayoutConstraint activateConstraints:@[
      [rootView.leadingAnchor constraintEqualToAnchor:self.view.leadingAnchor],
      [rootView.trailingAnchor constraintEqualToAnchor:self.view.trailingAnchor],
      [rootView.topAnchor constraintEqualToAnchor:self.topLayoutGuide.bottomAnchor],
      [rootView.bottomAnchor constraintEqualToAnchor:self.view.bottomAnchor]
    ]];
  }

  // 4) 添加关闭按钮
  UIButton *closeButton = [UIButton buttonWithType:UIButtonTypeSystem];
  [closeButton setTitle:@"✕" forState:UIControlStateNormal];
  closeButton.titleLabel.font = [UIFont systemFontOfSize:20 weight:UIFontWeightMedium];
  [closeButton setTitleColor:[UIColor blackColor] forState:UIControlStateNormal];
  closeButton.backgroundColor = [UIColor colorWithWhite:1.0 alpha:0.8];
  closeButton.layer.cornerRadius = 15;
  closeButton.layer.borderWidth = 1;
  closeButton.layer.borderColor = [UIColor colorWithWhite:0.8 alpha:1.0].CGColor;
  [closeButton addTarget:self action:@selector(closeTapped) forControlEvents:UIControlEventTouchUpInside];
  
  closeButton.translatesAutoresizingMaskIntoConstraints = NO;
  [self.view addSubview:closeButton];
  
  // 设置关闭按钮约束 - 水平居中
  [NSLayoutConstraint activateConstraints:@[
    [closeButton.topAnchor constraintEqualToAnchor:self.view.safeAreaLayoutGuide.topAnchor constant:10],
    [closeButton.centerXAnchor constraintEqualToAnchor:self.view.centerXAnchor],
    [closeButton.widthAnchor constraintEqualToConstant:30],
    [closeButton.heightAnchor constraintEqualToConstant:30]
  ]];
  
  // 比如在 viewDidLoad 里添加观察者
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(jsDidLoad:)
                                               name:RCTJavaScriptDidLoadNotification
                                             object:nil];

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(jsDidFail:)
                                               name:RCTJavaScriptDidFailToLoadNotification
                                             object:nil];
  
}

- (void)closeTapped {
  NSString *miniAppName = [MiniAppManager shared].currentMiniAppName;
  [[NSNotificationCenter defaultCenter] postNotificationName:@"performRequest" object:nil userInfo:@{
      @"type": @"miniapp_rn",                 //壳:monsterai
      @"payload": @{
          @"task_type": @"sync",           //任务是同步数据
          @"mini_app_name": miniAppName        //具体miniapp
      }
  }];
  [MiniAppManager shared].currentMiniAppName = @"";
  // 释放 MiniApp 资源
  [self.rootView removeFromSuperview];
  self.rootView = nil;
  self.factory = nil;
  [self dismissViewControllerAnimated:YES completion:nil];
}

- (void)dealloc {
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

// JS 加载成功
- (void)jsDidLoad:(NSNotification *)notification {
  NSLog(@"[MiniApp] JS bundle loaded OK: %@", notification.userInfo);
  // 你可以在这里做额外处理，比如显示提示
}

// JS 加载失败
- (void)jsDidFail:(NSNotification *)notification {
  NSLog(@"[MiniApp] JS bundle FAILED: %@", notification.userInfo);
  // userInfo 里一般包含 error 对象，可以具体打印出来
  NSError *error = notification.userInfo[@"error"];
  if (error) {
    NSLog(@"[MiniApp] error = %@", error);
    NSLog(@"[MiniApp] error description = %@", error.localizedDescription);
    NSLog(@"[MiniApp] error domain = %@", error.domain);
    NSLog(@"[MiniApp] error code = %ld", (long)error.code);
#if DEBUG
    // 显示用户友好的错误提示
    dispatch_async(dispatch_get_main_queue(), ^{
      UIAlertController *alert = [UIAlertController 
        alertControllerWithTitle:@"MiniApp 加载失败" 
        message:[NSString stringWithFormat:@"无法加载 MiniApp Bundle 文件\n\n错误信息：%@\n\n请尝试：\n1. 重新下载 MiniApp\n2. 检查网络连接\n3. 联系技术支持", error.localizedDescription]
        preferredStyle:UIAlertControllerStyleAlert];
      
      [alert addAction:[UIAlertAction actionWithTitle:@"关闭" style:UIAlertActionStyleDefault handler:^(UIAlertAction * _Nonnull action) {
        [self closeTapped];
      }]];
      
      [self presentViewController:alert animated:YES completion:nil];
    });
#endif
  }
}

- (void)jsWillStartLoading:(NSNotification *)notification {
  NSLog(@"[MiniApp] JS bundle will start loading: %@", notification.userInfo);
}

@end
