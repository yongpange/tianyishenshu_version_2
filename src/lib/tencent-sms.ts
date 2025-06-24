// 腾讯云短信服务配置
export interface TencentSmsConfig {
  secretId: string
  secretKey: string
  appId: string
  signName: string
  templateId: string
}

// 默认配置（从环境变量读取）
export const tencentSmsConfig: TencentSmsConfig = {
  secretId: process.env.TENCENT_SECRET_ID || '',
  secretKey: process.env.TENCENT_SECRET_KEY || '',
  appId: process.env.TENCENT_SMS_APP_ID || '',
  signName: process.env.TENCENT_SMS_SIGN_NAME || '天乙神数',
  templateId: process.env.TENCENT_SMS_TEMPLATE_ID || ''
}

// 发送短信验证码
export async function sendSmsCode(phone: string, code: string): Promise<boolean> {
  try {
    // 检查环境变量配置
    console.log('🔧 环境变量检查:', {
      secretId: tencentSmsConfig.secretId ? `${tencentSmsConfig.secretId.substring(0, 10)}...` : '未设置',
      secretKey: tencentSmsConfig.secretKey ? '已设置' : '未设置',
      appId: tencentSmsConfig.appId || '未设置',
      signName: tencentSmsConfig.signName || '未设置',
      templateId: tencentSmsConfig.templateId || '未设置'
    })

    // 🚧 临时注释：运营商审核期间强制使用模拟发送
    console.warn('🚧 运营商审核期间，强制使用模拟发送')
    console.log(`📱 模拟发送短信: 手机号 ${phone}, 验证码 ${code}`)
    console.log(`【${tencentSmsConfig.signName}】您的验证码是${code}，5分钟内有效，请勿泄露给他人。`)
    await new Promise(resolve => setTimeout(resolve, 1000))
    return true

    /* 🚧 临时注释掉腾讯云真实发送代码 - 运营商审核期间
    // 检查必要配置是否完整
    if (!tencentSmsConfig.secretId || !tencentSmsConfig.secretKey || 
        !tencentSmsConfig.appId || !tencentSmsConfig.templateId) {
      console.warn('⚠️ 腾讯云配置不完整，使用模拟发送')
      
      // 模拟发送
      console.log(`📱 模拟发送短信: 手机号 ${phone}, 验证码 ${code}`)
      console.log(`【${tencentSmsConfig.signName}】您的验证码是${code}，5分钟内有效，请勿泄露给他人。`)
      
      // 模拟延迟
      await new Promise(resolve => setTimeout(resolve, 1000))
      return true
    }

    // 尝试导入腾讯云SDK
    console.log('📦 正在导入腾讯云SDK...')
    
    try {
      const tencentcloud = require('tencentcloud-sdk-nodejs-sms')
      console.log('✅ SDK导入成功，版本信息:', {
        hasV20210111: !!tencentcloud.sms?.v20210111,
        hasClient: !!(tencentcloud.sms?.v20210111?.Client),
        sdkKeys: Object.keys(tencentcloud)
      })
      
      if (!tencentcloud.sms?.v20210111?.Client) {
        throw new Error('SDK版本不匹配或Client类不存在')
      }
      
      const SmsClient = tencentcloud.sms.v20210111.Client
      
      const clientConfig = {
        credential: {
          secretId: tencentSmsConfig.secretId,
          secretKey: tencentSmsConfig.secretKey,
        },
        region: 'ap-beijing',
        profile: {
          httpProfile: {
            endpoint: 'sms.tencentcloudapi.com',
          },
        },
      }

      console.log('🔌 正在创建SMS客户端...')
      const client = new SmsClient(clientConfig)
      
      // 根据模板ID和环境变量确定参数格式
      let templateParams: string[] = [];
      
      // 从环境变量读取模板参数格式，默认只发送验证码
      const templateParamsFormat = process.env.TENCENT_SMS_TEMPLATE_PARAMS || 'code_only';
      
      switch (templateParamsFormat) {
        case 'code_only':
          // 只需要验证码：{1}
          templateParams = [code];
          break;
        case 'code_and_minutes':
          // 验证码+分钟数：{1}, {2}
          templateParams = [code, '5'];
          break;
        case 'code_and_app_name':
          // 验证码+应用名：{1}, {2}
          templateParams = [code, '天乙神数'];
          break;
        default:
          // 默认只发送验证码
          templateParams = [code];
      }
      
      const params = {
        PhoneNumberSet: ['+86' + phone],
        SmsSdkAppId: tencentSmsConfig.appId,
        SignName: tencentSmsConfig.signName,
        TemplateId: tencentSmsConfig.templateId,
        TemplateParamSet: templateParams,
      }

      console.log('📤 正在发送短信，参数:', {
        phone: '+86' + phone,
        appId: tencentSmsConfig.appId,
        signName: tencentSmsConfig.signName,
        templateId: tencentSmsConfig.templateId,
        templateParams: templateParams,
        templateParamsFormat: templateParamsFormat
      })

      const response = await client.SendSms(params)
      console.log('📨 腾讯云短信发送结果:', response)

      // 检查发送结果
      const sendResult = response.SendStatusSet?.[0]
      if (sendResult?.Code === 'Ok') {
        console.log('✅ 短信发送成功!')
        return true
      } else {
        console.error('❌ 短信发送失败:', sendResult?.Message)
        console.log('💡 提示：请检查模板参数格式是否正确')
        
        // 如果是模板参数错误，尝试其他格式
        if (sendResult?.Code === 'FailedOperation.TemplateParamSetNotMatchApprovedTemplate') {
          console.log('🔄 模板参数不匹配，尝试降级到模拟发送...')
          console.log(`📱 模拟发送短信: 手机号 ${phone}, 验证码 ${code}`)
          console.log(`【${tencentSmsConfig.signName}】您的验证码是${code}，5分钟内有效，请勿泄露给他人。`)
          return true
        }
        
        return false
      }
      
    } catch (sdkError) {
      console.error('❌ SDK导入或使用失败:', sdkError)
      
      // 降级到模拟发送
      console.log('🔄 降级到模拟发送...')
      console.log(`📱 模拟发送短信: 手机号 ${phone}, 验证码 ${code}`)
      console.log(`【${tencentSmsConfig.signName}】您的验证码是${code}，5分钟内有效，请勿泄露给他人。`)
      
      await new Promise(resolve => setTimeout(resolve, 1000))
      return true
    }
    */ // 🚧 腾讯云代码注释结束
    
  } catch (error) {
    console.error('💥 发送短信失败:', error)
    return false
  }
}

// 验证手机号格式
export function validatePhoneNumber(phone: string): boolean {
  return /^1[3-9]\d{9}$/.test(phone)
}

// 生成验证码
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// 验证兑换码格式
export function validateInviteCode(code: string): boolean {
  return /^[A-Z0-9]{16}$/.test(code)
} 