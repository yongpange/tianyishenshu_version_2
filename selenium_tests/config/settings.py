"""
测试配置文件
包含所有测试相关的配置参数
"""
import os
from pathlib import Path

# 项目根目录
PROJECT_ROOT = Path(__file__).parent.parent

# 测试环境配置
class TestConfig:
    """测试配置类"""
    
    # 基础URL配置
    BASE_URL = os.getenv('TEST_BASE_URL', 'http://localhost:3000')
    
    # 浏览器配置
    BROWSER = os.getenv('TEST_BROWSER', 'chrome')  # chrome, firefox, edge
    HEADLESS = os.getenv('TEST_HEADLESS', 'false').lower() == 'true'
    
    # 等待时间配置（秒）
    IMPLICIT_WAIT = 10
    EXPLICIT_WAIT = 20
    PAGE_LOAD_TIMEOUT = 30
    
    # 截图配置
    SCREENSHOT_ON_FAILURE = True
    SCREENSHOT_DIR = PROJECT_ROOT / 'screenshots'
    
    # 测试报告配置
    REPORTS_DIR = PROJECT_ROOT / 'reports'
    
    # 测试数据配置
    TEST_DATA_DIR = PROJECT_ROOT / 'test_data'
    
    # 日志配置
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    LOG_DIR = PROJECT_ROOT / 'logs'
    
    # 移动端测试配置
    MOBILE_DEVICES = {
        'iphone_12': {
            'width': 390,
            'height': 844,
            'user_agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
        },
        'android': {
            'width': 412,
            'height': 915,
            'user_agent': 'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36'
        }
    }
    
    # 测试用户数据
    TEST_USERS = {
        'valid_phone': '13800138000',  # 测试用手机号
        'test_verification_code': '123456'  # 测试验证码
    }

# 创建必要的目录
def create_directories():
    """创建测试所需的目录"""
    directories = [
        TestConfig.SCREENSHOT_DIR,
        TestConfig.REPORTS_DIR,
        TestConfig.LOG_DIR,
        TestConfig.TEST_DATA_DIR
    ]
    
    for directory in directories:
        directory.mkdir(parents=True, exist_ok=True)

# 初始化时创建目录
create_directories()
