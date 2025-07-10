'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface PhoneNotRegisteredModalProps {
  isOpen: boolean
  onClose: () => void
  phoneNumber: string
}

function PhoneNotRegisteredModal({ isOpen, onClose, phoneNumber }: PhoneNotRegisteredModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl p-8 max-w-sm mx-4" onClick={e => e.stopPropagation()}>
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="text-blue-600 text-2xl">📱</div>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">手机号未注册</h3>
          <p className="text-gray-600 text-sm mb-6">
            该手机号尚未注册天乙神算账户<br />
            请先完成注册，开启您的命理探索之旅
          </p>
          <div className="space-y-3">
            <Link
              href={`/register?phone=${phoneNumber}`}
              className="block w-full py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              立即注册
            </Link>
            <button
              onClick={onClose}
              className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              重新输入
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [smsCode, setSmsCode] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [loading, setLoading] = useState(false)
  const [showPhoneNotRegisteredModal, setShowPhoneNotRegisteredModal] = useState(false)
  const [codeSent, setCodeSent] = useState(false)

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
      // 先检查手机号是否已注册
      const checkResponse = await fetch('/api/auth/check-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber })
      })

      const checkResult = await checkResponse.json()

      if (!checkResponse.ok) {
        throw new Error(checkResult.message || '检查手机号失败')
      }

      // 如果手机号未注册，显示提示
      if (!checkResult.exists) {
        setShowPhoneNotRegisteredModal(true)
        return
      }

      // 手机号已注册，发送验证码
      const response = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber, type: 'login' })
      })

      if (response.ok) {
        setCountdown(60)
        setCodeSent(true)
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
      // 验证短信验证码并登录
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phoneNumber,
          code: smsCode
        })
      })

      if (response.ok) {
        const result = await response.json()
        // 保存登录信息到localStorage
        const loginData = {
          phoneNumber,
          timestamp: Date.now(),
          user: result.user
        }
        localStorage.setItem('loginData', JSON.stringify(loginData))

        alert('登录成功!')

        // 根据API返回的跳转指示决定跳转
        const redirectTo = result.user?.redirect_to || 'profile'

        console.log('🚀 登录成功，用户状态:', {
          hasProfile: result.user?.has_profile,
          hasReport: result.user?.has_report,
          redirectTo: redirectTo
        })

        if (redirectTo === 'dashboard') {
          console.log('✅ 用户数据完整，跳转到dashboard')
          window.location.href = '/dashboard'
        } else {
          console.log('⚠️ 用户数据不完整，跳转到profile页面')
          window.location.href = '/profile'
        }
      } else {
        const error = await response.json()
        if (error.error === 'PHONE_NOT_REGISTERED') {
          setShowPhoneNotRegisteredModal(true)
        } else {
          alert(error.message || '登录失败')
        }
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
              <span className="text-xl font-bold text-gray-900">天乙神算</span>
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">天乙神算</h1>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">欢迎回来</h2>
          <p className="text-gray-600 text-sm">登录您的天乙神算账户</p>
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
          {codeSent && (
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
                  {countdown > 0 ? `${countdown}s` : '重新发送'}
                </button>
              </div>
            </div>
          )}

          {/* Action Button */}
          {!codeSent ? (
            <button
              onClick={sendSmsCode}
              disabled={loading || !phoneNumber || phoneNumber.length !== 11}
              className="w-full py-3 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '验证中...' : '发送验证码'}
            </button>
          ) : (
            <button
              onClick={handleLogin}
              disabled={loading || !smsCode || smsCode.length !== 6}
              className="w-full py-3 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '登录中...' : '步入玄境'}
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 mb-4">
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

        {/* Register Link */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            还没有账号？
            <Link href="/register" className="text-blue-600 hover:text-blue-700 font-medium ml-1">
              立即注册
            </Link>
          </p>
        </div>
      </div>

      {/* Phone Not Registered Modal */}
      <PhoneNotRegisteredModal
        isOpen={showPhoneNotRegisteredModal}
        onClose={() => setShowPhoneNotRegisteredModal(false)}
        phoneNumber={phoneNumber}
      />
    </div>
  )
} 