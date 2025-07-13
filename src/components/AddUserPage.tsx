'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, Input, Button, message, Form } from 'antd'
import { CheckCircleFilled } from '@ant-design/icons'

interface AddUserPageProps {
  onSuccess?: () => void
}

export default function AddUserPage({ onSuccess }: AddUserPageProps) {
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

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

  // 验证兑换码
  const handleVerifyCode = async () => {
    if (!inviteCode) {
      message.error('请输入兑换码')
      return
    }

    if (!validateInviteCode(inviteCode)) {
      message.error('请输入正确的16位兑换码')
      return
    }

    try {
      setLoading(true)
      
      // 调用API验证兑换码
      const response = await fetch('/api/invite-code/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: inviteCode })
      })

      if (response.ok) {
        const result = await response.json()
        message.success('兑换码验证成功！')
        
        // 将验证成功的兑换码存储到sessionStorage，供后续使用
        sessionStorage.setItem('verified_invite_code', inviteCode)
        sessionStorage.setItem('is_adding_new_user', 'true')
        
        // 如果有onSuccess回调，调用它；否则跳转到profile页面
        setTimeout(() => {
          if (onSuccess) {
            onSuccess()
          } else {
            router.push('/profile')
          }
        }, 1000)
        
      } else {
        const error = await response.json()
        message.error(error.message || '兑换码验证失败')
      }
    } catch (error) {
      console.error('验证兑换码失败:', error)
      message.error('验证失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="max-w-md mx-auto">
        {/* 头部 */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">乙</span>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">新增用户</h1>
          <p className="text-gray-600">请输入16位兑换码以添加新用户</p>
        </div>

        {/* 兑换码输入卡片 */}
        <Card className="shadow-lg border-0 rounded-2xl mb-6">
          <Form onFinish={handleVerifyCode}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                兑换码
              </label>
              <Input
                value={inviteCode}
                onChange={(e) => handleInviteCodeChange(e.target.value)}
                placeholder="输入16位兑换码，如：2406AB8F9E2D4C7K"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-center tracking-wider text-lg"
                maxLength={16}
                size="large"
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-500">
                  {inviteCode.length}/16 {validateInviteCode(inviteCode) ? '✓' : ''}
                </span>
                <span className="text-xs text-blue-600">
                  请确保兑换码正确且未被使用
                </span>
              </div>
            </div>

            {/* 验证按钮 */}
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              disabled={!validateInviteCode(inviteCode)}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 border-none shadow-lg hover:shadow-xl transition-all duration-300 text-lg font-medium h-12"
            >
              {loading ? '验证中...' : '验证兑换码'}
            </Button>
          </Form>
        </Card>

        {/* 说明信息 */}
        <Card className="bg-blue-50 border-blue-200 rounded-xl">
          <div className="text-center">
            <CheckCircleFilled className="text-blue-500 text-2xl mb-2" />
            <h3 className="text-sm font-medium text-blue-900 mb-1">关于兑换码</h3>
            <p className="text-xs text-blue-700 leading-relaxed">
              兑换码由16位字母和数字组成，每个兑换码只能使用一次。
              验证成功后，您将进入用户信息填写页面。
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
} 