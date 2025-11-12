//
//  RNLocationService.m
//  boltexponativewind
//
//  Created by fanthus on 9/30/25.
//

#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(RNLocationService, NSObject)
RCT_EXTERN_METHOD(location:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject);
@end
