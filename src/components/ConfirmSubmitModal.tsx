'use client'

import { useState, useEffect } from 'react'
import { Modal, Button } from 'antd'
import { ExclamationCircleOutlined } from '@ant-design/icons'

interface ConfirmSubmitModalProps {
  visible: boolean
  onCancel: () => void
  onConfirm: () => void
  loading?: boolean
}

export default function ConfirmSubmitModal({ 
  visible, 
  onCancel, 
  onConfirm, 
  loading = false 
}: ConfirmSubmitModalProps) {
  const [countdown, setCountdown] = useState(3)
  const [canSubmit, setCanSubmit] = useState(false)

  // 重置倒计时
  useEffect(() => {
    if (visible) {
      setCountdown(3)
      setCanSubmit(false)
    }
  }, [visible])

  // 倒计时逻辑
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null
    
    if (visible && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(prev => {
          const newCount = prev - 1
          if (newCount === 0) {
            setCanSubmit(true)
          }
          return newCount
        })
      }, 1000)
    }

    return () => {
      if (timer) {
        clearTimeout(timer)
      }
    }
  }, [visible, countdown])

  const handleConfirm = () => {
    if (canSubmit && !loading) {
      onConfirm()
    }
  }

  const handleCancel = () => {
    if (!loading) {
      onCancel()
    }
  }

  return (
    <Modal
      title={
        <div className="flex items-center space-x-2">
          <ExclamationCircleOutlined className="text-orange-500" />
          <span>天乙提示</span>
        </div>
      }
      open={visible}
      onCancel={handleCancel}
      footer={null}
      closable={!loading}
      maskClosable={!loading}
      centered
      width={480}
      style={{ top: -100 }}
    >
      <div className="py-4">
        <p className="text-gray-800 text-base leading-relaxed mb-6">
          一个生辰对应一系列报告，不可更改，请确认信息填写正确
        </p>
        
        <div className="flex justify-end space-x-3">
          <Button 
            onClick={handleCancel}
            disabled={loading}
            size="large"
          >
            返回修改
          </Button>
          
          <Button 
            type="primary" 
            onClick={handleConfirm}
            disabled={!canSubmit || loading}
            loading={loading}
            size="large"
          >
            {loading ? '提交中...' : (
              canSubmit ? '继续提交' : `继续提交 (${countdown}s)`
            )}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
