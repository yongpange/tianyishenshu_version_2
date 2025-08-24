'use client'

import { Modal } from 'antd'
import React from 'react'

// 全局会话管理器类型定义
interface GlobalSessionManager {
  getActiveSessions(): string[]
}

// 声明全局变量
declare global {
  var globalSessionManager: GlobalSessionManager | undefined
}

/**
 * 检查是否有活跃的流式输出会话
 * @param moduleId 模块ID，用于检查特定模块的流式输出状态
 * @param additionalChecks 额外的检查函数，用于检查组件内部状态
 * @returns 是否有活跃的流式输出
 */
export function hasActiveStreamingSession(
  moduleId?: string,
  additionalChecks?: () => boolean
): boolean {
  try {
    // 检查localStorage中的流式输出标识
    const streamingKeys = [
      'astrology_streaming',
      'personality_streaming', 
      'wealth_streaming',
      'marriage_streaming',
      'health_streaming',
      'consultation_streaming'
    ]

    // 如果指定了moduleId，只检查对应的流式输出标识
    if (moduleId) {
      const streamingKey = `${moduleId}_streaming`
      const isStreaming = localStorage.getItem(streamingKey) === 'true'
      if (isStreaming) return true
    } else {
      // 检查所有流式输出标识
      for (const key of streamingKeys) {
        if (localStorage.getItem(key) === 'true') {
          return true
        }
      }
    }

    // 检查全局会话管理器
    if (typeof window !== 'undefined' && window.globalSessionManager) {
      const activeSessions = window.globalSessionManager.getActiveSessions()
      if (activeSessions.length > 0) {
        return true
      }
    }

    // 执行额外的检查
    if (additionalChecks && additionalChecks()) {
      return true
    }

    return false
  } catch (error) {
    console.warn('检查流式输出状态时出错:', error)
    return false
  }
}

/**
 * 清理流式输出标识
 * @param moduleId 可选的模块ID，如果提供则只清理该模块的标识
 */
export function clearStreamingFlags(moduleId?: string): void {
  try {
    if (typeof window === 'undefined') return

    if (moduleId) {
      // 只清理指定模块的标识
      localStorage.removeItem(`${moduleId}_streaming`)
    } else {
      // 清理所有流式输出标识
      const streamingKeys = [
        'astrology_streaming',
        'personality_streaming',
        'wealth_streaming', 
        'marriage_streaming',
        'health_streaming',
        'consultation_streaming'
      ]
      
      streamingKeys.forEach(key => {
        localStorage.removeItem(key)
      })
      localStorage.removeItem('last_streaming_time')
    }
  } catch (error) {
    console.warn('清理流式输出标识时出错:', error)
  }
}

/**
 * 显示返回确认对话框
 * @param onConfirm 用户确认后的回调函数
 * @param onCancel 用户取消后的回调函数（可选）
 */
export function showBackConfirmModal(
  onConfirm: () => void,
  onCancel?: () => void
): void {
  Modal.confirm({
    title: '返回「命书」',
    content: React.createElement('p', {
      className: 'text-gray-600 text-sm'
    }, '💡 对话正在生成中，「返回命书」则打断对话流程。后续可在「对话历史」中查看，但会延迟5分钟显示。'),
    okText: '返回「命书」',
    cancelText: '继续等待',
    okType: 'default',
    cancelButtonProps: { type: 'primary' },
    onOk: onConfirm,
    onCancel: onCancel
  })
}

/**
 * 处理返回命书的完整逻辑
 * @param options 配置选项
 */
export interface HandleBackToDashboardOptions {
  /** 模块ID，用于检查特定模块的流式输出 */
  moduleId?: string
  /** 额外的流式输出检查函数 */
  additionalChecks?: () => boolean
  /** 确认后的跳转方式，默认为 'redirect' */
  navigationType?: 'redirect' | 'callback'
  /** 当navigationType为'callback'时的回调函数 */
  onNavigate?: () => void
  /** 取消时的回调函数 */
  onCancel?: () => void
}

export function handleBackToDashboard(options: HandleBackToDashboardOptions = {}): void {
  const {
    moduleId,
    additionalChecks,
    navigationType = 'redirect',
    onNavigate,
    onCancel
  } = options

  // 检查是否有活跃的流式输出
  const hasActiveStream = hasActiveStreamingSession(moduleId, additionalChecks)

  if (hasActiveStream) {
    // 有活跃流式输出，显示确认对话框
    showBackConfirmModal(
      () => {
        // 用户确认返回，清理流式输出标识
        clearStreamingFlags(moduleId)
        
        // 执行跳转
        if (navigationType === 'callback' && onNavigate) {
          onNavigate()
        } else {
          window.location.href = '/dashboard'
        }
      },
      onCancel
    )
  } else {
    // 没有活跃流式输出，直接跳转
    if (navigationType === 'callback' && onNavigate) {
      onNavigate()
    } else {
      window.location.href = '/dashboard'
    }
  }
}
