//
//  MiniAppLauncher.swift
//  boltexponativewind
//
//  Created by fanthus on 8/19/25.
//

import Foundation
import Foundation
import React
import ExpoModulesCore

@objc(MiniAppLauncher)
final class MiniAppLauncher: NSObject,RCTBridgeModule {
  static func moduleName() -> String! { "MiniAppLauncher" }
  static func requiresMainQueueSetup() -> Bool { true }
  @objc var bridge:RCTBridge?

  var rnvc:MiniAppViewController?
    
  // 打开 MiniApp：在一个原生导航控制器里 present
  @objc(open:moduleName:params:)
  func open(baseURL: NSString, moduleName: NSString, params:[String:Any]) {
    DispatchQueue.main.async {
      guard let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
            let window = scene.windows.first,
            let rootVC = window.rootViewController else { return }
      let moduleName:String = moduleName as String
      NSLog("MiniAppLauncher baseURL: \(baseURL) moduleName: \(moduleName) params: \(params), bridge \(String(describing: self.bridge))")
      let miniAppType = params["miniAppType"] as? String ?? "RN"
      // 如果 localBundle 为 true，则拼接 baseURL 和 moduleName 作为新的 url
      var finalBaseURL = baseURL as String
      if let localBundle = params["localBundle"] as? Bool, localBundle == true {
        // 确保 baseURL 以 / 结尾
        if !finalBaseURL.hasSuffix("/") {
          finalBaseURL += "/"
        }
        finalBaseURL += "ios/rnbundle/main.jsbundle"
      }
      NSLog("MiniAppLauncher finalBaseURL : \(finalBaseURL)")
      if miniAppType == "RN" {
        self.rnvc = MiniAppViewController(
                baseURL: finalBaseURL,
                moduleName: moduleName as String,
                param:params as Dictionary)
        self.rnvc?.modalPresentationStyle = .fullScreen
        rootVC.present(self.rnvc!, animated: true)
      } else {
        NSLog("open params \(params)") 
        let vc = MiniAppH5ViewController(
                baseURL: baseURL as String,
                moduleName: moduleName as String,
                param:params as Dictionary)
        let nav = UINavigationController(rootViewController: vc)
        nav.modalPresentationStyle = .fullScreen
        vc.rnbridge = self.bridge
        rootVC.present(nav, animated: true)
      }
      MiniAppManager.shared.currentMiniAppName = moduleName
    }
  }
  
  @objc(clearH5LocalStorage)
  func clearH5LocalStorage() {
    DispatchQueue.main.async {
      let dataTypes = WKWebsiteDataStore.allWebsiteDataTypes()
      let since = Date(timeIntervalSince1970: 0)
      WKWebsiteDataStore.default().removeData(ofTypes: dataTypes, modifiedSince: since) {
        NSLog("clear all h5 local storage")
      }
    }
  }
}
