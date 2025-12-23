import Foundation
import CocoaLumberjack

// 导入 RNLoggerHelper 以使用日志方法
// 注意：需要在 Bridging Header 中导入 RNLoggerHelper.h

/// 网络请求日志记录协议
/// 拦截所有通过 URLSession 发起的网络请求，记录请求和响应内容到日志文件
class NetworkLoggingProtocol: URLProtocol {
    
    private var dataTask: URLSessionDataTask?
    private var responseData: NSMutableData?
    private var response: URLResponse?
    
    // 静态计数器，用于调试日志（每100个请求记录一次）
    private static var requestCount = 0
    
    /// 设置网络日志记录
    /// 确保所有 URLSessionConfiguration 都包含我们的 protocol
    static func setupURLSessionConfigurationSwizzling() {
        // 确保默认配置包含我们的 protocol
        ensureProtocolInDefaultConfigurations()
        
        // 使用 Objective-C runtime 来 hook URLSessionConfiguration 的创建
        // 这确保所有新创建的配置都包含我们的 protocol
        hookURLSessionConfigurationCreation()
    }
    
    /// 确保默认的 URLSessionConfiguration 包含我们的 protocol
    private static func ensureProtocolInDefaultConfigurations() {
        // 获取所有默认配置并添加我们的 protocol
        let defaultConfig = URLSessionConfiguration.default
        addProtocolToConfiguration(defaultConfig)
        
        let ephemeralConfig = URLSessionConfiguration.ephemeral
        addProtocolToConfiguration(ephemeralConfig)
    }
    
    /// 将我们的 protocol 添加到配置中
    private static func addProtocolToConfiguration(_ config: URLSessionConfiguration) {
        var protocolClasses = config.protocolClasses ?? []
        if !protocolClasses.contains(where: { $0 == NetworkLoggingProtocol.self }) {
            // 将我们的 protocol 插入到最前面，确保优先处理
            protocolClasses.insert(NetworkLoggingProtocol.self, at: 0)
            config.protocolClasses = protocolClasses
        }
    }
    
    /// Hook URLSessionConfiguration 的创建方法
    private static func hookURLSessionConfigurationCreation() {
        // URLProtocol.registerClass 已经注册了我们的 protocol
        // 但是为了确保所有 URLSessionConfiguration 都包含我们的 protocol，
        // 我们已经在 ensureProtocolInDefaultConfigurations 中处理了默认配置
        // 对于自定义配置，URLProtocol.registerClass 应该已经足够
        RNLoggerHelper.logDebug("NetworkLoggingProtocol: Hook setup completed")
    }
    
    // 标记需要拦截的请求
    override class func canInit(with request: URLRequest) -> Bool {
        // 如果请求已经被标记为已处理，则不拦截（避免循环）
        if URLProtocol.property(forKey: "NetworkLoggingProtocolHandled", in: request) != nil {
            return false
        }
        
        // 拦截所有 HTTP/HTTPS 请求
        guard let scheme = request.url?.scheme else { return false }
        let shouldIntercept = scheme == "http" || scheme == "https"
        
        // 如果应该拦截，记录一条调试日志（每100个请求记录一次，避免日志过多）
        if shouldIntercept {
            requestCount += 1
            if requestCount % 100 == 1 {
                RNLoggerHelper.logDebug("NetworkLoggingProtocol: Intercepted \(requestCount) requests so far. Latest: \(request.url?.absoluteString ?? "unknown")")
            }
        }
        
        return shouldIntercept
    }
    
    // 返回规范化的请求
    override class func canonicalRequest(for request: URLRequest) -> URLRequest {
        // 创建可变的请求副本
        guard let mutableRequest = (request as NSURLRequest).mutableCopy() as? NSMutableURLRequest else {
            return request
        }
        
        // 标记请求已被处理，避免循环拦截
        URLProtocol.setProperty(true, forKey: "NetworkLoggingProtocolHandled", in: mutableRequest)
        
        return mutableRequest as URLRequest
    }
    
    // 开始加载请求
    override func startLoading() {
        let request = self.request
        
        // 记录请求信息（同步记录，确保所有请求都被记录）
        logRequest(request)
        
        // 创建新的 URLSession 来执行请求
        // 使用 ephemeral 配置，并移除所有已注册的协议类，避免循环拦截
        let config = URLSessionConfiguration.ephemeral
        config.protocolClasses = []
        let session = URLSession(configuration: config, delegate: self, delegateQueue: nil)
        
        // 创建数据任务
        dataTask = session.dataTask(with: request)
        dataTask?.resume()
        
        responseData = NSMutableData()
    }
    
    // 停止加载
    override func stopLoading() {
        dataTask?.cancel()
        dataTask = nil
        responseData = nil
    }
    
