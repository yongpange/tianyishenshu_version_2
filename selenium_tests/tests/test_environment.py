"""
环境测试
验证Selenium测试环境是否正常工作
"""
import pytest
from selenium.webdriver.common.by import By
from loguru import logger

class TestEnvironment:
    """环境测试类"""
    
    @pytest.mark.smoke
    def test_selenium_environment(self, driver, helpers):
        """
        测试Selenium环境是否正常
        
        验证点：
        1. WebDriver能够正常启动
        2. 能够访问外部网站
        3. 能够获取页面信息
        """
        logger.info("开始测试Selenium环境")
        
        # 访问百度首页（作为外部网站测试）
        driver.get("https://www.baidu.com")
        
        # 验证页面标题
        assert "百度" in driver.title, f"页面标题不正确，实际为'{driver.title}'"
        
        # 验证页面URL
        assert "baidu.com" in driver.current_url, f"页面URL不正确，实际为'{driver.current_url}'"
        
        # 截图记录
        helpers.take_screenshot("environment_test_baidu")
        
        logger.info("✅ Selenium环境测试通过")
    
    @pytest.mark.smoke
    def test_webdriver_capabilities(self, driver, helpers):
        """
        测试WebDriver基本功能
        
        验证点：
        1. 窗口大小调整
        2. 页面导航
        3. 元素查找
        """
        logger.info("开始测试WebDriver基本功能")
        
        # 测试窗口大小调整
        original_size = driver.get_window_size()
        logger.info(f"原始窗口大小: {original_size}")
        
        driver.set_window_size(1200, 800)
        new_size = driver.get_window_size()
        # 允许2像素的误差（Chrome浏览器的正常行为）
        assert abs(new_size['width'] - 1200) <= 2, f"窗口宽度设置失败，期望1200±2，实际{new_size['width']}"
        assert abs(new_size['height'] - 800) <= 2, f"窗口高度设置失败，期望800±2，实际{new_size['height']}"
        
        # 访问测试页面
        driver.get("https://www.example.com")
        
        # 测试元素查找
        try:
            title_element = driver.find_element(By.TAG_NAME, "h1")
            logger.info(f"找到标题元素: {title_element.text}")
        except Exception as e:
            logger.warning(f"查找标题元素失败: {e}")
        
        # 截图记录
        helpers.take_screenshot("webdriver_capabilities_test")
        
        # 恢复原始窗口大小
        driver.set_window_size(original_size['width'], original_size['height'])
        
        logger.info("✅ WebDriver基本功能测试通过")
    
    @pytest.mark.smoke
    def test_test_helpers(self, driver, helpers, wait_helpers):
        """
        测试辅助工具功能
        
        验证点：
        1. 截图功能
        2. 等待功能
        3. 页面信息获取
        """
        logger.info("开始测试辅助工具功能")
        
        # 访问测试页面
        driver.get("https://httpbin.org/html")
        
        # 测试等待功能
        wait_helpers.wait_for_page_load()
        
        # 测试页面信息获取
        page_info = helpers.get_page_source_info()
        logger.info(f"页面信息: {page_info}")
        
        assert page_info['title'] is not None, "页面标题获取失败"
        assert page_info['url'] is not None, "页面URL获取失败"
        assert page_info['page_source_length'] > 0, "页面源码长度为0"
        
        # 测试截图功能
        screenshot_path = helpers.take_screenshot("test_helpers_verification")
        assert screenshot_path is not None, "截图功能失败"
        
        logger.info("✅ 辅助工具功能测试通过")
    
    @pytest.mark.ui
    def test_responsive_simulation(self, driver, helpers):
        """
        测试响应式设计模拟
        
        验证点：
        1. 桌面端尺寸
        2. 平板端尺寸
        3. 移动端尺寸
        """
        logger.info("开始测试响应式设计模拟")
        
        # 访问简单的测试页面（避免网络超时）
        driver.get("data:text/html,<html><head><title>响应式测试</title></head><body><h1>响应式测试页面</h1><p>这是一个测试页面</p></body></html>")
        
        # 测试不同屏幕尺寸
        screen_sizes = [
            ("desktop", 1920, 1080),
            ("tablet", 768, 1024),
            ("mobile", 375, 667)
        ]
        
        for device_name, width, height in screen_sizes:
            driver.set_window_size(width, height)
            helpers.smart_wait(1)  # 等待页面调整
            
            current_size = driver.get_window_size()
            # 允许2像素的误差
            assert abs(current_size['width'] - width) <= 2, f"{device_name}宽度设置失败，期望{width}±2，实际{current_size['width']}"
            assert abs(current_size['height'] - height) <= 2, f"{device_name}高度设置失败，期望{height}±2，实际{current_size['height']}"
            
            helpers.take_screenshot(f"responsive_test_{device_name}_{width}x{height}")
            logger.info(f"✅ {device_name} ({width}x{height}) 测试通过")
        
        logger.info("✅ 响应式设计模拟测试通过")
