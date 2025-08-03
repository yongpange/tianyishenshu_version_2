"""
项目检测测试
详细检测天乙神算项目的运行状态
"""
import pytest
import requests
import time
from selenium.webdriver.common.by import By
from selenium.common.exceptions import TimeoutException, WebDriverException
from loguru import logger

class TestProjectDetection:
    """项目检测测试类"""
    
    @pytest.mark.smoke
    def test_detailed_port_scan(self, driver, helpers):
        """
        详细的端口扫描
        """
        logger.info("开始详细端口扫描")
        
        # 扩展端口范围
        ports = [3000, 3001, 3002, 3003, 3004, 3005, 8000, 8080, 8081, 5000, 5001, 4000, 4001]
        found_services = []
        
        for port in ports:
            url = f"http://localhost:{port}"
            logger.info(f"🔍 扫描端口 {port}...")
            
            # 方法1: 使用 requests 快速检测
            try:
                response = requests.get(url, timeout=2)
                if response.status_code == 200:
                    logger.info(f"✅ 端口 {port} HTTP响应正常")
                    
                    # 方法2: 使用 Selenium 获取详细信息
                    try:
                        # 设置短超时
                        driver.set_page_load_timeout(8)
                        driver.get(url)
                        
                        # 等待页面加载
                        time.sleep(2)
                        
                        title = driver.title or "无标题"
                        current_url = driver.current_url
                        
                        # 获取页面内容
                        try:
                            body_text = driver.find_element(By.TAG_NAME, "body").text[:100]
                        except:
                            body_text = "无法获取页面内容"
                        
                        service_info = {
                            'port': port,
                            'title': title,
                            'url': current_url,
                            'content_preview': body_text,
                            'status': 'active'
                        }
                        
                        # 检查是否是天乙神算项目
                        if any(keyword in title.lower() for keyword in ['天乙神算', '天乙神数', 'tianyishenshu']):
                            service_info['is_target'] = True
                            logger.info(f"🎯 在端口 {port} 找到天乙神算项目!")
                        elif any(keyword in body_text.lower() for keyword in ['天乙神算', '天乙神数']):
                            service_info['is_target'] = True
                            logger.info(f"🎯 在端口 {port} 找到天乙神算项目! (通过内容检测)")
                        else:
                            service_info['is_target'] = False
                        
                        found_services.append(service_info)
                        
                        logger.info(f"📄 端口 {port} 详情:")
                        logger.info(f"   标题: {title}")
                        logger.info(f"   内容: {body_text}")
                        
                        # 截图记录
                        helpers.take_screenshot(f"port_scan_{port}")
                        
                    except (TimeoutException, WebDriverException) as e:
                        logger.warning(f"⚠️ 端口 {port} Selenium访问失败: {str(e)[:50]}...")
                        found_services.append({
                            'port': port,
                            'title': 'HTTP响应正常但Selenium访问失败',
                            'status': 'http_only',
                            'is_target': False
                        })
                        
            except requests.exceptions.RequestException:
                logger.debug(f"❌ 端口 {port} 无HTTP响应")
        
        # 恢复默认超时
        driver.set_page_load_timeout(30)
        
        # 输出详细结果
        logger.info("=" * 80)
        logger.info("🔍 详细端口扫描结果:")
        logger.info("=" * 80)
        
        if found_services:
            target_found = False
            for service in found_services:
                status_icon = "🎯" if service.get('is_target') else "📄"
                logger.info(f"{status_icon} 端口 {service['port']}:")
                logger.info(f"   标题: {service['title']}")
                if 'content_preview' in service:
                    logger.info(f"   内容: {service['content_preview']}")
                logger.info(f"   状态: {service['status']}")
                logger.info("-" * 40)
                
                if service.get('is_target'):
                    target_found = True
            
            if target_found:
                logger.info("🎉 找到天乙神算项目!")
            else:
                logger.warning("⚠️ 找到运行中的服务，但不是天乙神算项目")
        else:
            logger.warning("❌ 没有找到任何运行中的服务")
            logger.info("💡 请确认:")
            logger.info("   1. 项目是否已启动")
            logger.info("   2. 启动命令是否成功")
            logger.info("   3. 是否有错误信息")
        
        logger.info("✅ 详细端口扫描完成")
        return found_services
    
    @pytest.mark.smoke
    def test_manual_url_check(self, driver, helpers):
        """
        手动URL检查
        """
        logger.info("开始手动URL检查")
        
        # 让用户可以通过环境变量或命令行指定URL
        import os
        test_url = os.getenv('TEST_URL', 'http://localhost:3000')
        
        logger.info(f"🔗 检查URL: {test_url}")
        
        try:
            # 首先用requests检查
            response = requests.get(test_url, timeout=5)
            logger.info(f"📡 HTTP状态码: {response.status_code}")
            
            if response.status_code == 200:
                # 用Selenium获取详细信息
                driver.get(test_url)
                helpers.smart_wait(3)
                
                title = driver.title
                current_url = driver.current_url
                
                logger.info(f"📄 页面标题: {title}")
                logger.info(f"🔗 当前URL: {current_url}")
                
                # 检查页面内容
                try:
                    body = driver.find_element(By.TAG_NAME, "body")
                    body_text = body.text[:200] if body.text else "页面无文本内容"
                    logger.info(f"📝 页面内容预览: {body_text}...")
                    
                    # 查找关键元素
                    h1_elements = driver.find_elements(By.TAG_NAME, "h1")
                    if h1_elements:
                        logger.info(f"📌 主标题: {h1_elements[0].text}")
                    
                    # 查找导航
                    nav_elements = driver.find_elements(By.TAG_NAME, "nav")
                    logger.info(f"🧭 导航元素数量: {len(nav_elements)}")
                    
                    # 查找按钮
                    button_elements = driver.find_elements(By.TAG_NAME, "button")
                    logger.info(f"🔘 按钮数量: {len(button_elements)}")
                    
                    # 截图记录
                    helpers.take_screenshot("manual_url_check")
                    
                    # 判断是否是天乙神算项目
                    if any(keyword in title for keyword in ['天乙神算', '天乙神数']):
                        logger.info("🎯 确认这是天乙神算项目!")
                        return True
                    elif any(keyword in body_text for keyword in ['天乙神算', '天乙神数']):
                        logger.info("🎯 通过内容确认这是天乙神算项目!")
                        return True
                    else:
                        logger.warning("❓ 这不是天乙神算项目")
                        logger.info("💡 如果这是你的项目，请检查页面标题和内容")
                        return False
                        
                except Exception as e:
                    logger.error(f"❌ 分析页面内容时出错: {e}")
                    return False
            else:
                logger.error(f"❌ HTTP请求失败，状态码: {response.status_code}")
                return False
                
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ 无法连接到 {test_url}: {e}")
            logger.info("💡 请检查:")
            logger.info("   1. URL是否正确")
            logger.info("   2. 项目是否正在运行")
            logger.info("   3. 端口是否被占用")
            return False
        except Exception as e:
            logger.error(f"❌ 检查过程中出错: {e}")
            return False
