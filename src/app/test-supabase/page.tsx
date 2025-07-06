'use client'

import { useState } from 'react'
import { Button, Card, Typography, Space, Alert } from 'antd'
import { supabase } from '@/lib/supabase'

const { Title, Text } = Typography

export default function TestSupabasePage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testSupabaseConnection = async () => {
    setLoading(true)
    try {
      console.log('🧪 测试 Supabase 连接...')
      
      // 1. 测试基本连接
      console.log('1️⃣ 测试基本连接...')
      const { data: connectionTest, error: connectionError } = await supabase
        .from('users')
        .select('count')
        .limit(1)

      if (connectionError) {
        throw new Error(`连接测试失败: ${connectionError.message}`)
      }

      // 2. 测试创建用户
      console.log('2️⃣ 测试创建用户...')
      const testPhoneNumber = 'test_' + Date.now()
      
      const { data: newUser, error: createUserError } = await supabase
        .from('users')
        .insert({
          phone_number: testPhoneNumber,
          permissions: ['basic']
        })
        .select('id')
        .single()

      if (createUserError) {
        throw new Error(`创建用户失败: ${createUserError.message}`)
      }

      console.log('✅ 用户创建成功:', newUser)

      // 3. 测试保存性格报告
      console.log('3️⃣ 测试保存性格报告...')
      const testReport = {
        user_id: newUser.id,
        content: '这是一个测试性格报告内容',
        generated_at: new Date().toISOString(),
        user_data_hash: 'test_hash_' + Date.now(),
        coze_conversation_id: 'test_conversation_' + Date.now()
      }

      const { data: reportData, error: reportError } = await supabase
        .from('personality_reports')
        .insert(testReport)
        .select()
        .single()

      if (reportError) {
        throw new Error(`保存报告失败: ${reportError.message}`)
      }

      console.log('✅ 报告保存成功:', reportData)

      // 4. 测试查询报告
      console.log('4️⃣ 测试查询报告...')
      const { data: queryData, error: queryError } = await supabase
        .from('personality_reports')
        .select('*')
        .eq('user_id', newUser.id)
        .single()

      if (queryError) {
        throw new Error(`查询报告失败: ${queryError.message}`)
      }

      console.log('✅ 报告查询成功:', queryData)

      // 5. 清理测试数据
      console.log('5️⃣ 清理测试数据...')
      await supabase.from('personality_reports').delete().eq('user_id', newUser.id)
      await supabase.from('users').delete().eq('id', newUser.id)

      setResult({
        success: true,
        message: '所有测试通过！Supabase 连接和操作正常',
        details: {
          connectionTest: '✅ 连接成功',
          userCreation: '✅ 用户创建成功',
          reportSave: '✅ 报告保存成功',
          reportQuery: '✅ 报告查询成功',
          cleanup: '✅ 清理完成'
        }
      })

    } catch (error) {
      console.error('❌ Supabase 测试失败:', error)
      setResult({
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
        details: error
      })
    } finally {
      setLoading(false)
    }
  }

  const testDirectSave = async () => {
    setLoading(true)
    try {
      console.log('🧪 测试直接保存性格报告...')
      
      const testData = {
        userInfo: {
          name: '测试用户',
          gender: '男',
          year: 1990,
          month: 5,
          day: 15,
          hour: 14,
          minute: 30,
          area: {
            province: '北京市',
            city: '北京市',
            district: '朝阳区'
          }
        },
        userId: 'test_user_' + Date.now(),
        content: '这是一个测试性格报告内容，用于验证保存功能是否正常工作。'
      }

      // 调用保存API
      const response = await fetch('/api/test-save-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData)
      })

      const result = await response.json()
      console.log('📊 保存测试结果:', result)
      setResult(result)

    } catch (error) {
      console.error('❌ 直接保存测试失败:', error)
      setResult({
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Title level={2}>Supabase 连接测试</Title>
      
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Alert
          message="测试说明"
          description="这个页面用于测试 Supabase 数据库连接和性格报告保存功能"
          type="info"
          showIcon
        />

        <Card title="测试选项">
          <Space>
            <Button type="primary" onClick={testSupabaseConnection} loading={loading}>
              测试 Supabase 连接
            </Button>
            <Button onClick={testDirectSave} loading={loading}>
              测试直接保存报告
            </Button>
          </Space>
        </Card>

        {result && (
          <Card title={result.success ? "✅ 测试成功" : "❌ 测试失败"}>
            <pre style={{ 
              background: result.success ? '#f6ffed' : '#fff2f0', 
              padding: '16px', 
              borderRadius: '4px',
              fontSize: '12px',
              overflow: 'auto',
              maxHeight: '600px',
              border: result.success ? '1px solid #b7eb8f' : '1px solid #ffccc7'
            }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          </Card>
        )}
      </Space>
    </div>
  )
}
