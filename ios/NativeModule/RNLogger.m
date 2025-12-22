#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(RNLogger, NSObject)

RCT_EXTERN_METHOD(verbose:(NSString *)message)
RCT_EXTERN_METHOD(debug:(NSString *)message)
RCT_EXTERN_METHOD(info:(NSString *)message)
RCT_EXTERN_METHOD(warn:(NSString *)message)
RCT_EXTERN_METHOD(error:(NSString *)message)

@end


