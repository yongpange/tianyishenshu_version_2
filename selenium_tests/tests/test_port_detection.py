"""
端口检测测试
检测天乙神算项目在哪个端口运行
"""
import pytest
import requests
from selenium.webdriver.common.by import By
from loguru import logger

class TestPortDetection:
    """端口检测测试类"""
    
    @pytest.mark.smoke
    def test_detect_tianyishenshu_port(self, driver, helpers):
        """
        检测天乙神算项目运行端口
        
        验证点：
        1. 检查常用端口
        2. 识别正确的项目
        """
        logger.info("开始检测天乙神算项目端口")
        
        # 常用的开发端口
        test_ports = [3000, 3001, 3002, 3003, 8000, 8080, 5000]
        found_ports = []
        
        for port in test_ports:
            url = f"http://localhost:{port}"
            logger.info(f"检测端口 {port}...")
            
            try:
                # 使用 requests 快速检查端口是否有响应
                response = requests.get(url, timeout=3)
                if response.status_code == 200:
                    logger.info(f"✅ 端口 {port} 有响应")
                    
                    # 使用 Selenium 访问页面获取详细信息
                    driver.get(url)
                    
                    # 等待页面加载
                    helpers.smart_wait(2)
                    
                    # 获取页面信息
                    title = driver.title
                    current_url = driver.current_url
                    
                    logger.info(f"端口 {port} - 标题: {title}")
                    logger.info(f"端口 {port} - URL: {current_url}")
                    
                    # 截图记录
                    helpers.take_screenshot(f"port_{port}_detection")
                    
                    # 检查是否是天乙神算项目
                    if "天乙神算" in title or "天乙神数" in title:
                        logger.info(f"🎯 找到天乙神算项目在端口 {port}!")
                        found_ports.append({
                            'port': port,
                            'title': title,
                            'url': current_url,
                            'is_tianyishenshu': True
                        })
                    else:
                        found_ports.append({
                            'port': port,
                            'title': title,
                            'url': current_url,
                            'is_tianyishenshu': False
                        })
                        
            except requests.exceptions.RequestException as e:
                logger.debug(f"端口 {port} 无响应: {e}")
            except Exception as e:
                logger.warning(f"检测端口 {port} 时出错: {e}")
        
        # 输出检测结果
        logger.info("=" * 60)
        logger.info("端口检测结果:")
        logger.info("=" * 60)
        
        if found_ports:
            for port_info in found_ports:
                status = "🎯 天乙神算项目" if port_info['is_tianyishenshu'] else "❓ 其他项目"
                logger.info(f"端口 {port_info['port']}: {status}")
                logger.info(f"  标题: {port_info['title']}")
                logger.info(f"  URL: {port_info['url']}")
                logger.info("-" * 40)
        else:
            logger.warning("❌ 没有找到任何运行中的项目")
            logger.info("💡 请手动启动天乙神算项目:")
            logger.info("   cd E:\\1_CODE\\tianyishenshu_2")
            logger.info("   npm run dev")
        
        logger.info("✅ 端口检测完成")
        
        return found_ports
    
    @pytest.mark.smoke
    def test_check_specific_url(self, driver, helpers):
        """
        检查特定URL是否是天乙神算项目
        """
        logger.info("开始检查特定URL")
        
        # 检查默认配置的URL
        from config.settings import TestConfig
        test_url = TestConfig.BASE_URL
        
        logger.info(f"检查配置的URL: {test_url}")
        
        try:
            driver.get(test_url)
            helpers.smart_wait(3)
            
            title = driver.title
            current_url = driver.current_url
            
            logger.info(f"页面标题: {title}")
            logger.info(f"当前URL: {current_url}")
            
            # 截图记录
            helpers.take_screenshot("configured_url_check")
            
            # 检查页面内容
            try:
                # 查找可能包含项目名称的元素
                body_text = driver.find_element(By.TAG_NAME, "body").text
                
                if "天乙神算" in title or "天乙神算" in body_text:
                    logger.info("🎯 确认这是天乙神算项目!")
                    return True
                elif "天乙神数" in title or "天乙神数" in body_text:
                    logger.info("🎯 确认这是天乙神数项目!")
                    return True
                else:
                    logger.warning("❓ 这不是天乙神算项目")
                    logger.info(f"页面内容预览: {body_text[:200]}...")
                    return False
                    
            except Exception as e:
                logger.warning(f"检查页面内容时出错: {e}")
                return False
                
        except Exception as e:
            logger.error(f"访问 {test_url} 失败: {e}")
            logger.info("💡 请确保项目正在运行:")
            logger.info("   cd E:\\1_CODE\\tianyishenshu_2")
            logger.info("   npm run dev")
            return False
