import { NextRequest, NextResponse } from 'next/server'
import { UserInfo } from '@/lib/coze-client'
import { formatUserInfoDisplay } from '@/utils/client-utils'
import { 
  createHealthReport, 
  saveHealthReport
} from '@/utils/health-report'
import { 
  generateReport,
  UniversalReportRequest,
  UniversalReportResponse,
  ReportConfig
} from '@/lib/report-generator'

// 请求接口
interface HealthReportRequest {
  userInfo: UserInfo
  userId: string
  isUserProfileId?: boolean
}

// 响应接口
interface HealthReportResponse {
  success: boolean
  reportId?: string
  content?: string
  error?: string
  authMethod?: string
}

// 环境变量配置
const HEALTH_BOT_ID = process.env.HEALTH_BOT_ID || process.env.BOT_ID || ''

// 格式化用户信息为身体健康报告prompt
function formatHealthPrompt(userInfo: UserInfo, astrologyContext?: string): string {
  const { year, month, day, hour, minute, gender, area } = userInfo
  const location = `${area.province}${area.city}${area.district}`
  const birthInfo = `${year}年${month}月${day}日${hour}时${minute}分，${location}`

  let prompt = `请根据出生信息：${birthInfo}，性别：${gender === 'male' || gender === '男' ? '男' : '女'}，生成详细的身体健康分析报告。

`

  // 如果有八字排盘信息，加入上下文
  if (astrologyContext) {
    prompt += `**八字排盘分析数据：**

${astrologyContext}

**请基于以上八字排盘信息，结合传统命理学知识，生成深度的身体健康分析报告。**

`
  }

  prompt += `请自由发挥，生成丰富全面的身体健康分析内容，可以包含但不限于：体质特点、健康趋势、易患疾病、养生建议、运动指导、饮食调理、生活习惯、预防保健、调理方法等方面。

请使用markdown格式，合理组织内容结构，让报告既专业又实用。`

  return prompt
}

// 生成fallback内容
function generateFallbackContent(userInfo: UserInfo): string {
  return `# 身体健康分析报告

基于您的出生信息：${formatUserInfoDisplay(userInfo)}

## 基础分析

由于AI服务暂时不可用，这里提供基础的身体健康分析框架。您可以稍后重新生成完整的报告。

## 出生信息
- 出生年份：${userInfo.year}年
- 出生月日：${userInfo.month}月${userInfo.day}日  
- 出生时辰：${userInfo.hour}时${userInfo.minute}分
- 出生地区：${userInfo.area.province} ${userInfo.area.city} ${userInfo.area.district}
- 性别：${userInfo.gender === 'male' || userInfo.gender === '男' ? '男' : '女'}

## 基础建议
- 保持规律的作息时间
- 均衡饮食，适量运动
- 定期体检，关注身体变化
- 保持良好的心理状态

请稍后重试以获取完整的AI分析报告。`
}

// 身体健康报告配置
const healthReportConfig: ReportConfig = {
  reportType: 'health',
  reportName: '身体健康报告',
  botId: HEALTH_BOT_ID,
  tableName: 'health_reports',
  formatPrompt: formatHealthPrompt,
  createReport: createHealthReport,
  saveReport: saveHealthReport,
  includeAstrology: true,
  fallbackContent: generateFallbackContent
}

export async function POST(request: NextRequest): Promise<NextResponse<HealthReportResponse>> {
  try {
    const body: HealthReportRequest = await request.json()
    const universalRequest: UniversalReportRequest = {
      userInfo: body.userInfo,
      userId: body.userId,
      isUserProfileId: body.isUserProfileId
    }

    // 使用通用报告生成引擎
    return await generateReport(universalRequest, healthReportConfig)

  } catch (error) {
    console.error('❌ 身体健康报告生成失败:', error)
    return NextResponse.json({
      success: false,
      error: '报告生成失败，请稍后重试',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
