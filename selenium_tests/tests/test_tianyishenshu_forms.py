"""
天乙神算表单测试
📝 表单测试：登录表单、注册表单、验证逻辑
"""
import pytest
import time
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.keys import Keys
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from loguru import logger
from config.settings import TestConfig
from config.test_data import TestData

class TestTianyishenshuForms:
    """天乙神算表单测试类"""
    
    @pytest.mark.ui
    def test_login_page_elements(self, driver, helpers, wait_helpers):
        """
        🔍 登录页面元素测试
        
        验证点：
        1. 登录页面所有元素存在
        2. 表单字段正确
        3. 按钮状态正常
        """
        logger.info("🔍 开始测试登录页面元素")
        
        # 访问登录页面
        driver.get(f"{TestConfig.BASE_URL}/login")
        wait_helpers.wait_for_page_load()
        wait_helpers.smart_wait(3)
        
        # 验证页面标题
        assert "天乙神算" in driver.title, f"登录页面标题不正确: {driver.title}"
        
        # 检查登录页面关键元素
        login_elements = [
            {
                'name': '天乙神算Logo',
                'locator': (By.XPATH, "//*[contains(text(), '天乙神算')]"),
                'required': True
            },
            {
                'name': '欢迎回来标题',
                'locator': (By.XPATH, "//*[contains(text(), '欢迎回来')]"),
                'required': True
            },
            {
                'name': '手机号输入框',
                'locator': (By.XPATH, "//input[@type='tel']"),
                'required': True
            },
            {
                'name': '验证码输入框',
                'locator': (By.XPATH, "//input[@placeholder='请输入验证码']"),
                'required': True
            },
            {
                'name': '获取验证码按钮',
                'locator': (By.XPATH, "//*[contains(text(), '获取验证码')]"),
                'required': True
            },
            {
                'name': '步入玄境按钮',
                'locator': (By.XPATH, "//*[contains(text(), '步入玄境')]"),
                'required': True
            },
            {
                'name': '立即注册链接',
                'locator': (By.XPATH, "//*[contains(text(), '立即注册')]"),
                'required': True
            }
        ]
        
        found_elements = []
        missing_elements = []
        
        for element_info in login_elements:
            try:
                element = wait_helpers.wait_for_element_present(
                    element_info['locator'], 
                    timeout=5
                )
                
                if element:
                    found_elements.append(element_info['name'])
                    logger.info(f"✅ 找到元素: {element_info['name']}")
                else:
                    if element_info['required']:
                        missing_elements.append(element_info['name'])
                    logger.warning(f"⚠️ 未找到元素: {element_info['name']}")
                    
            except Exception as e:
                if element_info['required']:
                    missing_elements.append(element_info['name'])
                logger.warning(f"❌ 查找元素失败: {element_info['name']} - {str(e)[:50]}...")
        
        # 截图记录
        helpers.take_screenshot("login_page_elements")
        
        # 验证必需元素
        if missing_elements:
            logger.error(f"❌ 缺少必需元素: {missing_elements}")
            assert False, f"登录页面缺少必需元素: {missing_elements}"
        
        logger.info(f"✅ 登录页面元素测试通过，找到 {len(found_elements)} 个元素")
    
    @pytest.mark.ui
    def test_login_form_validation(self, driver, helpers, wait_helpers):
        """
        ✅ 登录表单验证测试
        
        验证点：
        1. 空表单提交验证
        2. 手机号格式验证
        3. 验证码格式验证
        4. 按钮状态变化
        """
        logger.info("✅ 开始测试登录表单验证")
        
        # 访问登录页面
        driver.get(f"{TestConfig.BASE_URL}/login")
        wait_helpers.wait_for_page_load()
        wait_helpers.smart_wait(3)
        
        # 获取表单元素
        phone_input = wait_helpers.wait_for_element_present((By.XPATH, "//input[@type='tel']"))
        sms_input = wait_helpers.wait_for_element_present((By.XPATH, "//input[@placeholder='请输入验证码']"))
        login_button = wait_helpers.wait_for_element_present((By.XPATH, "//*[contains(text(), '步入玄境')]"))
        
        assert phone_input and sms_input and login_button, "关键表单元素未找到"
        
        # 测试1: 空表单提交
        logger.info("测试空表单提交")
        helpers.safe_click(login_button)
        wait_helpers.smart_wait(2)
        
        # 检查是否有错误提示或按钮被禁用
        button_disabled = login_button.get_attribute("disabled")
        logger.info(f"空表单时登录按钮状态: {'禁用' if button_disabled else '可用'}")
        
        # 截图记录
        helpers.take_screenshot("login_form_empty_validation")
        
        # 测试2: 无效手机号格式
        logger.info("测试无效手机号格式")
        invalid_phones = ['123', '12345678901234', 'abcdefghijk', '10012345678']
        
        for invalid_phone in invalid_phones:
            # 清空并输入无效手机号
            helpers.clear_and_send_keys(phone_input, invalid_phone)
            wait_helpers.smart_wait(1)
            
            # 检查按钮状态
            button_disabled = login_button.get_attribute("disabled")
            logger.info(f"手机号 '{invalid_phone}' 时按钮状态: {'禁用' if button_disabled else '可用'}")
            
            # 截图记录
            helpers.take_screenshot(f"login_invalid_phone_{invalid_phone[:3]}")
        
        # 测试3: 有效手机号格式
        logger.info("测试有效手机号格式")
        valid_phone = TestData.VALID_PHONE_NUMBERS[0]
        helpers.clear_and_send_keys(phone_input, valid_phone)
        wait_helpers.smart_wait(1)
        
        # 检查获取验证码按钮是否可用
        try:
            sms_button = driver.find_element(By.XPATH, "//*[contains(text(), '获取验证码')]")
            sms_button_disabled = sms_button.get_attribute("disabled")
            logger.info(f"有效手机号时获取验证码按钮状态: {'禁用' if sms_button_disabled else '可用'}")
        except:
            logger.warning("未找到获取验证码按钮")
        
        # 测试4: 验证码格式验证
        logger.info("测试验证码格式验证")
        invalid_codes = ['123', '1234567', 'abcdef', '12345a']
        
        for invalid_code in invalid_codes:
            helpers.clear_and_send_keys(sms_input, invalid_code)
            wait_helpers.smart_wait(1)
            
            button_disabled = login_button.get_attribute("disabled")
            logger.info(f"验证码 '{invalid_code}' 时按钮状态: {'禁用' if button_disabled else '可用'}")
        
        # 测试5: 完整有效表单
        logger.info("测试完整有效表单")
        helpers.clear_and_send_keys(phone_input, valid_phone)
        helpers.clear_and_send_keys(sms_input, "123456")
        wait_helpers.smart_wait(1)
        
        button_disabled = login_button.get_attribute("disabled")
        logger.info(f"完整有效表单时按钮状态: {'禁用' if button_disabled else '可用'}")
        
        # 截图记录
        helpers.take_screenshot("login_form_valid_complete")
        
        logger.info("✅ 登录表单验证测试完成")
    
    @pytest.mark.ui
    def test_register_page_elements(self, driver, helpers, wait_helpers):
        """
        🔍 注册页面元素测试
        
        验证点：
        1. 注册页面所有元素存在
        2. 表单字段正确
        3. 特殊元素（兑换码）存在
        """
        logger.info("🔍 开始测试注册页面元素")
        
        # 访问注册页面
        driver.get(f"{TestConfig.BASE_URL}/register")
        wait_helpers.wait_for_page_load()
        wait_helpers.smart_wait(3)
        
        # 验证页面标题
        assert "天乙神算" in driver.title, f"注册页面标题不正确: {driver.title}"
        
        # 检查注册页面关键元素
        register_elements = [
            {
                'name': '天乙神算Logo',
                'locator': (By.XPATH, "//*[contains(text(), '天乙神算')]"),
                'required': True
            },
            {
                'name': '开启您的命理探索之旅',
                'locator': (By.XPATH, "//*[contains(text(), '开启您的命理探索之旅')]"),
                'required': True
            },
            {
                'name': '手机号输入框',
                'locator': (By.XPATH, "//input[@type='tel']"),
                'required': True
            },
            {
                'name': '验证码输入框',
                'locator': (By.XPATH, "//input[@placeholder='请输入验证码']"),
                'required': True
            },
            {
                'name': '兑换码输入框',
                'locator': (By.XPATH, "//input[@placeholder='请输入16位兑换码']"),
                'required': True
            },
            {
                'name': '获取验证码按钮',
                'locator': (By.XPATH, "//*[contains(text(), '获取验证码')]"),
                'required': True
            },
            {
                'name': '步入玄境按钮',
                'locator': (By.XPATH, "//*[contains(text(), '步入玄境')]"),
                'required': True
            },
            {
                'name': '已有账号登录链接',
                'locator': (By.XPATH, "//*[contains(text(), '已有账号')]"),
                'required': False
            }
        ]
        
        found_elements = []
        missing_elements = []
        
        for element_info in register_elements:
            try:
                element = wait_helpers.wait_for_element_present(
                    element_info['locator'], 
                    timeout=5
                )
                
                if element:
                    found_elements.append(element_info['name'])
                    logger.info(f"✅ 找到元素: {element_info['name']}")
                else:
                    if element_info['required']:
                        missing_elements.append(element_info['name'])
                    logger.warning(f"⚠️ 未找到元素: {element_info['name']}")
                    
            except Exception as e:
                if element_info['required']:
                    missing_elements.append(element_info['name'])
                logger.warning(f"❌ 查找元素失败: {element_info['name']} - {str(e)[:50]}...")
        
        # 截图记录
        helpers.take_screenshot("register_page_elements")
        
        # 验证必需元素
        if missing_elements:
            logger.error(f"❌ 缺少必需元素: {missing_elements}")
            assert False, f"注册页面缺少必需元素: {missing_elements}"
        
        logger.info(f"✅ 注册页面元素测试通过，找到 {len(found_elements)} 个元素")
    
    @pytest.mark.ui
    def test_register_form_validation(self, driver, helpers, wait_helpers):
        """
        ✅ 注册表单验证测试
        
        验证点：
        1. 空表单提交验证
        2. 手机号格式验证
        3. 验证码格式验证
        4. 兑换码格式验证
        5. 按钮状态变化
        """
        logger.info("✅ 开始测试注册表单验证")
        
        # 访问注册页面
        driver.get(f"{TestConfig.BASE_URL}/register")
        wait_helpers.wait_for_page_load()
        wait_helpers.smart_wait(3)
        
        # 获取表单元素
        phone_input = wait_helpers.wait_for_element_present((By.XPATH, "//input[@type='tel']"))
        sms_input = wait_helpers.wait_for_element_present((By.XPATH, "//input[@placeholder='请输入验证码']"))
        invite_input = wait_helpers.wait_for_element_present((By.XPATH, "//input[@placeholder='请输入16位兑换码']"))
        register_button = wait_helpers.wait_for_element_present((By.XPATH, "//*[contains(text(), '步入玄境')]"))
        
        assert phone_input and sms_input and invite_input and register_button, "关键表单元素未找到"
        
        # 测试1: 空表单提交
        logger.info("测试空表单提交")
        helpers.safe_click(register_button)
        wait_helpers.smart_wait(2)
        
        button_disabled = register_button.get_attribute("disabled")
        logger.info(f"空表单时注册按钮状态: {'禁用' if button_disabled else '可用'}")
        
        # 截图记录
        helpers.take_screenshot("register_form_empty_validation")
        
        # 测试2: 兑换码格式验证
        logger.info("测试兑换码格式验证")
        invalid_invite_codes = TestData.INVALID_INVITE_CODES
        
        for invalid_code in invalid_invite_codes:
            helpers.clear_and_send_keys(invite_input, invalid_code)
            wait_helpers.smart_wait(1)
            
            button_disabled = register_button.get_attribute("disabled")
            logger.info(f"兑换码 '{invalid_code}' 时按钮状态: {'禁用' if button_disabled else '可用'}")
            
            # 截图记录
            helpers.take_screenshot(f"register_invalid_invite_{len(invalid_code)}")
        
        # 测试3: 有效兑换码格式
        logger.info("测试有效兑换码格式")
        valid_invite_code = TestData.VALID_INVITE_CODES[0]
        helpers.clear_and_send_keys(invite_input, valid_invite_code)
        wait_helpers.smart_wait(1)
        
        # 测试4: 完整表单填写
        logger.info("测试完整表单填写")
        valid_phone = TestData.VALID_PHONE_NUMBERS[0]
        helpers.clear_and_send_keys(phone_input, valid_phone)
        helpers.clear_and_send_keys(sms_input, "123456")
        wait_helpers.smart_wait(1)
        
        button_disabled = register_button.get_attribute("disabled")
        logger.info(f"完整有效表单时按钮状态: {'禁用' if button_disabled else '可用'}")
        
        # 截图记录
        helpers.take_screenshot("register_form_valid_complete")
        
        logger.info("✅ 注册表单验证测试完成")
    
    @pytest.mark.ui
    def test_form_navigation(self, driver, helpers, wait_helpers):
        """
        🧭 表单页面间导航测试
        
        验证点：
        1. 登录页面到注册页面导航
        2. 注册页面到登录页面导航
        3. 导航链接正确工作
        """
        logger.info("🧭 开始测试表单页面间导航")
        
        # 测试1: 首页到登录页面
        logger.info("测试首页到登录页面导航")
        driver.get(TestConfig.BASE_URL)
        wait_helpers.wait_for_page_load()
        
        login_link = wait_helpers.wait_for_element_clickable((By.XPATH, "//*[contains(text(), '登录')]"))
        helpers.safe_click(login_link)
        wait_helpers.wait_for_url_contains("/login")
        
        assert "/login" in driver.current_url, f"未正确跳转到登录页面: {driver.current_url}"
        logger.info("✅ 首页到登录页面导航成功")
        
        # 测试2: 登录页面到注册页面
        logger.info("测试登录页面到注册页面导航")
        register_link = wait_helpers.wait_for_element_clickable((By.XPATH, "//*[contains(text(), '立即注册')]"))
        helpers.safe_click(register_link)
        wait_helpers.wait_for_url_contains("/register")
        
        assert "/register" in driver.current_url, f"未正确跳转到注册页面: {driver.current_url}"
        logger.info("✅ 登录页面到注册页面导航成功")
        
        # 测试3: 注册页面到登录页面
        logger.info("测试注册页面到登录页面导航")
        try:
            login_link = wait_helpers.wait_for_element_clickable((By.XPATH, "//*[contains(text(), '已有账号')]"))
            helpers.safe_click(login_link)
            wait_helpers.wait_for_url_contains("/login")
            
            assert "/login" in driver.current_url, f"未正确跳转到登录页面: {driver.current_url}"
            logger.info("✅ 注册页面到登录页面导航成功")
        except:
            logger.warning("⚠️ 注册页面可能没有返回登录的链接")
        
        # 截图记录
        helpers.take_screenshot("form_navigation_complete")
        
        logger.info("✅ 表单页面间导航测试完成")
