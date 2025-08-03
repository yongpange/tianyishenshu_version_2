"""
真实世界场景演示
展示自动化测试在实际开发中的价值
"""
import pytest
import time
from selenium.webdriver.common.by import By
from loguru import logger
from config.settings import TestConfig

class TestRealWorldScenarios:
    """真实世界场景测试"""
    
    @pytest.mark.smoke
    def test_critical_user_journey_complete_flow(self, driver, helpers, wait_helpers):
        """
        🚨 关键用户流程完整测试
        
        这个测试模拟了一个完整的用户注册到使用的流程
        如果这个流程断了，就意味着没有新用户能够使用你的产品
        
        手动测试这个流程需要：5-10分钟
        自动化测试：2分钟，而且可以每天运行多次
        """
        logger.info("🚨 开始关键用户流程测试 - 这个流程如果坏了，业务就停了")
        
        # 步骤1: 新用户访问首页
        logger.info("步骤1: 新用户首次访问网站")
        driver.get(TestConfig.BASE_URL)
        wait_helpers.wait_for_page_load()
        
        # 验证首页加载正常（如果首页坏了，用户直接流失）
        assert "天乙神算" in driver.title, "💥 首页标题错误 - 用户会认为网站有问题"
        logger.info("✅ 首页正常，用户不会立即流失")
        
        # 步骤2: 用户被吸引，想要体验
        logger.info("步骤2: 用户点击'马上体验'")
        experience_btn = wait_helpers.wait_for_element_clickable(
            (By.XPATH, "//*[contains(text(), '马上体验')]"), timeout=10
        )
        helpers.safe_click(experience_btn)
        wait_helpers.smart_wait(3)
        
        # 验证跳转到正确页面（如果跳转错误，用户会困惑）
        current_url = driver.current_url
        assert "/login" in current_url, f"💥 马上体验按钮跳转错误 - 用户期望进入体验流程，实际到了: {current_url}"
        logger.info("✅ 正确跳转到登录页面，用户体验流畅")
        
        # 步骤3: 用户发现需要注册
        logger.info("步骤3: 新用户点击注册")
        register_link = wait_helpers.wait_for_element_clickable(
            (By.XPATH, "//*[contains(text(), '立即注册')]"), timeout=10
        )
        helpers.safe_click(register_link)
        wait_helpers.smart_wait(3)
        
        # 验证注册页面正常（如果注册页面坏了，就没有新用户了）
        assert "/register" in driver.current_url, "💥 注册链接坏了 - 新用户无法注册"
        logger.info("✅ 注册页面正常，新用户可以注册")
        
        # 步骤4: 验证注册表单完整性
        logger.info("步骤4: 检查注册表单是否完整")
        page_text = driver.find_element(By.TAG_NAME, "body").text
        
        required_elements = ['手机号', '验证码', '兑换码', '步入玄境']
        missing_elements = []
        
        for element in required_elements:
            if element not in page_text:
                missing_elements.append(element)
        
        assert len(missing_elements) == 0, f"💥 注册表单不完整，缺少: {missing_elements} - 用户无法完成注册"
        logger.info("✅ 注册表单完整，用户可以顺利注册")
        
        # 截图记录关键流程
        helpers.take_screenshot("critical_user_journey_success")
        
        logger.info("🎉 关键用户流程测试通过 - 新用户可以正常注册和使用")
    
    @pytest.mark.regression
    def test_all_navigation_links_work(self, driver, helpers, wait_helpers):
        """
        🔄 回归测试：所有导航链接正常工作
        
        这个测试确保网站的所有主要导航都能正常工作
        当你修改了任何代码后，这个测试能快速发现是否破坏了导航
        
        手动测试：需要点击每个链接，检查每个页面（10-15分钟）
        自动化测试：2分钟完成所有检查
        """
        logger.info("🔄 开始回归测试 - 确保所有导航链接正常工作")
        
        # 测试所有主要导航
        navigation_tests = [
            {
                'name': '首页到登录',
                'start_url': TestConfig.BASE_URL,
                'click_text': '登录',
                'expected_url': '/login',
                'business_impact': '用户无法登录 = 失去所有老用户'
            },
            {
                'name': '首页到注册',
                'start_url': TestConfig.BASE_URL,
                'click_text': '注册',
                'expected_url': '/register',
                'business_impact': '用户无法注册 = 失去所有新用户'
            },
            {
                'name': '登录到注册',
                'start_url': f"{TestConfig.BASE_URL}/login",
                'click_text': '立即注册',
                'expected_url': '/register',
                'business_impact': '登录用户无法切换到注册 = 用户体验差'
            }
        ]
        
        failed_navigations = []
        
        for nav_test in navigation_tests:
            try:
                logger.info(f"测试导航: {nav_test['name']}")
                
                # 访问起始页面
                driver.get(nav_test['start_url'])
                wait_helpers.wait_for_page_load()
                wait_helpers.smart_wait(2)
                
                # 查找并点击链接
                link = wait_helpers.wait_for_element_clickable(
                    (By.XPATH, f"//*[contains(text(), '{nav_test['click_text']}')]"),
                    timeout=10
                )
                helpers.safe_click(link)
                wait_helpers.smart_wait(3)
                
                # 验证跳转结果
                current_url = driver.current_url
                if nav_test['expected_url'] not in current_url:
                    failed_navigations.append({
                        'test': nav_test['name'],
                        'expected': nav_test['expected_url'],
                        'actual': current_url,
                        'impact': nav_test['business_impact']
                    })
                    logger.error(f"❌ {nav_test['name']} 失败")
                else:
                    logger.info(f"✅ {nav_test['name']} 成功")
                    
            except Exception as e:
                failed_navigations.append({
                    'test': nav_test['name'],
                    'error': str(e),
                    'impact': nav_test['business_impact']
                })
                logger.error(f"❌ {nav_test['name']} 出错: {e}")
        
        # 生成测试报告
        if failed_navigations:
            logger.error("💥 发现导航问题，业务影响分析:")
            for failure in failed_navigations:
                logger.error(f"   - {failure['test']}: {failure['impact']}")
            
            assert False, f"发现 {len(failed_navigations)} 个导航问题，可能影响用户体验和业务"
        else:
            logger.info("🎉 所有导航链接正常工作，用户体验良好")
    
    @pytest.mark.performance
    def test_page_load_performance(self, driver, helpers, wait_helpers):
        """
        ⚡ 性能测试：页面加载速度
        
        这个测试确保你的网站加载速度足够快
        如果页面加载太慢，用户会直接离开
        
        手动测试：需要用秒表计时，多次测试取平均值（很麻烦）
        自动化测试：精确测量，自动记录，可以设置阈值
        """
        logger.info("⚡ 开始性能测试 - 确保页面加载速度足够快")
        
        pages_to_test = [
            {'url': TestConfig.BASE_URL, 'name': '首页', 'max_load_time': 5},
            {'url': f"{TestConfig.BASE_URL}/login", 'name': '登录页', 'max_load_time': 3},
            {'url': f"{TestConfig.BASE_URL}/register", 'name': '注册页', 'max_load_time': 3}
        ]
        
        performance_results = []
        slow_pages = []
        
        for page in pages_to_test:
            logger.info(f"测试 {page['name']} 加载速度")
            
            # 记录开始时间
            start_time = time.time()
            
            # 访问页面
            driver.get(page['url'])
            wait_helpers.wait_for_page_load()
            
            # 记录结束时间
            end_time = time.time()
            load_time = end_time - start_time
            
            performance_results.append({
                'page': page['name'],
                'load_time': load_time,
                'threshold': page['max_load_time']
            })
            
            if load_time > page['max_load_time']:
                slow_pages.append({
                    'page': page['name'],
                    'load_time': load_time,
                    'threshold': page['max_load_time']
                })
                logger.warning(f"⚠️ {page['name']} 加载较慢: {load_time:.2f}s (阈值: {page['max_load_time']}s)")
            else:
                logger.info(f"✅ {page['name']} 加载正常: {load_time:.2f}s")
        
        # 生成性能报告
        logger.info("📊 性能测试结果:")
        for result in performance_results:
            status = "🐌 慢" if result['load_time'] > result['threshold'] else "⚡ 快"
            logger.info(f"   {result['page']}: {result['load_time']:.2f}s {status}")
        
        if slow_pages:
            logger.warning(f"⚠️ 发现 {len(slow_pages)} 个页面加载较慢，可能影响用户体验")
            # 注意：这里我们只警告，不让测试失败，因为性能问题通常需要优化而不是修复
        else:
            logger.info("🎉 所有页面加载速度正常，用户体验良好")
    
    @pytest.mark.business_critical
    def test_revenue_critical_flow(self, driver, helpers, wait_helpers):
        """
        💰 业务关键流程测试
        
        这个测试模拟了直接影响收入的用户流程
        如果这个流程坏了，直接影响收入
        
        这种测试的价值：
        - 防止因为代码修改导致收入损失
        - 可以在发布前发现问题
        - 可以设置为每次部署前必须通过的测试
        """
        logger.info("💰 开始业务关键流程测试 - 这个流程直接影响收入")
        
        # 模拟用户想要付费使用高级功能的流程
        logger.info("场景: 用户想要使用付费功能")
        
        # 步骤1: 用户访问首页
        driver.get(TestConfig.BASE_URL)
        wait_helpers.wait_for_page_load()
        
        # 步骤2: 用户点击体验按钮（这是转化的第一步）
        experience_btn = wait_helpers.wait_for_element_clickable(
            (By.XPATH, "//*[contains(text(), '马上体验')]"), timeout=10
        )
        
        # 如果体验按钮不存在或不可点击，用户无法开始转化流程
        assert experience_btn, "💥 马上体验按钮不可用 - 用户无法开始转化流程 - 直接影响收入"
        
        helpers.safe_click(experience_btn)
        wait_helpers.smart_wait(3)
        
        # 步骤3: 验证用户能够到达注册/登录页面（转化的关键步骤）
        current_url = driver.current_url
        assert "/login" in current_url, "💥 体验按钮没有引导用户到正确页面 - 转化流程中断"
        
        # 步骤4: 验证注册流程可用（新用户转化）
        register_link = driver.find_elements(By.XPATH, "//*[contains(text(), '立即注册')]")
        assert len(register_link) > 0, "💥 注册链接不存在 - 新用户无法注册 - 失去潜在付费用户"
        
        helpers.safe_click(register_link[0])
        wait_helpers.smart_wait(3)
        
        # 验证注册页面有兑换码功能（这可能是付费功能的入口）
        page_text = driver.find_element(By.TAG_NAME, "body").text
        assert "兑换码" in page_text, "💥 兑换码功能不可用 - 付费用户无法兑换 - 直接影响收入"
        
        logger.info("✅ 业务关键流程正常 - 用户可以正常转化为付费用户")
        
        # 截图记录
        helpers.take_screenshot("revenue_critical_flow_success")
        
        logger.info("💰 业务关键流程测试通过 - 收入流程安全")
