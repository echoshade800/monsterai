/**
 * 格式化 Prompt 数据用于显示
 * @param {Object} result - API 返回的结果对象
 * @returns {string} 格式化后的字符串内容
 */
export function formatPromptData(result) {
  let displayContent = '';
  
  // 检查 result.data 的结构
  if (result.data && typeof result.data === 'object' && !Array.isArray(result.data)) {
    // 新的返回结构：包含 first_contact_chat 和 daily_chat
    const sections = [];
    
    if (result.data.first_contact_chat) {
      sections.push(`【First Contact Chat Prompt】\n\n${result.data.first_contact_chat}`);
    }
    
    if (result.data.daily_chat) {
      sections.push(`【Daily Chat Prompt】\n\n${result.data.daily_chat}`);
    }
    
    // 如果有其他字段，也一并展示
    const otherKeys = Object.keys(result.data).filter(
      key => key !== 'first_contact_chat' && key !== 'daily_chat'
    );
    
    if (otherKeys.length > 0) {
      otherKeys.forEach(key => {
        const value = result.data[key];
        if (typeof value === 'string') {
          sections.push(`【${key}】\n\n${value}`);
        } else {
          sections.push(`【${key}】\n\n${JSON.stringify(value, null, 2)}`);
        }
      });
    }
    
    if (sections.length > 0) {
      displayContent = sections.join('\n\n' + '='.repeat(80) + '\n\n');
    } else {
      displayContent = JSON.stringify(result.data, null, 2);
    }
  } else if (Array.isArray(result.data)) {
    // 兼容旧的数组格式
    const parsedItems = result.data.map((item, index) => {
      try {
        const parsed = JSON.parse(item);
        return `[${index + 1}] ${JSON.stringify(parsed, null, 2)}`;
      } catch (parseError) {
        return `[${index + 1}] ${item}`;
      }
    });
    displayContent = parsedItems.join('\n\n---\n\n');
  } else if (typeof result.data === 'string') {
    // 兼容单个字符串格式
    try {
      const parsed = JSON.parse(result.data);
      displayContent = JSON.stringify(parsed, null, 2);
    } catch (parseError) {
      displayContent = result.data;
    }
  } else {
    // 其他类型，直接序列化
    displayContent = JSON.stringify(result.data, null, 2);
  }
  
  return displayContent || 'No content available';
}

