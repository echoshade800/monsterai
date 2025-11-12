//
//  MiniAppFactoryDelegate.h
//  boltexponativewind
//
//  Created by fanthus on 8/20/25.
//

#import <Foundation/Foundation.h>
#import <React-RCTAppDelegate/RCTReactNativeFactory.h>   // RN 0.78+ 提供
#import <React-RCTAppDelegate/RCTDefaultReactNativeFactoryDelegate.h>

NS_ASSUME_NONNULL_BEGIN

@interface MiniAppFactoryDelegate : RCTDefaultReactNativeFactoryDelegate

@property(nonatomic, copy) NSString *miniBundleURL;

@end

NS_ASSUME_NONNULL_END

