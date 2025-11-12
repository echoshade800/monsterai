//
//  H5JSExecUtil.swift
//  boltexponativewind
//
//  Created by fanthus on 9/23/25.
//

import Foundation

@objc class H5JSExecUtil: NSObject {
  
    /// 生成localStorage写入的JavaScript代码
    /// - Parameter jsonString: 要写入的JSON字符串
    /// - Returns: 完整的JavaScript执行代码
    @objc static func generateLocalStorageWriteJS(jsonString: String) -> String {
        // 转义JSON字符串中的单引号
        let escapedJsonString = jsonString.replacingOccurrences(of: "'", with: "\\'")
        
        let jsCode = """
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
            var newDataStr = '\(escapedJsonString)';
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
        """
        
        return jsCode
    }
    
    /// 生成localStorage读取的JavaScript代码
    /// - Returns: 完整的JavaScript执行代码
  @objc static func generateLocalStorageReadJS() -> String {
        let jsCode = """
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
        """
        
        return jsCode
    }
    
    /// 生成localStorage清除的JavaScript代码
    /// - Returns: 完整的JavaScript执行代码
  @objc static func generateLocalStorageClearJS() -> String {
        let jsCode = """
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
        """
        
        return jsCode
    }
    
}
