import Foundation
import CocoaLumberjack

@objc public class LoggerConfig: NSObject {
    @objc public static func setup() {
        // 1. Add OSLog (standard console output)
        // 为每个 logger 设置日志级别为 Verbose，确保所有级别的日志都能输出
        let osLogger = DDOSLogger.sharedInstance
        DDLog.add(osLogger, with: DDLogLevel.verbose)
        
        // 2. Add File Logger
        let fileLogger: DDFileLogger = DDFileLogger()
        fileLogger.rollingFrequency = 60 * 60 * 24 // 24 hours
        fileLogger.logFileManager.maximumNumberOfLogFiles = 7
        // 设置自动刷新，确保日志及时写入文件
        fileLogger.doNotReuseLogFiles = false
        // 设置文件日志器的日志级别为Verbose，确保所有级别的日志都写入文件
        DDLog.add(fileLogger, with: DDLogLevel.verbose)
        
        // 输出日志文件路径用于调试
        let logFilePaths = fileLogger.logFileManager.sortedLogFilePaths
        if let firstLogFile = logFilePaths.first {
            print("DDLog file path: \(firstLogFile)")
            // 也通过 DDLog 输出，确保能看到
            RNLoggerHelper.logInfo("DDLog file path: \(firstLogFile)")
        } else {
            // 如果没有日志文件，创建一个测试日志
            RNLoggerHelper.logInfo("DDLog initialized, waiting for log file creation")
        }
        
        RNLoggerHelper.logInfo("DDLog initialized with verbose level")
    }
}
