// 浏览器兼容性检测和修复工具
// 专门针对iPhone 15及以下版本的Safari兼容性问题

export interface BrowserCompatibility {
  optionalChaining: boolean
  nullishCoalescing: boolean
  cssGrid: boolean
  cssVariables: boolean
  flexboxGap: boolean
  es2020Features: boolean
}

// 检测浏览器兼容性
export function detectBrowserCompatibility(): BrowserCompatibility {
  const compatibility: BrowserCompatibility = {
    optionalChaining: false,
    nullishCoalescing: false,
    cssGrid: false,
    cssVariables: false,
    flexboxGap: false,
    es2020Features: false
  }

  try {
    // 检测可选链操作符支持
    eval('const test = {}; test?.prop')
    compatibility.optionalChaining = true
  } catch (e) {
    compatibility.optionalChaining = false
  }

  try {
    // 检测空值合并操作符支持
    eval('const test = null ?? "default"')
    compatibility.nullishCoalescing = true
  } catch (e) {
    compatibility.nullishCoalescing = false
  }

  // 检测CSS Grid支持
  if (typeof window !== 'undefined') {
    const testElement = document.createElement('div')
    testElement.style.display = 'grid'
    compatibility.cssGrid = testElement.style.display === 'grid'

    // 检测CSS变量支持
    compatibility.cssVariables = window.CSS && window.CSS.supports && window.CSS.supports('color', 'var(--test)')

    // 检测Flexbox gap支持
    compatibility.flexboxGap = window.CSS && window.CSS.supports && window.CSS.supports('gap', '1rem')
  }

  // 检测ES2020特性支持
  try {
    eval('const test = globalThis')
    compatibility.es2020Features = true
  } catch (e) {
    compatibility.es2020Features = false
  }

  return compatibility
}

// 获取Safari版本信息
export function getSafariVersion(): number | null {
  if (typeof window === 'undefined') return null
  
  const userAgent = window.navigator.userAgent
  const safariMatch = userAgent.match(/Version\/(\d+)\.(\d+).*Safari/)
  
  if (safariMatch) {
    return parseInt(safariMatch[1])
  }
  
  return null
}

// 检测是否为iPhone 15及以下版本
export function isOlderiPhone(): boolean {
  if (typeof window === 'undefined') return false
  
  const userAgent = window.navigator.userAgent
  const isIPhone = /iPhone/.test(userAgent)
  
  if (!isIPhone) return false
  
  // 检测iOS版本
  const iOSMatch = userAgent.match(/OS (\d+)_(\d+)/)
  if (iOSMatch) {
    const majorVersion = parseInt(iOSMatch[1])
    // iOS 15及以下版本可能存在兼容性问题
    return majorVersion <= 15
  }
  
  return false
}

// 应用兼容性修复 - 只在确实需要时应用，不影响正常样式
export function applyCompatibilityFixes(): void {
  const compatibility = detectBrowserCompatibility()
  const isOldiPhone = isOlderiPhone()

  console.log('🔍 浏览器兼容性检测结果:', compatibility)
  console.log('📱 是否为旧版iPhone:', isOldiPhone)

  // 只在检测到真正的兼容性问题时才应用修复
  if (isOldiPhone && !compatibility.optionalChaining) {
    console.log('🔧 检测到iPhone 15兼容性问题，应用最小化修复...')

    // 只添加必要的CSS修复，不影响移动端样式
    applyCSSFixes(compatibility)

    // 显示友好提示
    showCompatibilityNotice()
  } else {
    console.log('✅ 浏览器兼容性良好，无需修复')
  }
}

// 应用CSS修复 - 精准修复，不影响移动端样式
function applyCSSFixes(compatibility: BrowserCompatibility): void {
  if (typeof window === 'undefined') return

  const style = document.createElement('style')
  let cssRules = ''

  // 只在确实需要时添加最小化的修复
  if (!compatibility.cssVariables) {
    // 只修复CSS变量，不影响其他样式
    cssRules += `
      /* 仅修复CSS变量兼容性，保持原有样式 */
      :root {
        --foreground-rgb: 0, 0, 0;
        --background-start-rgb: 214, 219, 220;
        --background-end-rgb: 255, 255, 255;
      }
    `
  }

  if (cssRules) {
    style.textContent = cssRules
    style.setAttribute('data-compatibility-fix', 'true')
    document.head.appendChild(style)
    console.log('✅ 最小化CSS兼容性修复已应用')
  }
}

// 应用JavaScript修复
function applyJavaScriptFixes(compatibility: BrowserCompatibility): void {
  // 可选链操作符polyfill（简化版）
  if (!compatibility.optionalChaining) {
    console.log('🔧 应用可选链操作符polyfill')
    // 注意：这里只是示例，实际项目中应该使用完整的polyfill
    // 由于我们已经在代码中移除了可选链操作符，这里主要是记录
  }
  
  // 空值合并操作符polyfill
  if (!compatibility.nullishCoalescing) {
    console.log('🔧 应用空值合并操作符polyfill')
    // 同样，这里只是示例
  }
}

// 显示兼容性提示 - 更简洁，不影响用户体验
function showCompatibilityNotice(): void {
  if (typeof window === 'undefined') return

  // 只在控制台显示提示，不影响页面布局
  console.log('📱 检测到iPhone 15设备，已应用兼容性修复')

  // 可选：显示一个很小的、不显眼的提示
  const notice = document.createElement('div')
  notice.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 12px;
    z-index: 9999;
    opacity: 0.7;
    pointer-events: none;
  `
  notice.textContent = '兼容性修复已启用'

  document.body.appendChild(notice)

  // 3秒后自动隐藏
  setTimeout(() => {
    if (notice.parentElement) {
      notice.remove()
    }
  }, 3000)
}

// 导出主要函数
export {
  applyCompatibilityFixes as default
}
