#!/usr/bin/env python3
"""
天乙神算 CI/CD 自动化测试设置脚本
一键设置GitHub Actions自动化测试
"""
import os
import subprocess
import sys
from pathlib import Path

def print_banner():
    """打印欢迎信息"""
    print("=" * 60)
    print("🚀 天乙神算 CI/CD 自动化测试设置")
    print("=" * 60)
    print("这个脚本将帮你设置完整的自动化测试系统")
    print("包括：GitHub Actions、自动通知、测试报告等")
    print("=" * 60)

def check_git_status():
    """检查Git状态"""
    print("\n📋 步骤1: 检查Git状态")
    
    try:
        # 检查是否是Git仓库
        result = subprocess.run(['git', 'status'], capture_output=True, text=True)
        if result.returncode != 0:
            print("❌ 当前目录不是Git仓库")
            return False
        
        print("✅ Git仓库检查通过")
        
        # 检查远程仓库
        result = subprocess.run(['git', 'remote', '-v'], capture_output=True, text=True)
        if 'github.com' in result.stdout:
            print("✅ 检测到GitHub远程仓库")
            return True
        else:
            print("⚠️ 未检测到GitHub远程仓库")
            print("请确保你的项目已推送到GitHub")
            return False
            
    except FileNotFoundError:
        print("❌ 未安装Git")
        return False

def check_files():
    """检查必要文件"""
    print("\n📋 步骤2: 检查必要文件")
    
    required_files = [
        '.github/workflows/selenium-tests.yml',
        'selenium_tests/requirements.txt',
        'selenium_tests/tests/',
        'package.json'
    ]
    
    missing_files = []
    
    for file_path in required_files:
        if os.path.exists(file_path):
            print(f"✅ {file_path}")
        else:
            print(f"❌ {file_path}")
            missing_files.append(file_path)
    
    if missing_files:
        print(f"\n⚠️ 缺少必要文件: {missing_files}")
        return False
    
    print("✅ 所有必要文件检查通过")
    return True

def setup_github_secrets():
    """设置GitHub Secrets指南"""
    print("\n📋 步骤3: GitHub Secrets设置指南")
    
    print("""
🔐 需要在GitHub仓库中设置以下Secrets（可选）：

1. 进入你的GitHub仓库
2. 点击 Settings → Secrets and variables → Actions
3. 点击 "New repository secret"
4. 添加以下Secrets（如果需要通知功能）：

📧 邮件通知（可选）：
- EMAIL_USERNAME: 你的邮箱用户名
- EMAIL_PASSWORD: 你的邮箱密码或应用密码

📱 微信通知（可选）：
- WECHAT_WEBHOOK_URL: 企业微信机器人Webhook地址

💬 Slack通知（可选）：
- SLACK_WEBHOOK_URL: Slack Webhook地址

注意：这些都是可选的，不设置也能正常运行测试！
""")

def commit_and_push():
    """提交并推送代码"""
    print("\n📋 步骤4: 提交并推送代码")
    
    try:
        # 检查是否有未提交的更改
        result = subprocess.run(['git', 'status', '--porcelain'], capture_output=True, text=True)
        
        if result.stdout.strip():
            print("发现未提交的更改，正在提交...")
            
            # 添加所有文件
            subprocess.run(['git', 'add', '.'], check=True)
            
            # 提交
            commit_message = "🚀 添加GitHub Actions自动化测试配置"
            subprocess.run(['git', 'commit', '-m', commit_message], check=True)
            
            print("✅ 代码已提交")
            
            # 推送
            print("正在推送到GitHub...")
            result = subprocess.run(['git', 'push'], capture_output=True, text=True)
            
            if result.returncode == 0:
                print("✅ 代码已推送到GitHub")
                return True
            else:
                print(f"❌ 推送失败: {result.stderr}")
                return False
        else:
            print("✅ 没有需要提交的更改")
            return True
            
    except subprocess.CalledProcessError as e:
        print(f"❌ Git操作失败: {e}")
        return False

def get_github_repo_url():
    """获取GitHub仓库URL"""
    try:
        result = subprocess.run(['git', 'remote', 'get-url', 'origin'], capture_output=True, text=True)
        if result.returncode == 0:
            url = result.stdout.strip()
            # 转换SSH URL到HTTPS URL
            if url.startswith('git@github.com:'):
                url = url.replace('git@github.com:', 'https://github.com/')
                url = url.replace('.git', '')
            return url
        return None
    except:
        return None

def show_next_steps():
    """显示下一步操作"""
    print("\n🎉 设置完成！")
    
    repo_url = get_github_repo_url()
    
    print("\n📋 下一步操作：")
    
    if repo_url:
        print(f"1. 📊 查看GitHub Actions: {repo_url}/actions")
        print(f"2. ⚙️ 设置Secrets: {repo_url}/settings/secrets/actions")
        print(f"3. 🔍 查看工作流: {repo_url}/blob/main/.github/workflows/selenium-tests.yml")
    else:
        print("1. 📊 在GitHub仓库中查看 Actions 标签")
        print("2. ⚙️ 在 Settings → Secrets 中设置通知")
        print("3. 🔍 查看 .github/workflows/selenium-tests.yml 文件")
    
    print("\n🚀 自动化测试触发条件：")
    print("✅ 每次推送代码到main分支")
    print("✅ 每次创建Pull Request")
    print("✅ 每天凌晨2点自动运行")
    print("✅ 可以手动触发")
    
    print("\n📱 你将收到通知：")
    print("✅ GitHub界面实时显示测试进度")
    print("✅ 邮件通知测试结果（如果设置了）")
    print("✅ 微信通知测试结果（如果设置了）")
    
    print("\n🔍 查看测试结果：")
    if repo_url:
        print(f"📊 GitHub Actions: {repo_url}/actions")
    print("📧 邮件通知")
    print("📱 手机GitHub App")

def main():
    """主函数"""
    print_banner()
    
    # 检查步骤
    steps = [
        ("检查Git状态", check_git_status),
        ("检查必要文件", check_files),
    ]
    
    for step_name, step_func in steps:
        if not step_func():
            print(f"\n❌ {step_name}失败，请解决问题后重新运行")
            sys.exit(1)
    
    # 设置指南
    setup_github_secrets()
    
    # 询问是否提交推送
    print("\n" + "="*60)
    response = input("是否现在提交并推送代码到GitHub？(y/n): ").lower().strip()
    
    if response in ['y', 'yes', '是']:
        if commit_and_push():
            print("\n✅ 代码已推送，GitHub Actions将自动开始运行！")
        else:
            print("\n❌ 推送失败，请手动推送代码")
    else:
        print("\n📝 请手动运行以下命令推送代码：")
        print("git add .")
        print("git commit -m '🚀 添加GitHub Actions自动化测试配置'")
        print("git push")
    
    show_next_steps()

if __name__ == "__main__":
    main()
