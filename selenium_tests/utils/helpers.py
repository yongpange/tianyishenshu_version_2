"""
通用辅助工具
提供截图、日志、数据处理等功能
"""
import os
import time
from datetime import datetime
from pathlib import Path
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.keys import Keys
from loguru import logger
from config.settings import TestConfig
import json

class TestHelpers:
    """测试辅助工具类"""
    
    def __init__(self, driver):
        self.driver = driver
        self.config = TestConfig()
    
    def take_screenshot(self, name=None, on_failure=False):
        """
        截图功能
        
        Args:
            name (str): 截图文件名，不提供则自动生成
            on_failure (bool): 是否为失败时截图
            
        Returns:
            str: 截图文件路径
        """
        if not name:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            name = f"screenshot_{timestamp}"
        
        if on_failure:
            name = f"FAILED_{name}"
        
        screenshot_path = self.config.SCREENSHOT_DIR / f"{name}.png"
        
        try:
            self.driver.save_screenshot(str(screenshot_path))
            logger.info(f"截图已保存: {screenshot_path}")
            return str(screenshot_path)
        except Exception as e:
            logger.error(f"截图失败: {e}")
            return None
    
    def scroll_to_element(self, element):
        """
        滚动到指定元素
        
        Args:
            element: WebElement 对象
        """
        try:
            self.driver.execute_script("arguments[0].scrollIntoView(true);", element)
            time.sleep(0.5)  # 等待滚动完成
            logger.debug("已滚动到元素位置")
        except Exception as e:
            logger.error(f"滚动到元素失败: {e}")
    
    def scroll_to_top(self):
        """滚动到页面顶部"""
        try:
            self.driver.execute_script("window.scrollTo(0, 0);")
            time.sleep(0.5)
            logger.debug("已滚动到页面顶部")
        except Exception as e:
            logger.error(f"滚动到顶部失败: {e}")
    
    def scroll_to_bottom(self):
        """滚动到页面底部"""
        try:
            self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            time.sleep(0.5)
            logger.debug("已滚动到页面底部")
        except Exception as e:
            logger.error(f"滚动到底部失败: {e}")
    
    def clear_and_send_keys(self, element, text):
        """
        清空输入框并输入文本
        
        Args:
            element: WebElement 对象
            text (str): 要输入的文本
        """
        try:
            element.clear()
            time.sleep(0.2)
            element.send_keys(text)
            logger.debug(f"已输入文本: {text}")
        except Exception as e:
            logger.error(f"输入文本失败: {e}")
            raise
    
    def safe_click(self, element, scroll_first=True):
        """
        安全点击元素
        
        Args:
            element: WebElement 对象
            scroll_first (bool): 是否先滚动到元素位置
        """
        try:
            if scroll_first:
                self.scroll_to_element(element)
            
            # 等待元素可点击
            time.sleep(0.3)
            element.click()
            logger.debug("元素点击成功")
        except Exception as e:
            logger.error(f"点击元素失败: {e}")
            # 尝试使用 JavaScript 点击
            try:
                self.driver.execute_script("arguments[0].click();", element)
                logger.debug("使用 JavaScript 点击成功")
            except Exception as js_e:
                logger.error(f"JavaScript 点击也失败: {js_e}")
                raise
    
    def hover_element(self, element):
        """
        鼠标悬停在元素上
        
        Args:
            element: WebElement 对象
        """
        try:
            actions = ActionChains(self.driver)
            actions.move_to_element(element).perform()
            time.sleep(0.5)
            logger.debug("鼠标悬停成功")
        except Exception as e:
            logger.error(f"鼠标悬停失败: {e}")
    
    def double_click(self, element):
        """
        双击元素
        
        Args:
            element: WebElement 对象
        """
        try:
            actions = ActionChains(self.driver)
            actions.double_click(element).perform()
            time.sleep(0.5)
            logger.debug("双击成功")
        except Exception as e:
            logger.error(f"双击失败: {e}")
    
    def right_click(self, element):
        """
        右键点击元素
        
        Args:
            element: WebElement 对象
        """
        try:
            actions = ActionChains(self.driver)
            actions.context_click(element).perform()
            time.sleep(0.5)
            logger.debug("右键点击成功")
        except Exception as e:
            logger.error(f"右键点击失败: {e}")
    
    def send_keys_to_browser(self, keys):
        """
        向浏览器发送按键
        
        Args:
            keys: 按键组合，如 Keys.CONTROL + "a"
        """
        try:
            actions = ActionChains(self.driver)
            actions.send_keys(keys).perform()
            time.sleep(0.5)
            logger.debug(f"发送按键成功: {keys}")
        except Exception as e:
            logger.error(f"发送按键失败: {e}")
    
    def get_page_source_info(self):
        """
        获取页面源码信息
        
        Returns:
            dict: 页面信息
        """
        try:
            return {
                'title': self.driver.title,
                'url': self.driver.current_url,
                'page_source_length': len(self.driver.page_source),
                'window_size': self.driver.get_window_size(),
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"获取页面信息失败: {e}")
            return {}
    
    def save_page_source(self, filename=None):
        """
        保存页面源码
        
        Args:
            filename (str): 文件名，不提供则自动生成
            
        Returns:
            str: 保存的文件路径
        """
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"page_source_{timestamp}.html"
        
        file_path = self.config.REPORTS_DIR / filename
        
        try:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(self.driver.page_source)
            logger.info(f"页面源码已保存: {file_path}")
            return str(file_path)
        except Exception as e:
            logger.error(f"保存页面源码失败: {e}")
            return None
    
    def wait_for_page_ready(self, timeout=30):
        """
        等待页面完全准备就绪
        
        Args:
            timeout (int): 超时时间
        """
        try:
            # 等待 DOM 加载完成
            self.driver.execute_script("""
                return new Promise((resolve) => {
                    if (document.readyState === 'complete') {
                        resolve();
                    } else {
                        window.addEventListener('load', resolve);
                    }
                });
            """)
            
            # 等待 jQuery 加载完成（如果存在）
            try:
                self.driver.execute_script("return jQuery.active == 0")
            except:
                pass  # jQuery 可能不存在
            
            logger.debug("页面已完全准备就绪")
        except Exception as e:
            logger.error(f"等待页面准备就绪失败: {e}")
    
    def get_console_logs(self):
        """
        获取浏览器控制台日志
        
        Returns:
            list: 控制台日志列表
        """
        try:
            logs = self.driver.get_log('browser')
            logger.debug(f"获取到 {len(logs)} 条控制台日志")
            return logs
        except Exception as e:
            logger.error(f"获取控制台日志失败: {e}")
            return []
    
    def switch_to_new_window(self):
        """切换到新打开的窗口"""
        try:
            # 获取所有窗口句柄
            all_windows = self.driver.window_handles
            # 切换到最新的窗口
            self.driver.switch_to.window(all_windows[-1])
            logger.debug("已切换到新窗口")
        except Exception as e:
            logger.error(f"切换窗口失败: {e}")
    
    def close_current_window_and_switch_back(self):
        """关闭当前窗口并切换回主窗口"""
        try:
            self.driver.close()
            # 切换回第一个窗口
            self.driver.switch_to.window(self.driver.window_handles[0])
            logger.debug("已关闭当前窗口并切换回主窗口")
        except Exception as e:
            logger.error(f"关闭窗口失败: {e}")
