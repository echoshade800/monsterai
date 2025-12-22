import Foundation
import CocoaLumberjack

@objc public class LoggerConfig: NSObject {
    @objc public static func setup() {
        // 1. Add OSLog (standard console output)
        DDLog.add(DDOSLogger.sharedInstance)
        
        // 2. Add File Logger
        let fileLogger: DDFileLogger = DDFileLogger()
        fileLogger.rollingFrequency = 60 * 60 * 24 // 24 hours
        fileLogger.logFileManager.maximumNumberOfLogFiles = 7
        DDLog.add(fileLogger)
        
        RNLoggerHelper.logInfo("DDLog initialized")
    }
}
