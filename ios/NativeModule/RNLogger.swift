import Foundation
import React
import UIKit
import CocoaLumberjack

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
    
    // 获取当前日志文件路径
    @objc(getLogFilePath:rejecter:)
    func getLogFilePath(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        // 获取所有文件日志器
        let loggers = DDLog.allLoggers
        var fileLogger: DDFileLogger?
        
        for logger in loggers {
            if let logger = logger as? DDFileLogger {
                fileLogger = logger
                break
            }
        }
        
        guard let fileLogger = fileLogger else {
            reject("NO_FILE_LOGGER", "No file logger found", nil)
            return
        }
        
        let logFilePaths = fileLogger.logFileManager.sortedLogFilePaths
        if let firstLogFile = logFilePaths.first {
            resolve(firstLogFile)
        } else {
            reject("NO_LOG_FILE", "No log file found", nil)
        }
    }
    
    // 分享日志文件
    @objc(shareLogFile:rejecter:)
    func shareLogFile(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.main.async {
            // 获取所有文件日志器
            let loggers = DDLog.allLoggers
            var fileLogger: DDFileLogger?
            
            for logger in loggers {
                if let logger = logger as? DDFileLogger {
                    fileLogger = logger
                    break
                }
            }
            
            guard let fileLogger = fileLogger else {
                reject("NO_FILE_LOGGER", "No file logger found", nil)
                return
            }
            
            let logFilePaths = fileLogger.logFileManager.sortedLogFilePaths
            guard let firstLogFile = logFilePaths.first else {
                reject("NO_LOG_FILE", "No log file found", nil)
                return
            }
            
            let fileURL = URL(fileURLWithPath: firstLogFile)
            
            // 获取当前视图控制器
            guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
                  let window = windowScene.windows.first,
                  let rootViewController = window.rootViewController else {
                reject("NO_ROOT_VC", "Cannot find root view controller", nil)
                return
            }
            
            // 找到最顶层的视图控制器
            var topViewController = rootViewController
            while let presentedViewController = topViewController.presentedViewController {
                topViewController = presentedViewController
            }
            
            // 创建分享控制器
            let activityViewController = UIActivityViewController(
                activityItems: [fileURL],
                applicationActivities: nil
            )
            
            // 为 iPad 设置 popover
            if let popover = activityViewController.popoverPresentationController {
                popover.sourceView = topViewController.view
                popover.sourceRect = CGRect(x: topViewController.view.bounds.midX, y: topViewController.view.bounds.midY, width: 0, height: 0)
                popover.permittedArrowDirections = []
            }
            
            // 显示分享控制器
            topViewController.present(activityViewController, animated: true)
            resolve(true)
        }
    }
}
