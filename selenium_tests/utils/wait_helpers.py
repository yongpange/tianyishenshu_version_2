"""
等待策略辅助工具
提供各种智能等待方法
"""
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from loguru import logger
from config.settings import TestConfig
import time

class WaitHelpers:
    """等待辅助工具类"""
    
    def __init__(self, driver):
        self.driver = driver
        self.wait = WebDriverWait(driver, TestConfig.EXPLICIT_WAIT)
        self.short_wait = WebDriverWait(driver, 5)
    
    def wait_for_element_visible(self, locator, timeout=None):
        """
        等待元素可见
        
        Args:
            locator (tuple): 元素定位器 (By.ID, 'element_id')
            timeout (int): 超时时间，默认使用配置中的值
            
        Returns:
            WebElement: 找到的元素
        """
        wait_time = timeout or TestConfig.EXPLICIT_WAIT
        wait = WebDriverWait(self.driver, wait_time)
        
        try:
            logger.debug(f"等待元素可见: {locator}")
            element = wait.until(EC.visibility_of_element_located(locator))
            logger.debug(f"元素已可见: {locator}")
            return element
        except TimeoutException:
            logger.error(f"等待元素可见超时: {locator}")
            raise
    
    def wait_for_element_clickable(self, locator, timeout=None):
        """
        等待元素可点击
        
        Args:
            locator (tuple): 元素定位器
            timeout (int): 超时时间
            
        Returns:
            WebElement: 可点击的元素
        """
        wait_time = timeout or TestConfig.EXPLICIT_WAIT
        wait = WebDriverWait(self.driver, wait_time)
        
        try:
            logger.debug(f"等待元素可点击: {locator}")
            element = wait.until(EC.element_to_be_clickable(locator))
            logger.debug(f"元素已可点击: {locator}")
            return element
        except TimeoutException:
            logger.error(f"等待元素可点击超时: {locator}")
            raise
    
    def wait_for_element_present(self, locator, timeout=None):
        """
        等待元素存在于DOM中
        
        Args:
            locator (tuple): 元素定位器
            timeout (int): 超时时间
            
        Returns:
            WebElement: 找到的元素
        """
        wait_time = timeout or TestConfig.EXPLICIT_WAIT
        wait = WebDriverWait(self.driver, wait_time)
        
        try:
            logger.debug(f"等待元素存在: {locator}")
            element = wait.until(EC.presence_of_element_located(locator))
            logger.debug(f"元素已存在: {locator}")
            return element
        except TimeoutException:
            logger.error(f"等待元素存在超时: {locator}")
            raise
    
    def wait_for_text_in_element(self, locator, text, timeout=None):
        """
        等待元素包含指定文本
        
        Args:
            locator (tuple): 元素定位器
            text (str): 期望的文本
            timeout (int): 超时时间
            
        Returns:
            bool: 是否找到包含指定文本的元素
        """
        wait_time = timeout or TestConfig.EXPLICIT_WAIT
        wait = WebDriverWait(self.driver, wait_time)
        
        try:
            logger.debug(f"等待元素包含文本 '{text}': {locator}")
            result = wait.until(EC.text_to_be_present_in_element(locator, text))
            logger.debug(f"元素已包含文本 '{text}': {locator}")
            return result
        except TimeoutException:
            logger.error(f"等待元素包含文本超时 '{text}': {locator}")
            raise
    
    def wait_for_url_contains(self, url_part, timeout=None):
        """
        等待URL包含指定内容
        
        Args:
            url_part (str): URL片段
            timeout (int): 超时时间
            
        Returns:
            bool: URL是否包含指定内容
        """
        wait_time = timeout or TestConfig.EXPLICIT_WAIT
        wait = WebDriverWait(self.driver, wait_time)
        
        try:
            logger.debug(f"等待URL包含: {url_part}")
            result = wait.until(EC.url_contains(url_part))
            logger.debug(f"URL已包含: {url_part}")
            return result
        except TimeoutException:
            logger.error(f"等待URL包含超时: {url_part}")
            raise
    
    def wait_for_page_load(self, timeout=None):
        """
        等待页面完全加载
        
        Args:
            timeout (int): 超时时间
        """
        wait_time = timeout or TestConfig.PAGE_LOAD_TIMEOUT
        
        try:
            logger.debug("等待页面加载完成")
            WebDriverWait(self.driver, wait_time).until(
                lambda driver: driver.execute_script("return document.readyState") == "complete"
            )
            logger.debug("页面加载完成")
        except TimeoutException:
            logger.error("等待页面加载超时")
            raise
    
    def wait_for_element_invisible(self, locator, timeout=None):
        """
        等待元素不可见
        
        Args:
            locator (tuple): 元素定位器
            timeout (int): 超时时间
            
        Returns:
            bool: 元素是否已不可见
        """
        wait_time = timeout or TestConfig.EXPLICIT_WAIT
        wait = WebDriverWait(self.driver, wait_time)
        
        try:
            logger.debug(f"等待元素不可见: {locator}")
            result = wait.until(EC.invisibility_of_element_located(locator))
            logger.debug(f"元素已不可见: {locator}")
            return result
        except TimeoutException:
            logger.error(f"等待元素不可见超时: {locator}")
            raise
    
    def wait_for_alert_present(self, timeout=None):
        """
        等待弹窗出现
        
        Args:
            timeout (int): 超时时间
            
        Returns:
            Alert: 弹窗对象
        """
        wait_time = timeout or TestConfig.EXPLICIT_WAIT
        wait = WebDriverWait(self.driver, wait_time)
        
        try:
            logger.debug("等待弹窗出现")
            alert = wait.until(EC.alert_is_present())
            logger.debug("弹窗已出现")
            return alert
        except TimeoutException:
            logger.error("等待弹窗出现超时")
            raise
    
    def smart_wait(self, seconds):
        """
        智能等待，在等待期间检查页面状态
        
        Args:
            seconds (int): 等待秒数
        """
        logger.debug(f"智能等待 {seconds} 秒")
        end_time = time.time() + seconds
        
        while time.time() < end_time:
            # 检查页面是否还在加载
            if self.driver.execute_script("return document.readyState") == "complete":
                time.sleep(0.5)
            else:
                time.sleep(0.1)
        
        logger.debug("智能等待完成")
    
    def is_element_present(self, locator):
        """
        检查元素是否存在（不等待）
        
        Args:
            locator (tuple): 元素定位器
            
        Returns:
            bool: 元素是否存在
        """
        try:
            self.driver.find_element(*locator)
            return True
        except NoSuchElementException:
            return False
    
    def is_element_visible(self, locator):
        """
        检查元素是否可见（不等待）
        
        Args:
            locator (tuple): 元素定位器
            
        Returns:
            bool: 元素是否可见
        """
        try:
            element = self.driver.find_element(*locator)
            return element.is_displayed()
        except NoSuchElementException:
            return False
