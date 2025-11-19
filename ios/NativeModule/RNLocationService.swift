//
//  RNLocationService.swift
//  boltexponativewind
//
//  Created by fanthus on 9/30/25.
//

import UIKit
import React
import ExpoModulesCore
import CoreLocation

@objc(RNLocationService)
final class RNLocationService: NSObject,RCTBridgeModule {
  let locManager = CLLocationManager()
  static func moduleName() -> String! { "RNLocationService" }
  static func requiresMainQueueSetup() -> Bool { true }
  @objc var bridge:RCTBridge?
    
  // 获取位置信息
  @objc(location:rejecter:)
  func location(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    print("RNLocationService.location() called")
    let accuracyType = locManager.accuracyAuthorization
    resolve("Location service is working \(accuracyType)")
  }
  
}

