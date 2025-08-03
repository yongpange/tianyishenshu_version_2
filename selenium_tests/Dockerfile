# Selenium自动化测试Docker镜像
# 这个镜像包含了运行自动化测试所需的所有环境

FROM python:3.11-slim

# 设置工作目录
WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    unzip \
    curl \
    xvfb \
    && rm -rf /var/lib/apt/lists/*

# 安装Chrome浏览器
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list \
    && apt-get update \
    && apt-get install -y google-chrome-stable \
    && rm -rf /var/lib/apt/lists/*

# 安装ChromeDriver
RUN CHROMEDRIVER_VERSION=`curl -sS chromedriver.storage.googleapis.com/LATEST_RELEASE` && \
    mkdir -p /opt/chromedriver-$CHROMEDRIVER_VERSION && \
    curl -sS -o /tmp/chromedriver_linux64.zip http://chromedriver.storage.googleapis.com/$CHROMEDRIVER_VERSION/chromedriver_linux64.zip && \
    unzip -qq /tmp/chromedriver_linux64.zip -d /opt/chromedriver-$CHROMEDRIVER_VERSION && \
    rm /tmp/chromedriver_linux64.zip && \
    chmod +x /opt/chromedriver-$CHROMEDRIVER_VERSION/chromedriver && \
    ln -fs /opt/chromedriver-$CHROMEDRIVER_VERSION/chromedriver /usr/local/bin/chromedriver

# 复制requirements.txt并安装Python依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制测试代码
COPY . .

# 设置环境变量
ENV PYTHONPATH=/app
ENV DISPLAY=:99

# 创建启动脚本
RUN echo '#!/bin/bash\n\
# 启动虚拟显示器\n\
Xvfb :99 -screen 0 1920x1080x24 &\n\
# 等待显示器启动\n\
sleep 2\n\
# 运行测试\n\
python -m pytest tests/ -v --html=reports/test_report.html --self-contained-html\n\
' > /app/run_tests.sh && chmod +x /app/run_tests.sh

# 暴露端口（如果需要）
EXPOSE 4444

# 默认命令
CMD ["/app/run_tests.sh"]
