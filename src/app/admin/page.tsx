'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import TianIcon from '@/components/icons/TianIcon'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  phoneNumber?: string
  type: 'phone-not-registered' | 'incomplete-input' | 'no-admin-permission' | 'error'
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
          content: '该手机号尚未注册天乙神算账户',
          buttons: (
            <button
              onClick={onClose}
              className="w-full py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              重新输入
            </button>
          )
        }
      case 'no-admin-permission':
        return {
          icon: '🚫',
          title: '权限不足',
          content: '您没有管理员权限，无法登录管理后台',
          buttons: (
            <button
              onClick={onClose}
              className="w-full py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              重新输入
            </button>
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl">
        <div className="p-6 text-center">
          <div className="text-4xl mb-4">{content.icon}</div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">{content.title}</h3>
          <p className="text-gray-600 mb-6 whitespace-pre-line leading-relaxed">
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

export default function AdminLogin() {
  const router = useRouter()
  const [phoneNumber, setPhoneNumber] = useState('')
  const [smsCode, setSmsCode] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [loading, setLoading] = useState(false)
  const [modal, setModal] = useState<{
    isOpen: boolean
    type: 'phone-not-registered' | 'incomplete-input' | 'no-admin-permission' | 'error'
    message?: string
  }>({
    isOpen: false,
    type: 'phone-not-registered'
  })

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
    if (!phoneNumber) {
      setModal({
        isOpen: true,
        type: 'incomplete-input',
        message: '请输入手机号'
      })
      return
    }

    if (!/^1[3-9]\d{9}$/.test(phoneNumber)) {
      setModal({
        isOpen: true,
        type: 'error',
        message: '请输入正确的手机号格式'
      })
      return
    }

    if (countdown > 0) {
      return
    }

    try {
      setLoading(true)
      
      // 发送管理员验证码
      const response = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phoneNumber,
          type: 'admin' // 指定为管理员类型
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setCountdown(60)
        // 可以显示成功提示，但不用modal
      } else {
        if (result.message?.includes('尚未注册')) {
          setModal({
            isOpen: true,
            type: 'phone-not-registered'
          })
        } else if (result.message?.includes('管理员权限')) {
          setModal({
            isOpen: true,
            type: 'no-admin-permission'
          })
        } else {
          setModal({
            isOpen: true,
            type: 'error',
            message: result.message || '发送验证码失败'
          })
        }
      }
    } catch (error) {
      setModal({
        isOpen: true,
        type: 'error',
        message: '网络错误，请重试'
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
      
      // 管理员登录验证
      const response = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phoneNumber,
          code: smsCode
        })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          // 保存管理员登录信息
          const adminData = {
            admin_token: 'admin_logged_in_' + Date.now(),
            admin_phone: phoneNumber,
            admin_user: result.data.user,
            timestamp: Date.now()
          }
          
          localStorage.setItem('admin_token', adminData.admin_token)
          localStorage.setItem('admin_phone', phoneNumber)
          localStorage.setItem('admin_user', JSON.stringify(result.data.user))

          // 跳转到管理后台
          router.push('/admin/dashboard')
        } else {
          setModal({
            isOpen: true,
            type: 'error',
            message: result.message || '登录失败'
          })
        }
      } else {
        const error = await response.json()
        if (error.message?.includes('权限')) {
          setModal({
            isOpen: true,
            type: 'no-admin-permission'
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
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8">
        {/* 头部logo和标题 */}
        <div className="text-center mb-8">
          <TianIcon className="w-16 h-16 mx-auto mb-4 text-purple-600" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">天乙神算</h1>
          <p className="text-gray-600">管理员后台</p>
        </div>

        {/* 登录表单 */}
        <div className="space-y-6">
          {/* 手机号输入 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              管理员手机号
            </label>
            <div className="relative">
                             <input
                 type="tel"
                 placeholder="请输入管理员手机号"
                 value={phoneNumber}
                 onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 11))}
                 className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all bg-gray-50 text-black"
                 maxLength={11}
               />
            </div>
          </div>

          {/* 验证码输入 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              短信验证码
            </label>
            <div className="flex gap-3">
                             <input
                 type="text"
                 placeholder="请输入6位验证码"
                 value={smsCode}
                 onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                 className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all bg-gray-50 text-black"
                 maxLength={6}
               />
              <button
                onClick={sendSmsCode}
                disabled={countdown > 0 || loading}
                className={`px-6 py-3 rounded-xl font-medium transition-all ${
                  countdown > 0 || loading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-purple-600 text-white hover:bg-purple-700 active:bg-purple-800'
                }`}
              >
                {countdown > 0 ? `${countdown}s` : '发送验证码'}
              </button>
            </div>
          </div>

          {/* 登录按钮 */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className={`w-full py-4 rounded-xl font-medium text-lg transition-all ${
              loading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 active:from-purple-800 active:to-blue-800 shadow-lg hover:shadow-xl'
            }`}
          >
            {loading ? '登录中...' : '登录管理后台'}
          </button>
        </div>

        {/* 提示信息 */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>仅限具有管理员权限的用户登录</p>
        </div>
      </div>

      {/* 模态框 */}
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