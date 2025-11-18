import { Platform } from 'react-native';
import AppleHealthKit from 'react-native-health';
import storageManager from './storage';

/**
 * 获取当前时间信息
 * @returns {Object} 包含日期、本地时间和星期几的对象
 */
export const getCurrentTimeInfo = () => {
  const now = new Date();
  
  // 格式化日期 (YYYY-MM-DD)
  const date = now.toISOString().split('T')[0];
  
  // 格式化本地时间 (12小时制)
  const localTime = now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  
  // 获取星期几
  const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });
  
  return {
    date,
    localTime,
    dayOfWeek
  };
};

/**
 * 获取用户信息
 * @returns {Promise<Object>} 用户资料对象
 */
export const getUserProfile = async () => {
  try {
    // 从本地存储获取用户数据
    const userData = await storageManager.getUserData();
    
    // 默认用户信息
    let userProfile = {
      name: 'User',
      age: 'Unknown',
      gender: 'Unknown',
      height: 'Unknown',
      weight: 'Unknown',
      location: 'Unknown',
      goal: 'Not set'
    };

    // 从用户数据中提取信息
    if (userData) {
      if (userData.userName) {
        userProfile.name = userData.userName;
      }
      if (userData.city && userData.country) {
        userProfile.location = `${userData.city}, ${userData.country}`;
      } else if (userData.city) {
        userProfile.location = userData.city;
      } else if (userData.country) {
        userProfile.location = userData.country;
      }
      if (userData.age) {
        userProfile.age = userData.age;
      }
     if (userData.gender) {
        userProfile.gender = userData.gender;
      }
      if (userData.height) {
        userProfile.height = userData.height;
      }
      if (userData.weight) {
        userProfile.weight = userData.weight;
      }
      if (userData.goal) {
        userProfile.goal = userData.goal;
      }
    }
    return userProfile;
  } catch (error) {
    console.error('Failed to get user info:', error);
    return {
      name: 'User',
      age: 'Unknown',
      gender: 'Unknown',
      height: 'Unknown',
      weight: 'Unknown',
      location: 'Unknown',
      goal: 'Not set'
    };
  }
};

/**
 * 生成本地动态 User Context
 * @returns {Promise<string>} User Context 文本
 */
const generateLocalUserContext = async () => {
  // 获取实时时间信息
  const timeInfo = getCurrentTimeInfo();
  
  // 获取用户信息
  const userProfile = await getUserProfile();
  
  return `
### 5. User Context  (Dynamic Data – updated each request)
**User Profile**  
- Name: ${userProfile.name}  
- Age: ${userProfile.age}  
- Gender: ${userProfile.gender}  
- Height: ${userProfile.height}  
- Weight: ${userProfile.weight}  
- Location: ${userProfile.location}  

**Current Time**  
- Date: ${timeInfo.date}  
- Local Time: ${timeInfo.localTime}  
- Day of Week: ${timeInfo.dayOfWeek}

**User Goals**  
- Primary Goal: ${userProfile.goal}  

**Recent Lifestyle Data (Past 7 Days)**  
- 🍽️ Diet: Average daily calorie intake: ~2450 kcal. Protein intake slightly low (~60g/day). High late-night snacking frequency (4/7 days).  
- 🏃‍♂️ Activity: Average steps per day: ~6800. Only 2 structured workouts this week.  
- 😴 Sleep: Average sleep duration: 6h 10m. Bedtime: ~00:45 AM. Sleep quality: 6.5/10.  
- 🚽 Excretion: Regular bowel movements (once daily). Slight dehydration signs reported twice.  
- 🧠 Mood/Energy: Midday energy dips reported on 5/7 days. Mood described as "sluggish" on 3 days.  
`;
};

/**
 * 生成本地系统提示词
 * @returns {Promise<string>} 系统提示词文本
 */
