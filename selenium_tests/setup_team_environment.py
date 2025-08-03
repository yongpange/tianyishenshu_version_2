#!/usr/bin/env python3
"""
团队自动化测试环境一键安装脚本
让团队成员快速搭建自动化测试环境
"""
import os
import sys
import subprocess
import platform
import urllib.request
import zipfile
import shutil
from pathlib import Path

class TeamEnvironmentSetup:
    """团队环境安装器"""
    
    def __init__(self):
        self.system = platform.system().lower()
        self.python_version = f"{sys.version_info.major}.{sys.version_info.minor}"
        self.project_root = Path(__file__).parent
        
    def print_banner(self):
        """打印欢迎信息"""
        print("=" * 60)
        print("🚀 天乙神算自动化测试环境安装器")
        print("=" * 60)
        print(f"操作系统: {platform.system()} {platform.release()}")
        print(f"Python版本: {self.python_version}")
        print(f"安装目录: {self.project_root}")
        print("=" * 60)
    
    def check_python_version(self):
        """检查Python版本"""
        print("🐍 检查Python版本...")
        
        if sys.version_info < (3, 8):
            print("❌ Python版本过低，需要Python 3.8+")
            print("请访问 https://www.python.org/downloads/ 下载最新版本")
            return False
        
        print(f"✅ Python版本检查通过: {self.python_version}")
        return True
    
    def install_chrome(self):
        """安装Chrome浏览器"""
        print("🌐 检查Chrome浏览器...")
        
        try:
            # 检查Chrome是否已安装
            if self.system == "windows":
                chrome_paths = [
                    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
                    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
                ]
                chrome_installed = any(os.path.exists(path) for path in chrome_paths)
            else:
                result = subprocess.run(["which", "google-chrome"], 
                                      capture_output=True, text=True)
                chrome_installed = result.returncode == 0
            
            if chrome_installed:
                print("✅ Chrome浏览器已安装")
                return True
            else:
                print("⚠️ 未检测到Chrome浏览器")
                print("请手动安装Chrome浏览器:")
                print("Windows: https://www.google.com/chrome/")
                print("Mac: brew install --cask google-chrome")
                print("Ubuntu: sudo apt-get install google-chrome-stable")
                return False
                
        except Exception as e:
            print(f"❌ 检查Chrome时出错: {e}")
            return False
    
    def install_python_dependencies(self):
        """安装Python依赖"""
        print("📦 安装Python依赖...")
        
        try:
            # 检查pip
            subprocess.run([sys.executable, "-m", "pip", "--version"], 
                         check=True, capture_output=True)
            print("✅ pip可用")
            
            # 安装依赖
            requirements_file = self.project_root / "requirements.txt"
            if requirements_file.exists():
                print("正在安装依赖包...")
                subprocess.run([
                    sys.executable, "-m", "pip", "install", "-r", str(requirements_file)
                ], check=True)
                print("✅ Python依赖安装完成")
                return True
            else:
                print("❌ 未找到requirements.txt文件")
                return False
                
        except subprocess.CalledProcessError as e:
            print(f"❌ 安装Python依赖失败: {e}")
            return False
    
    def test_selenium_environment(self):
        """测试Selenium环境"""
        print("🧪 测试Selenium环境...")
        
        try:
            # 创建测试脚本
            test_script = """
import sys
sys.path.insert(0, '.')

from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.options import Options

print("正在测试Selenium环境...")

# 配置Chrome选项
options = Options()
options.add_argument('--headless')
options.add_argument('--no-sandbox')
options.add_argument('--disable-dev-shm-usage')

# 创建WebDriver
service = Service(ChromeDriverManager().install())
driver = webdriver.Chrome(service=service, options=options)

# 测试访问网页
driver.get("https://www.baidu.com")
title = driver.title
driver.quit()

print(f"✅ Selenium环境测试成功！访问百度，标题: {title}")
"""
            
            # 运行测试
            result = subprocess.run([
                sys.executable, "-c", test_script
            ], capture_output=True, text=True, cwd=self.project_root)
            
            if result.returncode == 0:
                print("✅ Selenium环境测试通过")
                print(result.stdout)
                return True
            else:
                print("❌ Selenium环境测试失败")
                print(result.stderr)
                return False
                
        except Exception as e:
            print(f"❌ 测试Selenium环境时出错: {e}")
            return False
    
    def create_run_script(self):
        """创建运行脚本"""
        print("📝 创建运行脚本...")
        
        try:
            if self.system == "windows":
                # Windows批处理脚本
                script_content = f"""@echo off
echo 🚀 启动天乙神算自动化测试
cd /d "{self.project_root}"
python -m pytest tests/ -v --html=reports/test_report.html --self-contained-html
pause
"""
                script_path = self.project_root / "run_tests.bat"
            else:
                # Unix shell脚本
                script_content = f"""#!/bin/bash
echo "🚀 启动天乙神算自动化测试"
cd "{self.project_root}"
python -m pytest tests/ -v --html=reports/test_report.html --self-contained-html
"""
                script_path = self.project_root / "run_tests.sh"
            
            with open(script_path, 'w', encoding='utf-8') as f:
                f.write(script_content)
            
            if not self.system == "windows":
                os.chmod(script_path, 0o755)
            
            print(f"✅ 运行脚本创建完成: {script_path}")
            return True
            
        except Exception as e:
            print(f"❌ 创建运行脚本失败: {e}")
            return False
    
    def create_team_readme(self):
        """创建团队使用说明"""
        print("📚 创建团队使用说明...")
        
        readme_content = """# 天乙神算自动化测试 - 团队使用指南

## 🚀 快速开始

### 1. 环境要求
- Python 3.8+
- Chrome浏览器
- Git

### 2. 安装步骤
```bash
# 1. 克隆项目
git clone <项目地址>
cd tianyishenshu_2

# 2. 运行环境安装脚本
cd selenium_tests
python setup_team_environment.py

# 3. 启动项目（另一个终端）
npm install
npm run dev

# 4. 运行自动化测试
# Windows:
run_tests.bat

# Mac/Linux:
./run_tests.sh
```

### 3. 测试命令
```bash
# 运行所有测试
python -m pytest tests/ -v

# 运行特定测试
python -m pytest tests/test_tianyishenshu_basic.py -v

# 生成HTML报告
python -m pytest tests/ --html=reports/test_report.html --self-contained-html

# 无头模式运行
python -m pytest tests/ --headless -v
```

### 4. CI/CD集成
项目已配置GitHub Actions，每次推送代码时自动运行测试。

### 5. 故障排除
- 如果Chrome驱动下载失败，检查网络连接
- 如果测试失败，查看screenshots目录的截图
- 如果环境问题，重新运行setup_team_environment.py

### 6. 联系支持
如有问题，请联系项目维护者。
"""
        
        try:
            readme_path = self.project_root / "TEAM_README.md"
            with open(readme_path, 'w', encoding='utf-8') as f:
                f.write(readme_content)
            
            print(f"✅ 团队使用说明创建完成: {readme_path}")
            return True
            
        except Exception as e:
            print(f"❌ 创建团队使用说明失败: {e}")
            return False
    
    def run_setup(self):
        """运行完整安装流程"""
        self.print_banner()
        
        steps = [
            ("检查Python版本", self.check_python_version),
            ("检查Chrome浏览器", self.install_chrome),
            ("安装Python依赖", self.install_python_dependencies),
            ("测试Selenium环境", self.test_selenium_environment),
            ("创建运行脚本", self.create_run_script),
            ("创建团队说明", self.create_team_readme)
        ]
        
        failed_steps = []
        
        for step_name, step_func in steps:
            print(f"\n📋 {step_name}...")
            try:
                if not step_func():
                    failed_steps.append(step_name)
            except Exception as e:
                print(f"❌ {step_name}失败: {e}")
                failed_steps.append(step_name)
        
        print("\n" + "=" * 60)
        if failed_steps:
            print("⚠️ 安装完成，但有以下问题:")
            for step in failed_steps:
                print(f"   - {step}")
            print("\n请手动解决上述问题后重新运行安装脚本")
        else:
            print("🎉 环境安装完成！")
            print("\n下一步:")
            print("1. 启动天乙神算项目: npm run dev")
            print("2. 运行自动化测试:")
            if self.system == "windows":
                print("   Windows: 双击 run_tests.bat")
            else:
                print("   Mac/Linux: ./run_tests.sh")
            print("3. 查看测试报告: reports/test_report.html")
        
        print("=" * 60)

if __name__ == "__main__":
    setup = TeamEnvironmentSetup()
    setup.run_setup()
