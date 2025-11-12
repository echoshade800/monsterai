//
//  MiniAppH5ViewController.h
//  boltexponativewind
//
//  Created by fanthus on 8/21/25.
//

#import <UIKit/UIKit.h>
#import <WebKit/WebKit.h>
#import "React/React-Core-umbrella.h"

NS_ASSUME_NONNULL_BEGIN

@interface MiniAppH5ViewController : UIViewController <WKNavigationDelegate, WKUIDelegate, WKScriptMessageHandler>

- (instancetype)initWithBaseURL:(NSString *)baseURL
                     moduleName:(NSString *)moduleName
                          param:(NSDictionary *)param;

- (instancetype)initWithNibName:(nullable NSString *)nibNameOrNil
                         bundle:(nullable NSBundle *)nibBundleOrNil NS_UNAVAILABLE;
- (instancetype)initWithCoder:(NSCoder *)coder NS_UNAVAILABLE;

@property(nonatomic, strong, nullable) RCTBridge *rnbridge;

@end

NS_ASSUME_NONNULL_END

