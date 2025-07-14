// 报告模块配置类型定义
export interface ReportModuleConfig {
  moduleId: 'personality' | 'wealth' | 'marriage' | 'health'
  title: string
  reportTitle: string
  reportButtonText: string
  apiEndpoint: string
  envBotKey: string
  description: string
  icon: string
}

// 报告模块配置
export const REPORT_MODULES: Record<string, ReportModuleConfig> = {
  personality: {
    moduleId: 'personality',
    title: '性格内观',
    reportTitle: '性格分析报告',
    reportButtonText: '性格内观报告',
    apiEndpoint: '/api/personality-report',
    envBotKey: 'PERSONALITY_BOT_ID',
    description: '深入灵魂深处，发现真实的自己',
    icon: '🧠'
  },
  wealth: {
    moduleId: 'wealth',
    title: '事业财富',
    reportTitle: '事业财富报告',
    reportButtonText: '事业财富报告',
    apiEndpoint: '/api/wealth-report',
    envBotKey: 'WEALTH_BOT_ID',
    description: '洞察事业走向，把握财富机遇',
    icon: '💰'
  },
  marriage: {
    moduleId: 'marriage',
    title: '婚恋感情',
    reportTitle: '婚恋感情报告',
    reportButtonText: '婚恋感情报告',
    apiEndpoint: '/api/marriage-report',
    envBotKey: 'MARRIAGE_BOT_ID',
    description: '探寻情感密码，指引爱情方向',
    icon: '💕'
  },
  health: {
    moduleId: 'health',
    title: '身体健康',
    reportTitle: '身体健康报告',
    reportButtonText: '身体健康报告',
    apiEndpoint: '/api/health-report',
    envBotKey: 'HEALTH_BOT_ID',
    description: '感知身心状态，守护健康之源',
    icon: '🏥'
  }
}

// 获取模块配置的工具函数
export const getModuleConfig = (moduleId: string): ReportModuleConfig => {
  const config = REPORT_MODULES[moduleId]
  if (!config) {
    throw new Error(`Unknown module: ${moduleId}`)
  }
  return config
}

// 获取所有模块ID列表
export const getAllModuleIds = (): string[] => {
  return Object.keys(REPORT_MODULES)
}
