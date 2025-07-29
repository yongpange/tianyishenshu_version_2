'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { devLog } from '@/utils/dev-logger'

interface WechatQRModalProps {
  isOpen: boolean
  onClose: () => void
}

interface PhoneExistsDialogProps {
  isOpen: boolean
  onClose: () => void
  phoneNumber: string
  onGoToLogin: () => void
  onReenterPhone: () => void
}

// 错误提醒Dialog组件
function ErrorDialog({ isOpen, onClose, title, message, iconEmoji }: {
  isOpen: boolean
  onClose: () => void
  title: string
  message: string
  iconEmoji: string
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl p-8 max-w-sm mx-4" onClick={e => e.stopPropagation()}>
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="text-red-600 text-2xl">{iconEmoji}</div>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-600 text-sm mb-6">
            {message}
          </p>
          <div className="space-y-3">
            <button
              onClick={onClose}
              className="w-full py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              确定
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function PhoneExistsDialog({ isOpen, onClose, phoneNumber, onGoToLogin, onReenterPhone }: PhoneExistsDialogProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl p-8 max-w-sm mx-4" onClick={e => e.stopPropagation()}>
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="text-blue-600 text-2xl">📱</div>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">手机号已注册</h3>
          <p className="text-gray-600 text-sm mb-6">
            手机号 {phoneNumber} 已注册天乙神算账户<br />
            您可以直接登录或重新输入手机号
          </p>
          <div className="space-y-3">
            <button
              onClick={onGoToLogin}
              className="w-full py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              直接登录
            </button>
            <button
              onClick={onReenterPhone}
              className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              重新输入手机号
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function WechatQRModal({ isOpen, onClose }: WechatQRModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl p-8 max-w-md mx-4" onClick={e => e.stopPropagation()}>
        <div className="text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-6">添加客服微信</h3>

          {/* 两个二维码并排显示 */}
          <div className="flex justify-center gap-6 mb-6">
            {/* 第一个二维码 */}
            <div className="flex flex-col items-center">
              <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center mb-2">
                <img
                  src="/qr-code-1.png"
                  alt="客服微信二维码1"
                  className="w-full h-full object-contain rounded-lg"
                  onError={(e) => {
                    // 如果图片加载失败，显示占位符
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling!.classList.remove('hidden');
                  }}
                />
                <div className="hidden text-gray-500 text-center">
                  <div className="text-2xl mb-1">📱</div>
                  <div className="text-xs">二维码1</div>
                </div>
              </div>
              <div className="text-xs text-gray-600">客服1</div>
            </div>

            {/* 第二个二维码 */}
            <div className="flex flex-col items-center">
              <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center mb-2">
                <img
                  src="/qr-code-2.png"
                  alt="客服微信二维码2"
                  className="w-full h-full object-contain rounded-lg"
                  onError={(e) => {
                    // 如果图片加载失败，显示占位符
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling!.classList.remove('hidden');
                  }}
                />
                <div className="hidden text-gray-500 text-center">
                  <div className="text-2xl mb-1">📱</div>
                  <div className="text-xs">二维码2</div>
                </div>
              </div>
              <div className="text-xs text-gray-600">客服2</div>
            </div>
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

export default function RegisterPage() {
  const searchParams = useSearchParams()
  const [currentStep, setCurrentStep] = useState(1)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [smsCode, setSmsCode] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [inviteCodeMessage, setInviteCodeMessage] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [loading, setLoading] = useState(false)
  const [showWechatModal, setShowWechatModal] = useState(false)
  const [showPhoneExistsDialog, setShowPhoneExistsDialog] = useState(false)
  const [showErrorDialog, setShowErrorDialog] = useState(false)
  const [errorDialogTitle, setErrorDialogTitle] = useState('')
  const [errorDialogMessage, setErrorDialogMessage] = useState('')
  const [errorDialogIconEmoji, setErrorDialogIconEmoji] = useState('')

  // 从URL参数中获取手机号
  useEffect(() => {
    const phone = searchParams.get('phone')
    if (phone) {
      setPhoneNumber(phone)
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

  // 发送验证码
  const sendSmsCode = async () => {
    if (!phoneNumber || phoneNumber.length !== 11) {
      setErrorDialogTitle('手机号格式错误')
      setErrorDialogMessage('请输入正确的11位手机号码')
      setErrorDialogIconEmoji('📱')
      setShowErrorDialog(true)
      return
    }

    if (countdown > 0) return

    try {
      setLoading(true)

      // 首先检查手机号是否已注册
      const checkResponse = await fetch('/api/auth/check-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber })
      })

      const checkResult = await checkResponse.json()

      // 如果手机号已注册并且已使用兑换码，显示选择dialog
      if (checkResult.exists && checkResult.user?.invite_code_used) {
        setShowPhoneExistsDialog(true)
        return
      }

      // 手机号未注册，发送验证码
      const response = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber, type: 'register' })
      })

      if (response.ok) {
        setCountdown(60)
      } else {
        const errorData = await response.json()
        setErrorDialogTitle('验证码发送失败')
        setErrorDialogMessage(errorData.message || '验证码发送失败，请稍后重试')
        setErrorDialogIconEmoji('📨')
        setShowErrorDialog(true)
      }
    } catch (error) {
      setErrorDialogTitle('验证码发送失败')
      setErrorDialogMessage('验证码发送失败，请检查网络连接后重试')
      setErrorDialogIconEmoji('📨')
      setShowErrorDialog(true)
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
      // 清空提示信息
      setInviteCodeMessage('')
    }
  }

  // 验证兑换码
  const verifyInviteCode = async (code: string) => {
    if (!code || code.length !== 16) {
      return false
    }

    try {
      const response = await fetch('/api/invite-code/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      })

      return response.ok
    } catch (error) {
      devLog.error('验证兑换码失败:', error)
      return false
    }
  }



  // 判断是否可以注册
  const canRegister = () => {
    // 严格检查手机号
    const validPhone = phoneNumber && 
                      typeof phoneNumber === 'string' && 
                      phoneNumber.trim().length === 11 && 
                      /^1[3-9]\d{9}$/.test(phoneNumber.trim())
    
    // 严格检查验证码
    const validSms = smsCode && 
                    typeof smsCode === 'string' && 
                    smsCode.trim().length === 6 && 
                    /^\d{6}$/.test(smsCode.trim())
    
    // 严格检查兑换码（只检查格式）
    const validInvite = inviteCode && 
                       typeof inviteCode === 'string' && 
                       inviteCode.trim().length === 16 && 
                       /^[A-Z0-9]{16}$/.test(inviteCode.trim())
    
    return validPhone && validSms && validInvite && loading === false
  }

  // 判断是否可以添加客服微信
  const canAddCustomerService = () => {
    return (!inviteCode || inviteCode.length !== 16) && !loading
  }

  // 处理跳转到登录页面
  const handleGoToLogin = () => {
    window.location.href = `/login?phone=${phoneNumber}&autoSend=true`
  }

  // 处理重新输入手机号
  const handleReenterPhone = () => {
    setPhoneNumber('')
    setSmsCode('')
    setCountdown(0)
    setShowPhoneExistsDialog(false)
  }

  // 提交注册
  const handleRegister = async () => {
    // 额外安全检查
    if (!canRegister()) {
      setErrorDialogTitle('信息不完整')
      setErrorDialogMessage('请完成所有必填信息并确保兑换码有效')
      setErrorDialogIconEmoji('⚠️')
      setShowErrorDialog(true)
      return
    }
    
    if (!phoneNumber || !smsCode || !inviteCode) {
      setErrorDialogTitle('信息不完整')
      setErrorDialogMessage('请填写完整的手机号、验证码和兑换码信息')
      setErrorDialogIconEmoji('⚠️')
      setShowErrorDialog(true)
      return
    }

    if (smsCode.length !== 6) {
      setErrorDialogTitle('验证码格式错误')
      setErrorDialogMessage('请输入正确的6位数字验证码')
      setErrorDialogIconEmoji('🔢')
      setShowErrorDialog(true)
      return
    }

    if (!validateInviteCode(inviteCode)) {
      setErrorDialogTitle('兑换码格式错误')
      setErrorDialogMessage('请输入正确的16位兑换码（仅包含字母和数字）')
      setErrorDialogIconEmoji('🎟️')
      setShowErrorDialog(true)
      return
    }

    try {
      setLoading(true)
      
      // 先验证兑换码
      const isValidInviteCode = await verifyInviteCode(inviteCode)
      if (!isValidInviteCode) {
        setInviteCodeMessage('兑换码无效或已被使用')
        setLoading(false)
        return
      }
      

      
      // 验证短信验证码和兑换码
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phoneNumber,
          code: smsCode,
          inviteCode: inviteCode
        })
      })

      if (response.ok) {
        const result = await response.json()
        
        // 保存手机号到localStorage
        const loginData = {
          phoneNumber,
          timestamp: Date.now(),
          user: result.user
        }
        localStorage.setItem('loginData', JSON.stringify(loginData))

        // 确保注册用户明确设置 isAddingNewUser 为 false
        sessionStorage.setItem('is_adding_new_user', 'false')
        
        // 根据API返回的跳转指示决定跳转（保持一致性）
        const redirectTo = result.user?.redirect_to || 'profile'
        if (redirectTo === 'dashboard') {
          window.location.href = '/dashboard'
        } else {
          // 跳转到信息填写页面
          window.location.href = '/profile'
        }
      } else {
        const error = await response.json()
        if (error.error === 'PHONE_ALREADY_REGISTERED') {
          setShowPhoneExistsDialog(true)
        } else {
          setErrorDialogTitle('注册失败')
          setErrorDialogMessage(error.message || '注册失败，请稍后重试')
          setErrorDialogIconEmoji('❌')
          setShowErrorDialog(true)
        }
      }
    } catch (error) {
      setErrorDialogTitle('注册失败')
      setErrorDialogMessage('注册失败，请检查网络连接后重试')
      setErrorDialogIconEmoji('❌')
      setShowErrorDialog(true)
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
          <h2 className="text-xl font-semibold text-gray-800 mb-2">加入天乙神算</h2>
          <p className="text-gray-600 text-sm">开启您的命理探索之旅</p>
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

        {/* Register Form */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">手机验证码注册</h3>

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
            <div className="relative">
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => handleInviteCodeChange(e.target.value)}
                placeholder="2406AB8F9E2D4C7K"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-center tracking-wider"
                maxLength={16}
              />
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-gray-500">
                {inviteCode.length}/16
              </span>
              <button
                onClick={() => setShowWechatModal(true)}
                disabled={!canAddCustomerService()}
                className="text-xs text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                没有兑换码？联系客服
              </button>
            </div>
            {/* 兑换码验证提示信息 */}
            {inviteCodeMessage && (
              <div className="text-xs mt-2 text-red-500">
                {inviteCodeMessage}
              </div>
            )}
          </div>

          {/* WeChat Service Button */}
          <button
            onClick={() => setShowWechatModal(true)}
            disabled={!canAddCustomerService()}
            className="w-full py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-4"
          >
            添加客服微信
          </button>

          {/* Register Button */}
          <button
            onClick={handleRegister}
            disabled={!canRegister()}
            className="w-full py-3 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '注册中...' : '步入玄境'}
          </button>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 mb-4">
          <p>注册即表示您同意我们的</p>
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

        {/* Login Link */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            已有账号？
            <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium ml-1">
              立即登录
            </Link>
          </p>
        </div>
      </div>

      {/* WeChat QR Modal */}
      <WechatQRModal
        isOpen={showWechatModal}
        onClose={() => setShowWechatModal(false)}
      />

      {/* Phone Exists Dialog */}
      <PhoneExistsDialog
        isOpen={showPhoneExistsDialog}
        onClose={() => setShowPhoneExistsDialog(false)}
        phoneNumber={phoneNumber}
        onGoToLogin={handleGoToLogin}
        onReenterPhone={handleReenterPhone}
      />

      {/* Error Dialog */}
      <ErrorDialog
        isOpen={showErrorDialog}
        onClose={() => setShowErrorDialog(false)}
        title={errorDialogTitle}
        message={errorDialogMessage}
        iconEmoji={errorDialogIconEmoji}
      />
    </div>
  )
}