const generateLocalSystemPrompt = async () => {
  // 获取本地动态 User Context
  const userContextStr = await generateLocalUserContext();

    const systemPrompt = `
You are **"Monster AI"** – the world's most professional yet playful **weight-loss companion**。 
Your personality = **ENFP**: energetic, sunny, warm, encouraging, and curious.  
You treat the user in a protective, slightly cheeky, and proactive way.

## 🎯 Core Goals

### 1. Metabolism Tracking
- Collect key info: food/drinks (input), activity/sleep (output), body/genetic factors, past weight-loss experiences.  
- Maintain an internal metabolic picture — only show numbers when needed.  
- Support **image recognition** for foods, drinks, or activities. When an image is uploaded, describe it briefly (e.g., "User uploaded a bowl of ramen") and treat it as new data.
- State Tracking: Continuously gather daily behavior data — including eating, drinking, excretion, urination, sleep, and exercise — from user input or tool output, and automatically infer the user's current physiological and lifestyle state.
- Multidimensional Reasoning: Analyze and interpret the user's condition from multiple expert perspectives, including but not limited to:
  - 🍎 Nutritionist: Evaluate whether the dietary structure is balanced and whether nutrient intake is excessive or insufficient.
  - ⚖️ Weight-Loss Advisor: Assess whether calorie intake and expenditure align with weight-management goals.
  - 🧬 Metabolic Specialist: Infer metabolic state, hormonal rhythms, and energy utilization efficiency.
  - 🧘‍♂️ Lifestyle Coach: Provide improvement suggestions based on routines, habits, stress levels, and behavioral patterns.

### 2. Interactive Guidance
- Keep replies **short (≤2 sentences)** — talk like a fun, supportive friend.  
- Each reply = one of:
  - **a)** acknowledge new data + ask one focused follow-up (on current state, past habits, challenges, etc.), or  
  - **b)** give one small actionable step and invite a report later.  
- If the user isn't chatty or no new data, send a quick action reminder (e.g., "Go stretch!").

### 3. Input type and tool Use 
You may receive the following types of input — automatically recognize and leverage them in your reasoning and responses:
  - 🕰️ Current Time (e.g., "7:30 AM"): Used to determine the current stage of the day (e.g., waking up, breakfast, lunch, bedtime, etc.).
  -📍 User Location (e.g., "Beijing"): Used to infer factors like daylight exposure, climate, and dietary context.
  - 🍽️ Dietary Information (Eating/Drinking): Includes time, type of food/drink, quantity, and subjective feelings.
  - 🚽 Excretion Information (Bowel/Urinary): Includes time, frequency, and condition/state.
  - 🏃‍♂️ Exercise Information: Includes type, duration, and intensity of physical activity.
  - 😴 Sleep Information: Includes bedtime, total duration, and sleep quality.
  - 📊 User Goals: Examples include "lose 5 kg," "increase early wake-up success rate," or "improve sleep quality."

### 4. Style
- Light, playful, but purposeful.  
- Never list things; always flow like a natural chat.  
- Ask open, meaningful questions about metabolism, habits, or mindset.

${userContextStr}

### 6. Behavior Rules: 
- Output Format:  
  - New Data: One short factual summary from the user's input.  
  - Chat: A short, playful, focused reply:  
    - Recognize what user said,  
    - Ask one key question (if data missing), or  
    - Give one small action + invite them to report back.  
- You're like a friend-coach hybrid: caring + curious + nudging forward.  

---
【Example Interaction】
User: "今天下午我吃了一个汉堡和一杯可乐。"  
Monster AI:  
New Data: User had a hamburger and soda for lunch.  
Chat: 午餐小放纵啊～你今天下午打算动一动还是直接回家？  

---
User: "昨天走路1万步，大概1个小时。"  
Monster AI:  
New Data: User walked 10,000 steps (~1 hour) yesterday.  
Chat: 哇昨天很拼耶！那你今天的状态还好吗，累不累？  

---
User: "我之前也尝试过节食，但两周就放弃了。"  
Monster AI:  
New Data: User tried dieting before but quit after 2 weeks.  
Chat: 原来有过节食经历呀～那两周里，最让你坚持不下去的是啥？  

---
User: "好"
Monster AI:  
New Data: (no new data)  
Chat: 好啦小怪兽，去忙你的吧～记得要喝水、要运动有新数据就回来告诉我～  
`;
  
  return systemPrompt;
};

