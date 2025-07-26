import { message, Modal } from 'antd'
import { Input, Button, Space } from 'antd'
import React from 'react'

const { TextArea } = Input

interface CopyOptions {
  title?: string
  successMessage?: string
  fallbackTitle?: string
  fallbackMessage?: string
}

/**
 * 通用复制函数，适用于Docker生产环境
 * 提供多重备用方案确保在各种环境下都能工作
 */
export const copyToClipboard = async (
  text: string, 
  options: CopyOptions = {}
): Promise<boolean> => {
  const {
    successMessage = '内容已复制到剪贴板',
    fallbackTitle = '手动复制',
    fallbackMessage = '自动复制失败，请手动复制以下内容：'
  } = options

  try {
    // 方案1：尝试现代 Clipboard API（仅在安全上下文中可用）
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text)
        message.success(successMessage)
        return true
      } catch (clipboardError) {
        console.warn('Clipboard API 失败，尝试备用方案:', clipboardError)
      }
    }

    // 方案2：使用传统的 execCommand 方法
    try {
      const textArea = document.createElement('textarea')
      textArea.value = text
      
      // 设置样式确保元素不可见但可交互
      textArea.style.position = 'fixed'
      textArea.style.left = '-9999px'
      textArea.style.top = '-9999px'
      textArea.style.width = '0'
      textArea.style.height = '0'
      textArea.style.padding = '0'
      textArea.style.border = 'none'
      textArea.style.outline = 'none'
      textArea.style.boxShadow = 'none'
      textArea.style.background = 'transparent'
      
      document.body.appendChild(textArea)
      
      // 强制焦点和选择
      textArea.focus()
      textArea.setSelectionRange(0, text.length)
      textArea.select()
      
      // 尝试复制
      const successful = document.execCommand('copy')
      document.body.removeChild(textArea)
      
      if (successful) {
        message.success(successMessage)
        return true
      }
    } catch (execCommandError) {
      console.warn('execCommand 失败，使用最终备用方案:', execCommandError)
    }

    // 方案3：创建临时可选择的元素（兼容更多浏览器）
    try {
      const container = document.createElement('div')
      container.style.position = 'fixed'
      container.style.left = '-9999px'
      container.style.top = '-9999px'
      container.style.opacity = '0'
      
      const pre = document.createElement('pre')
      pre.style.userSelect = 'text'
      pre.style.webkitUserSelect = 'text'
      pre.textContent = text
      
      container.appendChild(pre)
      document.body.appendChild(container)
      
      // 选择文本
      const range = document.createRange()
      range.selectNode(pre)
      const selection = window.getSelection()
      if (selection) {
        selection.removeAllRanges()
        selection.addRange(range)
        
        const successful = document.execCommand('copy')
        selection.removeAllRanges()
        
        if (successful) {
          document.body.removeChild(container)
          message.success(successMessage)
          return true
        }
      }
      
      document.body.removeChild(container)
    } catch (rangeError) {
      console.warn('Range 选择失败:', rangeError)
    }

    // 方案4：最终备用方案 - 显示Modal让用户手动复制
    showCopyModal(text, fallbackTitle, fallbackMessage)
    return false
    
  } catch (error) {
    console.error('所有复制方案都失败了:', error)
    showCopyModal(text, fallbackTitle, fallbackMessage)
    return false
  }
}

/**
 * 显示手动复制的Modal
 */
const showCopyModal = (text: string, title: string, messageText: string) => {
  let modalInstance: any = null
  
  const handleCopy = async () => {
    // 在Modal中再次尝试复制
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text)
        message.success('复制成功！')
        if (modalInstance) {
          modalInstance.destroy()
        }
        return
      }
    } catch (e) {
      console.warn('Modal中复制失败:', e)
    }
    
    // 提示用户手动选择
    message.info('请手动选择文本后按 Ctrl+C 复制')
  }

  modalInstance = Modal.info({
    title,
    width: 600,
    content: React.createElement('div', {}, [
      React.createElement('p', { key: 'message' }, messageText),
      React.createElement(TextArea, {
        key: 'textarea',
        value: text,
        readOnly: true,
        autoSize: { minRows: 8, maxRows: 20 },
        style: { 
          marginTop: 12, 
          fontFamily: 'Monaco, Consolas, "Courier New", monospace',
          fontSize: '12px'
        },
        onFocus: (e: any) => {
          e.target.select()
          // 延迟一下确保选择完成
          setTimeout(() => e.target.setSelectionRange(0, e.target.value.length), 10)
        },
        onClick: (e: any) => {
          const target = e.target as HTMLTextAreaElement
          target.select()
          target.setSelectionRange(0, target.value.length)
        }
      }),
      React.createElement('div', { 
        key: 'buttons',
        style: { marginTop: 12, textAlign: 'center' }
      }, React.createElement(Space, {}, [
        React.createElement(Button, {
          key: 'copy',
          type: 'primary',
          onClick: handleCopy
        }, '尝试自动复制'),
        React.createElement(Button, {
          key: 'close',
          onClick: () => {
            if (modalInstance) {
              modalInstance.destroy()
            }
          }
        }, '关闭')
      ])),
      React.createElement('p', {
        key: 'tip',
        style: { marginTop: 8, fontSize: '12px', color: '#999' }
      }, '提示：点击文本框会自动选中所有内容，然后按 Ctrl+C 复制')
    ]),
    okText: '关闭',
    onOk: () => {
      if (modalInstance) {
        modalInstance.destroy()
      }
    }
  })
}

/**
 * 专门用于复制代码/兑换码的函数
 */
export const copyCode = async (code: string, codeType: string = '代码') => {
  return copyToClipboard(code, {
    successMessage: `${codeType}已复制到剪贴板`,
    fallbackTitle: `复制${codeType}`,
    fallbackMessage: `自动复制失败，请手动复制以下${codeType}：`
  })
}

/**
 * 专门用于复制报告内容的函数
 */
export const copyReport = async (reportContent: string, reportType: string = '报告') => {
  return copyToClipboard(reportContent, {
    successMessage: `${reportType}内容已复制到剪贴板`,
    fallbackTitle: `复制${reportType}内容`,
    fallbackMessage: `自动复制失败，请手动复制以下${reportType}内容：`
  })
} 