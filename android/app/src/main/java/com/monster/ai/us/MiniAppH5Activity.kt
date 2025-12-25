package com.monster.ai.us

import android.annotation.SuppressLint
import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.view.View
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Button
import androidx.appcompat.app.AppCompatActivity
import androidx.appcompat.widget.Toolbar
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import org.json.JSONObject

/**
 * MiniAppH5Activity - 用于显示 H5 类型的小程序
 * 参考 iOS 的 MiniAppH5ViewController.m
 */
class MiniAppH5Activity : AppCompatActivity() {
    
    private var webView: WebView? = null
    private var baseURL: String? = null
    private var moduleName: String? = null
    private var storageParams: String? = null
    
    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // 从 Intent 获取参数
        baseURL = intent.getStringExtra(EXTRA_BASE_URL)
        moduleName = intent.getStringExtra(EXTRA_MODULE_NAME)
        storageParams = intent.getStringExtra(EXTRA_STORAGE_PARAMS)
        
        Log.d(TAG, "[MiniApp] H5 baseURL = $baseURL, moduleName = $moduleName")
        
        // 设置当前小程序名称
        moduleName?.let { MiniAppManager.setCurrentMiniAppName(it) }
        
        // 创建 WebView
        webView = WebView(this).apply {
            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                allowFileAccess = true
                allowContentAccess = true
                setSupportZoom(true)
                builtInZoomControls = false
                displayZoomControls = false
                loadWithOverviewMode = true
                useWideViewPort = true
            }
            
            webViewClient = object : WebViewClient() {
                override fun onPageFinished(view: WebView?, url: String?) {
                    super.onPageFinished(view, url)
                    Log.d(TAG, "[MiniApp] H5 page finished loading: $url")
                    
                    // 如果有存储参数，注入到 localStorage
                    storageParams?.let { params ->
                        val jsCode = H5JSExecUtil.generateLocalStorageWriteJS(params)
                        view?.evaluateJavascript(jsCode) { result ->
                            Log.d(TAG, "[MiniApp] Injected storage data: $result")
                        }
                    }
                }
                
                override fun onPageStarted(view: WebView?, url: String?, favicon: android.graphics.Bitmap?) {
                    super.onPageStarted(view, url, favicon)
                    Log.d(TAG, "[MiniApp] H5 page started loading: $url")
                }
                
                override fun onReceivedError(
                    view: WebView?,
                    errorCode: Int,
                    description: String?,
                    failingUrl: String?
                ) {
                    super.onReceivedError(view, errorCode, description, failingUrl)
                    Log.e(TAG, "[MiniApp] H5 page error: $description ($errorCode) at $failingUrl")
                }
            }
            
            webChromeClient = object : WebChromeClient() {
                override fun onConsoleMessage(consoleMessage: android.webkit.ConsoleMessage?): Boolean {
                    Log.d(TAG, "[MiniApp] H5 Console: ${consoleMessage?.message()}")
                    return true
                }
            }
            
