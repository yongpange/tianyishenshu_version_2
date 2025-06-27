'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface WechatQRModalProps {
  isOpen: boolean
  onClose: () => void
}

function WechatQRModal({ isOpen, onClose }: WechatQRModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl p-8 max-w-sm mx-4" onClick={e => e.stopPropagation()}>
        <div className="text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-4">添加客服微信</h3>
          <div className="w-48 h-48 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
            <div className="text-gray-500">
              <div className="text-4xl mb-2">📱</div>
              <div className="text-sm">微信二维码</div>
              <div className="text-xs text-gray-400 mt-1">请扫码添加客服</div>
            </div>
          </div>
          <div className="text-sm text-gray-600 mb-4">
            微信号：tianyishenshu_kefu
          </div>
          <button
            onClick={onClose}
            className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [smsCode, setSmsCode] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [loading, setLoading] = useState(false)
  const [showWechatModal, setShowWechatModal] = useState(false)

  // 倒计时逻辑
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    }
    return () => clearTimeout(timer)
  }, [countdown])

  // 发送验证码
  const sendSmsCode = async () => {
    if (!phoneNumber || phoneNumber.length !== 11) {
      alert('请输入正确的手机号')
      return
    }

    if (countdown > 0) return

    try {
      setLoading(true)
      // 这里调用发送短信API
      const response = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber })
      })

      if (response.ok) {
        setCountdown(60)
        alert('验证码已发送')
      } else {
        throw new Error('发送失败')
      }
    } catch (error) {
      alert('发送验证码失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  // 验证兑换码格式
  const validateInviteCode = (code: string) => {
    return /^[A-Z0-9]{16}$/.test(code)
  }

  // 处理兑换码输入
  const handleInviteCodeChange = (value: string) => {
    const upperValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (upperValue.length <= 16) {
      setInviteCode(upperValue)
    }
  }

  // 提交登录
  const handleLogin = async () => {
    if (!phoneNumber || !smsCode) {
      alert('请填写完整信息')
      return
    }

    if (smsCode.length !== 6) {
      alert('请输入6位验证码')
      return
    }

    try {
      setLoading(true)
      // 验证短信验证码
      const response = await fetch('/api/sms/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone: phoneNumber, 
          code: smsCode,
          inviteCode: inviteCode 
        })
      })

      if (response.ok) {
        // 保存手机号到localStorage
        const loginData = {
          phoneNumber,
          timestamp: Date.now()
        }
        localStorage.setItem('loginData', JSON.stringify(loginData))

        alert('登录成功!')
        // 跳转到信息填写页面
        window.location.href = '/profile'
      } else {
        const error = await response.json()
        alert(error.message || '登录失败')
      }
    } catch (error) {
      alert('登录失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      {/* Header */}
      <div className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-40 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">天</span>
              </div>
              <span className="text-xl font-bold text-gray-900">天乙神数</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="w-full max-w-md pt-20">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center">
              <span className="text-white text-lg font-bold">天</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">天乙神数</h1>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">欢迎回来</h2>
          <p className="text-gray-600 text-sm">验证身份，开启命理探索之旅</p>
        </div>

        {/* Steps Indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-sm font-semibold">
                1
              </div>
              <span className="ml-2 text-sm font-medium text-gray-900">身份验证</span>
            </div>
            <div className="w-8 h-px bg-gray-300"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center text-sm font-semibold">
                2
              </div>
              <span className="ml-2 text-sm text-gray-500">完善信息</span>
            </div>
            <div className="w-8 h-px bg-gray-300"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center text-sm font-semibold">
                3
              </div>
              <span className="ml-2 text-sm text-gray-500">进入应用</span>
            </div>
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">手机验证码登录</h3>
          
          {/* Phone Number */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              手机号码
            </label>
            <div className="flex">
              <div className="flex items-center px-3 bg-gray-50 border border-r-0 border-gray-300 rounded-l-lg">
                <span className="text-gray-600 text-sm">+86</span>
              </div>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 11))}
                placeholder="请输入手机号"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* SMS Code */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              验证码
            </label>
            <div className="flex space-x-3">
              <input
                type="text"
                value={smsCode}
                onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="6位验证码"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={sendSmsCode}
                disabled={countdown > 0 || loading}
                className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-sm"
              >
                {countdown > 0 ? `${countdown}s` : '发送验证码'}
              </button>
            </div>
          </div>
        </div>

        {/* Invite Code Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">兑换码</h3>
          <p className="text-sm text-gray-600 mb-4">请输入兑换码</p>
          
          <div className="mb-4">
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => handleInviteCodeChange(e.target.value)}
              placeholder="2406AB8F9E2D4C7K"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-center tracking-wider"
              maxLength={16}
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-gray-500">
                {inviteCode.length}/16 {validateInviteCode(inviteCode) ? '✓' : ''}
              </span>
              <button
                onClick={() => setShowWechatModal(true)}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                没有兑换码？联系客服
              </button>
            </div>
          </div>

          {/* Remember Me */}
          <div className="flex items-center mb-6">
            <input
              type="checkbox"
              id="remember"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="remember" className="ml-2 text-sm text-gray-600">
              记住我（30天内免登录）
            </label>
          </div>

          {/* WeChat Service Button */}
          <button
            onClick={() => setShowWechatModal(true)}
            className="w-full py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors mb-4"
          >
            添加客服微信
          </button>

          {/* Login Button */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full py-3 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '登录中...' : '步入天境'}
          </button>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500">
          <p>登录即表示您同意我们的</p>
          <div className="space-x-4 mt-1">
            <Link href="/terms" className="text-blue-600 hover:text-blue-700">
              服务条款
            </Link>
            <span>和</span>
            <Link href="/privacy" className="text-blue-600 hover:text-blue-700">
              隐私政策
            </Link>
          </div>
        </div>
      </div>

      {/* WeChat QR Modal */}
      <WechatQRModal
        isOpen={showWechatModal}
        onClose={() => setShowWechatModal(false)}
      />
    </div>
  )
} 