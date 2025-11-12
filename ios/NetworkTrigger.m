//
//  NetworkTrigger.m
//  boltexponativewind
//
//  Created by fanthus on 9/17/25.
//

// NetworkTrigger.m
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(NetworkTrigger, RCTEventEmitter)
RCT_EXTERN_METHOD(emit:(NSString *)type payload:(NSDictionary *)payload)
@end

