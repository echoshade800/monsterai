//
//  MiniAppH5ViewController.m
//  boltexponativewind
//
//  Created by fanthus on 8/21/25.
//

//#import <React/RCTCxxBridgeDelegate.h>
//#import <React/RCTJSIExecutorRuntimeInstaller.h>
//#import <React/RCTLog.h>
//#import <jsi/jsi.h>  


#import "MiniAppH5ViewController.h"
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


@interface MiniAppH5ViewController ()
@property (nonatomic, copy, nullable) NSString *baseURL;
@property (nonatomic, copy) NSString *moduleName;
@property (nonatomic, copy) NSDictionary *param;
@property (nonatomic, strong) WKWebView *webView;
@property (nonatomic, copy) NSString *storageParams;
@end

@implementation MiniAppH5ViewController

- (instancetype)initWithBaseURL:(NSString *)baseURL
                     moduleName:(NSString *)moduleName
                          param:(nonnull NSDictionary *)param {
  if (self = [super initWithNibName:nil bundle:nil]) {
    _baseURL = [baseURL copy];
    _moduleName = [moduleName copy];
    _param = param;
    _storageParams = [param objectForKey:@"storage_data"];
  }
  return self;
}

- (void)viewDidLoad {
  [super viewDidLoad];
  RCTLogInfo(@"[MiniApp] H5 self.baseUrl = %@, self.moduleName = %@, self.param = %@", self.baseURL, self.moduleName, self.param);
  self.view.backgroundColor = [UIColor systemBackgroundColor];
  
  WKUserContentController *uc = [WKUserContentController new];
  [uc addScriptMessageHandler:self name:@"native"];
  [uc addScriptMessageHandler:self name:@"bridge"];
  //
  if (self.storageParams != nil) {
    NSString *js = [H5JSExecUtil generateLocalStorageWriteJSWithJsonString:self.storageParams];
    NSLog(@"待注入的JSON内容 %@", js);
    WKUserScript *us = [[WKUserScript alloc] initWithSource:js
                                                injectionTime:WKUserScriptInjectionTimeAtDocumentStart
                                             forMainFrameOnly:YES];
    [uc addUserScript:us];
  }
  //
  WKWebViewConfiguration *cfg = [WKWebViewConfiguration new];
  cfg.userContentController = uc;
  cfg.allowsInlineMediaPlayback = YES;
  if (@available(iOS 10.0, *)) {
    cfg.mediaTypesRequiringUserActionForPlayback = WKAudiovisualMediaTypeNone;
  }
  //
  _webView = [[WKWebView alloc] initWithFrame:self.view.bounds configuration:cfg];
  _webView.navigationDelegate = self;
  _webView.UIDelegate = self;
  _webView.translatesAutoresizingMaskIntoConstraints = NO;
  [self.webView loadRequest:[NSURLRequest requestWithURL:[NSURL URLWithString:self.baseURL]]];
  [self.view addSubview:self.webView];
  // 4) 导航返回
  self.navigationItem.title = self.moduleName;
  self.navigationItem.leftBarButtonItem =
  [[UIBarButtonItem alloc] initWithBarButtonSystemItem:UIBarButtonSystemItemClose target:self action:@selector(closeTapped)];
  
  // 添加右侧按钮用于写入localStorage数据
  self.navigationItem.rightBarButtonItem =
  [[UIBarButtonItem alloc] initWithTitle:@"写入数据" style:UIBarButtonItemStylePlain target:self action:@selector(writeDataTapped)];
  // 1) 关闭自动调整
  if (@available(iOS 11.0, *)) {
      self.webView.scrollView.contentInsetAdjustmentBehavior = UIScrollViewContentInsetAdjustmentNever;
  }
  // 2) 清零 inset
  self.webView.scrollView.contentInset = UIEdgeInsetsZero;
  self.webView.scrollView.scrollIndicatorInsets = UIEdgeInsetsZero;
  // 3) 约束布局 - 可选择是否使用安全区域
  self.webView.translatesAutoresizingMaskIntoConstraints = NO;
  
  // 检查参数中是否要求使用安全区域
  BOOL useSafeArea = [self.param[@"useSafeArea"] boolValue];
  
  if (useSafeArea && @available(iOS 11.0, *)) {
    // 使用安全区域约束，避免被状态栏、导航栏、刘海和底部指示器遮挡
    [NSLayoutConstraint activateConstraints:@[
        [self.webView.leadingAnchor constraintEqualToAnchor:self.view.safeAreaLayoutGuide.leadingAnchor],
        [self.webView.trailingAnchor constraintEqualToAnchor:self.view.safeAreaLayoutGuide.trailingAnchor],
        [self.webView.topAnchor constraintEqualToAnchor:self.view.safeAreaLayoutGuide.topAnchor],
        [self.webView.bottomAnchor constraintEqualToAnchor:self.view.safeAreaLayoutGuide.bottomAnchor]
    ]];
  } else {
    // 默认行为：约束到父视图边缘（全屏显示）
    [NSLayoutConstraint activateConstraints:@[
        [self.webView.leadingAnchor constraintEqualToAnchor:self.view.leadingAnchor],
        [self.webView.trailingAnchor constraintEqualToAnchor:self.view.trailingAnchor],
        [self.webView.topAnchor constraintEqualToAnchor:self.view.topAnchor],
        [self.webView.bottomAnchor constraintEqualToAnchor:self.view.bottomAnchor]
    ]];
  }
}

