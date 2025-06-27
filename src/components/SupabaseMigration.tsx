'use client'

import { useState } from 'react'
import { Button, Card, Alert, Progress, List, message } from 'antd'
import { 
  CloudUploadOutlined, 
  CheckCircleOutlined, 
  ExclamationCircleOutlined,
  DatabaseOutlined 
} from '@ant-design/icons'
import { 
  needsMigration, 
  performFullMigration, 
  testSupabaseConnection,
  MigrationResult 
} from '@/utils/migrate-to-supabase'
import { getUserPhoneNumber } from '@/utils/personality-report'

export default function SupabaseMigration() {
  const [migrating, setMigrating] = useState(false)
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null)
  const [connectionTested, setConnectionTested] = useState(false)
  const [connectionOk, setConnectionOk] = useState(false)

  // 测试Supabase连接
  const handleTestConnection = async () => {
    setConnectionTested(true)
    const isOk = await testSupabaseConnection()
    setConnectionOk(isOk)
    
    if (isOk) {
      message.success('Supabase连接正常')
    } else {
      message.error('Supabase连接失败，请检查配置')
    }
  }

  // 执行迁移
  const handleMigration = async () => {
    const phoneNumber = getUserPhoneNumber()
    if (!phoneNumber) {
      message.error('未找到用户信息')
      return
    }

    setMigrating(true)
    try {
      const result = await performFullMigration(phoneNumber)
      setMigrationResult(result)
      
      if (result.success) {
        message.success(`迁移成功！共迁移 ${result.migratedCount} 项数据`)
      } else {
        message.error('迁移失败，请查看详细信息')
      }
    } catch (error) {
      message.error('迁移过程出错')
      console.error('Migration error:', error)
    } finally {
      setMigrating(false)
    }
  }

  const hasMigrationData = needsMigration()

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card title="数据迁移到Supabase" className="mb-6">
        <div className="space-y-4">
          {/* 连接测试 */}
          <div>
            <h3 className="text-lg font-medium mb-2">
              <DatabaseOutlined className="mr-2" />
              1. 测试Supabase连接
            </h3>
            <Button 
              type="primary" 
              onClick={handleTestConnection}
              loading={!connectionTested}
              icon={<DatabaseOutlined />}
            >
              测试连接
            </Button>
            {connectionTested && (
              <Alert
                className="mt-2"
                type={connectionOk ? 'success' : 'error'}
                message={connectionOk ? 'Supabase连接正常' : 'Supabase连接失败'}
                description={connectionOk ? '可以进行数据迁移' : '请检查环境变量配置'}
                showIcon
              />
            )}
          </div>

          {/* 数据检查 */}
          <div>
            <h3 className="text-lg font-medium mb-2">
              <ExclamationCircleOutlined className="mr-2" />
              2. 本地数据检查
            </h3>
            <Alert
              type={hasMigrationData ? 'info' : 'warning'}
              message={hasMigrationData ? '发现本地数据' : '未发现本地数据'}
              description={
                hasMigrationData 
                  ? '检测到localStorage中有用户数据，可以进行迁移'
                  : '没有发现需要迁移的本地数据'
              }
              showIcon
            />
          </div>

          {/* 迁移操作 */}
          <div>
            <h3 className="text-lg font-medium mb-2">
              <CloudUploadOutlined className="mr-2" />
              3. 执行数据迁移
            </h3>
            <Button 
              type="primary" 
              size="large"
              onClick={handleMigration}
              loading={migrating}
              disabled={!connectionOk || !hasMigrationData}
              icon={<CloudUploadOutlined />}
            >
              {migrating ? '迁移中...' : '开始迁移'}
            </Button>
            
            {migrating && (
              <div className="mt-4">
                <Progress percent={50} status="active" />
                <p className="text-sm text-gray-500 mt-2">正在迁移数据到Supabase...</p>
              </div>
            )}
          </div>

          {/* 迁移结果 */}
          {migrationResult && (
            <div>
              <h3 className="text-lg font-medium mb-2">
                <CheckCircleOutlined className="mr-2" />
                迁移结果
              </h3>
              <Alert
                type={migrationResult.success ? 'success' : 'error'}
                message={
                  migrationResult.success 
                    ? `迁移成功！共迁移 ${migrationResult.migratedCount} 项数据`
                    : '迁移失败'
                }
                description={
                  migrationResult.success
                    ? '您的数据已成功迁移到Supabase，本地数据已清理'
                    : '迁移过程中出现错误，请查看详细信息'
                }
                showIcon
              />
              
              {migrationResult.errors.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-red-600 mb-2">错误详情:</h4>
                  <List
                    size="small"
                    dataSource={migrationResult.errors}
                    renderItem={error => (
                      <List.Item>
                        <span className="text-red-500">{error}</span>
                      </List.Item>
                    )}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* 使用说明 */}
      <Card title="使用说明" size="small">
        <div className="text-sm text-gray-600 space-y-2">
          <p>• 迁移前请确保已正确配置Supabase环境变量</p>
          <p>• 迁移过程会将localStorage中的数据转移到Supabase</p>
          <p>• 迁移成功后，本地数据将被清理</p>
          <p>• 如果迁移失败，本地数据不会被删除</p>
        </div>
      </Card>
    </div>
  )
}