/**
 * 从远程URL获取系统提示词
 * @param {string} url - 系统提示词的远程URL
 * @returns {Promise<string>} 系统提示词文本
 */
const fetchRemoteSystemPrompt = async (url) => {
  try {
    const timestamp = Date.now();
    const response = await fetch(`${url}?t=${timestamp}`, {
      method: 'GET',
      headers: {
        'Accept-Charset': 'utf-8'
      }
    });
    
    if (response.ok) {
      const prompt = await response.text();
      console.log('Successfully fetched systemPrompt from remote');
      return prompt;
    } else {
      console.error('Failed to fetch systemPrompt from remote:', response.status);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error('Error fetching systemPrompt from remote:', error);
    throw error;
  }
};

/**
 * 将本地动态生成的 User Context 替换或插入到服务端 prompt 中
 * @param {string} remotePrompt - 服务端返回的 prompt
 * @returns {Promise<string>} 合并后的系统提示词
 */
const mergeUserContextWithRemotePrompt = async (remotePrompt) => {
  try {
    // 生成本地动态 User Context
    const localUserContext = await generateLocalUserContext();
    
    // 正则表达式匹配 User Context 部分
    // 匹配从 "### 5. User Context" 开始到下一个 "###" 或文件结尾的所有内容
    const userContextRegex = /### 5\. User Context[\s\S]*?(?=### \d+\.|$)/;
    
    // 检查服务端 prompt 是否包含 User Context 部分
    if (userContextRegex.test(remotePrompt)) {
      // 如果包含，则替换现有的 User Context
      const mergedPrompt = remotePrompt.replace(userContextRegex, localUserContext.trim());
      console.log('Replaced User Context section in remote prompt');
      return mergedPrompt;
    } else {
      // 如果不包含，则在适当位置插入本地 User Context
      // 查找 "### 4. Style" 部分，在其后插入 User Context
      const styleSectionRegex = /(### 4\. Style[\s\S]*?)(?=### \d+\.|$)/;
      const styleMatch = remotePrompt.match(styleSectionRegex);
      
      if (styleMatch) {
        // 在 Style 部分后插入 User Context
        const mergedPrompt = remotePrompt.replace(
          styleSectionRegex, 
          `${styleMatch[1]}\n${localUserContext.trim()}\n\n`
        );
        console.log('Inserted local User Context into remote prompt');
        return mergedPrompt;
      } else {
        // 如果找不到 Style 部分，则在文件末尾添加
        const mergedPrompt = `${remotePrompt}\n\n${localUserContext.trim()}`;
        console.log('Appended local User Context to end of remote prompt');
        return mergedPrompt;
      }
    }
  } catch (error) {
    console.error('Error merging User Context:', error);
    // 如果合并失败，返回原始服务端 prompt
    return remotePrompt;
  }
};

/**
 * 获取系统提示词（System Prompt）
 * 如果提供了 systemPromptURL，则优先从远程获取并合并本地 User Context；
 * 如果远程获取失败或未提供URL，则使用本地生成的提示词
 * 
 * @param {string} [systemPromptURL] - 可选的远程系统提示词URL
 * @returns {Promise<string>} 系统提示词文本
 */
export const fetchSystemPrompt = async (systemPromptURL = null) => {
  try {
    // 如果提供了远程URL，优先尝试从远程获取
    if (systemPromptURL) {
      try {
        const remotePrompt = await fetchRemoteSystemPrompt(systemPromptURL);
        // 将本地动态生成的 User Context 合并到服务端 prompt 中
        const mergedPrompt = await mergeUserContextWithRemotePrompt(remotePrompt);
        return mergedPrompt;
      } catch (error) {
        console.warn('Failed to fetch systemPrompt from remote, using locally generated prompt:', error);
        // 远程获取失败，继续使用本地生成
      }
    }
    
    // 使用本地生成的系统提示词
    const localPrompt = await generateLocalSystemPrompt();
    return localPrompt;
    
  } catch (error) {
    console.error('Error getting systemPrompt:', error);
    return 'You are a helpful assistant.'; // 默认提示
  }
};

