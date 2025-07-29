import { UserInfo } from '@/lib/coze-client'
import { calculateUserDataHash, generateReportId, formatAreaDisplay } from '@/utils/client-utils'
import { getAstrologyContext } from '@/utils/personality-report'
import { supabaseAdmin } from '@/lib/supabase'
import { devLog } from '@/utils/dev-logger'

// 身体健康报告接口
export interface HealthReport {
  id: string
  user_id: string
  content: string
  generated_at: string
  user_data_hash: string
  coze_conversation_id?: string
}

// 创建身体健康报告对象
export function createHealthReport(
  userId: string,
  content: string,
  userInfo: UserInfo,
  cozeConversationId?: string
): HealthReport {
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

// 保存身体健康报告到数据库
export async function saveHealthReport(report: HealthReport, userProfileId: string): Promise<void> {
  try {
    devLog.log('💾 保存身体健康报告到数据库:', {
      reportId: report.id,
      userProfileId: userProfileId,
      contentLength: report.content.length
    })

    // 检查是否已存在报告
    const { data: existingReport, error: checkError } = await supabaseAdmin
      .from('health_reports')
      .select('id')
      .eq('user_id', userProfileId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      devLog.error('❌ 检查现有报告失败:', checkError)
      throw new Error('检查现有报告失败')
    }

    if (existingReport) {
      // 更新现有报告
      devLog.log('🔄 更新现有身体健康报告:', existingReport.id)
      const { error: updateError } = await supabaseAdmin
        .from('health_reports')
        .update({
          content: report.content,
          generated_at: report.generated_at,
          user_data_hash: report.user_data_hash,
          coze_conversation_id: report.coze_conversation_id
        })
        .eq('user_id', userProfileId)

      if (updateError) {
        devLog.error('❌ 更新身体健康报告失败:', updateError)
        throw new Error('更新报告失败')
      }

      devLog.log('✅ 身体健康报告更新成功')
    } else {
      // 创建新报告
      devLog.log('🆕 创建新的身体健康报告')
      const { error: insertError } = await supabaseAdmin
        .from('health_reports')
        .insert({
          id: report.id,
          user_id: userProfileId,
          content: report.content,
          generated_at: report.generated_at,
          user_data_hash: report.user_data_hash,
          coze_conversation_id: report.coze_conversation_id
        })

      if (insertError) {
        devLog.error('❌ 插入身体健康报告失败:', insertError)
        throw new Error('保存报告失败')
      }

      devLog.log('✅ 身体健康报告保存成功')
    }

  } catch (error) {
    devLog.error('❌ 保存身体健康报告过程出错:', error)
    throw error
  }
}

// 获取身体健康报告
export async function getHealthReport(userProfileId: string): Promise<HealthReport | null> {
  try {
    devLog.log('📖 获取身体健康报告:', userProfileId)

    const { data: report, error } = await supabaseAdmin
      .from('health_reports')
      .select('*')
      .eq('user_id', userProfileId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        devLog.log('📋 身体健康报告不存在:', userProfileId)
        return null
      }
      devLog.error('❌ 查询身体健康报告失败:', error)
      throw new Error('查询报告失败')
    }

    devLog.log('✅ 成功获取身体健康报告:', {
      reportId: report.id,
      contentLength: report.content?.length || 0,
      generatedAt: report.generated_at
    })

    return report
  } catch (error) {
    devLog.error('❌ 获取身体健康报告过程出错:', error)
    throw error
  }
}

// 删除身体健康报告
export async function deleteHealthReport(userProfileId: string): Promise<void> {
  try {
    devLog.log('🗑️ 删除身体健康报告:', userProfileId)

    const { error } = await supabaseAdmin
      .from('health_reports')
      .delete()
      .eq('user_id', userProfileId)

    if (error) {
      devLog.error('❌ 删除身体健康报告失败:', error)
      throw new Error('删除报告失败')
    }

    devLog.log('✅ 身体健康报告删除成功')
  } catch (error) {
    devLog.error('❌ 删除身体健康报告过程出错:', error)
    throw error
  }
}

// 检查身体健康报告是否存在
export async function checkHealthReportExists(userProfileId: string): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin
      .from('health_reports')
      .select('id')
      .eq('user_id', userProfileId)
      .single()

    if (error && error.code !== 'PGRST116') {
      devLog.error('❌ 检查身体健康报告存在性失败:', error)
      return false
    }

    return !!data
  } catch (error) {
    devLog.error('❌ 检查身体健康报告存在性过程出错:', error)
    return false
  }
}

// 获取用户的身体健康报告统计信息
export async function getHealthReportStats(userProfileId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('health_reports')
      .select('id, generated_at, user_data_hash')
      .eq('user_id', userProfileId)
      .single()

    if (error && error.code !== 'PGRST116') {
      devLog.error('❌ 获取身体健康报告统计失败:', error)
      return null
    }

    return data
  } catch (error) {
    devLog.error('❌ 获取身体健康报告统计过程出错:', error)
    return null
  }
}

// 重新导出八字排盘上下文函数，供身体健康报告使用
export { getAstrologyContext }