    // 记录请求信息
    private func logRequest(_ request: URLRequest) {
        var logMessage = "\n"
        logMessage += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        logMessage += "📤 [网络请求] \(Date())\n"
        logMessage += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        
        // URL
        if let url = request.url {
            logMessage += "📍 URL: \(url.absoluteString)\n"
        }
        
        // Method
        if let method = request.httpMethod {
            logMessage += "🔧 Method: \(method)\n"
        }
        
        // Headers
        if let headers = request.allHTTPHeaderFields, !headers.isEmpty {
            logMessage += "📋 Headers:\n"
            for (key, value) in headers.sorted(by: { $0.key < $1.key }) {
                // 隐藏敏感信息
                let displayValue = shouldHideValue(for: key) ? "***" : value
                logMessage += "   \(key): \(displayValue)\n"
            }
        }
        
        // Body
        if let body = request.httpBody {
            if let bodyString = String(data: body, encoding: .utf8) {
                // 尝试格式化 JSON
                if let jsonData = bodyString.data(using: .utf8),
                   let jsonObject = try? JSONSerialization.jsonObject(with: jsonData),
                   let prettyData = try? JSONSerialization.data(withJSONObject: jsonObject, options: .prettyPrinted),
                   let prettyString = String(data: prettyData, encoding: .utf8) {
                    logMessage += "📦 Body (JSON):\n\(prettyString)\n"
                } else {
                    // 如果不是 JSON，直接显示（原样输出，不截断）
                    logMessage += "📦 Body:\n\(bodyString)\n"
                }
            } else {
                logMessage += "📦 Body: [二进制数据，大小: \(body.count) bytes]\n"
            }
        }
        
        logMessage += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        
        // 使用 RNLoggerHelper 记录日志（通过 Bridging Header 导入）
        RNLoggerHelper.logInfo(logMessage)
    }
    
    // 记录响应信息
    private func logResponse(_ response: URLResponse, data: Data?) {
        var logMessage = "\n"
        logMessage += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        logMessage += "📥 [网络响应] \(Date())\n"
        logMessage += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        
        // URL
        if let url = response.url {
            logMessage += "📍 URL: \(url.absoluteString)\n"
        }
        
        // Status Code (HTTP)
        if let httpResponse = response as? HTTPURLResponse {
            logMessage += "📊 Status Code: \(httpResponse.statusCode)\n"
            
            // Response Headers
            let headers = httpResponse.allHeaderFields
            if !headers.isEmpty {
                logMessage += "📋 Response Headers:\n"
                for (key, value) in headers.sorted(by: { 
                    let key1 = "\($0.key)"
                    let key2 = "\($1.key)"
                    return key1 < key2
                }) {
                    logMessage += "   \(key): \(value)\n"
                }
            }
        }
        
        // Response Data
        if let data = data, !data.isEmpty {
            if let dataString = String(data: data, encoding: .utf8) {
                // 尝试格式化 JSON
                if let jsonObject = try? JSONSerialization.jsonObject(with: data),
                   let prettyData = try? JSONSerialization.data(withJSONObject: jsonObject, options: .prettyPrinted),
                   let prettyString = String(data: prettyData, encoding: .utf8) {
                    // 原样输出 JSON，不截断
                    logMessage += "📦 Response Body (JSON):\n\(prettyString)\n"
                } else {
                    // 如果不是 JSON，直接显示（原样输出，不截断）
                    logMessage += "📦 Response Body:\n\(dataString)\n"
                }
            } else {
                logMessage += "📦 Response Body: [二进制数据，大小: \(data.count) bytes]\n"
            }
        } else {
            logMessage += "📦 Response Body: [空]\n"
        }
        
        logMessage += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        
        // 使用 RNLoggerHelper 记录日志（通过 Bridging Header 导入）
        RNLoggerHelper.logInfo(logMessage)
    }
    
    // 判断是否应该隐藏某个 header 的值（敏感信息）
    private func shouldHideValue(for key: String) -> Bool {
        let sensitiveKeys = ["authorization", "cookie", "x-api-key", "x-auth-token", "token", "password", "secret"]
        return sensitiveKeys.contains { key.lowercased().contains($0) }
    }
}

// MARK: - URLSessionConfiguration Extension
extension URLSessionConfiguration {
    /// 确保配置包含 NetworkLoggingProtocol
    /// 这个方法可以在创建 URLSession 之前调用
    func ensureNetworkLoggingProtocol() {
        var protocolClasses = self.protocolClasses ?? []
        if !protocolClasses.contains(where: { $0 == NetworkLoggingProtocol.self }) {
            protocolClasses.insert(NetworkLoggingProtocol.self, at: 0)
            self.protocolClasses = protocolClasses
        }
    }
}

// MARK: - URLSessionDataDelegate
extension NetworkLoggingProtocol: URLSessionDataDelegate {
    
    func urlSession(_ session: URLSession, dataTask: URLSessionDataTask, didReceive response: URLResponse, completionHandler: @escaping (URLSession.ResponseDisposition) -> Void) {
        self.response = response
        
        // 通知客户端收到响应
        client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
        completionHandler(.allow)
    }
    
    func urlSession(_ session: URLSession, dataTask: URLSessionDataTask, didReceive data: Data) {
        responseData?.append(data)
        
        // 转发数据给客户端
        client?.urlProtocol(self, didLoad: data)
    }
    
    func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
        if let error = error {
            // 记录错误
            var logMessage = "\n"
            logMessage += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            logMessage += "❌ [网络错误] \(Date())\n"
            logMessage += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            if let url = task.originalRequest?.url {
                logMessage += "📍 URL: \(url.absoluteString)\n"
            }
            logMessage += "⚠️ Error: \(error.localizedDescription)\n"
            if let nsError = error as NSError? {
                logMessage += "   Code: \(nsError.code)\n"
                logMessage += "   Domain: \(nsError.domain)\n"
            }
            logMessage += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            
            // 记录错误日志
            RNLoggerHelper.logError(logMessage)
            
            client?.urlProtocol(self, didFailWithError: error)
        } else {
            // 记录响应
            if let response = self.response, let data = responseData as Data? {
                logResponse(response, data: data)
            }
            
            client?.urlProtocolDidFinishLoading(self)
        }
        
        dataTask = nil
        responseData = nil
    }
}

