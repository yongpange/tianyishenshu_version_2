// 测试管理页面API功能
const fetch = require('node-fetch');

async function testAdminAPI() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🔍 测试管理页面API功能...\n');

  try {
    // 1. 测试获取兑换码列表
    console.log('1. 测试获取兑换码列表...');
    const getResponse = await fetch(`${baseUrl}/api/invite-code/supabase`);
    const getResult = await getResponse.json();
    
    console.log('响应状态:', getResponse.status);
    console.log('响应数据:', JSON.stringify(getResult, null, 2));
    
    if (getResult.success && getResult.data) {
      console.log(`✅ 成功获取 ${getResult.data.length} 个兑换码`);
      
      // 显示前3个兑换码的详细信息
      getResult.data.slice(0, 3).forEach((code, index) => {
        console.log(`  ${index + 1}. 兑换码: ${code.code}`);
        console.log(`     状态: ${code.status}`);
        console.log(`     创建时间: ${code.created_at}`);
        console.log(`     备注: ${code.remarks || '无'}`);
        console.log('');
      });
    } else {
      console.log('❌ 获取兑换码失败');
    }

    // 2. 测试生成新兑换码
    console.log('\n2. 测试生成新兑换码...');
    const createResponse = await fetch(`${baseUrl}/api/invite-code/supabase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        count: 1,
        remarks: 'API测试生成 ' + new Date().toLocaleString()
      })
    });
    
    const createResult = await createResponse.json();
    
    console.log('响应状态:', createResponse.status);
    console.log('响应数据:', JSON.stringify(createResult, null, 2));
    
    if (createResult.success) {
      console.log('✅ 兑换码生成成功');
      if (createResult.data && createResult.data.length > 0) {
        console.log(`新兑换码: ${createResult.data[0].code}`);
      }
    } else {
      console.log('❌ 兑换码生成失败');
    }

    // 3. 再次获取列表验证新兑换码
    console.log('\n3. 验证新兑换码是否出现在列表中...');
    const verifyResponse = await fetch(`${baseUrl}/api/invite-code/supabase`);
    const verifyResult = await verifyResponse.json();
    
    if (verifyResult.success && verifyResult.data) {
      console.log(`✅ 验证成功，当前共有 ${verifyResult.data.length} 个兑换码`);
      
      // 显示最新的兑换码
      const latestCode = verifyResult.data[0];
      console.log('最新兑换码信息:');
      console.log(`  兑换码: ${latestCode.code}`);
      console.log(`  状态: ${latestCode.status}`);
      console.log(`  创建时间: ${latestCode.created_at}`);
      console.log(`  备注: ${latestCode.remarks || '无'}`);
    }

  } catch (error) {
    console.error('❌ 测试过程出错:', error.message);
  }
}

testAdminAPI();
