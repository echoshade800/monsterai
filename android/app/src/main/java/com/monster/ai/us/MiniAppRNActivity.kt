package com.monster.ai.us

import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.view.View
import android.widget.Button
import android.widget.FrameLayout
import androidx.appcompat.app.AppCompatActivity
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.ReactInstanceManager
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.ReactRootView
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.Arguments
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.facebook.react.common.LifecycleState
import com.facebook.react.shell.MainReactPackage
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.PackageList
import com.monster.ai.us.BuildConfig
import java.io.File

/**
 * MiniAppRNActivity - 用于显示 RN 类型的小程序
 * 参考 iOS 的 MiniAppViewController.m
 */
class MiniAppRNActivity : ReactActivity() {
    
    private var moduleName: String? = null
    private var bundlePath: String? = null
    private var customReactNativeHost: ReactNativeHost? = null
    
    override fun onCreate(savedInstanceState: Bundle?) {
        // 从 Intent 获取参数
        bundlePath = intent.getStringExtra(EXTRA_BUNDLE_PATH)
        moduleName = intent.getStringExtra(EXTRA_MODULE_NAME)
        
        Log.d(TAG, "[MiniApp] bundlePath = $bundlePath, moduleName = $moduleName")
        
        // 设置当前小程序名称
        moduleName?.let { MiniAppManager.setCurrentMiniAppName(it) }
        
        // 如果提供了本地 bundle 路径，创建自定义的 ReactNativeHost
        if (bundlePath != null && File(bundlePath).exists()) {
            customReactNativeHost = createCustomReactNativeHost()
        }
        
        super.onCreate(savedInstanceState)
        
        // 添加关闭按钮
        addCloseButton()
    }
    
    override fun getMainComponentName(): String {
        return moduleName ?: "main"
    }
    
    override fun getReactNativeHost(): ReactNativeHost {
        return customReactNativeHost ?: super.getReactNativeHost()
    }
    
    private fun createCustomReactNativeHost(): ReactNativeHost {
        val bundlePath = this.bundlePath
        val application = application as com.monster.ai.us.MainApplication
        
        return object : DefaultReactNativeHost(application) {
            override fun getPackages(): List<ReactPackage> {
                return PackageList(this).packages.apply {
                    // 添加 MiniAppLauncherPackage
                    add(MiniAppLauncherPackage())
                }
            }
            
            override fun getJSMainModuleName(): String {
                // 返回本地 bundle 路径
                // 注意：这里需要将文件路径转换为 file:// URL 格式
                val file = File(bundlePath ?: "")
                if (file.exists()) {
                    val fileUrl = file.toURI().toString()
                    Log.d(TAG, "[MiniApp] Using local bundle: $fileUrl")
                    return fileUrl
                }
                return ".expo/.virtual-metro-entry"
            }
            
            override fun getUseDeveloperSupport(): Boolean {
                return false // 不使用开发服务器，使用本地 bundle
            }
            
            override val isNewArchEnabled: Boolean
                get() = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
        }
    }
    
    override fun createReactActivityDelegate(): ReactActivityDelegate {
        val moduleName = this.moduleName ?: "main"
        
        return object : ReactActivityDelegate(this, moduleName) {
            override fun getLaunchOptions(): Bundle? {
                val launchOptions = Bundle()
                // 可以在这里传递初始属性
                return launchOptions
            }
        }
    }
    
    private fun addCloseButton() {
        // 等待 ReactRootView 创建后再添加关闭按钮
        window.decorView.post {
            val rootView = window.decorView.findViewById<View>(android.R.id.content)
            if (rootView != null) {
                val closeButton = Button(this).apply {
                    text = "✕"
                    setOnClickListener { closeTapped() }
                    // 设置按钮样式
                    setBackgroundColor(0xFFFFFFFF.toInt())
                    setTextColor(0xFF000000.toInt())
                    textSize = 20f
                    // 设置位置和大小
                    val params = FrameLayout.LayoutParams(
                        FrameLayout.LayoutParams.WRAP_CONTENT,
                        FrameLayout.LayoutParams.WRAP_CONTENT
                    ).apply {
                        // 居中顶部
                        topMargin = 50
                    }
                    layoutParams = params
                }
                
                // 将按钮添加到根视图
                if (rootView is FrameLayout) {
                    rootView.addView(closeButton)
                } else {
                    // 如果不是 FrameLayout，创建一个包装器
                    val wrapper = FrameLayout(this).apply {
                        addView(rootView)
                        addView(closeButton)
                    }
                    setContentView(wrapper)
                }
            }
        }
    }
    
    private fun closeTapped() {
        val miniAppName = MiniAppManager.getCurrentMiniAppName() ?: ""
        
        // 发送数据同步事件
        sendSyncEvent(miniAppName)
        
        // 清除当前小程序名称
        MiniAppManager.clearCurrentMiniAppName()
        
        // 关闭 Activity
        finish()
    }
    
    private fun sendSyncEvent(miniAppName: String) {
        try {
            // 通过 NetworkTrigger 发送事件
            // 在 Android 中，我们需要找到 NetworkTrigger 模块并调用 emit 方法
            // 或者通过 Intent 发送广播，让 NetworkTrigger 接收
            
            // 方案1: 直接通过 ReactContext 发送事件
            val reactContext = reactInstanceManager.currentReactContext
            reactContext?.let { context ->
                val eventMap: WritableMap = Arguments.createMap().apply {
                    putString("type", "miniapp_rn")
                    val payload = Arguments.createMap().apply {
                        putString("task_type", "sync")
                        putString("mini_app_name", miniAppName)
                    }
                    putMap("payload", payload)
                }
                
                context
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    .emit("NativeAction", eventMap)
                
                Log.d(TAG, "[MiniApp] Sent sync event for: $miniAppName")
            } ?: run {
                // 如果 ReactContext 不可用，尝试通过 Intent 发送
                Log.w(TAG, "[MiniApp] ReactContext not available, trying alternative method")
                sendBroadcast(Intent("com.monster.ai.us.NativeAction").apply {
                    putExtra("type", "miniapp_rn")
                    putExtra("task_type", "sync")
                    putExtra("mini_app_name", miniAppName)
                })
            }
        } catch (e: Exception) {
            Log.e(TAG, "[MiniApp] Failed to send sync event", e)
        }
    }
    
    override fun onBackPressed() {
        closeTapped()
    }
    
    companion object {
        private const val TAG = "MiniAppRNActivity"
        const val EXTRA_BUNDLE_PATH = "bundle_path"
        const val EXTRA_MODULE_NAME = "module_name"
        
        fun createIntent(
            context: android.content.Context,
            bundlePath: String,
            moduleName: String
        ): Intent {
            return Intent(context, MiniAppRNActivity::class.java).apply {
                putExtra(EXTRA_BUNDLE_PATH, bundlePath)
                putExtra(EXTRA_MODULE_NAME, moduleName)
            }
        }
    }
}

