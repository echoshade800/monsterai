/**
 * 角色类型到组件名称的映射字典
 * 用于将后端返回的角色类型标识映射到前端组件名称
 */
export const AGENT_TYPE_TO_COMPONENT_MAP: Record<string, string> = {
  // 营养师 -> Nutri
  nutritionist: 'nutri',
  
  // 睡眠师 -> Somno
  sleep_coach: 'somno',
  
  // 活动教练 -> Coach
  activity_coach: 'coach',
  
  // 放空师 -> zen
  mind_rest: 'zen',
  
  // 情感分析师 -> Muse
  relationship: 'muse',
  
  // 理财师 -> Fiscal
  finance: 'fiscal',
  
  // 咖酒师 -> Brew
  cafe_alcohol: 'brew',
  
  // 人生规划师 -> Architect
  life_planning: 'architect',
};

/**
 * 根据角色类型获取对应的组件名称
 * @param agentType 角色类型（如 'nutritionist', 'sleep_coach' 等）
 * @returns 组件名称（如 'nutri', 'somno' 等），如果未找到则返回 undefined
 */
export function getComponentNameByAgentType(agentType: string): string | undefined {
  return AGENT_TYPE_TO_COMPONENT_MAP[agentType];
}

/**
 * 根据组件名称获取对应的角色类型
 * @param componentName 组件名称（如 'nutri', 'somno' 等）
 * @returns 角色类型（如 'nutritionist', 'sleep_coach' 等），如果未找到则返回 undefined
 */
export function getAgentTypeByComponentName(componentName: string): string | undefined {
  const entries = Object.entries(AGENT_TYPE_TO_COMPONENT_MAP);
  const found = entries.find(([_, value]) => value === componentName);
  return found ? found[0] : undefined;
}

