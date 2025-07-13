import { createClient } from '@supabase/supabase-js'
import type { Database } from './supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// 使用服务端key创建客户端，避免RLS限制
const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)

/**
 * 聊天次数管理类
 */
export class ChatCreditsManager {
  
  /**
   * 获取用户剩余聊天次数
   * @param userId 用户ID
   * @returns 剩余聊天次数，如果用户不存在返回null
   */
  static async getRemainingCredits(userId: string): Promise<number | null> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('remaining_chat_credits')
        .eq('user_id', userId)
        .single()

      if (error) {
        console.error('获取用户聊天次数失败:', error)
        return null
      }

      return data.remaining_chat_credits
    } catch (error) {
      console.error('获取聊天次数时出错:', error)
      return null
    }
  }

  /**
   * 检查用户是否有足够的聊天次数
   * @param userId 用户ID
   * @param requiredCredits 需要的次数，默认为1
   * @returns 是否有足够次数
   */
  static async hasEnoughCredits(userId: string, requiredCredits: number = 1): Promise<boolean> {
    const remaining = await this.getRemainingCredits(userId)
    return remaining !== null && remaining >= requiredCredits
  }

  /**
   * 消耗聊天次数
   * @param userId 用户ID
   * @param creditsToConsume 要消耗的次数，默认为1
   * @returns 操作是否成功
   */
  static async consumeCredits(userId: string, creditsToConsume: number = 1): Promise<boolean> {
    try {
      // 先检查剩余次数
      const remaining = await this.getRemainingCredits(userId)
      if (remaining === null || remaining < creditsToConsume) {
        console.error('聊天次数不足')
        return false
      }

      // 更新剩余次数
      const { error } = await supabase
        .from('user_profiles')
        .update({
          remaining_chat_credits: remaining - creditsToConsume
        })
        .eq('user_id', userId)

      if (error) {
        console.error('更新聊天次数失败:', error)
        return false
      }

      console.log(`用户 ${userId} 消耗了 ${creditsToConsume} 次聊天次数，剩余 ${remaining - creditsToConsume} 次`)
      return true
    } catch (error) {
      console.error('消耗聊天次数时出错:', error)
      return false
    }
  }

  /**
   * 增加用户聊天次数（用于充值或赠送）
   * @param userId 用户ID
   * @param creditsToAdd 要增加的次数
   * @returns 操作是否成功
   */
  static async addCredits(userId: string, creditsToAdd: number): Promise<boolean> {
    try {
      const currentCredits = await this.getRemainingCredits(userId)
      if (currentCredits === null) {
        console.error('用户不存在或获取聊天次数失败')
        return false
      }

      const { error } = await supabase
        .from('user_profiles')
        .update({
          remaining_chat_credits: currentCredits + creditsToAdd
        })
        .eq('user_id', userId)

      if (error) {
        console.error('增加聊天次数失败:', error)
        return false
      }

      console.log(`用户 ${userId} 增加了 ${creditsToAdd} 次聊天次数，现有 ${currentCredits + creditsToAdd} 次`)
      return true
    } catch (error) {
      console.error('增加聊天次数时出错:', error)
      return false
    }
  }

  /**
   * 重置用户聊天次数到指定值
   * @param userId 用户ID
   * @param newCredits 新的聊天次数
   * @returns 操作是否成功
   */
  static async resetCredits(userId: string, newCredits: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          remaining_chat_credits: newCredits
        })
        .eq('user_id', userId)

      if (error) {
        console.error('重置聊天次数失败:', error)
        return false
      }

      console.log(`用户 ${userId} 聊天次数已重置为 ${newCredits} 次`)
      return true
    } catch (error) {
      console.error('重置聊天次数时出错:', error)
      return false
    }
  }

  /**
   * 获取用户聊天次数使用情况统计
   * @param userId 用户ID
   * @returns 聊天次数信息
   */
  static async getCreditsSummary(userId: string): Promise<{
    remaining: number
    isLowCredits: boolean
    isOutOfCredits: boolean
  } | null> {
    const remaining = await this.getRemainingCredits(userId)
    
    if (remaining === null) {
      return null
    }

    return {
      remaining,
      isLowCredits: remaining <= 3 && remaining > 0,
      isOutOfCredits: remaining === 0
    }
  }
}

/**
 * 聊天次数相关常量
 */
export const CHAT_CREDITS_CONFIG = {
  DEFAULT_CREDITS: 10,        // 新用户默认次数
  LOW_CREDITS_THRESHOLD: 3,   // 低次数警告阈值
  DAILY_FREE_CREDITS: 3,      // 每日免费次数（如果需要）
  VIP_CREDITS: 100           // VIP用户次数
} as const

export default ChatCreditsManager 