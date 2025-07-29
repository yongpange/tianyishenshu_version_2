import { NextRequest, NextResponse } from 'next/server'
import { UserInfo } from '@/lib/coze-client'
import { formatUserInfoDisplay } from '@/utils/client-utils'
import { 
  createMarriageReport, 
  saveMarriageReport
} from '@/utils/marriage-report'
import { 
  generateReport,
  UniversalReportRequest,
  UniversalReportResponse,
  ReportConfig
} from '@/lib/report-generator'

// 请求接口
interface MarriageReportRequest {
  userInfo: UserInfo
  userId: string
  isUserProfileId?: boolean
}

// 响应接口
interface MarriageReportResponse {
  success: boolean
  reportId?: string
  content?: string
  error?: string
  authMethod?: string
}

// 环境变量配置
const MARRIAGE_BOT_ID = process.env.MARRIAGE_BOT_ID || process.env.BOT_ID || ''

// 验证Bot ID配置
if (!MARRIAGE_BOT_ID) {
  console.error('❌ 婚恋报告Bot ID配置缺失: MARRIAGE_BOT_ID 和 BOT_ID 都未设置')
}

// 格式化用户信息为婚恋感情报告prompt
function formatMarriagePrompt(userInfo: UserInfo, astrologyContext?: string): string {
  const { year, month, day, hour, minute, gender, area } = userInfo
  const location = `${area.province}${area.city}${area.district}`
  const birthInfo = `${year}年${month}月${day}日${hour}时${minute}分，${location}`

  let prompt = `请根据出生信息：${birthInfo}，性别：${gender === 'male' || gender === '男' ? '男' : '女'}，生成详细的婚恋感情分析报告。

`

  // 如果有八字排盘信息，加入上下文
  if (astrologyContext) {
    prompt += `**八字排盘分析数据：**

${astrologyContext}

**请基于以上八字排盘信息，结合传统命理学知识，生成深度的婚恋感情分析报告。**

`
  }

  prompt += `请自由发挥，生成丰富全面的婚恋感情分析内容，可以包含但不限于：感情模式、伴侣特质、恋爱态度、婚姻运势、情感发展、关系维护、最佳匹配时期、注意事项等方面。

请使用markdown格式，合理组织内容结构，让报告既专业又贴心。`

  return prompt
}

// 生成fallback内容
function generateFallbackContent(userInfo: UserInfo): string {
  return `# 婚恋感情分析报告

基于您的出生信息：${formatUserInfoDisplay(userInfo)}

## 基础分析

由于AI服务暂时不可用，这里提供基础的婚恋感情分析框架。您可以稍后重新生成完整的报告。

## 出生信息
- 出生年份：${userInfo.year}年
- 出生月日：${userInfo.month}月${userInfo.day}日  
- 出生时辰：${userInfo.hour}时${userInfo.minute}分
- 出生地区：${userInfo.area.province} ${userInfo.area.city} ${userInfo.area.district}
- 性别：${userInfo.gender === 'male' || userInfo.gender === '男' ? '男' : '女'}

## 基础建议
- 感情需要真诚和理解
- 建议多沟通，增进了解
- 保持开放和包容的心态

请稍后重试以获取完整的AI分析报告。`
}

// 婚恋感情报告配置
const marriageReportConfig: ReportConfig = {
  reportType: 'marriage',
  reportName: '婚恋感情报告',
  botId: MARRIAGE_BOT_ID,
  tableName: 'marriage_reports',
  formatPrompt: formatMarriagePrompt,
  createReport: createMarriageReport,
  saveReport: saveMarriageReport,
  includeAstrology: true,
  fallbackContent: generateFallbackContent
}

export async function POST(request: NextRequest): Promise<NextResponse<MarriageReportResponse>> {
  try {
    // 首先检查Bot ID配置
    if (!MARRIAGE_BOT_ID) {
      console.error('❌ 婚恋报告配置错误:', {
        MARRIAGE_BOT_ID: process.env.MARRIAGE_BOT_ID || 'undefined',
        BOT_ID: process.env.BOT_ID || 'undefined'
      })
      return NextResponse.json({
        success: false,
        error: 'Bot ID配置缺失，请联系管理员配置 MARRIAGE_BOT_ID 或 BOT_ID 环境变量',
        details: `当前配置: MARRIAGE_BOT_ID=${process.env.MARRIAGE_BOT_ID || 'undefined'}, BOT_ID=${process.env.BOT_ID || 'undefined'}`
      }, { status: 500 })
    }

    const body: MarriageReportRequest = await request.json()
    const universalRequest: UniversalReportRequest = {
      userInfo: body.userInfo,
      userId: body.userId,
      isUserProfileId: body.isUserProfileId
    }

    console.log('✅ 婚恋报告Bot ID配置正常:', MARRIAGE_BOT_ID)

    // 使用通用报告生成引擎
    return await generateReport(universalRequest, marriageReportConfig)

  } catch (error) {
    console.error('❌ 婚恋感情报告生成失败:', error)
    return NextResponse.json({
      success: false,
      error: '报告生成失败，请稍后重试',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
