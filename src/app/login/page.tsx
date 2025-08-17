'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import TianIcon from '@/components/icons/TianIcon'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  phoneNumber?: string
  type: 'phone-not-registered' | 'incomplete-input' | 'account-incomplete' | 'error'
  message?: string
}

function Modal({ isOpen, onClose, phoneNumber, type, message }: ModalProps) {
  if (!isOpen) return null

  const getModalContent = () => {
    switch (type) {
      case 'phone-not-registered':
        return {
          icon: '📱',
          title: '手机号未注册',
          content: '该手机号尚未注册天乙神算账户\n请先完成注册，开启您的命理探索之旅',
          buttons: (
            <>
              <Link
                href={`/register?phone=${phoneNumber}`}
                className="block w-full py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-center"
              >
                立即注册
              </Link>
              <button
                onClick={onClose}
                className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                重新输入
              </button>
            </>
          )
        }
      case 'incomplete-input':
        return {
          icon: '⚠️',
          title: '请完善信息',
          content: '请填写完整的手机号和验证码信息',
          buttons: (
            <button
              onClick={onClose}
              className="w-full py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              确定
            </button>
          )
        }
      case 'account-incomplete':
        return {
          icon: '🔐',
          title: '账户未完成注册',
          content: '该账户尚未完成注册流程\n请使用注册页面完成账户创建',
          buttons: (
            <>
              <Link
                href={`/register?phone=${phoneNumber}`}
                className="block w-full py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-center"
              >
                完成注册
              </Link>
              <button
                onClick={onClose}
                className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                重新输入
              </button>
            </>
          )
        }
      case 'error':
        return {
          icon: '❌',
          title: '登录失败',
          content: message || '登录过程中出现错误，请重试',
          buttons: (
            <button
              onClick={onClose}
              className="w-full py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              确定
            </button>
          )
        }
    }
  }

  const content = getModalContent()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl p-8 max-w-sm mx-4" onClick={e => e.stopPropagation()}>
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="text-blue-600 text-2xl">{content.icon}</div>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">{content.title}</h3>
          <p className="text-gray-600 text-sm mb-6 whitespace-pre-line">
            {content.content}
          </p>
          <div className="space-y-3">
            {content.buttons}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  const searchParams = useSearchParams()
  const [phoneNumber, setPhoneNumber] = useState('')
  const [smsCode, setSmsCode] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [loading, setLoading] = useState(false)
  const [modal, setModal] = useState<{
    isOpen: boolean
    type: 'phone-not-registered' | 'incomplete-input' | 'account-incomplete' | 'error'
    message?: string
  }>({
    isOpen: false,
    type: 'phone-not-registered'
  })

  // 处理URL参数和自动发送验证码
  useEffect(() => {
    const phone = searchParams.get('phone')
    const autoSend = searchParams.get('autoSend')
    
    if (phone) {
      setPhoneNumber(phone)
      
      // 如果需要自动发送验证码
      if (autoSend === 'true') {
        // 延迟一下确保页面完全加载
        setTimeout(() => {
          sendSmsCodeAuto(phone)
        }, 500)
      }
    }
  }, [searchParams])

  // 倒计时逻辑
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    }
    return () => clearTimeout(timer)
  }, [countdown])

  // 自动发送验证码（用于URL参数触发）
  const sendSmsCodeAuto = async (phone: string) => {
    if (!phone || phone.length !== 11) {
      return
    }

    if (countdown > 0) return

    try {
      setLoading(true)
      // 先检查手机号是否已注册
      const checkResponse = await fetch('/api/auth/check-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      })

      const checkResult = await checkResponse.json()

      if (!checkResponse.ok) {
        return
      }

      // 如果手机号未注册，不自动发送
      if (!checkResult.exists) {
        return
      }

      // 手机号已注册，发送验证码
      const response = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, type: 'login' })
      })

      if (response.ok) {
        setCountdown(60)
      }
    } catch (error) {
      // 自动发送失败时不显示错误，保持静默
    } finally {
      setLoading(false)
    }
  }

  // 发送验证码
  const sendSmsCode = async () => {
    if (!phoneNumber || phoneNumber.length !== 11) {
      setModal({
        isOpen: true,
        type: 'incomplete-input',
        message: '请输入正确的手机号'
      })
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
        setModal({
          isOpen: true,
          type: 'error',
          message: checkResult.message || '检查手机号失败'
        })
        return
      }

      // 如果手机号未注册，显示提示弹窗
      if (!checkResult.exists) {
        setModal({
          isOpen: true,
          type: 'phone-not-registered'
        })
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
      } else {
        const errorData = await response.json()
        if (errorData.message === '该账户尚未完成注册，请使用注册流程') {
          setModal({
            isOpen: true,
            type: 'account-incomplete'
          })
        } else {
          setModal({
            isOpen: true,
            type: 'error',
            message: errorData.message || '发送验证码失败'
          })
        }
      }
    } catch (error) {
      setModal({
        isOpen: true,
        type: 'error',
        message: '发送验证码失败，请重试'
      })
    } finally {
      setLoading(false)
    }
  }

  // 提交登录
  const handleLogin = async () => {
    if (!phoneNumber || !smsCode) {
      setModal({
        isOpen: true,
        type: 'incomplete-input'
      })
      return
    }

    if (smsCode.length !== 6) {
      setModal({
        isOpen: true,
        type: 'incomplete-input',
        message: '请输入6位验证码'
      })
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

        // 根据返回的redirect_to决定跳转
        if (result.user.redirect_to === 'profile') {
          window.location.href = '/profile'
        } else {
          window.location.href = '/dashboard'
        }
      } else {
        const error = await response.json()
        if (error.error === 'PHONE_NOT_REGISTERED') {
          setModal({
            isOpen: true,
            type: 'phone-not-registered'
          })
        } else {
          setModal({
            isOpen: true,
            type: 'error',
            message: error.message || '登录失败'
          })
        }
      }
    } catch (error) {
      setModal({
        isOpen: true,
        type: 'error',
        message: '登录失败，请重试'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <TianIcon width={52} height={52} className="text-black" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">天乙神算</h1>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">欢迎回来</h2>
          {/* <p className="text-gray-600 text-sm">登录您的天乙神算账户</p> */}
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-lg p-3 sm:p-4 md:p-6 mb-6 min-w-[280px]">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">手机验证码登录</h3>

          {/* Phone Number */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              手机号码
            </label>
            <div className="flex">
              <div className="flex items-center px-2 sm:px-3 bg-gray-50 border border-r-0 border-gray-300 rounded-l-lg">
                <span className="text-gray-600 text-xs sm:text-sm">+86</span>
              </div>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 11))}
                placeholder="手机号"
                className="flex-1 px-3 sm:px-4 py-3 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* SMS Code */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              验证码
            </label>
            <div className="flex gap-2 sm:gap-3">
              <input
                type="text"
                value={smsCode}
                onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="验证码"
                className="flex-1 px-3 sm:px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={sendSmsCode}
                disabled={countdown > 0 || loading || !phoneNumber || phoneNumber.length !== 11}
                className="px-2 sm:px-3 py-3 bg-gray-100 text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-xs sm:text-sm min-w-[70px] sm:min-w-[80px] flex-shrink-0"
              >
                {countdown > 0 ? `${countdown}s` : '获取验证码'}
              </button>
            </div>
          </div>
          {/* Login Button */}
          <button
            onClick={handleLogin}
            disabled={loading || !phoneNumber || !smsCode || phoneNumber.length !== 11 || smsCode.length !== 6}
            className="w-full py-3 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '登录中...' : '步入玄境'}
          </button>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 mb-4">
          <p>登录即表示您同意我们的</p>
          <div className="space-x-4 mt-1">
            <Link href="/user-agreement" className="text-blue-600 hover:text-blue-700">
              服务条款
            </Link>
            <span>和</span>
            <Link href="/privacy-policy" className="text-blue-600 hover:text-blue-700">
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

      {/* Modal */}
      <Modal
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        phoneNumber={phoneNumber}
        type={modal.type}
        message={modal.message}
      />
    </div>
  )
} 