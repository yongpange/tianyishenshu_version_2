import { NextRequest, NextResponse } from 'next/server'
import { UserInfo } from '@/lib/coze-client'
import { formatUserInfoDisplay } from '@/utils/client-utils'
import {
  createWealthReport,
  saveWealthReport
} from '@/utils/wealth-report'
import { 
  generateReport,
  UniversalReportRequest,
  UniversalReportResponse,
  ReportConfig
} from '@/lib/report-generator'

// 请求接口
interface WealthReportRequest {
  userInfo: UserInfo
  userId: string
  isUserProfileId?: boolean
}

// 响应接口
interface WealthReportResponse {
  success: boolean
  reportId?: string
  content?: string
  error?: string
  authMethod?: string
}

// 环境变量配置
const WEALTH_BOT_ID = process.env.WEALTH_BOT_ID || process.env.BOT_ID || ''

// 格式化用户信息为事业财富报告prompt
function formatWealthPrompt(userInfo: UserInfo, astrologyContext?: string): string {
  const { year, month, day, hour, minute, gender, area } = userInfo
  const location = `${area.province}${area.city}${area.district}`
  const birthInfo = `${year}年${month}月${day}日${hour}时${minute}分，${location}`

  let prompt = `请根据出生信息：${birthInfo}，性别：${gender === 'male' || gender === '男' ? '男' : '女'}，生成详细的事业财富分析报告。

`

  // 如果有八字排盘信息，加入上下文
  if (astrologyContext) {
    prompt += `**八字排盘分析数据：**

${astrologyContext}

**请基于以上八字排盘信息，结合传统命理学知识，生成深度的事业财富分析报告。**

`
  }

  prompt += `请自由发挥，生成丰富全面的事业财富分析内容，可以包含但不限于：事业发展方向、财富累积模式、投资理财建议、职业规划、商业机遇、风险防范、时机把握等方面。

请使用markdown格式，合理组织内容结构，让报告既专业又实用。`

  return prompt
}

// 生成fallback内容
function generateFallbackContent(userInfo: UserInfo): string {
  return `# 事业财富分析报告

基于您的出生信息：${formatUserInfoDisplay(userInfo)}

## 基础分析

由于AI服务暂时不可用，这里提供基础的事业财富分析框架。您可以稍后重新生成完整的报告。

## 出生信息
- 出生年份：${userInfo.year}年
- 出生月日：${userInfo.month}月${userInfo.day}日  
- 出生时辰：${userInfo.hour}时${userInfo.minute}分
- 出生地区：${userInfo.area.province} ${userInfo.area.city} ${userInfo.area.district}
- 性别：${userInfo.gender === 'male' || userInfo.gender === '男' ? '男' : '女'}

## 基础建议
- 请关注事业发展和财富规划
- 建议结合自身实际情况制定计划
- 投资理财需谨慎，分散风险

请稍后重试以获取完整的AI分析报告。`
}

// 事业财富报告配置
const wealthReportConfig: ReportConfig = {
  reportType: 'wealth',
  reportName: '事业财富报告',
  botId: WEALTH_BOT_ID,
  tableName: 'wealth_reports',
  formatPrompt: formatWealthPrompt,
  createReport: createWealthReport,
  saveReport: saveWealthReport,
  includeAstrology: true,
  fallbackContent: generateFallbackContent
}

export async function POST(request: NextRequest): Promise<NextResponse<WealthReportResponse>> {
  try {
    const body: WealthReportRequest = await request.json()
    const universalRequest: UniversalReportRequest = {
      userInfo: body.userInfo,
      userId: body.userId,
      isUserProfileId: body.isUserProfileId
    }

    // 使用通用报告生成引擎
    return await generateReport(universalRequest, wealthReportConfig)

  } catch (error) {
    console.error('❌ 事业财富报告生成失败:', error)
    return NextResponse.json({
      success: false,
      error: '报告生成失败，请稍后重试',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
