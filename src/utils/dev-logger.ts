// 开发环境日志工具
const isDev = process.env.NODE_ENV === 'development';

export const devLog = {
  log: (...args: any[]) => {
    if (isDev) {
      console.log(...args);
    }
  },
  error: (...args: any[]) => {
    if (isDev) {
      console.error(...args);
    }
  },
  warn: (...args: any[]) => {
    if (isDev) {
      console.warn(...args);
    }
  },
  info: (...args: any[]) => {
    if (isDev) {
      console.info(...args);
    }
  },
  debug: (...args: any[]) => {
    if (isDev) {
      console.debug(...args);
    }
  }
};

// 禁用右键菜单和F12开发者工具
export const disableDevTools = () => {
  if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'development') {
    // 禁用右键菜单
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });

    // 禁用F12和其他开发者工具快捷键
    document.addEventListener('keydown', (e) => {
      // F12
      if (e.key === 'F12') {
        e.preventDefault();
        return false;
      }
      
      // Ctrl+Shift+I (开发者工具)
      if (e.ctrlKey && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        return false;
      }
      
      // Ctrl+Shift+J (控制台)
      if (e.ctrlKey && e.shiftKey && e.key === 'J') {
        e.preventDefault();
        return false;
      }
      
      // Ctrl+U (查看源码)
      if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
        return false;
      }
      
      // Ctrl+Shift+C (元素选择器)
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        return false;
      }
    });

    // 检测开发者工具是否打开
    let devtools = { open: false, orientation: null };
    const threshold = 160;

    setInterval(() => {
      if (window.outerHeight - window.innerHeight > threshold ||
          window.outerWidth - window.innerWidth > threshold) {
        if (!devtools.open) {
          devtools.open = true;
          // 如果检测到开发者工具打开，可以采取行动
          // 例如：跳转到其他页面或显示警告
          alert('开发者工具已被禁用');
          window.location.href = '/';
        }
      } else {
        devtools.open = false;
      }
    }, 500);
  }
}; 