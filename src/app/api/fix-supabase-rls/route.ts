import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import * as fs from 'fs'
import * as path from 'path'

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({
        success: false,
        error: 'Supabase Admin 客户端未配置'
      }, { status: 500 })
    }

    console.log('🔧 开始修复 Supabase RLS 策略...')

    // 读取迁移文件
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '002_fix_rls_policies.sql')
    
    if (!fs.existsSync(migrationPath)) {
      return NextResponse.json({
        success: false,
        error: '迁移文件不存在'
      }, { status: 404 })
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    console.log('📄 读取迁移文件成功，长度:', migrationSQL.length)

    // 将 SQL 分割成单独的语句
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

    console.log('📝 找到', statements.length, '个 SQL 语句')

    const results = []
    let successCount = 0
    let errorCount = 0

    // 逐个执行 SQL 语句
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      
      try {
        console.log(`🔄 执行语句 ${i + 1}/${statements.length}:`, statement.substring(0, 100) + '...')
        
        const { data, error } = await supabaseAdmin.rpc('exec_sql', {
          sql_query: statement
        })

        if (error) {
          // 尝试直接执行（某些语句可能不支持 rpc）
          const { error: directError } = await supabaseAdmin
            .from('_temp_migration')
            .select('1')
            .limit(0) // 这只是为了触发连接，实际不会执行

          // 如果是策略相关的语句，我们需要用不同的方法
          if (statement.includes('POLICY') || statement.includes('ALTER TABLE')) {
            console.log(`⚠️ 跳过策略语句 ${i + 1}:`, error.message)
            results.push({
              statement: statement.substring(0, 100) + '...',
              status: 'skipped',
              reason: '策略语句需要在 Supabase Dashboard 中手动执行'
            })
            continue
          }

          throw error
        }

        results.push({
          statement: statement.substring(0, 100) + '...',
          status: 'success',
          data
        })
        successCount++

      } catch (error) {
        console.error(`❌ 语句 ${i + 1} 执行失败:`, error)
        results.push({
          statement: statement.substring(0, 100) + '...',
          status: 'error',
          error: error instanceof Error ? error.message : String(error)
        })
        errorCount++
      }
    }

    console.log(`✅ 迁移完成: ${successCount} 成功, ${errorCount} 失败`)

    return NextResponse.json({
      success: errorCount === 0,
      message: `迁移执行完成: ${successCount} 成功, ${errorCount} 失败`,
      results,
      summary: {
        total: statements.length,
        success: successCount,
        errors: errorCount
      },
      manualSteps: [
        '1. 访问 Supabase Dashboard',
        '2. 进入 SQL Editor',
        '3. 执行 supabase/migrations/002_fix_rls_policies.sql 中的策略语句',
        '4. 确保所有 RLS 策略正确创建'
      ]
    })

  } catch (error) {
    console.error('❌ 修复 RLS 策略失败:', error)
    return NextResponse.json({
      success: false,
      error: '修复失败',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
