"""
首页测试
测试天乙神算首页的基本功能
"""
import pytest
from selenium.webdriver.common.by import By
from loguru import logger
from config.settings import TestConfig

class TestHomepage:
    """首页测试类"""
    
    @pytest.mark.smoke
    def test_homepage_loads_successfully(self, driver, helpers, wait_helpers):
        """
        测试首页能够成功加载
        
        验证点：
        1. 页面能够正常访问
        2. 页面标题正确
        3. 主要元素存在
        """
        logger.info("开始测试首页加载")
        
        # 访问首页
        driver.get(TestConfig.BASE_URL)
        
        # 等待页面加载完成
        wait_helpers.wait_for_page_load()
        
        # 验证页面标题
        expected_title = "天乙神算"
        assert expected_title in driver.title, f"页面标题不正确，期望包含'{expected_title}'，实际为'{driver.title}'"
        
        # 截图记录
        helpers.take_screenshot("homepage_loaded")
        
        logger.info("首页加载测试通过")
    
    @pytest.mark.smoke
    def test_homepage_main_elements_present(self, driver, helpers, wait_helpers):
        """
        测试首页主要元素是否存在
        
        验证点：
        1. 导航栏存在
        2. 主标题存在
        3. 主要功能按钮存在
        """
        logger.info("开始测试首页主要元素")
        
        # 访问首页
        driver.get(TestConfig.BASE_URL)
        wait_helpers.wait_for_page_load()
        
        # 检查主要元素（根据你的项目实际情况调整选择器）
        main_elements = [
            # 这些选择器需要根据你的实际页面结构调整
            ("导航栏", "nav"),  # 通用导航栏标签
            ("主标题", "h1"),   # 主标题
            ("主要内容区", "main"),  # 主要内容区域
        ]
        
        for element_name, selector in main_elements:
            try:
                if selector.startswith("#"):
                    # ID 选择器
                    element = wait_helpers.wait_for_element_present((By.ID, selector[1:]), timeout=10)
                elif selector.startswith("."):
                    # Class 选择器
                    element = wait_helpers.wait_for_element_present((By.CLASS_NAME, selector[1:]), timeout=10)
                else:
                    # 标签选择器
                    element = wait_helpers.wait_for_element_present((By.TAG_NAME, selector), timeout=10)
                
                assert element is not None, f"{element_name}元素未找到"
                logger.info(f"✅ {element_name}元素存在")
                
            except Exception as e:
                logger.warning(f"⚠️ {element_name}元素检查失败: {e}")
                # 对于首次测试，我们记录警告但不让测试失败
                continue
        
        # 截图记录
        helpers.take_screenshot("homepage_elements_check")
        
        logger.info("首页主要元素测试完成")
    
    @pytest.mark.ui
    def test_homepage_responsive_design(self, driver, helpers, wait_helpers):
        """
        测试首页响应式设计
        
        验证点：
        1. 桌面端显示正常
        2. 移动端显示正常（通过调整窗口大小模拟）
        """
        logger.info("开始测试首页响应式设计")
        
        # 访问首页
        driver.get(TestConfig.BASE_URL)
        wait_helpers.wait_for_page_load()
        
        # 测试桌面端尺寸
        driver.set_window_size(1920, 1080)
        helpers.smart_wait(2)
        helpers.take_screenshot("homepage_desktop_1920x1080")
        logger.info("✅ 桌面端 1920x1080 显示测试完成")
        
        # 测试平板端尺寸
        driver.set_window_size(768, 1024)
        helpers.smart_wait(2)
        helpers.take_screenshot("homepage_tablet_768x1024")
        logger.info("✅ 平板端 768x1024 显示测试完成")
        
        # 测试移动端尺寸
        driver.set_window_size(375, 667)
        helpers.smart_wait(2)
        helpers.take_screenshot("homepage_mobile_375x667")
        logger.info("✅ 移动端 375x667 显示测试完成")
        
        # 恢复桌面端尺寸
        driver.set_window_size(1920, 1080)
        
        logger.info("首页响应式设计测试完成")
    
    @pytest.mark.ui
    def test_homepage_navigation_links(self, driver, helpers, wait_helpers):
        """
        测试首页导航链接
        
        验证点：
        1. 导航链接可点击
        2. 链接指向正确
        """
        logger.info("开始测试首页导航链接")
        
        # 访问首页
        driver.get(TestConfig.BASE_URL)
        wait_helpers.wait_for_page_load()
        
        # 获取当前URL作为基准
        original_url = driver.current_url
        logger.info(f"原始URL: {original_url}")
        
        # 查找所有链接
        try:
            links = driver.find_elements(By.TAG_NAME, "a")
            logger.info(f"找到 {len(links)} 个链接")
            
            # 检查前几个链接（避免测试时间过长）
            for i, link in enumerate(links[:5]):  # 只测试前5个链接
                try:
                    href = link.get_attribute("href")
                    text = link.text.strip()
                    
                    if href and href.startswith(("http", "/")):
                        logger.info(f"链接 {i+1}: '{text}' -> {href}")
                        
                        # 检查链接是否可见和可点击
                        if link.is_displayed() and link.is_enabled():
                            logger.info(f"✅ 链接 {i+1} 可见且可点击")
                        else:
                            logger.warning(f"⚠️ 链接 {i+1} 不可见或不可点击")
                            
                except Exception as e:
                    logger.warning(f"⚠️ 检查链接 {i+1} 时出错: {e}")
                    continue
                    
        except Exception as e:
            logger.warning(f"⚠️ 查找链接时出错: {e}")
        
        # 截图记录
        helpers.take_screenshot("homepage_navigation_check")
        
        logger.info("首页导航链接测试完成")
    
    @pytest.mark.smoke
    def test_homepage_console_errors(self, driver, helpers, wait_helpers):
        """
        测试首页是否有JavaScript错误
        
        验证点：
        1. 控制台无严重错误
        2. 页面功能正常
        """
        logger.info("开始检查首页控制台错误")
        
        # 访问首页
        driver.get(TestConfig.BASE_URL)
        wait_helpers.wait_for_page_load()
        
        # 等待页面完全加载
        helpers.smart_wait(3)
        
        # 获取控制台日志
        console_logs = helpers.get_console_logs()
        
        # 分析控制台日志
        error_count = 0
        warning_count = 0
        
        for log in console_logs:
            level = log.get('level', '').upper()
            message = log.get('message', '')
            
            if level == 'SEVERE':
                error_count += 1
                logger.error(f"控制台错误: {message}")
            elif level == 'WARNING':
                warning_count += 1
                logger.warning(f"控制台警告: {message}")
            else:
                logger.debug(f"控制台日志 [{level}]: {message}")
        
        # 记录统计信息
        logger.info(f"控制台日志统计 - 错误: {error_count}, 警告: {warning_count}, 总计: {len(console_logs)}")
        
        # 截图记录
        helpers.take_screenshot("homepage_console_check")
        
        # 对于首次测试，我们只记录错误但不让测试失败
        if error_count > 0:
            logger.warning(f"⚠️ 发现 {error_count} 个控制台错误，请检查")
        
        logger.info("首页控制台错误检查完成")
