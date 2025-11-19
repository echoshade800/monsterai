//
//  MiniAppViewController.h
//  boltexponativewind
//
//  Created by fanthus on 8/19/25.
//

#import <UIKit/UIKit.h>
#import <React/RCTBridge.h>

NS_ASSUME_NONNULL_BEGIN

@interface MiniAppViewController : UIViewController

- (instancetype)initWithBaseURL:(NSString *)baseURL
                     moduleName:(NSString *)moduleName
                          param:(NSDictionary *)param;

- (instancetype)initWithNibName:(nullable NSString *)nibNameOrNil
                         bundle:(nullable NSBundle *)nibBundleOrNil NS_UNAVAILABLE;
- (instancetype)initWithCoder:(NSCoder *)coder NS_UNAVAILABLE;

@end

NS_ASSUME_NONNULL_END
