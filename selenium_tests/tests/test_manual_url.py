"""
手动URL测试
允许手动指定URL进行测试
"""
import pytest
from selenium.webdriver.common.by import By
from loguru import logger

class TestManualURL:
    """手动URL测试类"""
    
    @pytest.mark.smoke
    def test_manual_url_access(self, driver, helpers, wait_helpers):
        """
        手动指定URL进行测试
        
        使用方法：
        python -m pytest tests/test_manual_url.py::TestManualURL::test_manual_url_access -v -s --url=http://localhost:3000
        """
        logger.info("开始手动URL测试")
        
        # 从命令行参数获取URL，如果没有则使用默认值
        import sys
        test_url = "http://localhost:3000"  # 默认URL
        
        # 检查命令行参数
        for arg in sys.argv:
            if arg.startswith("--url="):
                test_url = arg.split("=", 1)[1]
                break
        
        logger.info(f"测试URL: {test_url}")
        
        try:
            # 访问指定URL
            driver.get(test_url)
            
            # 等待页面加载
            wait_helpers.wait_for_page_load()
            helpers.smart_wait(2)
            
            # 获取页面信息
            title = driver.title
            current_url = driver.current_url
            
            logger.info(f"页面标题: {title}")
            logger.info(f"当前URL: {current_url}")
            
            # 截图记录
            helpers.take_screenshot("manual_url_test")
            
            # 检查页面是否加载成功
            if title and title.strip():
                logger.info("✅ 页面加载成功")
                
                # 检查是否是天乙神算项目
                if "天乙神算" in title or "天乙神数" in title:
                    logger.info("🎯 确认这是天乙神算项目!")
                else:
                    logger.info(f"ℹ️ 这是其他项目: {title}")
                
                # 获取页面基本信息
                try:
                    # 查找主要元素
                    h1_elements = driver.find_elements(By.TAG_NAME, "h1")
                    if h1_elements:
                        logger.info(f"主标题: {h1_elements[0].text}")
                    
                    # 查找导航元素
                    nav_elements = driver.find_elements(By.TAG_NAME, "nav")
                    if nav_elements:
                        logger.info(f"找到 {len(nav_elements)} 个导航元素")
                    
                    # 获取页面文本内容（前200字符）
                    body = driver.find_element(By.TAG_NAME, "body")
                    body_text = body.text[:200] if body.text else "无文本内容"
                    logger.info(f"页面内容预览: {body_text}...")
                    
                except Exception as e:
                    logger.warning(f"获取页面详细信息时出错: {e}")
                
                return True
                
            else:
                logger.warning("❌ 页面标题为空，可能加载失败")
                return False
                
        except Exception as e:
            logger.error(f"访问 {test_url} 失败: {e}")
            logger.info("💡 请检查:")
            logger.info("   1. URL是否正确")
            logger.info("   2. 项目是否正在运行")
            logger.info("   3. 端口是否被占用")
            return False
    
    @pytest.mark.smoke  
    def test_common_ports(self, driver, helpers):
        """
        测试常用端口
        """
        logger.info("开始测试常用端口")
        
        ports = [3000, 3001, 3002, 8000, 8080]
        successful_ports = []
        
        for port in ports:
            url = f"http://localhost:{port}"
            logger.info(f"测试端口 {port}...")
            
            try:
                driver.set_page_load_timeout(5)  # 设置较短的超时时间
                driver.get(url)
                
                # 简单等待
                helpers.smart_wait(1)
                
                title = driver.title
                if title and title.strip():
                    logger.info(f"✅ 端口 {port} 响应正常 - 标题: {title}")
                    successful_ports.append({
                        'port': port,
                        'title': title,
                        'url': url
                    })
                    
                    # 截图记录
                    helpers.take_screenshot(f"port_{port}_test")
                    
                    # 检查是否是天乙神算
                    if "天乙神算" in title or "天乙神数" in title:
                        logger.info(f"🎯 在端口 {port} 找到天乙神算项目!")
                else:
                    logger.info(f"⚠️ 端口 {port} 响应但无标题")
                    
            except Exception as e:
                logger.debug(f"端口 {port} 无响应: {str(e)[:50]}...")
        
        # 恢复默认超时时间
        driver.set_page_load_timeout(30)
        
        # 输出结果
        logger.info("=" * 50)
        logger.info("端口测试结果:")
        for port_info in successful_ports:
            logger.info(f"  端口 {port_info['port']}: {port_info['title']}")
        
        if not successful_ports:
            logger.warning("❌ 没有找到任何运行中的项目")
            logger.info("💡 请启动你的项目:")
            logger.info("   cd E:\\1_CODE\\tianyishenshu_2")
            logger.info("   npm run dev")
        
        logger.info("✅ 端口测试完成")
        return successful_ports
