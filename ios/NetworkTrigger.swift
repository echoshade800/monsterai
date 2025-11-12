//
//  NetworkTrigger.swift
//  boltexponativewind
//
//  Created by fanthus on 9/17/25.
//


// NetworkTrigger.swift
import Foundation

@objc(NetworkTrigger)
class NetworkTrigger: RCTEventEmitter {

  override static func requiresMainQueueSetup() -> Bool { true }

  // JS 可订阅的事件名列表
  override func supportedEvents() -> [String] { ["NativeAction"] }

  // （可选）统一从 NotificationCenter 收到消息后再分发到 JS
  override func startObserving() {
    NSLog("NetworkTrigger startObserving... ")
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(onTrigger(_:)),
      name: Notification.Name.init("performRequest"),
      object: nil
    )
  }

  override func stopObserving() {
    NotificationCenter.default.removeObserver(self)
  }

  @objc private func onTrigger(_ note: Notification) {
    // 统一转发给 JS
    let body = note.userInfo ?? [:]
    NSLog("on trigger %@", body)
    sendEvent(withName: "NativeAction", body: body)
  }

  // 如果你想从 VC 直接调用，也可暴露一个 @objc 方法
  @objc func emit(_ type: NSString, payload: NSDictionary) {
    NSLog("native direct emit type \(type)")
    sendEvent(withName: "NativeAction", body: ["type": type, "payload": payload])
  }
}

//extension Notification.Name {
//  static let performRequest = Notification.Name("NetworkTriggerPerformRequest")
//  
//}
