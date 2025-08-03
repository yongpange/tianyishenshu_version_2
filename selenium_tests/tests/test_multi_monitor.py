"""
多显示器环境测试
验证Selenium在多显示器环境下的行为
"""
import pytest
import time
from selenium.webdriver.common.by import By
from loguru import logger

class TestMultiMonitor:
    """多显示器环境测试类"""
    
    @pytest.mark.smoke
    def test_browser_window_positioning(self, driver, helpers):
        """
        测试浏览器窗口定位
        
        验证点：
        1. 获取当前窗口位置
        2. 移动窗口到不同位置
        3. 验证窗口大小控制
        """
        logger.info("开始测试浏览器窗口定位")
        
        # 访问一个简单的测试页面
        driver.get("data:text/html,<html><head><title>多显示器测试</title></head><body><h1>多显示器环境测试</h1><p>当前时间: <span id='time'></span></p><script>setInterval(() => document.getElementById('time').textContent = new Date().toLocaleTimeString(), 1000);</script></body></html>")
        
        # 获取当前窗口位置和大小
        original_position = driver.get_window_position()
        original_size = driver.get_window_size()
        
        logger.info(f"原始窗口位置: {original_position}")
        logger.info(f"原始窗口大小: {original_size}")
        
        # 截图记录原始状态
        helpers.take_screenshot("multi_monitor_original_position")
        
        # 测试移动窗口到不同位置
        test_positions = [
            (100, 100),    # 左上角
            (500, 200),    # 中间偏左
            (1000, 100),   # 右侧（可能在第二个显示器）
        ]
        
        for i, (x, y) in enumerate(test_positions):
            logger.info(f"移动窗口到位置: ({x}, {y})")
            
            try:
                driver.set_window_position(x, y)
                time.sleep(2)  # 等待窗口移动完成
                
                # 获取实际位置
                actual_position = driver.get_window_position()
                logger.info(f"实际窗口位置: {actual_position}")
                
                # 截图记录
                helpers.take_screenshot(f"multi_monitor_position_{i+1}_{x}_{y}")
                
            except Exception as e:
                logger.warning(f"移动窗口到 ({x}, {y}) 失败: {e}")
        
        # 恢复原始位置
        driver.set_window_position(original_position['x'], original_position['y'])
        driver.set_window_size(original_size['width'], original_size['height'])
        
        logger.info("✅ 浏览器窗口定位测试完成")
    
    @pytest.mark.smoke
    def test_window_size_variations(self, driver, helpers):
        """
        测试不同窗口大小
        
        验证点：
        1. 小窗口模式
        2. 大窗口模式
        3. 全屏模式
        """
        logger.info("开始测试窗口大小变化")
        
        # 访问测试页面
        driver.get("data:text/html,<html><head><title>窗口大小测试</title></head><body><h1>窗口大小测试</h1><p>窗口信息:</p><div id='info'></div><script>function updateInfo(){const info=document.getElementById('info');info.innerHTML=`宽度: ${window.innerWidth}px<br>高度: ${window.innerHeight}px<br>设备像素比: ${window.devicePixelRatio}`;}updateInfo();window.addEventListener('resize',updateInfo);</script></body></html>")
        
        # 测试不同窗口大小
        window_sizes = [
            ("小窗口", 800, 600),
            ("中等窗口", 1200, 800),
            ("大窗口", 1600, 1000),
        ]
        
        for size_name, width, height in window_sizes:
            logger.info(f"设置窗口大小: {size_name} ({width}x{height})")
            
            try:
                driver.set_window_size(width, height)
                time.sleep(2)  # 等待窗口调整完成
                
                # 获取实际大小
                actual_size = driver.get_window_size()
                logger.info(f"实际窗口大小: {actual_size}")
                
                # 截图记录
                helpers.take_screenshot(f"window_size_{size_name}_{width}x{height}")
                
            except Exception as e:
                logger.warning(f"设置窗口大小 {size_name} 失败: {e}")
        
        logger.info("✅ 窗口大小变化测试完成")
    
    @pytest.mark.smoke
    def test_user_interaction_independence(self, driver, helpers):
        """
        测试用户交互独立性
        
        验证点：
        1. 测试运行时用户可以进行其他操作
        2. 验证测试不受外部干扰
        """
        logger.info("开始测试用户交互独立性")
        
        # 创建一个动态页面来验证测试的连续性
        driver.get("data:text/html,<html><head><title>交互独立性测试</title></head><body><h1>交互独立性测试</h1><p>测试开始时间: <span id='start-time'></span></p><p>当前计数: <span id='counter'>0</span></p><p>页面状态: <span id='status'>运行中</span></p><script>const startTime=new Date();document.getElementById('start-time').textContent=startTime.toLocaleTimeString();let counter=0;const interval=setInterval(()=>{counter++;document.getElementById('counter').textContent=counter;if(counter>=10){document.getElementById('status').textContent='测试完成';clearInterval(interval);}},1000);</script></body></html>")
        
        logger.info("⏰ 测试将运行15秒，在此期间你可以：")
        logger.info("   ✅ 移动鼠标")
        logger.info("   ✅ 使用键盘")
        logger.info("   ✅ 切换到其他窗口")
        logger.info("   ✅ 在其他显示器上工作")
        logger.info("   ⚠️ 请不要点击或移动测试浏览器窗口")
        
        # 在测试期间进行一些自动化操作
        for i in range(15):
            time.sleep(1)
            
            # 每3秒截图一次
            if i % 3 == 0:
                helpers.take_screenshot(f"independence_test_second_{i}")
            
            # 检查页面状态
            try:
                counter_element = driver.find_element(By.ID, "counter")
                counter_value = counter_element.text
                logger.info(f"第 {i+1} 秒 - 页面计数器: {counter_value}")
            except Exception as e:
                logger.warning(f"第 {i+1} 秒 - 读取计数器失败: {e}")
        
        # 最终截图
        helpers.take_screenshot("independence_test_final")
        
        logger.info("✅ 用户交互独立性测试完成")
        logger.info("💡 如果你在测试期间能够正常使用电脑，说明 Selenium 运行正常！")
    
    @pytest.mark.ui
    def test_display_information(self, driver, helpers):
        """
        获取显示器信息
        
        验证点：
        1. 获取屏幕分辨率信息
        2. 检测多显示器设置
        """
        logger.info("开始获取显示器信息")
        
        # 创建一个页面来显示显示器信息
        driver.get("data:text/html,<html><head><title>显示器信息</title></head><body><h1>显示器信息检测</h1><div id='display-info'></div><script>function getDisplayInfo(){const info=document.getElementById('display-info');const screenInfo=`<h3>屏幕信息:</h3><p>屏幕宽度: ${screen.width}px</p><p>屏幕高度: ${screen.height}px</p><p>可用宽度: ${screen.availWidth}px</p><p>可用高度: ${screen.availHeight}px</p><p>颜色深度: ${screen.colorDepth}位</p><p>像素深度: ${screen.pixelDepth}位</p>`;const windowInfo=`<h3>窗口信息:</h3><p>窗口内宽: ${window.innerWidth}px</p><p>窗口内高: ${window.innerHeight}px</p><p>窗口外宽: ${window.outerWidth}px</p><p>窗口外高: ${window.outerHeight}px</p><p>设备像素比: ${window.devicePixelRatio}</p>`;info.innerHTML=screenInfo+windowInfo;}getDisplayInfo();window.addEventListener('resize',getDisplayInfo);</script></body></html>")
        
        time.sleep(2)  # 等待页面加载完成
        
        # 截图记录显示器信息
        helpers.take_screenshot("display_information")
        
        # 尝试获取屏幕信息
        try:
            screen_width = driver.execute_script("return screen.width;")
            screen_height = driver.execute_script("return screen.height;")
            available_width = driver.execute_script("return screen.availWidth;")
            available_height = driver.execute_script("return screen.availHeight;")
            device_pixel_ratio = driver.execute_script("return window.devicePixelRatio;")
            
            logger.info(f"屏幕分辨率: {screen_width} x {screen_height}")
            logger.info(f"可用区域: {available_width} x {available_height}")
            logger.info(f"设备像素比: {device_pixel_ratio}")
            
            # 判断是否可能有多显示器
            if available_width > 2000 or screen_width > 2000:
                logger.info("🖥️ 检测到可能的多显示器设置（宽度 > 2000px）")
            else:
                logger.info("🖥️ 检测到单显示器或较小的多显示器设置")
                
        except Exception as e:
            logger.warning(f"获取显示器信息失败: {e}")
        
        logger.info("✅ 显示器信息检测完成")
