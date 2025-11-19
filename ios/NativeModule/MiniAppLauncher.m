//
//  MiniAppLauncher.m
//  boltexponativewind
//
//  Created by fanthus on 8/19/25.
//

#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(MiniAppLauncher, NSObject)
RCT_EXTERN_METHOD(open:(NSString *)baseURL moduleName:(NSString *)moduleName versionForFileName:(NSString *)versionForFileName params:(NSDictionary *)params);
RCT_EXTERN_METHOD(clearH5LocalStorage);
@end
