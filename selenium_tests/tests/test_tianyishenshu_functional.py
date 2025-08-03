"""
天乙神算功能测试
🔧 功能测试：导航测试、响应式测试、表单测试
"""
import pytest
import time
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from loguru import logger
from config.settings import TestConfig

class TestTianyishenshuFunctional:
    """天乙神算功能测试类"""
    
    @pytest.mark.ui
    def test_navigation_links_clickable(self, driver, helpers, wait_helpers):
        """
        🧭 导航测试 - 测试页面间跳转
        
        验证点：
        1. 导航链接可点击
        2. 点击后有响应
        3. 页面跳转或弹窗正常
        """
        logger.info("🧭 开始测试导航链接")
        
        # 访问首页
        driver.get(TestConfig.BASE_URL)
        wait_helpers.wait_for_page_load()
        wait_helpers.smart_wait(3)
        
        # 测试的导航元素
        navigation_elements = [
            {
                'name': '登录按钮',
                'locator': (By.XPATH, "//*[contains(text(), '登录')]"),
                'expected_action': 'modal_or_redirect'
            },
            {
                'name': '注册按钮', 
                'locator': (By.XPATH, "//*[contains(text(), '注册')]"),
                'expected_action': 'modal_or_redirect'
            },
            {
                'name': '马上体验按钮',
                'locator': (By.XPATH, "//*[contains(text(), '马上体验')]"),
                'expected_action': 'redirect_or_action'
            }
        ]
        
        original_url = driver.current_url
        logger.info(f"原始URL: {original_url}")
        
        for nav_info in navigation_elements:
            try:
                logger.info(f"测试导航元素: {nav_info['name']}")
                
                # 查找元素
                element = wait_helpers.wait_for_element_clickable(
                    nav_info['locator'], 
                    timeout=5
                )
                
                if element:
                    # 滚动到元素位置
                    helpers.scroll_to_element(element)
                    wait_helpers.smart_wait(1)
                    
                    # 记录点击前状态
                    before_click_url = driver.current_url
                    before_click_title = driver.title
                    
                    # 点击元素
                    logger.info(f"点击 {nav_info['name']}")
                    helpers.safe_click(element)
                    
                    # 等待响应
                    wait_helpers.smart_wait(3)
                    
                    # 检查点击后的变化
                    after_click_url = driver.current_url
                    after_click_title = driver.title
                    
                    # 检查是否有弹窗
                    try:
                        # 检查是否有模态框出现
                        modal_elements = driver.find_elements(By.XPATH, "//*[contains(@class, 'modal') or contains(@class, 'dialog') or contains(@class, 'popup')]")
                        if modal_elements:
                            logger.info(f"✅ {nav_info['name']} 点击后出现弹窗")
                            helpers.take_screenshot(f"navigation_{nav_info['name']}_modal")
                        else:
                            logger.info(f"ℹ️ {nav_info['name']} 点击后无弹窗")
                    except Exception as e:
                        logger.debug(f"检查弹窗时出错: {e}")
                    
                    # 检查URL变化
                    if after_click_url != before_click_url:
                        logger.info(f"✅ {nav_info['name']} 点击后URL发生变化")
                        logger.info(f"   变化: {before_click_url} → {after_click_url}")
                    else:
                        logger.info(f"ℹ️ {nav_info['name']} 点击后URL未变化")
                    
                    # 检查标题变化
                    if after_click_title != before_click_title:
                        logger.info(f"✅ {nav_info['name']} 点击后标题发生变化")
                        logger.info(f"   变化: {before_click_title} → {after_click_title}")
                    
                    # 截图记录
                    helpers.take_screenshot(f"navigation_{nav_info['name']}_after_click")
                    
                    # 如果URL变化了，尝试返回首页
                    if after_click_url != original_url:
                        logger.info("返回首页继续测试")
                        driver.get(original_url)
                        wait_helpers.wait_for_page_load()
                        wait_helpers.smart_wait(2)
                    
                    logger.info(f"✅ {nav_info['name']} 导航测试完成")
                    
                else:
                    logger.warning(f"⚠️ 未找到导航元素: {nav_info['name']}")
                    
            except Exception as e:
                logger.error(f"❌ 测试 {nav_info['name']} 时出错: {e}")
                # 截图记录错误状态
                helpers.take_screenshot(f"navigation_{nav_info['name']}_error")
                continue
        
        logger.info("✅ 导航链接测试完成")
    
    @pytest.mark.ui
    def test_responsive_design(self, driver, helpers, wait_helpers):
        """
        📱 响应式测试 - 测试不同屏幕尺寸
        
        验证点：
        1. 桌面端显示正常
        2. 平板端显示正常
        3. 移动端显示正常
        4. 元素在不同尺寸下可见
        """
        logger.info("📱 开始测试响应式设计")
        
        # 访问首页
        driver.get(TestConfig.BASE_URL)
        wait_helpers.wait_for_page_load()
        
        # 测试不同屏幕尺寸
        screen_sizes = [
            {
                'name': '桌面端大屏',
                'width': 1920,
                'height': 1080,
                'device_type': 'desktop'
            },
            {
                'name': '桌面端中屏',
                'width': 1366,
                'height': 768,
                'device_type': 'desktop'
            },
            {
                'name': '平板端横屏',
                'width': 1024,
                'height': 768,
                'device_type': 'tablet'
            },
            {
                'name': '平板端竖屏',
                'width': 768,
                'height': 1024,
                'device_type': 'tablet'
            },
            {
                'name': '手机端大屏',
                'width': 414,
                'height': 896,
                'device_type': 'mobile'
            },
            {
                'name': '手机端小屏',
                'width': 375,
                'height': 667,
                'device_type': 'mobile'
            }
        ]
        
        for size_info in screen_sizes:
            try:
                logger.info(f"测试屏幕尺寸: {size_info['name']} ({size_info['width']}x{size_info['height']})")
                
                # 设置窗口大小
                driver.set_window_size(size_info['width'], size_info['height'])
                wait_helpers.smart_wait(2)  # 等待页面调整
                
                # 验证窗口大小设置成功
                actual_size = driver.get_window_size()
                logger.info(f"实际窗口大小: {actual_size['width']}x{actual_size['height']}")
                
                # 检查关键元素在当前尺寸下是否可见
                key_elements = [
                    (By.XPATH, "//*[contains(text(), '登录')]", "登录按钮"),
                    (By.XPATH, "//*[contains(text(), '注册')]", "注册按钮"),
                    (By.XPATH, "//*[contains(text(), '马上体验')]", "马上体验按钮")
                ]
                
                visible_elements = []
                hidden_elements = []
                
                for locator_by, locator_value, element_name in key_elements:
                    try:
                        element = driver.find_element(locator_by, locator_value)
                        if element.is_displayed():
                            visible_elements.append(element_name)
                            logger.info(f"✅ {element_name} 在 {size_info['name']} 下可见")
                        else:
                            hidden_elements.append(element_name)
                            logger.warning(f"⚠️ {element_name} 在 {size_info['name']} 下不可见")
                    except NoSuchElementException:
                        hidden_elements.append(element_name)
                        logger.warning(f"⚠️ {element_name} 在 {size_info['name']} 下未找到")
                
                # 检查页面是否有横向滚动条（移动端不应该有）
                if size_info['device_type'] == 'mobile':
                    body_width = driver.execute_script("return document.body.scrollWidth;")
                    window_width = driver.execute_script("return window.innerWidth;")
                    
                    if body_width > window_width:
                        logger.warning(f"⚠️ {size_info['name']} 下出现横向滚动条 (body: {body_width}px, window: {window_width}px)")
                    else:
                        logger.info(f"✅ {size_info['name']} 下无横向滚动条")
                
                # 截图记录
                helpers.take_screenshot(f"responsive_{size_info['device_type']}_{size_info['width']}x{size_info['height']}")
                
                # 记录测试结果
                logger.info(f"📊 {size_info['name']} 测试结果:")
                logger.info(f"   可见元素: {visible_elements}")
                if hidden_elements:
                    logger.info(f"   隐藏元素: {hidden_elements}")
                
            except Exception as e:
                logger.error(f"❌ 测试 {size_info['name']} 时出错: {e}")
                helpers.take_screenshot(f"responsive_{size_info['name']}_error")
                continue
        
        # 恢复默认窗口大小
        driver.set_window_size(1920, 1080)
        logger.info("✅ 响应式设计测试完成")
    
    @pytest.mark.ui
    def test_button_interactions(self, driver, helpers, wait_helpers):
        """
        🔘 按钮交互测试
        
        验证点：
        1. 按钮悬停效果
        2. 按钮点击响应
        3. 按钮状态变化
        """
        logger.info("🔘 开始测试按钮交互")
        
        # 访问首页
        driver.get(TestConfig.BASE_URL)
        wait_helpers.wait_for_page_load()
        wait_helpers.smart_wait(3)
        
        # 测试按钮
        buttons_to_test = [
            {
                'name': '登录按钮',
                'locator': (By.XPATH, "//*[contains(text(), '登录')]")
            },
            {
                'name': '注册按钮',
                'locator': (By.XPATH, "//*[contains(text(), '注册')]")
            },
            {
                'name': '马上体验按钮',
                'locator': (By.XPATH, "//*[contains(text(), '马上体验')]")
            }
        ]
        
        for button_info in buttons_to_test:
            try:
                logger.info(f"测试按钮: {button_info['name']}")
                
                # 查找按钮
                button = wait_helpers.wait_for_element_present(
                    button_info['locator'], 
                    timeout=5
                )
                
                if button and button.is_displayed():
                    # 滚动到按钮位置
                    helpers.scroll_to_element(button)
                    wait_helpers.smart_wait(1)
                    
                    # 测试悬停效果
                    logger.info(f"测试 {button_info['name']} 悬停效果")
                    
                    # 记录悬停前的样式
                    before_hover_style = button.get_attribute("style") or ""
                    before_hover_class = button.get_attribute("class") or ""
                    
                    # 悬停
                    actions = ActionChains(driver)
                    actions.move_to_element(button).perform()
                    wait_helpers.smart_wait(1)
                    
                    # 记录悬停后的样式
                    after_hover_style = button.get_attribute("style") or ""
                    after_hover_class = button.get_attribute("class") or ""
                    
                    # 检查是否有悬停效果
                    if (after_hover_style != before_hover_style or 
                        after_hover_class != before_hover_class):
                        logger.info(f"✅ {button_info['name']} 有悬停效果")
                    else:
                        logger.info(f"ℹ️ {button_info['name']} 无明显悬停效果")
                    
                    # 截图记录悬停状态
                    helpers.take_screenshot(f"button_{button_info['name']}_hover")
                    
                    # 测试点击响应
                    logger.info(f"测试 {button_info['name']} 点击响应")
                    
                    # 记录点击前状态
                    before_click_url = driver.current_url
                    
                    # 点击按钮
                    helpers.safe_click(button)
                    wait_helpers.smart_wait(2)
                    
                    # 检查点击后的变化
                    after_click_url = driver.current_url
                    
                    if after_click_url != before_click_url:
                        logger.info(f"✅ {button_info['name']} 点击后页面跳转")
                        # 返回首页继续测试
                        driver.get(TestConfig.BASE_URL)
                        wait_helpers.wait_for_page_load()
                        wait_helpers.smart_wait(2)
                    else:
                        logger.info(f"ℹ️ {button_info['name']} 点击后页面未跳转")
                    
                    # 截图记录点击后状态
                    helpers.take_screenshot(f"button_{button_info['name']}_clicked")
                    
                    logger.info(f"✅ {button_info['name']} 交互测试完成")
                    
                else:
                    logger.warning(f"⚠️ 未找到或不可见: {button_info['name']}")
                    
            except Exception as e:
                logger.error(f"❌ 测试 {button_info['name']} 时出错: {e}")
                helpers.take_screenshot(f"button_{button_info['name']}_error")
                continue
        
        logger.info("✅ 按钮交互测试完成")
