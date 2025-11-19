//
//  MiniAppManager.swift
//  boltexponativewind
//
//  Created by fanthus on 9/17/25.
//

//@objc(MiniAppManager)
//class MiniAppManager: NSObject {
//  @objc class func sharedInstance() -> MiniAppManager {
//    return MiniAppManager()
//  }
//
//  @objc var currentMiniAppName: String?
//}

@objc(MiniAppManager)
@objcMembers
class MiniAppManager: NSObject {
  static let shared = MiniAppManager()
  var currentMiniAppName: String?
}
