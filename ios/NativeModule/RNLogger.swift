import Foundation
import React

@objc(RNLogger)
class RNLogger: NSObject, RCTBridgeModule {
    
    static func moduleName() -> String! {
        return "RNLogger"
    }
    
    static func requiresMainQueueSetup() -> Bool {
        return false
    }
    
    @objc(verbose:)
    func verbose(_ message: String) {
        let logMessage = "[JS] \(message)"
        RNLoggerHelper.logVerbose(logMessage)
    }
    
    @objc(debug:)
    func debug(_ message: String) {
        let logMessage = "[JS] \(message)"
        RNLoggerHelper.logDebug(logMessage)
    }
    
    @objc(info:)
    func info(_ message: String) {
        let logMessage = "[JS] \(message)"
        RNLoggerHelper.logInfo(logMessage)
    }
    
    @objc(warn:)
    func warn(_ message: String) {
        let logMessage = "[JS] \(message)"
        RNLoggerHelper.logWarn(logMessage)
    }
    
    @objc(error:)
    func error(_ message: String) {
        let logMessage = "[JS] \(message)"
        RNLoggerHelper.logError(logMessage)
    }
}
