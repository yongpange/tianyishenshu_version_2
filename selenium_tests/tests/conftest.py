"""
pytest 配置文件
定义测试夹具和全局配置
"""
import pytest
import sys
import os
from pathlib import Path
from loguru import logger

# 添加项目根目录到 Python 路径
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from utils.driver_manager import DriverManager
from utils.helpers import TestHelpers
from utils.wait_helpers import WaitHelpers
from config.settings import TestConfig

# 配置 loguru 日志
logger.remove()  # 移除默认处理器
logger.add(
    TestConfig.LOG_DIR / "test_{time:YYYY-MM-DD}.log",
    rotation="1 day",
    retention="7 days",
    level=TestConfig.LOG_LEVEL,
    format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}"
)
logger.add(
    sys.stdout,
    level=TestConfig.LOG_LEVEL,
    format="<green>{time:HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>"
)

@pytest.fixture(scope="session")
def test_config():
    """测试配置夹具"""
    return TestConfig()

@pytest.fixture(scope="function")
def driver_manager():
    """WebDriver 管理器夹具"""
    manager = DriverManager()
    yield manager
    # 测试结束后清理
    manager.quit_driver()

@pytest.fixture(scope="function")
def driver(driver_manager, request):
    """WebDriver 夹具"""
    # 从测试标记中获取浏览器配置
    browser = getattr(request.node.get_closest_marker("browser"), "args", [None])[0] if request.node.get_closest_marker("browser") else None
    headless = getattr(request.node.get_closest_marker("headless"), "args", [None])[0] if request.node.get_closest_marker("headless") else None
    mobile = getattr(request.node.get_closest_marker("mobile"), "args", [None])[0] if request.node.get_closest_marker("mobile") else None
    
    # 创建驱动
    driver = driver_manager.create_driver(
        browser_name=browser,
        headless=headless,
        mobile_device=mobile
    )
    
    yield driver
    
    # 测试失败时截图
    if request.node.rep_call.failed:
        helpers = TestHelpers(driver)
        test_name = request.node.name
        helpers.take_screenshot(f"failed_{test_name}", on_failure=True)

@pytest.fixture(scope="function")
def helpers(driver):
    """测试辅助工具夹具"""
    return TestHelpers(driver)

@pytest.fixture(scope="function")
def wait_helpers(driver):
    """等待辅助工具夹具"""
    return WaitHelpers(driver)

@pytest.fixture(autouse=True)
def setup_test_environment(request):
    """自动设置测试环境"""
    test_name = request.node.name
    logger.info(f"开始测试: {test_name}")
    
    yield
    
    logger.info(f"测试完成: {test_name}")

# pytest hook：收集测试结果用于截图
@pytest.hookimpl(tryfirst=True, hookwrapper=True)
def pytest_runtest_makereport(item, call):
    """收集测试结果"""
    outcome = yield
    rep = outcome.get_result()
    setattr(item, "rep_" + rep.when, rep)

# pytest hook：测试会话开始
def pytest_sessionstart(session):
    """测试会话开始时的设置"""
    logger.info("=" * 80)
    logger.info("天乙神算 Selenium 自动化测试开始")
    logger.info("=" * 80)
    
    # 确保必要的目录存在
    TestConfig.SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)
    TestConfig.REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    TestConfig.LOG_DIR.mkdir(parents=True, exist_ok=True)

# pytest hook：测试会话结束
def pytest_sessionfinish(session, exitstatus):
    """测试会话结束时的清理"""
    logger.info("=" * 80)
    logger.info(f"天乙神算 Selenium 自动化测试结束，退出状态: {exitstatus}")
    logger.info("=" * 80)

# pytest hook：添加命令行选项
def pytest_addoption(parser):
    """添加自定义命令行选项"""
    parser.addoption(
        "--browser",
        action="store",
        default="chrome",
        help="指定浏览器: chrome, firefox, edge"
    )
    parser.addoption(
        "--headless",
        action="store_true",
        default=False,
        help="启用无头模式"
    )
    parser.addoption(
        "--base-url",
        action="store",
        default="http://localhost:3000",
        help="指定测试基础URL"
    )
    parser.addoption(
        "--mobile",
        action="store",
        help="指定移动设备: iphone_12, android"
    )

# pytest hook：配置测试
def pytest_configure(config):
    """配置测试环境"""
    # 从命令行参数更新配置
    if config.getoption("--browser"):
        TestConfig.BROWSER = config.getoption("--browser")
    if config.getoption("--headless"):
        TestConfig.HEADLESS = True
    if config.getoption("--base-url"):
        TestConfig.BASE_URL = config.getoption("--base-url")

# 自定义标记
pytest_plugins = []
