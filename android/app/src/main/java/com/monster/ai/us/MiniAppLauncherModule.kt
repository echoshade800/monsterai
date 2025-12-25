package com.monster.ai.us

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.util.Log
import android.webkit.WebStorage
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.Promise

/**
 * MiniAppLauncherModule - React Native 原生模块
 * 参考 iOS 的 MiniAppLauncher.swift
 */
class MiniAppLauncherModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "MiniAppLauncher"
    }

    /**
     * 打开小程序
     * @param baseURL bundle 路径或 H5 URL
     * @param moduleName 模块名称
     * @param versionForFileName 版本号（用于文件名）
     * @param params 参数字典，包含 miniAppType, title, localBundle 等
     */
    @ReactMethod
    fun open(
        baseURL: String,
        moduleName: String,
        versionForFileName: String,
        params: ReadableMap
    ) {
        val activity = currentActivity
        if (activity == null) {
            Log.e(TAG, "[MiniAppLauncher] Current activity is null")
            return
        }

        val miniAppType = params.getString("miniAppType") ?: "RN"
        val title = params.getString("title") ?: moduleName
        val localBundle = params.getBoolean("localBundle") ?: false

        Log.d(
            TAG,
            "[MiniAppLauncher] baseURL: $baseURL, moduleName: $moduleName, miniAppType: $miniAppType"
        )

        activity.runOnUiThread {
            try {
                if (miniAppType == "H5") {
                    // H5 类型小程序
                    val storageParams = params.getString("storage_data")
                    val intent = MiniAppH5Activity.createIntent(
                        reactApplicationContext,
                        baseURL,
                        moduleName,
                        storageParams
                    )
                    activity.startActivity(intent)
                } else {
                    // RN 类型小程序
                    // baseURL 已经是完整的 bundle 路径（如：file:///path/to/rnbundle/main.jsbundle）
                    val bundlePath = if (baseURL.startsWith("file://")) {
                        baseURL.substring(7) // 移除 "file://" 前缀
                    } else {
                        baseURL
                    }

                    val intent = MiniAppRNActivity.createIntent(
                        reactApplicationContext,
                        bundlePath,
                        moduleName
                    )
                    activity.startActivity(intent)
                }
            } catch (e: Exception) {
                Log.e(TAG, "[MiniAppLauncher] Failed to open MiniApp", e)
            }
        }
    }

    /**
     * 清除 H5 本地存储
     */
    @ReactMethod
    fun clearH5LocalStorage() {
        val activity = currentActivity
        activity?.runOnUiThread {
            try {
                WebStorage.getInstance().deleteAllData()
                Log.d(TAG, "[MiniAppLauncher] Cleared H5 local storage")
            } catch (e: Exception) {
                Log.e(TAG, "[MiniAppLauncher] Failed to clear H5 local storage", e)
            }
        }
    }

    companion object {
        private const val TAG = "MiniAppLauncherModule"
    }
}

