import { UserInfo } from '@/lib/coze-client'
import { calculateUserDataHash, generateReportId, formatAreaDisplay } from '@/utils/client-utils'
import { getAstrologyContext } from '@/utils/personality-report'
import { supabaseAdmin } from '@/lib/supabase'

// 婚恋感情报告接口
export interface MarriageReport {
  id: string
  user_id: string
  content: string
  generated_at: string
  user_data_hash: string
  coze_conversation_id?: string
}

// 创建婚恋感情报告对象
export function createMarriageReport(
  userId: string,
  content: string,
  userInfo: UserInfo,
  cozeConversationId?: string
): MarriageReport {
  const userDataHash = calculateUserDataHash(userInfo)
  
  return {
    id: generateReportId(),
    user_id: userId,
    content: content,
    generated_at: new Date().toISOString(),
    user_data_hash: userDataHash,
    coze_conversation_id: cozeConversationId
  }
}

// 保存婚恋感情报告到数据库
export async function saveMarriageReport(report: MarriageReport, userProfileId: string): Promise<void> {
  try {
    console.log('💾 保存婚恋感情报告到数据库:', {
      reportId: report.id,
      userProfileId: userProfileId,
      contentLength: report.content.length
    })

    // 检查是否已存在报告
    const { data: existingReport, error: checkError } = await supabaseAdmin
      .from('marriage_reports')
      .select('id')
      .eq('user_id', userProfileId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 表示没有找到记录，这是正常的
      console.error('❌ 检查现有报告失败:', checkError)
      throw new Error('检查现有报告失败')
    }

    if (existingReport) {
      // 更新现有报告
      console.log('🔄 更新现有婚恋感情报告:', existingReport.id)
      const { error: updateError } = await supabaseAdmin
        .from('marriage_reports')
        .update({
          content: report.content,
          generated_at: report.generated_at,
          user_data_hash: report.user_data_hash,
          coze_conversation_id: report.coze_conversation_id
        })
        .eq('user_id', userProfileId)

      if (updateError) {
        console.error('❌ 更新婚恋感情报告失败:', updateError)
        throw new Error('更新报告失败')
      }

      console.log('✅ 婚恋感情报告更新成功')
    } else {
      // 创建新报告
      console.log('🆕 创建新的婚恋感情报告')
      const { error: insertError } = await supabaseAdmin
        .from('marriage_reports')
        .insert({
          id: report.id,
          user_id: userProfileId, // 使用user_profiles.id
          content: report.content,
          generated_at: report.generated_at,
          user_data_hash: report.user_data_hash,
          coze_conversation_id: report.coze_conversation_id
        })

      if (insertError) {
        console.error('❌ 插入婚恋感情报告失败:', insertError)
        throw new Error('保存报告失败')
      }

      console.log('✅ 婚恋感情报告保存成功')
    }

  } catch (error) {
    console.error('❌ 保存婚恋感情报告过程出错:', error)
    throw error
  }
}

// 获取婚恋感情报告
export async function getMarriageReport(userProfileId: string): Promise<MarriageReport | null> {
  try {
    console.log('📖 获取婚恋感情报告:', userProfileId)

    const { data: report, error } = await supabaseAdmin
      .from('marriage_reports')
      .select('*')
      .eq('user_id', userProfileId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('📋 婚恋感情报告不存在:', userProfileId)
        return null
      }
      console.error('❌ 查询婚恋感情报告失败:', error)
      throw new Error('查询报告失败')
    }

    console.log('✅ 成功获取婚恋感情报告:', {
      reportId: report.id,
      contentLength: report.content?.length || 0,
      generatedAt: report.generated_at
    })

    return report
  } catch (error) {
    console.error('❌ 获取婚恋感情报告过程出错:', error)
    throw error
  }
}

// 删除婚恋感情报告
export async function deleteMarriageReport(userProfileId: string): Promise<void> {
  try {
    console.log('🗑️ 删除婚恋感情报告:', userProfileId)

    const { error } = await supabaseAdmin
      .from('marriage_reports')
      .delete()
      .eq('user_id', userProfileId)

    if (error) {
      console.error('❌ 删除婚恋感情报告失败:', error)
      throw new Error('删除报告失败')
    }

    console.log('✅ 婚恋感情报告删除成功')
  } catch (error) {
    console.error('❌ 删除婚恋感情报告过程出错:', error)
    throw error
  }
}

// 检查婚恋感情报告是否存在
export async function checkMarriageReportExists(userProfileId: string): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin
      .from('marriage_reports')
      .select('id')
      .eq('user_id', userProfileId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('❌ 检查婚恋感情报告存在性失败:', error)
      return false
    }

    return !!data
  } catch (error) {
    console.error('❌ 检查婚恋感情报告存在性过程出错:', error)
    return false
  }
}

// 获取用户的婚恋感情报告统计信息
export async function getMarriageReportStats(userProfileId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('marriage_reports')
      .select('id, generated_at, user_data_hash')
      .eq('user_id', userProfileId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('❌ 获取婚恋感情报告统计失败:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('❌ 获取婚恋感情报告统计过程出错:', error)
    return null
  }
}

// 重新导出八字排盘上下文函数，供婚恋感情报告使用
export { getAstrologyContext }
