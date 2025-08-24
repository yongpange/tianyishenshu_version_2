'use client'

import React, { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

class CompatibilityErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    // 更新 state 使下一次渲染能够显示降级后的 UI
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 记录错误信息
    console.error('兼容性错误边界捕获到错误:', error, errorInfo)
    
    // 检查是否为兼容性相关错误
    const isCompatibilityError = this.isCompatibilityError(error)
    
    if (isCompatibilityError) {
      console.warn('检测到兼容性问题，启用降级模式')
      // 可以在这里发送错误报告到监控系统
    }
  }

  private isCompatibilityError(error: Error): boolean {
    const compatibilityKeywords = [
      'optional chaining',
      'nullish coalescing',
      'CSS.supports',
      'grid',
      'var(',
      'Unexpected token',
      'SyntaxError'
    ]
    
    const errorMessage = error.message.toLowerCase()
    return compatibilityKeywords.some(keyword => 
      errorMessage.includes(keyword.toLowerCase())
    )
  }

  render() {
    if (this.state.hasError) {
      // 自定义降级UI
      return this.props.fallback || (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          padding: '20px',
          textAlign: 'center',
          backgroundColor: '#f9f9f9',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          margin: '20px'
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '16px'
          }}>
            📱
          </div>
          <h2 style={{
            fontSize: '20px',
            fontWeight: 'bold',
            marginBottom: '12px',
            color: '#333'
          }}>
            兼容性问题
          </h2>
          <p style={{
            fontSize: '16px',
            color: '#666',
            marginBottom: '20px',
            maxWidth: '400px',
            lineHeight: '1.5'
          }}>
            检测到您的浏览器版本较旧，部分功能可能无法正常显示。
            建议您更新到最新版本的Safari浏览器以获得最佳体验。
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: '#007AFF',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '12px 24px',
              fontSize: '16px',
              cursor: 'pointer',
              marginBottom: '12px'
            }}
          >
            重新加载页面
          </button>
          <button
            onClick={() => this.setState({ hasError: false })}
            style={{
              backgroundColor: 'transparent',
              color: '#007AFF',
              border: '1px solid #007AFF',
              borderRadius: '6px',
              padding: '12px 24px',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            继续使用
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default CompatibilityErrorBoundary
