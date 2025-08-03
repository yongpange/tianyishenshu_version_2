"""
用户流程测试
🎭 用户流程测试：完整的用户操作流程
"""
import pytest
import time
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains
from loguru import logger
from config.settings import TestConfig

class TestUserJourney:
    """用户流程测试类"""
    
    @pytest.mark.smoke
    def test_complete_user_journey_homepage_to_login(self, driver, helpers, wait_helpers):
        """
        🎭 完整用户流程：首页到登录
        
        模拟用户操作流程：
        1. 访问首页
        2. 浏览首页内容
        3. 点击登录按钮
        4. 到达登录页面
        5. 查看登录表单
        """
        logger.info("🎭 开始测试完整用户流程：首页到登录")
        
        # 步骤1: 访问首页
        logger.info("步骤1: 访问首页")
        driver.get(TestConfig.BASE_URL)
        wait_helpers.wait_for_page_load()
        wait_helpers.smart_wait(3)
        
        # 验证首页加载
        assert "天乙神算" in driver.title, "首页标题不正确"
        logger.info("✅ 首页加载成功")
        
        # 截图记录
        helpers.take_screenshot("user_journey_01_homepage")
        
        # 步骤2: 浏览首页内容（模拟用户滚动浏览）
        logger.info("步骤2: 浏览首页内容")
        
        # 滚动到页面顶部
        helpers.scroll_to_top()
        wait_helpers.smart_wait(1)
        
        # 模拟用户慢慢滚动浏览页面
        for i in range(3):
            driver.execute_script(f"window.scrollTo(0, {(i+1) * 300});")
            wait_helpers.smart_wait(1)
            logger.info(f"浏览页面内容 - 滚动位置 {(i+1) * 300}px")
        
        # 滚动到底部
        helpers.scroll_to_bottom()
        wait_helpers.smart_wait(2)
        
        # 截图记录浏览状态
        helpers.take_screenshot("user_journey_02_browsing")
        
        # 步骤3: 寻找并点击登录按钮
        logger.info("步骤3: 寻找并点击登录按钮")
        
        # 滚动回顶部寻找登录按钮
        helpers.scroll_to_top()
        wait_helpers.smart_wait(2)
        
        # 查找登录按钮
        login_button = wait_helpers.wait_for_element_clickable(
            (By.XPATH, "//*[contains(text(), '登录')]"), 
            timeout=10
        )
        
        assert login_button, "未找到登录按钮"
        logger.info("✅ 找到登录按钮")
        
        # 模拟用户悬停在按钮上（查看效果）
        actions = ActionChains(driver)
        actions.move_to_element(login_button).perform()
        wait_helpers.smart_wait(1)
        
        # 截图记录悬停状态
        helpers.take_screenshot("user_journey_03_login_button_hover")
        
        # 点击登录按钮
        helpers.safe_click(login_button)
        logger.info("✅ 点击登录按钮")
        
        # 步骤4: 等待跳转到登录页面
        logger.info("步骤4: 等待跳转到登录页面")
        wait_helpers.wait_for_url_contains("/login", timeout=10)
        wait_helpers.wait_for_page_load()
        wait_helpers.smart_wait(3)
        
        # 验证到达登录页面
        current_url = driver.current_url
        assert "/login" in current_url, f"未正确跳转到登录页面，当前URL: {current_url}"
        logger.info("✅ 成功跳转到登录页面")
        
        # 截图记录登录页面
        helpers.take_screenshot("user_journey_04_login_page")
        
        # 步骤5: 查看登录表单
        logger.info("步骤5: 查看登录表单")
        
        # 检查登录页面关键元素
        page_text = driver.find_element(By.TAG_NAME, "body").text
        
        expected_elements = ['手机号', '验证码', '步入玄境']
        found_elements = []
        
        for element in expected_elements:
            if element in page_text:
                found_elements.append(element)
                logger.info(f"✅ 找到登录表单元素: {element}")
        
        assert len(found_elements) >= 2, f"登录表单元素不足，只找到: {found_elements}"
        
        # 截图记录最终状态
        helpers.take_screenshot("user_journey_05_login_form_complete")
        
        logger.info("🎉 完整用户流程测试成功：首页 → 登录页面")
    
    @pytest.mark.smoke
    def test_user_journey_registration_flow(self, driver, helpers, wait_helpers):
        """
        🎭 用户注册流程测试
        
        模拟用户操作流程：
        1. 访问首页
        2. 点击注册按钮
        3. 到达注册页面
        4. 查看注册表单
        5. 尝试返回登录
        """
        logger.info("🎭 开始测试用户注册流程")
        
        # 步骤1: 访问首页
        logger.info("步骤1: 访问首页")
        driver.get(TestConfig.BASE_URL)
        wait_helpers.wait_for_page_load()
        wait_helpers.smart_wait(3)
        
        # 截图记录
        helpers.take_screenshot("registration_journey_01_homepage")
        
        # 步骤2: 点击注册按钮
        logger.info("步骤2: 寻找并点击注册按钮")
        
        register_button = wait_helpers.wait_for_element_clickable(
            (By.XPATH, "//*[contains(text(), '注册')]"), 
            timeout=10
        )
        
        assert register_button, "未找到注册按钮"
        logger.info("✅ 找到注册按钮")
        
        # 点击注册按钮
        helpers.safe_click(register_button)
        logger.info("✅ 点击注册按钮")
        
        # 步骤3: 等待跳转到注册页面
        logger.info("步骤3: 等待跳转到注册页面")
        wait_helpers.wait_for_url_contains("/register", timeout=10)
        wait_helpers.wait_for_page_load()
        wait_helpers.smart_wait(3)
        
        # 验证到达注册页面
        current_url = driver.current_url
        assert "/register" in current_url, f"未正确跳转到注册页面，当前URL: {current_url}"
        logger.info("✅ 成功跳转到注册页面")
        
        # 截图记录注册页面
        helpers.take_screenshot("registration_journey_02_register_page")
        
        # 步骤4: 查看注册表单
        logger.info("步骤4: 查看注册表单")
        
        # 检查注册页面关键元素
        page_text = driver.find_element(By.TAG_NAME, "body").text
        
        expected_elements = ['手机号', '验证码', '兑换码', '步入玄境']
        found_elements = []
        
        for element in expected_elements:
            if element in page_text:
                found_elements.append(element)
                logger.info(f"✅ 找到注册表单元素: {element}")
        
        assert len(found_elements) >= 3, f"注册表单元素不足，只找到: {found_elements}"
        
        # 步骤5: 尝试返回登录（如果有相关链接）
        logger.info("步骤5: 查找返回登录的链接")
        
        try:
            login_links = driver.find_elements(By.XPATH, "//*[contains(text(), '登录') or contains(text(), '已有账号')]")
            if login_links:
                logger.info("✅ 找到返回登录的链接")
                
                # 点击返回登录
                helpers.safe_click(login_links[0])
                wait_helpers.smart_wait(3)
                
                # 验证是否返回登录页面
                current_url = driver.current_url
                if "/login" in current_url:
                    logger.info("✅ 成功返回登录页面")
                else:
                    logger.info(f"ℹ️ 点击后当前URL: {current_url}")
            else:
                logger.info("ℹ️ 注册页面没有明显的返回登录链接")
        except Exception as e:
            logger.warning(f"⚠️ 查找返回登录链接时出错: {e}")
        
        # 截图记录最终状态
        helpers.take_screenshot("registration_journey_03_final_state")
        
        logger.info("🎉 用户注册流程测试完成")
    
    @pytest.mark.ui
    def test_user_journey_navigation_exploration(self, driver, helpers, wait_helpers):
        """
        🧭 用户导航探索流程
        
        模拟用户操作流程：
        1. 访问首页
        2. 点击"马上体验"
        3. 探索不同页面
        4. 测试页面间跳转
        """
        logger.info("🧭 开始测试用户导航探索流程")
        
        # 步骤1: 访问首页
        logger.info("步骤1: 访问首页")
        driver.get(TestConfig.BASE_URL)
        wait_helpers.wait_for_page_load()
        wait_helpers.smart_wait(3)
        
        # 记录起始状态
        original_url = driver.current_url
        logger.info(f"起始URL: {original_url}")
        
        # 截图记录
        helpers.take_screenshot("navigation_journey_01_homepage")
        
        # 步骤2: 点击"马上体验"按钮
        logger.info("步骤2: 点击马上体验按钮")
        
        try:
            experience_button = wait_helpers.wait_for_element_clickable(
                (By.XPATH, "//*[contains(text(), '马上体验')]"), 
                timeout=10
            )
            
            if experience_button:
                logger.info("✅ 找到马上体验按钮")
                
                # 点击按钮
                helpers.safe_click(experience_button)
                wait_helpers.smart_wait(3)
                
                # 检查跳转结果
                current_url = driver.current_url
                logger.info(f"点击马上体验后URL: {current_url}")
                
                # 截图记录跳转后状态
                helpers.take_screenshot("navigation_journey_02_after_experience_click")
                
            else:
                logger.warning("⚠️ 未找到马上体验按钮")
                
        except Exception as e:
            logger.warning(f"⚠️ 点击马上体验按钮时出错: {e}")
        
        # 步骤3: 探索当前页面
        logger.info("步骤3: 探索当前页面")
        
        # 获取当前页面信息
        current_title = driver.title
        current_url = driver.current_url
        page_text = driver.find_element(By.TAG_NAME, "body").text[:200]
        
        logger.info(f"当前页面标题: {current_title}")
        logger.info(f"当前页面URL: {current_url}")
        logger.info(f"页面内容预览: {page_text}...")
        
        # 步骤4: 测试页面间跳转
        logger.info("步骤4: 测试页面间跳转")
        
        # 查找所有可点击的链接
        try:
            links = driver.find_elements(By.TAG_NAME, "a")
            clickable_links = []
            
            for link in links[:5]:  # 只检查前5个链接
                try:
                    href = link.get_attribute("href")
                    text = link.text.strip()
                    
                    if href and text and link.is_displayed():
                        clickable_links.append({
                            'text': text,
                            'href': href,
                            'element': link
                        })
                        logger.info(f"找到可点击链接: '{text}' -> {href}")
                        
                except Exception as e:
                    continue
            
            logger.info(f"总共找到 {len(clickable_links)} 个可点击链接")
            
        except Exception as e:
            logger.warning(f"⚠️ 查找链接时出错: {e}")
            clickable_links = []
        
        # 截图记录探索状态
        helpers.take_screenshot("navigation_journey_03_exploration_complete")
        
        # 步骤5: 返回首页
        logger.info("步骤5: 返回首页")
        
        if current_url != original_url:
            driver.get(original_url)
            wait_helpers.wait_for_page_load()
            wait_helpers.smart_wait(2)
            logger.info("✅ 返回首页")
        else:
            logger.info("ℹ️ 已在首页")
        
        # 截图记录最终状态
        helpers.take_screenshot("navigation_journey_04_back_to_homepage")
        
        logger.info("🎉 用户导航探索流程测试完成")
    
    @pytest.mark.ui
    def test_user_journey_responsive_experience(self, driver, helpers, wait_helpers):
        """
        📱 用户响应式体验流程
        
        模拟用户在不同设备上的体验：
        1. 桌面端体验
        2. 切换到移动端
        3. 测试移动端导航
        4. 返回桌面端
        """
        logger.info("📱 开始测试用户响应式体验流程")
        
        # 步骤1: 桌面端体验
        logger.info("步骤1: 桌面端体验")
        driver.set_window_size(1920, 1080)
        driver.get(TestConfig.BASE_URL)
        wait_helpers.wait_for_page_load()
        wait_helpers.smart_wait(3)
        
        # 截图记录桌面端
        helpers.take_screenshot("responsive_journey_01_desktop")
        
        # 步骤2: 切换到移动端
        logger.info("步骤2: 切换到移动端")
        driver.set_window_size(375, 667)  # iPhone 6/7/8 尺寸
        wait_helpers.smart_wait(2)
        
        # 截图记录移动端
        helpers.take_screenshot("responsive_journey_02_mobile")
        
        # 步骤3: 测试移动端导航
        logger.info("步骤3: 测试移动端导航")
        
        # 查找移动端的导航元素
        try:
            # 查找登录按钮
            login_button = driver.find_element(By.XPATH, "//*[contains(text(), '登录')]")
            if login_button.is_displayed():
                logger.info("✅ 移动端登录按钮可见")
            else:
                logger.warning("⚠️ 移动端登录按钮不可见")
                
            # 查找注册按钮
            register_button = driver.find_element(By.XPATH, "//*[contains(text(), '注册')]")
            if register_button.is_displayed():
                logger.info("✅ 移动端注册按钮可见")
            else:
                logger.warning("⚠️ 移动端注册按钮不可见")
                
        except Exception as e:
            logger.warning(f"⚠️ 查找移动端导航元素时出错: {e}")
        
        # 截图记录移动端导航测试
        helpers.take_screenshot("responsive_journey_03_mobile_navigation")
        
        # 步骤4: 返回桌面端
        logger.info("步骤4: 返回桌面端")
        driver.set_window_size(1920, 1080)
        wait_helpers.smart_wait(2)
        
        # 截图记录返回桌面端
        helpers.take_screenshot("responsive_journey_04_back_to_desktop")
        
        logger.info("🎉 用户响应式体验流程测试完成")
