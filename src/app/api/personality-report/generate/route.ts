import { NextRequest, NextResponse } from 'next/server'
import { UserInfo } from '@/lib/coze-client'
import { formatUserInfoDisplay } from '@/utils/client-utils'
import { 
  createPersonalityReport, 
  savePersonalityReport
} from '@/utils/personality-report'
import { 
  generateReport,
  UniversalReportRequest,
  UniversalReportResponse,
  ReportConfig
} from '@/lib/report-generator'

// 请求接口
interface PersonalityReportRequest {
  userInfo: UserInfo
  userId: string
  isUserProfileId?: boolean
}

// 响应接口
interface PersonalityReportResponse {
  success: boolean
  reportId?: string
  content?: string
  error?: string
  authMethod?: string
}

// 环境变量配置（可能需要特定的Bot ID）
const PERSONALITY_BOT_ID = process.env.PERSONALITY_BOT_ID || process.env.BOT_ID || ''

// 格式化用户信息为性格报告prompt
function formatPersonalityPrompt(userInfo: UserInfo, astrologyContext?: string): string {
  const { year, month, day, hour, minute, gender, area } = userInfo
  const location = `${area.province}${area.city}${area.district}`
  const birthInfo = `${year}年${month}月${day}日${hour}时${minute}分，${location}`

  let prompt = `请根据出生信息：${birthInfo}，性别：${gender === 'male' || gender === '男' ? '男' : '女'}，生成详细的性格分析报告。

`

  // 如果有八字排盘信息，加入上下文
  if (astrologyContext) {
    prompt += `**八字排盘分析数据：**

${astrologyContext}

**请基于以上八字排盘信息，结合传统命理学知识，生成深度的性格分析报告。**

`
  }

  prompt += `请自由发挥，生成丰富全面的性格分析内容，可以包含但不限于：八字排盘、五行分析、性格特征、情感表达、处事风格、人际关系、优势潜力、发展建议等方面。

请使用markdown格式，合理组织内容结构，让报告既专业又易读。`

  return prompt
}

// 生成fallback内容
function generateFallbackContent(userInfo: UserInfo): string {
  return `# 性格分析报告

基于您的出生信息：${formatUserInfoDisplay(userInfo)}

## 基础分析

由于AI服务暂时不可用，这里提供基础的性格分析框架。您可以稍后重新生成完整的报告。

## 出生信息
- 出生年份：${userInfo.year}年
- 出生月日：${userInfo.month}月${userInfo.day}日  
- 出生时辰：${userInfo.hour}时${userInfo.minute}分
- 出生地区：${userInfo.area.province} ${userInfo.area.city} ${userInfo.area.district}
- 性别：${userInfo.gender === 'male' || userInfo.gender === '男' ? '男' : '女'}

请稍后重试以获取完整的AI分析报告。`
}

// 性格报告配置
const personalityReportConfig: ReportConfig = {
  reportType: 'personality',
  reportName: '性格报告',
  botId: PERSONALITY_BOT_ID,
  tableName: 'personality_reports',
  formatPrompt: formatPersonalityPrompt,
  createReport: createPersonalityReport,
  saveReport: savePersonalityReport,
  includeAstrology: true,
  fallbackContent: generateFallbackContent
}

export async function POST(request: NextRequest): Promise<NextResponse<PersonalityReportResponse>> {
  try {
    const body: PersonalityReportRequest = await request.json()
    const universalRequest: UniversalReportRequest = {
      userInfo: body.userInfo,
      userId: body.userId,
      isUserProfileId: body.isUserProfileId
    }

    // 使用通用报告生成引擎
    return await generateReport(universalRequest, personalityReportConfig)

  } catch (error) {
    console.error('❌ 性格报告生成失败:', error)
    return NextResponse.json({
      success: false,
      error: '报告生成失败，请稍后重试',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
