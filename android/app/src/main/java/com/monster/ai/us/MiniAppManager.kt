package com.monster.ai.us

/**
 * MiniAppManager - 管理当前打开的小程序名称
 * 单例模式，类似 iOS 的 MiniAppManager.swift
 */
object MiniAppManager {
    @Volatile
    private var currentMiniAppName: String? = null

    fun getCurrentMiniAppName(): String? {
        return currentMiniAppName
    }

    fun setCurrentMiniAppName(name: String?) {
        currentMiniAppName = name
    }

    fun clearCurrentMiniAppName() {
        currentMiniAppName = null
    }
}

