"""
WebDriver 管理器
负责创建和配置不同类型的浏览器驱动
"""
from selenium import webdriver
from selenium.webdriver.chrome.service import Service as ChromeService
from selenium.webdriver.firefox.service import Service as FirefoxService
from selenium.webdriver.edge.service import Service as EdgeService
from selenium.webdriver.chrome.options import Options as ChromeOptions
from selenium.webdriver.firefox.options import Options as FirefoxOptions
from selenium.webdriver.edge.options import Options as EdgeOptions
from webdriver_manager.chrome import ChromeDriverManager
from webdriver_manager.firefox import GeckoDriverManager
from webdriver_manager.microsoft import EdgeChromiumDriverManager
from loguru import logger
from config.settings import TestConfig

class DriverManager:
    """WebDriver 管理器类"""
    
    def __init__(self):
        self.driver = None
        self.config = TestConfig()
    
    def create_driver(self, browser_name=None, headless=None, mobile_device=None):
        """
        创建 WebDriver 实例
        
        Args:
            browser_name (str): 浏览器名称 ('chrome', 'firefox', 'edge')
            headless (bool): 是否无头模式
            mobile_device (str): 移动设备名称
            
        Returns:
            WebDriver: 配置好的 WebDriver 实例
        """
        browser = browser_name or self.config.BROWSER
        is_headless = headless if headless is not None else self.config.HEADLESS
        
        logger.info(f"创建 {browser} 浏览器驱动，无头模式: {is_headless}")
        
        if browser.lower() == 'chrome':
            self.driver = self._create_chrome_driver(is_headless, mobile_device)
        elif browser.lower() == 'firefox':
            self.driver = self._create_firefox_driver(is_headless, mobile_device)
        elif browser.lower() == 'edge':
            self.driver = self._create_edge_driver(is_headless, mobile_device)
        else:
            raise ValueError(f"不支持的浏览器类型: {browser}")
        
        # 设置通用配置
        self._configure_driver()
        
        return self.driver
    
    def _create_chrome_driver(self, headless=False, mobile_device=None):
        """创建 Chrome 驱动"""
        options = ChromeOptions()
        
        # 基础配置
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument('--disable-gpu')
        options.add_argument('--disable-extensions')
        options.add_argument('--disable-web-security')
        options.add_argument('--allow-running-insecure-content')
        
        # 无头模式
        if headless:
            options.add_argument('--headless')
        
        # 移动设备模拟
        if mobile_device and mobile_device in self.config.MOBILE_DEVICES:
            device_config = self.config.MOBILE_DEVICES[mobile_device]
            mobile_emulation = {
                "deviceMetrics": {
                    "width": device_config['width'],
                    "height": device_config['height'],
                    "pixelRatio": 3.0
                },
                "userAgent": device_config['user_agent']
            }
            options.add_experimental_option("mobileEmulation", mobile_emulation)
        
        # 窗口大小
        if not mobile_device:
            options.add_argument('--window-size=1920,1080')
        
        # 创建服务
        service = ChromeService(ChromeDriverManager().install())
        
        return webdriver.Chrome(service=service, options=options)
    
    def _create_firefox_driver(self, headless=False, mobile_device=None):
        """创建 Firefox 驱动"""
        options = FirefoxOptions()
        
        # 无头模式
        if headless:
            options.add_argument('--headless')
        
        # 移动设备模拟（Firefox 的移动模拟相对简单）
        if mobile_device and mobile_device in self.config.MOBILE_DEVICES:
            device_config = self.config.MOBILE_DEVICES[mobile_device]
            options.set_preference("general.useragent.override", device_config['user_agent'])
        
        # 创建服务
        service = FirefoxService(GeckoDriverManager().install())
        
        driver = webdriver.Firefox(service=service, options=options)
        
        # 设置窗口大小
        if mobile_device and mobile_device in self.config.MOBILE_DEVICES:
            device_config = self.config.MOBILE_DEVICES[mobile_device]
            driver.set_window_size(device_config['width'], device_config['height'])
        else:
            driver.set_window_size(1920, 1080)
        
        return driver
    
    def _create_edge_driver(self, headless=False, mobile_device=None):
        """创建 Edge 驱动"""
        options = EdgeOptions()
        
        # 基础配置
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument('--disable-gpu')
        
        # 无头模式
        if headless:
            options.add_argument('--headless')
        
        # 移动设备模拟
        if mobile_device and mobile_device in self.config.MOBILE_DEVICES:
            device_config = self.config.MOBILE_DEVICES[mobile_device]
            mobile_emulation = {
                "deviceMetrics": {
                    "width": device_config['width'],
                    "height": device_config['height'],
                    "pixelRatio": 3.0
                },
                "userAgent": device_config['user_agent']
            }
            options.add_experimental_option("mobileEmulation", mobile_emulation)
        
        # 窗口大小
        if not mobile_device:
            options.add_argument('--window-size=1920,1080')
        
        # 创建服务
        service = EdgeService(EdgeChromiumDriverManager().install())
        
        return webdriver.Edge(service=service, options=options)
    
    def _configure_driver(self):
        """配置驱动的通用设置"""
        if self.driver:
            # 设置等待时间
            self.driver.implicitly_wait(self.config.IMPLICIT_WAIT)
            self.driver.set_page_load_timeout(self.config.PAGE_LOAD_TIMEOUT)
            
            logger.info(f"WebDriver 配置完成，隐式等待: {self.config.IMPLICIT_WAIT}s")
    
    def quit_driver(self):
        """关闭驱动"""
        if self.driver:
            logger.info("关闭 WebDriver")
            self.driver.quit()
            self.driver = None
    
    def get_driver(self):
        """获取当前驱动实例"""
        return self.driver
