#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface RNLoggerHelper : NSObject

+ (void)logVerbose:(NSString *)message;
+ (void)logDebug:(NSString *)message;
+ (void)logInfo:(NSString *)message;
+ (void)logWarn:(NSString *)message;
+ (void)logError:(NSString *)message;

@end

NS_ASSUME_NONNULL_END
