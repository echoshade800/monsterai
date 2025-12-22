#import "RNLoggerHelper.h"
#import <CocoaLumberjack/CocoaLumberjack.h>

// Define log level for this file
static const DDLogLevel ddLogLevel = DDLogLevelAll;

@implementation RNLoggerHelper

+ (void)logVerbose:(NSString *)message {
    DDLogVerbose(@"%@", message);
}

+ (void)logDebug:(NSString *)message {
    DDLogDebug(@"%@", message);
}

+ (void)logInfo:(NSString *)message {
    DDLogInfo(@"%@", message);
}

+ (void)logWarn:(NSString *)message {
    DDLogWarn(@"%@", message);
}

+ (void)logError:(NSString *)message {
    DDLogError(@"%@", message);
}

@end
