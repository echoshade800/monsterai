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
        RNLoggerHelper.logVerbose(message)
    }
    
    @objc(debug:)
    func debug(_ message: String) {
        RNLoggerHelper.logDebug(message)
    }
    
    @objc(info:)
    func info(_ message: String) {
        RNLoggerHelper.logInfo(message)
    }
    
    @objc(warn:)
    func warn(_ message: String) {
        RNLoggerHelper.logWarn(message)
    }
    
    @objc(error:)
    func error(_ message: String) {
        RNLoggerHelper.logError(message)
    }
}
