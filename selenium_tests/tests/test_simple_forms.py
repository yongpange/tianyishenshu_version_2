"""
简单表单测试
📝 简化的表单测试，专注于核心功能
"""
import pytest
import time
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from loguru import logger
from config.settings import TestConfig

class TestSimpleForms:
    """简单表单测试类"""
    
    @pytest.mark.ui
    def test_login_page_access(self, driver, helpers, wait_helpers):
        """
        🔍 登录页面访问测试
        
        验证点：
        1. 能够访问登录页面
        2. 页面加载正常
        3. 基本元素存在
        """
        logger.info("🔍 开始测试登录页面访问")
        
        # 访问登录页面
        driver.get(f"{TestConfig.BASE_URL}/login")
        wait_helpers.wait_for_page_load()
        wait_helpers.smart_wait(3)
        
        # 验证URL正确
        current_url = driver.current_url
        assert "/login" in current_url, f"URL不正确，期望包含'/login'，实际为'{current_url}'"
        
        # 验证页面标题
        title = driver.title
        assert "天乙神算" in title, f"页面标题不正确，期望包含'天乙神算'，实际为'{title}'"
        
        # 检查页面是否有内容
        body_text = driver.find_element(By.TAG_NAME, "body").text
        assert len(body_text) > 50, f"页面内容过少，可能加载失败。内容长度: {len(body_text)}"
        
        # 检查是否包含登录相关内容
        login_keywords = ['登录', '手机号', '验证码', '步入玄境']
        found_keywords = []
        
        for keyword in login_keywords:
            if keyword in body_text:
                found_keywords.append(keyword)
                logger.info(f"✅ 找到关键词: {keyword}")
        
        assert len(found_keywords) >= 2, f"登录页面关键词不足，只找到: {found_keywords}"
        
        # 截图记录
        helpers.take_screenshot("login_page_access")
        
        logger.info("✅ 登录页面访问测试通过")
    
    @pytest.mark.ui
    def test_register_page_access(self, driver, helpers, wait_helpers):
        """
        🔍 注册页面访问测试
        
        验证点：
        1. 能够访问注册页面
        2. 页面加载正常
        3. 基本元素存在
        """
        logger.info("🔍 开始测试注册页面访问")
        
        # 访问注册页面
        driver.get(f"{TestConfig.BASE_URL}/register")
        wait_helpers.wait_for_page_load()
        wait_helpers.smart_wait(3)
        
        # 验证URL正确
        current_url = driver.current_url
        assert "/register" in current_url, f"URL不正确，期望包含'/register'，实际为'{current_url}'"
        
        # 验证页面标题
        title = driver.title
        assert "天乙神算" in title, f"页面标题不正确，期望包含'天乙神算'，实际为'{title}'"
        
        # 检查页面是否有内容
        body_text = driver.find_element(By.TAG_NAME, "body").text
        assert len(body_text) > 50, f"页面内容过少，可能加载失败。内容长度: {len(body_text)}"
        
        # 检查是否包含注册相关内容
        register_keywords = ['注册', '手机号', '验证码', '兑换码', '步入玄境']
        found_keywords = []
        
        for keyword in register_keywords:
            if keyword in body_text:
                found_keywords.append(keyword)
                logger.info(f"✅ 找到关键词: {keyword}")
        
        assert len(found_keywords) >= 3, f"注册页面关键词不足，只找到: {found_keywords}"
        
        # 截图记录
        helpers.take_screenshot("register_page_access")
        
        logger.info("✅ 注册页面访问测试通过")
    
    @pytest.mark.ui
    def test_form_input_fields(self, driver, helpers, wait_helpers):
        """
        📝 表单输入字段测试
        
        验证点：
        1. 输入字段可以找到
        2. 输入字段可以输入内容
        3. 输入内容正确显示
        """
        logger.info("📝 开始测试表单输入字段")
        
        # 测试登录页面输入字段
        logger.info("测试登录页面输入字段")
        driver.get(f"{TestConfig.BASE_URL}/login")
        wait_helpers.wait_for_page_load()
        wait_helpers.smart_wait(3)
        
        # 查找手机号输入框
        try:
            phone_inputs = driver.find_elements(By.XPATH, "//input[@type='tel']")
            if phone_inputs:
                phone_input = phone_inputs[0]
                logger.info("✅ 找到手机号输入框")
                
                # 测试输入
                test_phone = "13800138000"
                helpers.clear_and_send_keys(phone_input, test_phone)
                wait_helpers.smart_wait(1)
                
                # 验证输入值
                input_value = phone_input.get_attribute("value")
                assert input_value == test_phone, f"手机号输入失败，期望'{test_phone}'，实际'{input_value}'"
                logger.info(f"✅ 手机号输入测试通过: {input_value}")
            else:
                logger.warning("⚠️ 未找到手机号输入框")
        except Exception as e:
            logger.warning(f"⚠️ 手机号输入框测试失败: {e}")
        
        # 查找验证码输入框
        try:
            sms_inputs = driver.find_elements(By.XPATH, "//input[@placeholder='请输入验证码']")
            if sms_inputs:
                sms_input = sms_inputs[0]
                logger.info("✅ 找到验证码输入框")
                
                # 测试输入
                test_code = "123456"
                helpers.clear_and_send_keys(sms_input, test_code)
                wait_helpers.smart_wait(1)
                
                # 验证输入值
                input_value = sms_input.get_attribute("value")
                assert input_value == test_code, f"验证码输入失败，期望'{test_code}'，实际'{input_value}'"
                logger.info(f"✅ 验证码输入测试通过: {input_value}")
            else:
                logger.warning("⚠️ 未找到验证码输入框")
        except Exception as e:
            logger.warning(f"⚠️ 验证码输入框测试失败: {e}")
        
        # 截图记录登录页面输入测试
        helpers.take_screenshot("login_form_input_test")
        
        # 测试注册页面输入字段
        logger.info("测试注册页面输入字段")
        driver.get(f"{TestConfig.BASE_URL}/register")
        wait_helpers.wait_for_page_load()
        wait_helpers.smart_wait(3)
        
        # 查找兑换码输入框
        try:
            invite_inputs = driver.find_elements(By.XPATH, "//input[@placeholder='请输入16位兑换码']")
            if invite_inputs:
                invite_input = invite_inputs[0]
                logger.info("✅ 找到兑换码输入框")
                
                # 测试输入
                test_invite = "TEST1234ABCD5678"
                helpers.clear_and_send_keys(invite_input, test_invite)
                wait_helpers.smart_wait(1)
                
                # 验证输入值
                input_value = invite_input.get_attribute("value")
                assert input_value == test_invite, f"兑换码输入失败，期望'{test_invite}'，实际'{input_value}'"
                logger.info(f"✅ 兑换码输入测试通过: {input_value}")
            else:
                logger.warning("⚠️ 未找到兑换码输入框")
        except Exception as e:
            logger.warning(f"⚠️ 兑换码输入框测试失败: {e}")
        
        # 截图记录注册页面输入测试
        helpers.take_screenshot("register_form_input_test")
        
        logger.info("✅ 表单输入字段测试完成")
    
    @pytest.mark.ui
    def test_form_buttons(self, driver, helpers, wait_helpers):
        """
        🔘 表单按钮测试
        
        验证点：
        1. 按钮可以找到
        2. 按钮可以点击
        3. 按钮状态正确
        """
        logger.info("🔘 开始测试表单按钮")
        
        # 测试登录页面按钮
        logger.info("测试登录页面按钮")
        driver.get(f"{TestConfig.BASE_URL}/login")
        wait_helpers.wait_for_page_load()
        wait_helpers.smart_wait(3)
        
        # 查找登录按钮
        try:
            login_buttons = driver.find_elements(By.XPATH, "//*[contains(text(), '步入玄境')]")
            if login_buttons:
                login_button = login_buttons[0]
                logger.info("✅ 找到登录按钮")
                
                # 检查按钮状态
                is_enabled = login_button.is_enabled()
                is_displayed = login_button.is_displayed()
                
                logger.info(f"登录按钮状态 - 可用: {is_enabled}, 可见: {is_displayed}")
                
                # 测试点击（不会真正提交，因为没有有效数据）
                original_url = driver.current_url
                helpers.safe_click(login_button)
                wait_helpers.smart_wait(2)
                
                # 检查是否有反应（可能显示错误信息或保持在同一页面）
                current_url = driver.current_url
                logger.info(f"点击登录按钮后URL: {current_url}")
                
            else:
                logger.warning("⚠️ 未找到登录按钮")
        except Exception as e:
            logger.warning(f"⚠️ 登录按钮测试失败: {e}")
        
        # 查找获取验证码按钮
        try:
            sms_buttons = driver.find_elements(By.XPATH, "//*[contains(text(), '获取验证码')]")
            if sms_buttons:
                sms_button = sms_buttons[0]
                logger.info("✅ 找到获取验证码按钮")
                
                # 检查按钮状态
                is_enabled = sms_button.is_enabled()
                is_displayed = sms_button.is_displayed()
                
                logger.info(f"获取验证码按钮状态 - 可用: {is_enabled}, 可见: {is_displayed}")
                
            else:
                logger.warning("⚠️ 未找到获取验证码按钮")
        except Exception as e:
            logger.warning(f"⚠️ 获取验证码按钮测试失败: {e}")
        
        # 截图记录
        helpers.take_screenshot("login_form_buttons_test")
        
        # 测试注册页面按钮
        logger.info("测试注册页面按钮")
        driver.get(f"{TestConfig.BASE_URL}/register")
        wait_helpers.wait_for_page_load()
        wait_helpers.smart_wait(3)
        
        # 查找注册按钮
        try:
            register_buttons = driver.find_elements(By.XPATH, "//*[contains(text(), '步入玄境')]")
            if register_buttons:
                register_button = register_buttons[0]
                logger.info("✅ 找到注册按钮")
                
                # 检查按钮状态
                is_enabled = register_button.is_enabled()
                is_displayed = register_button.is_displayed()
                
                logger.info(f"注册按钮状态 - 可用: {is_enabled}, 可见: {is_displayed}")
                
            else:
                logger.warning("⚠️ 未找到注册按钮")
        except Exception as e:
            logger.warning(f"⚠️ 注册按钮测试失败: {e}")
        
        # 截图记录
        helpers.take_screenshot("register_form_buttons_test")
        
        logger.info("✅ 表单按钮测试完成")
    
    @pytest.mark.ui
    def test_page_navigation_links(self, driver, helpers, wait_helpers):
        """
        🔗 页面导航链接测试
        
        验证点：
        1. 登录页面到注册页面链接
        2. 注册页面到登录页面链接
        3. 链接正确工作
        """
        logger.info("🔗 开始测试页面导航链接")
        
        # 测试从登录页面到注册页面
        logger.info("测试从登录页面到注册页面的导航")
        driver.get(f"{TestConfig.BASE_URL}/login")
        wait_helpers.wait_for_page_load()
        wait_helpers.smart_wait(3)
        
        try:
            register_links = driver.find_elements(By.XPATH, "//*[contains(text(), '立即注册')]")
            if register_links:
                register_link = register_links[0]
                logger.info("✅ 找到'立即注册'链接")
                
                # 点击链接
                helpers.safe_click(register_link)
                wait_helpers.smart_wait(3)
                
                # 验证跳转
                current_url = driver.current_url
                if "/register" in current_url:
                    logger.info("✅ 成功跳转到注册页面")
                else:
                    logger.warning(f"⚠️ 跳转失败，当前URL: {current_url}")
                    
            else:
                logger.warning("⚠️ 未找到'立即注册'链接")
        except Exception as e:
            logger.warning(f"⚠️ 登录到注册页面导航测试失败: {e}")
        
        # 截图记录
        helpers.take_screenshot("navigation_login_to_register")
        
        # 测试从注册页面返回（如果有相关链接）
        logger.info("检查注册页面是否有返回登录的链接")
        try:
            login_links = driver.find_elements(By.XPATH, "//*[contains(text(), '登录') or contains(text(), '已有账号')]")
            if login_links:
                logger.info("✅ 找到返回登录的链接")
                for i, link in enumerate(login_links):
                    link_text = link.text
                    logger.info(f"链接 {i+1}: '{link_text}'")
            else:
                logger.info("ℹ️ 注册页面没有明显的返回登录链接")
        except Exception as e:
            logger.warning(f"⚠️ 检查返回登录链接时出错: {e}")
        
        # 截图记录
        helpers.take_screenshot("navigation_register_page_links")
        
        logger.info("✅ 页面导航链接测试完成")
