package com.monster.ai.us

/**
 * H5JSExecUtil - 生成 localStorage 相关的 JavaScript 代码
 * 参考 iOS 的 H5JSExecUtil.swift
 */
object H5JSExecUtil {
    
    /**
     * 生成写入 localStorage 的 JavaScript 代码
     * @param jsonString 要写入的 JSON 字符串
     * @return 完整的 JavaScript 执行代码
     */
    fun generateLocalStorageWriteJS(jsonString: String): String {
        // 转义 JSON 字符串中的单引号和反斜杠
        val escapedJsonString = jsonString
            .replace("\\", "\\\\")
            .replace("'", "\\'")
            .replace("\n", "\\n")
            .replace("\r", "\\r")
        
        return """
        (function() {
          try {
            console.log('开始写入localStorage数据');
            
            // 读取现有的localStorage数据
            var existingData = {};
            for (var i = 0; i < localStorage.length; i++) {
              var key = localStorage.key(i);
              existingData[key] = localStorage.getItem(key);
            }
            
            console.log('现有localStorage数据:', existingData);
            
            // 解析要写入的新数据
            var newDataStr = '$escapedJsonString';
            console.log('新数据字符串:', newDataStr);
            
            var newData;
            try {
              newData = JSON.parse(newDataStr);
              console.log('解析后的新数据:', newData);
            } catch (parseError) {
              console.error('JSON解析失败:', parseError);
              return 'JSON解析失败: ' + parseError.message;
            }
            
            // 合并数据：保留现有数据，更新新数据
            for (var key in newData) {
              if (newData.hasOwnProperty(key)) {
                existingData[key] = newData[key];
                console.log('更新字段:', key, '=', newData[key]);
              }
            }
            
            // 将合并后的数据写回localStorage
            for (var key in existingData) {
              if (existingData.hasOwnProperty(key)) {
                localStorage.setItem(key, existingData[key]);
              }
            }
            
            console.log('localStorage写入完成');
            
            // 返回更新后的数据
            return JSON.stringify(existingData);
          } catch (error) {
            console.error('JavaScript执行错误:', error);
            return 'Error: ' + error.message;
          }
        })()
        """.trimIndent()
    }
    
    /**
     * 生成读取 localStorage 的 JavaScript 代码
     * @return 完整的 JavaScript 执行代码
     */
    fun generateLocalStorageReadJS(): String {
        return """
        (function() {
          try {
            console.log('开始读取localStorage数据');
            
            var data = {};
            for (var i = 0; i < localStorage.length; i++) {
              var key = localStorage.key(i);
              data[key] = localStorage.getItem(key);
            }
            
            console.log('读取到的localStorage数据:', data);
            return JSON.stringify(data);
          } catch (error) {
            console.error('读取localStorage失败:', error);
            return 'Error: ' + error.message;
          }
        })()
        """.trimIndent()
    }
    
    /**
     * 生成清除 localStorage 的 JavaScript 代码
     * @return 完整的 JavaScript 执行代码
     */
    fun generateLocalStorageClearJS(): String {
        return """
        (function() {
          try {
            console.log('开始清除localStorage数据');
            localStorage.clear();
            console.log('localStorage清除完成');
            return 'success';
          } catch (error) {
            console.error('清除localStorage失败:', error);
            return 'Error: ' + error.message;
          }
        })()
        """.trimIndent()
    }
}