- (void)viewDidLayoutSubviews {
  [super viewDidLayoutSubviews];
  self.webView.frame = self.view.bounds;
  NSLog(@"safeAreaInsets: %@", NSStringFromUIEdgeInsets(self.view.safeAreaInsets));
  NSLog(@"contentInset: %@", NSStringFromUIEdgeInsets(self.webView.scrollView.contentInset));
  NSLog(@"adjustedContentInset: %@", NSStringFromUIEdgeInsets(self.webView.scrollView.adjustedContentInset));
  NSLog(@"self.webView: %@", NSStringFromCGRect(self.webView.frame));
  NSLog(@"scrollView.bounds.height: %f", self.webView.scrollView.bounds.size.height);
}

- (void)closeTapped {
  // 在关闭前获取H5页面的localStorage数据
  [self getLocalStorageDataBeforeClose];
}

- (void)writeDataTapped {
  // 向H5的localStorage写入数据
  [self writeDataToLocalStorage];
}

- (void)getLocalStorageDataBeforeClose {
  // 使用Swift工具类生成JavaScript代码
  NSString *jsCode = [H5JSExecUtil generateLocalStorageReadJS];
  __weak __typeof(self) weakSelf = self;
  [self.webView evaluateJavaScript:jsCode completionHandler:^(id result, NSError *error) {
    __strong __typeof(self) strongSelf = weakSelf;
    if (strongSelf) {
      if (error) {
        NSLog(@"[MiniApp] 获取localStorage数据失败: %@", error.localizedDescription);
      } else {
        NSLog(@"[MiniApp] 获取到localStorage数据: %@", result);
        // 这里可以处理获取到的localStorage数据
        [strongSelf handleLocalStorageData:result];
      }
      // 无论是否成功获取数据，都关闭视图控制器
      dispatch_async(dispatch_get_main_queue(), ^{
        [strongSelf dismissViewControllerAnimated:YES completion:nil];
      });
    }
  }];
}

- (void)handleLocalStorageData:(id)data {
  // 处理获取到的localStorage数据
  if ([data isKindOfClass:[NSString class]]) {
    NSString *jsonString = (NSString *)data;
    NSData *jsonData = [jsonString dataUsingEncoding:NSUTF8StringEncoding];
    NSError *error;
    NSDictionary *localStorageDict = [NSJSONSerialization JSONObjectWithData:jsonData options:0 error:&error];
    NSString *miniAppName = [MiniAppManager shared].currentMiniAppName;
    NSString *miniAppDataJSONStr = [localStorageDict objectForKey:miniAppName];
    if (miniAppDataJSONStr != nil && miniAppDataJSONStr.length != 0) {
      [[NSNotificationCenter defaultCenter] postNotificationName:@"performRequest" object:nil userInfo:@{
          @"type": @"miniapp_h5",
          @"payload": @{
              @"task_type": @"sync",
              @"mini_app_name": miniAppName,
              @"data":miniAppDataJSONStr
          }
      }];
    }
    if (error) {
      NSLog(@"[MiniApp] 解析localStorage JSON失败: %@", error.localizedDescription);
    } else {
      NSLog(@"[MiniApp] 解析后的localStorage数据: %@", localStorageDict);
      // 这里可以根据需要进一步处理数据，比如保存到本地、发送到服务器等
    }
  }
}

