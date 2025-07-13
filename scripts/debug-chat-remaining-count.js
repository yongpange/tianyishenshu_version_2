// 调试剩余对话次数显示问题
console.log('🔍 调试剩余对话次数显示问题')

// 可能的问题和解决方案
const possibleIssues = [
  {
    issue: '数据库迁移未完成',
    description: '004_add_user_profile_fields.sql 迁移可能没有执行',
    solution: '在 Supabase Dashboard 中执行迁移文件'
  },
  {
    issue: 'chat_remaining_count 字段不存在',
    description: 'user_profiles 表中缺少 chat_remaining_count 字段',
    solution: '手动添加字段：ALTER TABLE user_profiles ADD COLUMN chat_remaining_count INTEGER DEFAULT 10;'
  },
  {
    issue: '字段值为 NULL',
    description: '现有用户的 chat_remaining_count 字段为 NULL',
    solution: '更新现有记录：UPDATE user_profiles SET chat_remaining_count = 10 WHERE chat_remaining_count IS NULL;'
  },
  {
    issue: 'API 查询问题',
    description: 'API 关联查询可能有问题',
    solution: '检查 API 返回的数据结构'
  }
]

console.log('\n📋 可能的问题和解决方案:')
possibleIssues.forEach((item, index) => {
  console.log(`\n${index + 1}. ${item.issue}`)
  console.log(`   问题: ${item.description}`)
  console.log(`   解决: ${item.solution}`)
})

console.log('\n🔧 推荐的调试步骤:')
console.log('1. 在 Supabase Dashboard 中检查 user_profiles 表结构')
console.log('2. 确认是否有 chat_remaining_count 字段')
console.log('3. 检查现有记录的字段值')
console.log('4. 如果字段不存在，执行迁移文件或手动添加')
console.log('5. 如果字段值为 NULL，更新为默认值')

console.log('\n📝 SQL 调试查询:')
console.log(`
-- 1. 检查表结构
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
  AND column_name LIKE '%chat%';

-- 2. 检查现有数据
SELECT 
  up.name,
  up.chat_remaining_count,
  up.user_role,
  u.phone_number
FROM user_profiles up
JOIN users u ON up.user_id = u.id
LIMIT 10;

-- 3. 统计NULL值
SELECT 
  COUNT(*) as total_users,
  COUNT(chat_remaining_count) as users_with_chat_count,
  COUNT(*) - COUNT(chat_remaining_count) as users_with_null_chat_count
FROM user_profiles;

-- 4. 修复NULL值（如果需要）
-- UPDATE user_profiles 
-- SET chat_remaining_count = 10 
-- WHERE chat_remaining_count IS NULL;
`)

console.log('\n✅ 调试完成！请在 Supabase Dashboard 中执行上述 SQL 查询来诊断问题。') 