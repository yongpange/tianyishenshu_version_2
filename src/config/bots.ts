// 智能体配置 - 支持6个不同的智能体
export const BOT_CONFIG = {
  // 默认聊天机器人
  chat: 'YOUR_CHAT_BOT_ID',
  
  // 性格分析机器人  
  personality: 'YOUR_PERSONALITY_BOT_ID',
  
  // 运势分析机器人
  fortune: 'YOUR_FORTUNE_BOT_ID',
  
  // 事业分析机器人
  career: 'YOUR_CAREER_BOT_ID',
  
  // 感情分析机器人
  love: 'YOUR_LOVE_BOT_ID',
  
  // 健康分析机器人
  health: 'YOUR_HEALTH_BOT_ID'
} as const

export type BotType = keyof typeof BOT_CONFIG

// 获取智能体ID的工具函数
export function getBotId(type: BotType): string {
  return BOT_CONFIG[type]
}

// 获取智能体描述
export function getBotDescription(type: BotType): string {
  const descriptions = {
    chat: '通用聊天助手',
    personality: '性格分析专家',
    fortune: '运势预测大师',
    career: '事业规划顾问',
    love: '情感咨询师',
    health: '健康养生专家'
  }
  return descriptions[type]
}

// 验证BOT_ID是否有效
export function isValidBotId(botId: string): boolean {
  return /^\d{19}$/.test(botId) // Coze BOT_ID 通常是19位数字
}
