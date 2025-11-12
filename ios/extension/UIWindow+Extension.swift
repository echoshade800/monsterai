//
//  UIWindow+Extension.swift
//  boltexponativewind
//
//  Created by fanthus on 8/21/25.
//

import UIKit
import Foundation

public extension UIWindow {
    override func motionBegan(_ motion: UIEvent.EventSubtype, with event: UIEvent?) {
        if motion == .motionShake {
            #if DEBUG
            FLEXManager.shared.showExplorer()
            #endif
        }
    }
}