            // 添加 JavaScript 接口
            addJavascriptInterface(WebAppInterface(), "native")
            addJavascriptInterface(WebAppInterface(), "bridge")
        }
        
        // 设置内容视图
        setContentView(createLayout())
        
        // 加载 URL
        baseURL?.let { url ->
            webView?.loadUrl(url)
        } ?: run {
            Log.e(TAG, "[MiniApp] No baseURL provided")
            finish()
        }
    }
    
    private fun createLayout(): View {
        // 创建工具栏
        val toolbar = Toolbar(this).apply {
            title = moduleName ?: "MiniApp"
            setTitleTextColor(0xFF000000.toInt())
            setBackgroundColor(0xFFFFFFFF.toInt())
            // 添加关闭按钮
            setNavigationIcon(android.R.drawable.ic_menu_close_clear_cancel)
            setNavigationOnClickListener { closeTapped() }
        }
        
        // 创建主布局
        return android.widget.LinearLayout(this).apply {
            orientation = android.widget.LinearLayout.VERTICAL
            addView(toolbar, android.widget.LinearLayout.LayoutParams(
                android.widget.LinearLayout.LayoutParams.MATCH_PARENT,
                android.widget.LinearLayout.LayoutParams.WRAP_CONTENT
            ))
            addView(webView, android.widget.LinearLayout.LayoutParams(
                android.widget.LinearLayout.LayoutParams.MATCH_PARENT,
                android.widget.LinearLayout.LayoutParams.MATCH_PARENT
            ))
        }
    }
    
    private fun closeTapped() {
        // 在关闭前获取 H5 页面的 localStorage 数据
        getLocalStorageDataBeforeClose()
    }
    
    private fun getLocalStorageDataBeforeClose() {
        val jsCode = H5JSExecUtil.generateLocalStorageReadJS()
        webView?.evaluateJavascript(jsCode) { result ->
            Log.d(TAG, "[MiniApp] Retrieved localStorage data: $result")
            handleLocalStorageData(result)
            
            // 无论是否成功获取数据，都关闭 Activity
            runOnUiThread {
                finish()
            }
        }
    }
    
    private fun handleLocalStorageData(data: String?) {
        if (data.isNullOrEmpty() || data == "null") {
            Log.w(TAG, "[MiniApp] No localStorage data retrieved")
            return
        }
        
        try {
            // 移除 JSON 字符串的引号（如果存在）
            val cleanData = data.removeSurrounding("\"").replace("\\\"", "\"")
            val jsonObject = JSONObject(cleanData)
            val miniAppName = MiniAppManager.getCurrentMiniAppName() ?: ""
            
            // 获取该小程序的数据
            val miniAppData = jsonObject.optString(miniAppName)
            
            if (miniAppData.isNotEmpty()) {
                // 发送数据同步事件
                sendSyncEvent(miniAppName, miniAppData)
            } else {
                Log.d(TAG, "[MiniApp] No data found for miniApp: $miniAppName")
            }
        } catch (e: Exception) {
            Log.e(TAG, "[MiniApp] Failed to parse localStorage data", e)
        }
    }
    
    private fun sendSyncEvent(miniAppName: String, data: String) {
        try {
            // 通过 ReactContext 发送事件
            // 注意：这里我们需要获取主应用的 ReactContext
            // 由于 H5 Activity 是独立的，我们需要通过其他方式发送事件
            
            // 方案1: 通过 Intent 发送广播
            sendBroadcast(Intent("com.monster.ai.us.NativeAction").apply {
                putExtra("type", "miniapp_h5")
                putExtra("task_type", "sync")
                putExtra("mini_app_name", miniAppName)
                putExtra("data", data)
            })
            
            // 方案2: 尝试通过 MainApplication 获取 ReactContext
            val application = application as? com.monster.ai.us.MainApplication
            application?.reactNativeHost?.reactInstanceManager?.currentReactContext?.let { context ->
                val eventMap: WritableMap = Arguments.createMap().apply {
                    putString("type", "miniapp_h5")
                    val payload = Arguments.createMap().apply {
                        putString("task_type", "sync")
                        putString("mini_app_name", miniAppName)
                        putString("data", data)
                    }
                    putMap("payload", payload)
                }
                
                context
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    .emit("NativeAction", eventMap)
                
                Log.d(TAG, "[MiniApp] Sent sync event for: $miniAppName")
            }
        } catch (e: Exception) {
            Log.e(TAG, "[MiniApp] Failed to send sync event", e)
        }
    }
    
    override fun onBackPressed() {
        closeTapped()
    }
    
    override fun onDestroy() {
        super.onDestroy()
        // 清除当前小程序名称
        MiniAppManager.clearCurrentMiniAppName()
        webView?.destroy()
        webView = null
    }
    
    /**
     * JavaScript 接口，用于 H5 页面与原生通信
     */
    inner class WebAppInterface {
        @JavascriptInterface
        fun postMessage(message: String) {
            Log.d(TAG, "[MiniApp] Received message from H5: $message")
            // 可以在这里处理来自 H5 的消息
        }
    }
    
    companion object {
        private const val TAG = "MiniAppH5Activity"
        const val EXTRA_BASE_URL = "base_url"
        const val EXTRA_MODULE_NAME = "module_name"
        const val EXTRA_STORAGE_PARAMS = "storage_params"
        
        fun createIntent(
            context: android.content.Context,
            baseURL: String,
            moduleName: String,
            storageParams: String? = null
        ): Intent {
            return Intent(context, MiniAppH5Activity::class.java).apply {
                putExtra(EXTRA_BASE_URL, baseURL)
                putExtra(EXTRA_MODULE_NAME, moduleName)
                storageParams?.let { putExtra(EXTRA_STORAGE_PARAMS, it) }
            }
        }
    }
}

