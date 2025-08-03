"""
测试运行脚本
提供简单的测试执行入口
"""
import subprocess
import sys
import os
from pathlib import Path

def run_tests(test_type="smoke", browser="chrome", headless=False, base_url="http://localhost:3000"):
    """
    运行测试
    
    Args:
        test_type (str): 测试类型 (smoke, ui, all)
        browser (str): 浏览器类型 (chrome, firefox, edge)
        headless (bool): 是否无头模式
        base_url (str): 测试基础URL
    """
    
    # 构建pytest命令
    cmd = [
        "python", "-m", "pytest",
        "-v",  # 详细输出
        "--tb=short",  # 简短的错误回溯
        f"--browser={browser}",
        f"--base-url={base_url}",
        "--html=reports/test_report.html",
        "--self-contained-html"
    ]
    
    # 添加无头模式
    if headless:
        cmd.append("--headless")
    
    # 添加测试标记
    if test_type != "all":
        cmd.extend(["-m", test_type])
    
    # 添加测试目录
    cmd.append("tests/")
    
    print("=" * 80)
    print("🚀 天乙神算 Selenium 自动化测试")
    print("=" * 80)
    print(f"测试类型: {test_type}")
    print(f"浏览器: {browser}")
    print(f"无头模式: {headless}")
    print(f"测试URL: {base_url}")
    print("=" * 80)
    
    # 执行测试
    try:
        result = subprocess.run(cmd, cwd=Path(__file__).parent)
        return result.returncode
    except KeyboardInterrupt:
        print("\n❌ 测试被用户中断")
        return 1
    except Exception as e:
        print(f"❌ 测试执行失败: {e}")
        return 1

def main():
    """主函数"""
    import argparse
    
    parser = argparse.ArgumentParser(description="天乙神算 Selenium 自动化测试")
    parser.add_argument("--type", choices=["smoke", "ui", "all"], default="smoke",
                       help="测试类型 (默认: smoke)")
    parser.add_argument("--browser", choices=["chrome", "firefox", "edge"], default="chrome",
                       help="浏览器类型 (默认: chrome)")
    parser.add_argument("--headless", action="store_true",
                       help="启用无头模式")
    parser.add_argument("--url", default="http://localhost:3000",
                       help="测试基础URL (默认: http://localhost:3000)")
    
    args = parser.parse_args()
    
    # 检查是否在正确的目录
    if not Path("tests").exists():
        print("❌ 错误: 请在 selenium_tests 目录下运行此脚本")
        return 1
    
    # 运行测试
    exit_code = run_tests(
        test_type=args.type,
        browser=args.browser,
        headless=args.headless,
        base_url=args.url
    )
    
    if exit_code == 0:
        print("\n✅ 测试执行完成")
        print(f"📊 测试报告: {Path('reports/test_report.html').absolute()}")
    else:
        print("\n❌ 测试执行失败")
    
    return exit_code

if __name__ == "__main__":
    sys.exit(main())
