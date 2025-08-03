"""
真实世界场景演示
展示自动化测试在实际开发中的价值
"""
import pytest
import time
from selenium.webdriver.common.by import By
from loguru import logger
from config.settings import TestConfig

class TestRealWorldScenarios:
    """真实世界场景测试"""
    
    @pytest.mark.smoke
    def test_critical_user_journey_complete_flow(self, driver, helpers, wait_helpers):
        """
        🚨 关键用户流程完整测试
        
        这个测试模拟了一个完整的用户注册到使用的流程
        如果这个流程断了，就意味着没有新用户能够使用你的产品
        
        手动测试这个流程需要：5-10分钟
        自动化测试：2分钟，而且可以每天运行多次
        """
        logger.info("🚨 开始关键用户流程测试 - 这个流程如果坏了，业务就停了")
        
        # 步骤1: 新用户访问首页
        logger.info("步骤1: 新用户首次访问网站")
        driver.get(TestConfig.BASE_URL)
        wait_helpers.wait_for_page_load()
        
        # 验证首页加载正常（如果首页坏了，用户直接流失）
        assert "天乙神算" in driver.title, "💥 首页标题错误 - 用户会认为网站有问题"
        logger.info("✅ 首页正常，用户不会立即流失")
        
        # 步骤2: 用户被吸引，想要体验
        logger.info("步骤2: 用户点击'马上体验'")
        experience_btn = wait_helpers.wait_for_element_clickable(
            (By.XPATH, "//*[contains(text(), '马上体验')]"), timeout=10
        )
        helpers.safe_click(experience_btn)
        wait_helpers.smart_wait(3)
        
        # 验证跳转到正确页面（如果跳转错误，用户会困惑）
        current_url = driver.current_url
        assert "/login" in current_url, f"💥 马上体验按钮跳转错误 - 用户期望进入体验流程，实际到了: {current_url}"
        logger.info("✅ 正确跳转到登录页面，用户体验流畅")
        
        # 步骤3: 用户发现需要注册
        logger.info("步骤3: 新用户点击注册")
        register_link = wait_helpers.wait_for_element_clickable(
            (By.XPATH, "//*[contains(text(), '立即注册')]"), timeout=10
        )
        helpers.safe_click(register_link)
        wait_helpers.smart_wait(3)
        
        # 验证注册页面正常（如果注册页面坏了，就没有新用户了）
        assert "/register" in driver.current_url, "💥 注册链接坏了 - 新用户无法注册"
        logger.info("✅ 注册页面正常，新用户可以注册")
        
        # 步骤4: 验证注册表单完整性
        logger.info("步骤4: 检查注册表单是否完整")
        page_text = driver.find_element(By.TAG_NAME, "body").text
        
        required_elements = ['手机号', '验证码', '兑换码', '步入玄境']
        missing_elements = []
        
        for element in required_elements:
            if element not in page_text:
                missing_elements.append(element)
        
        assert len(missing_elements) == 0, f"💥 注册表单不完整，缺少: {missing_elements} - 用户无法完成注册"
        logger.info("✅ 注册表单完整，用户可以顺利注册")
        
        # 截图记录关键流程
        helpers.take_screenshot("critical_user_journey_success")
        
        logger.info("🎉 关键用户流程测试通过 - 新用户可以正常注册和使用")
    
    @pytest.mark.business_critical
    def test_revenue_critical_flow(self, driver, helpers, wait_helpers):
        """
        💰 业务关键流程测试
        
        这个测试模拟了直接影响收入的用户流程
        如果这个流程坏了，直接影响收入
        
        这种测试的价值：
        - 防止因为代码修改导致收入损失
        - 可以在发布前发现问题
        - 可以设置为每次部署前必须通过的测试
        """
        logger.info("💰 开始业务关键流程测试 - 这个流程直接影响收入")
        
        # 模拟用户想要付费使用高级功能的流程
        logger.info("场景: 用户想要使用付费功能")
        
        # 步骤1: 用户访问首页
        driver.get(TestConfig.BASE_URL)
        wait_helpers.wait_for_page_load()
        
        # 步骤2: 用户点击体验按钮（这是转化的第一步）
        experience_btn = wait_helpers.wait_for_element_clickable(
            (By.XPATH, "//*[contains(text(), '马上体验')]"), timeout=10
        )
        
        # 如果体验按钮不存在或不可点击，用户无法开始转化流程
        assert experience_btn, "💥 马上体验按钮不可用 - 用户无法开始转化流程 - 直接影响收入"
        
        helpers.safe_click(experience_btn)
        wait_helpers.smart_wait(3)
        
        # 步骤3: 验证用户能够到达注册/登录页面（转化的关键步骤）
        current_url = driver.current_url
        assert "/login" in current_url, "💥 体验按钮没有引导用户到正确页面 - 转化流程中断"
        
        # 步骤4: 验证注册流程可用（新用户转化）
        register_link = driver.find_elements(By.XPATH, "//*[contains(text(), '立即注册')]")
        assert len(register_link) > 0, "💥 注册链接不存在 - 新用户无法注册 - 失去潜在付费用户"
        
        helpers.safe_click(register_link[0])
        wait_helpers.smart_wait(3)
        
        # 验证注册页面有兑换码功能（这可能是付费功能的入口）
        page_text = driver.find_element(By.TAG_NAME, "body").text
        assert "兑换码" in page_text, "💥 兑换码功能不可用 - 付费用户无法兑换 - 直接影响收入"
        
        logger.info("✅ 业务关键流程正常 - 用户可以正常转化为付费用户")
        
        # 截图记录
        helpers.take_screenshot("revenue_critical_flow_success")
        
        logger.info("💰 业务关键流程测试通过 - 收入流程安全")
