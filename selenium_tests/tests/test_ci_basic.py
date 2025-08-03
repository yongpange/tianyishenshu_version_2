"""
CI/CD环境基础测试
专门为GitHub Actions优化的简化测试
"""
import pytest
import time
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from loguru import logger
from config.settings import TestConfig

class TestCIBasic:
    """CI/CD环境基础测试类"""
    
    @pytest.mark.smoke
    def test_homepage_accessibility(self, driver, helpers, wait_helpers):
        """
        🏠 首页可访问性测试（CI/CD优化版）
        
        这是最基础的测试，验证网站是否能正常访问
        """
        logger.info("🏠 开始CI/CD首页可访问性测试")
        
        try:
            # 访问首页
            logger.info(f"访问URL: {TestConfig.BASE_URL}")
            driver.get(TestConfig.BASE_URL)
            
            # 等待页面加载
            wait_helpers.wait_for_page_load()
            wait_helpers.smart_wait(5)
            
            # 验证页面标题
            title = driver.title
            logger.info(f"页面标题: {title}")
            
            # 基础验证
            assert title is not None, "页面标题为空"
            assert len(title) > 0, "页面标题长度为0"
            
            # 验证页面内容
            body = driver.find_element(By.TAG_NAME, "body")
            body_text = body.text
            
            assert len(body_text) > 100, f"页面内容过少，可能加载失败。内容长度: {len(body_text)}"
            
            # 截图记录
            helpers.take_screenshot("ci_homepage_accessibility")
            
            logger.info("✅ CI/CD首页可访问性测试通过")
            
        except Exception as e:
            logger.error(f"❌ CI/CD首页可访问性测试失败: {e}")
            helpers.take_screenshot("ci_homepage_accessibility_failed")
            raise
    
    @pytest.mark.smoke
    def test_basic_elements_present(self, driver, helpers, wait_helpers):
        """
        🔍 基础元素存在测试（CI/CD优化版）
        
        验证页面基本元素是否存在
        """
        logger.info("🔍 开始CI/CD基础元素存在测试")
        
        try:
            # 访问首页
            driver.get(TestConfig.BASE_URL)
            wait_helpers.wait_for_page_load()
            wait_helpers.smart_wait(3)
            
            # 检查页面是否包含关键内容
            page_text = driver.find_element(By.TAG_NAME, "body").text
            
            # 基础关键词检查
            basic_keywords = ['天乙神算', '登录', '注册']
            found_keywords = []
            
            for keyword in basic_keywords:
                if keyword in page_text:
                    found_keywords.append(keyword)
                    logger.info(f"✅ 找到关键词: {keyword}")
                else:
                    logger.warning(f"⚠️ 未找到关键词: {keyword}")
            
            # 至少要找到一个关键词
            assert len(found_keywords) > 0, f"未找到任何关键词，页面可能加载异常。页面内容前100字符: {page_text[:100]}"
            
            # 截图记录
            helpers.take_screenshot("ci_basic_elements")
            
            logger.info(f"✅ CI/CD基础元素测试通过，找到关键词: {found_keywords}")
            
        except Exception as e:
            logger.error(f"❌ CI/CD基础元素测试失败: {e}")
            helpers.take_screenshot("ci_basic_elements_failed")
            raise
    
    @pytest.mark.smoke
    def test_page_structure_basic(self, driver, helpers, wait_helpers):
        """
        📋 页面结构基础测试（CI/CD优化版）
        
        验证页面基本HTML结构
        """
        logger.info("📋 开始CI/CD页面结构基础测试")
        
        try:
            # 访问首页
            driver.get(TestConfig.BASE_URL)
            wait_helpers.wait_for_page_load()
            wait_helpers.smart_wait(3)
            
            # 检查基本HTML结构
            html_elements = [
                ('html', By.TAG_NAME, 'html'),
                ('head', By.TAG_NAME, 'head'),
                ('body', By.TAG_NAME, 'body'),
                ('title', By.TAG_NAME, 'title')
            ]
            
            found_elements = []
            
            for element_name, by_type, selector in html_elements:
                try:
                    element = driver.find_element(by_type, selector)
                    if element:
                        found_elements.append(element_name)
                        logger.info(f"✅ 找到HTML元素: {element_name}")
                except:
                    logger.warning(f"⚠️ 未找到HTML元素: {element_name}")
            
            # 验证基本结构完整
            assert len(found_elements) >= 3, f"HTML基本结构不完整，只找到: {found_elements}"
            
            # 检查是否有JavaScript错误
            logs = driver.get_log('browser')
            severe_errors = [log for log in logs if log['level'] == 'SEVERE']
            
            if severe_errors:
                logger.warning(f"⚠️ 发现 {len(severe_errors)} 个严重JavaScript错误")
                for error in severe_errors[:3]:  # 只显示前3个错误
                    logger.warning(f"JS错误: {error['message'][:100]}...")
            else:
                logger.info("✅ 未发现严重JavaScript错误")
            
            # 截图记录
            helpers.take_screenshot("ci_page_structure")
            
            logger.info("✅ CI/CD页面结构基础测试通过")
            
        except Exception as e:
            logger.error(f"❌ CI/CD页面结构测试失败: {e}")
            helpers.take_screenshot("ci_page_structure_failed")
            raise
    
    @pytest.mark.smoke
    def test_response_time_basic(self, driver, helpers, wait_helpers):
        """
        ⚡ 响应时间基础测试（CI/CD优化版）
        
        验证页面加载时间在合理范围内
        """
        logger.info("⚡ 开始CI/CD响应时间基础测试")
        
        try:
            # 记录开始时间
            start_time = time.time()
            
            # 访问首页
            driver.get(TestConfig.BASE_URL)
            wait_helpers.wait_for_page_load()
            
            # 记录结束时间
            end_time = time.time()
            load_time = end_time - start_time
            
            logger.info(f"页面加载时间: {load_time:.2f}秒")
            
            # 验证加载时间合理（CI/CD环境可能较慢，设置较宽松的阈值）
            max_load_time = 30  # CI/CD环境30秒内加载完成即可
            assert load_time < max_load_time, f"页面加载时间过长: {load_time:.2f}秒 (阈值: {max_load_time}秒)"
            
            # 截图记录
            helpers.take_screenshot("ci_response_time")
            
            if load_time < 10:
                logger.info(f"✅ 页面加载速度优秀: {load_time:.2f}秒")
            elif load_time < 20:
                logger.info(f"✅ 页面加载速度良好: {load_time:.2f}秒")
            else:
                logger.info(f"✅ 页面加载速度可接受: {load_time:.2f}秒")
            
        except Exception as e:
            logger.error(f"❌ CI/CD响应时间测试失败: {e}")
            helpers.take_screenshot("ci_response_time_failed")
            raise