- (void)writeDataToLocalStorage {
  // 示例数据：要写入localStorage的数据
  NSDictionary *dataToWrite = @{
    @"timestamp": [NSString stringWithFormat:@"%.0f", [[NSDate date] timeIntervalSince1970] * 1000],
    @"source": @"iOS Native",
    @"userAction": @"writeDataButtonTapped",
    @"version": @"1.0.0"
  };
  
  // 将数据转换为JSON字符串
  NSError *error;
  NSData *jsonData = [NSJSONSerialization dataWithJSONObject:dataToWrite options:0 error:&error];
  if (error) {
    NSLog(@"[MiniApp] 数据序列化失败: %@", error.localizedDescription);
    return;
  }
  
  NSString *jsonString = [[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding];
  if (!jsonString) {
    NSLog(@"[MiniApp] JSON字符串创建失败");
    return;
  }
  
  NSLog(@"[MiniApp] 准备写入的数据: %@", jsonString);
  
  // 使用Swift工具类生成JavaScript代码
  NSString *jsCode = [H5JSExecUtil generateLocalStorageWriteJSWithJsonString:jsonString];
  
  NSLog(@"[MiniApp] 执行的JavaScript代码: %@", jsCode);
  
  __weak __typeof(self) weakSelf = self;
  [self.webView evaluateJavaScript:jsCode completionHandler:^(id result, NSError *error) {
    __strong __typeof(self) strongSelf = weakSelf;
    if (strongSelf) {
      if (error) {
        NSLog(@"[MiniApp] 写入localStorage数据失败: %@", error.localizedDescription);
        NSLog(@"[MiniApp] 错误详情: %@", error.userInfo);
      } else {
        NSLog(@"[MiniApp] 成功写入localStorage数据，更新后的数据: %@", result);
        // 可以在这里添加成功提示或其他处理逻辑
        [strongSelf showWriteSuccessAlert];
      }
    }
  }];
}

- (void)showWriteSuccessAlert {
  dispatch_async(dispatch_get_main_queue(), ^{
    UIAlertController *alert = [UIAlertController alertControllerWithTitle:@"成功" 
                                                                   message:@"数据已成功写入localStorage" 
                                                            preferredStyle:UIAlertControllerStyleAlert];
    [alert addAction:[UIAlertAction actionWithTitle:@"确定" style:UIAlertActionStyleDefault handler:nil]];
    [self presentViewController:alert animated:YES completion:nil];
  });
}

- (void)dealloc {
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

#pragma mark - WKNavigationDelegate

- (void)webView:(WKWebView *)webView didStartProvisionalNavigation:(WKNavigation *)nav {
  NSLog(@"webview didStartProvisionalNavigation");
}

- (void)webView:(WKWebView *)webView didCommitNavigation:(WKNavigation *)nav {
  NSLog(@"webview didCommitNavigation");
}

- (void)webView:(WKWebView *)webView didFinishNavigation:(WKNavigation *)nav {
  NSLog(@"webview didFinishNavigation");
}

- (void)webView:(WKWebView *)webView didFailProvisionalNavigation:(WKNavigation *)nav withError:(NSError *)error {
  NSLog(@"webview didFailProvisionalNavigation %@", error);
}

- (void)webView:(WKWebView *)webView didFailNavigation:(WKNavigation *)nav withError:(NSError *)error {
  NSLog(@"webview didFailNavigation %@", error);
}

- (void)webView:(WKWebView *)webView didReceiveServerRedirectForProvisionalNavigation:(WKNavigation *)nav {
  NSLog(@"webview didReceiveServerRedirectForProvisionalNavigation");
}

- (void)webView:(WKWebView *)webView decidePolicyForNavigationAction:(WKNavigationAction *)action decisionHandler:(void (^)(WKNavigationActionPolicy))decisionHandler {
  NSLog(@"webview decidePolicyForNavigationAction decisionHandler");
  if (!action.targetFrame.isMainFrame) { // 处理 target=_blank
    [webView loadRequest:action.request];
    decisionHandler(WKNavigationActionPolicyCancel);
    return;
  }
  decisionHandler(WKNavigationActionPolicyAllow);
}

- (void)webView:(WKWebView *)webView decidePolicyForNavigationResponse:(WKNavigationResponse *)response
 decisionHandler:(void (^)(WKNavigationResponsePolicy))decisionHandler {
  decisionHandler(WKNavigationResponsePolicyAllow);
}

- (void)webView:(WKWebView *)webView didReceiveAuthenticationChallenge:(NSURLAuthenticationChallenge *)challenge
 completionHandler:(void (^)(NSURLSessionAuthChallengeDisposition, NSURLCredential * _Nullable))completionHandler {
  completionHandler(NSURLSessionAuthChallengePerformDefaultHandling, nil);
}

- (void)webViewWebContentProcessDidTerminate:(WKWebView *)webView {
  [webView reload];
}

#pragma mark - WKUIDelegate

- (WKWebView *)webView:(WKWebView *)webView
 createWebViewWithConfiguration:(WKWebViewConfiguration *)configuration
 forNavigationAction:(WKNavigationAction *)action
 windowFeatures:(WKWindowFeatures *)windowFeatures {
  if (!action.targetFrame) { [webView loadRequest:action.request]; }
  return nil;
}

- (void)webView:(WKWebView *)webView runJavaScriptAlertPanelWithMessage:(NSString *)message
 initiatedByFrame:(WKFrameInfo *)frame completionHandler:(void (^)(void))completionHandler {
  UIAlertController *ac = [UIAlertController alertControllerWithTitle:nil message:message preferredStyle:UIAlertControllerStyleAlert];
  [ac addAction:[UIAlertAction actionWithTitle:@"OK" style:UIAlertActionStyleDefault handler:^(__unused UIAlertAction *a){ completionHandler(); }]];
  [self presentViewController:ac animated:YES completion:nil];
}

- (void)webView:(WKWebView *)webView runJavaScriptConfirmPanelWithMessage:(NSString *)message
 initiatedByFrame:(WKFrameInfo *)frame completionHandler:(void (^)(BOOL))completionHandler {
  UIAlertController *ac = [UIAlertController alertControllerWithTitle:nil message:message preferredStyle:UIAlertControllerStyleAlert];
  [ac addAction:[UIAlertAction actionWithTitle:@"取消" style:UIAlertActionStyleCancel handler:^(__unused UIAlertAction *a){ completionHandler(NO); }]];
  [ac addAction:[UIAlertAction actionWithTitle:@"确定" style:UIAlertActionStyleDefault handler:^(__unused UIAlertAction *a){ completionHandler(YES); }]];
  [self presentViewController:ac animated:YES completion:nil];
}

- (void)webView:(WKWebView *)webView runJavaScriptTextInputPanelWithPrompt:(NSString *)prompt
 defaultText:(NSString *)defaultText initiatedByFrame:(WKFrameInfo *)frame
 completionHandler:(void (^)(NSString * _Nullable))completionHandler {
  UIAlertController *ac = [UIAlertController alertControllerWithTitle:nil message:prompt preferredStyle:UIAlertControllerStyleAlert];
  [ac addTextFieldWithConfigurationHandler:^(UITextField *tf){ tf.text = defaultText; }];
  [ac addAction:[UIAlertAction actionWithTitle:@"取消" style:UIAlertActionStyleCancel handler:^(__unused UIAlertAction *a){ completionHandler(nil); }]];
  [ac addAction:[UIAlertAction actionWithTitle:@"确定" style:UIAlertActionStyleDefault handler:^(__unused UIAlertAction *a){
    completionHandler(ac.textFields.firstObject.text);
  }]];
  [self presentViewController:ac animated:YES completion:nil];
}

#pragma mark - WKScriptMessageHandler
- (void)userContentController:(WKUserContentController *)userContentController didReceiveScriptMessage:(WKScriptMessage *)message {
  NSLog(@"JS -> Native: %@, %@", message.name, message.body);
  NSLog(@"bridge %@",self.rnbridge);
  //前置检查
//  if (![message.name isEqualToString:@"bridge"]) return;
//  if (![message.body isKindOfClass:[NSDictionary class]]) return;
//  //提取参数
//  NSDictionary *body = (NSDictionary *)message.body;
//  NSString *reqId   = [body objectForKey:@"id"];
//  NSString *method  = [body objectForKey:@"method"];
//  NSDictionary *bodyParams         = [body objectForKey:@"params"];
//  NSLog(@"bodyParams: %@", bodyParams);
//  NSLog(@"accessKey: %@", bodyParams[@"key"]);
//  //
//  if (reqId.length == 0 || method.length == 0) return;
//  RCTCxxBridge *cxxBridge = (RCTCxxBridge *)self.rnbridge;
//  auto *runtime = (facebook::jsi::Runtime *)cxxBridge.runtime;
//  if (!runtime) { NSLog(@"[JSI] runtime is null"); return; }
//
//  auto &rt = *runtime;
//  auto global = rt.global();
//
//  // 1) 先拿对象 MiniAppStorage
//  auto miniVal = global.getProperty(rt, "MiniAppStorage");
//  if (!miniVal.isObject()) { NSLog(@"[JSI] MiniAppStorage is not object"); return; }
//  auto miniObj = miniVal.asObject(rt);
//
//  // 2) 再从对象上拿函数 invoke
//  auto invokeVal = miniObj.getProperty(rt, "invoke");
//  if (!invokeVal.isObject() || !invokeVal.asObject(rt).isFunction(rt)) {
//    NSLog(@"[JSI] MiniAppStorage.invoke is not function");
//    return;
//  }
//  auto invokeFn = invokeVal.asObject(rt).asFunction(rt);
//  __weak __typeof(self) weakSelf = self;
//
//  // 3) 组装参数
//  facebook::jsi::Object params(rt);
//  params.setProperty(rt, "key", facebook::jsi::String::createFromUtf8(rt, "accessToken"));
//
//  // 4) 调用（把 miniObj 作为 this 传入）
//  auto ret = invokeFn.callWithThis(
//    rt,
//    miniObj, // thisArg
//    {
//      facebook::jsi::String::createFromUtf8(rt, [method UTF8String]),
//      std::move(params),
//      facebook::jsi::String::createFromUtf8(rt, [reqId UTF8String])
//    }
//  );
//  
//  if (ret.isObject()) {
//    auto str = ret.toString(rt).utf8(rt);
//    NSLog(@"ret: %@", [NSString stringWithUTF8String:str.c_str()] );
//    //
//    auto promiseObj = ret.asObject(rt);
//    auto thenFn = promiseObj.getProperty(rt, "then").asObject(rt).asFunction(rt);
//
//    auto onFulfilled = facebook::jsi::Function::createFromHostFunction(
//      rt, facebook::jsi::PropNameID::forAscii(rt, "onFulfilled"), 1,
//                                                                       [weakSelf, str](facebook::jsi::Runtime& rt,
//         const facebook::jsi::Value& thisVal,
//         const facebook::jsi::Value* args,
//         size_t count) -> facebook::jsi::Value {
//           if (count > 0 && !args[0].isUndefined() && !args[0].isNull()) {
//             std::string resultUtf8 = args[0].toString(rt).utf8(rt);
//              NSString *nsResult = [NSString stringWithUTF8String:resultUtf8.c_str()];
//              NSLog(@"[JSI] Promise resolved: %s", resultUtf8.c_str());
//             __strong __typeof(self) strongSelf = weakSelf;
//             if (strongSelf) {
//               [strongSelf prepareToCallH5ReqId:[NSString stringWithUTF8String:str.c_str()] result:nsResult];
//             }
//           } else {
//             NSLog(@"[JSI] Promise resolved: <undefined>");
//           }
//           return facebook::jsi::Value::undefined();
//      }
//    );
//    
//    thenFn.callWithThis(rt, promiseObj, { std::move(onFulfilled) });
//  }

}


- (void)prepareToCallH5ReqId:(NSString *)reqId result:(NSString *)result {
  NSMutableDictionary *payload = [NSMutableDictionary dictionaryWithObject:reqId forKey:@"id"];
  if (result) {
    payload[@"result"] = result;
  } else {
    payload[@"result"] = [NSNull null];
  }
  [self replyToH5WithPayload:payload];
}

- (void)replyToH5WithPayload:(NSDictionary *)payload {
  NSError *jsonErr = nil;
  NSData *data = [NSJSONSerialization dataWithJSONObject:payload options:0 error:&jsonErr];
  if (jsonErr || !data) return;

  NSString *json = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
  if (!json) return;

  NSString *js = [NSString stringWithFormat:@"window.NativeBridge._dispatchResponse(%@);", json];

  dispatch_async(dispatch_get_main_queue(), ^{
    [self.webView evaluateJavaScript:js completionHandler:nil];
  });
}

#pragma mark - 处理 AsyncStorage 读写（对接 RN）

- (void)handleMethod:(NSString *)method
              params:(id _Nullable)params
          completion:(void (^)(id _Nullable result, NSError * _Nullable error))completion
{
  // 方案 1（推荐）：把请求转发到 RN JS，使用 AsyncStorage 完成读写
  [self callRNAsyncStorageWithMethod:method params:params completion:completion];

  // 方案 2（可选）：直接依赖 RNCAsyncStorage 的 iOS 原生实现（耦合较强，不示例）
}

- (void)callRNAsyncStorageWithMethod:(NSString *)method
                              params:(id _Nullable)params
                          completion:(void (^)(id _Nullable result, NSError * _Nullable error))completion
{
  RCTBridge *bridge = self.rnbridge;
  if (!bridge) {
    if (completion) {
      NSError *err = [NSError errorWithDomain:@"bridge" code:-1 userInfo:@{NSLocalizedDescriptionKey: @"RN bridge is nil"}];
      completion(nil, err);
    }
    return;
  }

  // === 对接点 ===
  // 你可以选择以下任一方式把调用交给 RN JS：
  // A) 自定义 NativeModule：例如 MiniAppStorage.invoke(method, params, requestId)；完成后再回调 resolve(requestId, payload)
  // B) 通过事件总线（RCTDeviceEventEmitter）发送事件，RN JS 收到后用 AsyncStorage 处理，再回原生
  //
  // 下面给出一个“占位实现”，请替换为你的实际桥接逻辑。
  // 示例里我们仅返回一个 “TODO” 错误，避免误用。
  if (completion) {
    NSError *todo = [NSError errorWithDomain:@"todo"
                                        code:-2
                                    userInfo:@{NSLocalizedDescriptionKey: @"Hook RN JS module here (AsyncStorage proxy)."}];
    completion(nil, todo);
  }

  
  
//  id<RCTCallableJSModules *> callable = [RCTAppSetupUtils callableJSModulesForBridge:bridge];
//  [callable invokeModule:@"MiniAppStorage" method:@"invoke" args:@[@"sayHello", @{@"msg": @"Hello"}]];
   //—— 参考：如果你已经有一个叫 "MiniAppStorage" 的 JS 模块 ——
 [bridge enqueueJSCall:@"MiniAppStorage"
                method:@"invoke"
                  args:@[method ?: @"", params ?: [NSNull null],@"helloworld"]
            completion:^{
   NSLog(@"call js function finished");
 }];
   //然后由 JS 侧处理完毕后，通过一个原生导出的方法把结果带着 requestId 回填到这里，再调用 completion(result, nil)。
}

@end


