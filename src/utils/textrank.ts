// TextRank算法实现，用于自动生成对话标题
export interface TextRankOptions {
  maxKeywords?: number
  damping?: number
  iterations?: number
  threshold?: number
}

export class TextRank {
  private damping: number
  private iterations: number
  private threshold: number

  constructor(options: TextRankOptions = {}) {
    this.damping = options.damping || 0.85
    this.iterations = options.iterations || 30
    this.threshold = options.threshold || 0.0001
  }

  // 中文分词（简单实现）
  private tokenize(text: string): string[] {
    // 移除标点符号和特殊字符
    const cleanText = text.replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, ' ')
    
    // 简单的中文分词：按字符和空格分割
    const words: string[] = []
    let currentWord = ''
    
    for (const char of cleanText) {
      if (/[\u4e00-\u9fa5]/.test(char)) {
        // 中文字符
        if (currentWord) {
          words.push(currentWord)
          currentWord = ''
        }
        words.push(char)
      } else if (/[a-zA-Z0-9]/.test(char)) {
        // 英文字符和数字
        currentWord += char
      } else if (char === ' ' && currentWord) {
        // 空格，结束当前单词
        words.push(currentWord)
        currentWord = ''
      }
    }
    
    if (currentWord) {
      words.push(currentWord)
    }
    
    return words.filter(word => word.length > 0)
  }

  // 过滤停用词
  private filterStopWords(words: string[]): string[] {
    const stopWords = new Set([
      '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个',
      '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好',
      '自己', '这', '那', '什么', '可以', '这个', '怎么', '为什么', '如何', '吗',
      '呢', '啊', '哦', '嗯', '哈', '呵', '嘿', '额', '呃', '嗯嗯', '好的', '谢谢',
      'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has',
      'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was',
      'will', 'with', 'you', 'your', 'i', 'me', 'my', 'we', 'our', 'us'
    ])
    
    return words.filter(word => 
      !stopWords.has(word.toLowerCase()) && 
      word.length > 1 && 
      !/^\d+$/.test(word) // 过滤纯数字
    )
  }

  // 构建词汇共现图
  private buildGraph(words: string[], windowSize: number = 5): Map<string, Map<string, number>> {
    const graph = new Map<string, Map<string, number>>()
    
    // 初始化图
    for (const word of words) {
      if (!graph.has(word)) {
        graph.set(word, new Map())
      }
    }
    
    // 构建共现关系
    for (let i = 0; i < words.length; i++) {
      const word1 = words[i]
      
      for (let j = i + 1; j < Math.min(i + windowSize, words.length); j++) {
        const word2 = words[j]
        
        if (word1 !== word2) {
          // 添加边
          const neighbors1 = graph.get(word1)!
          const neighbors2 = graph.get(word2)!
          
          neighbors1.set(word2, (neighbors1.get(word2) || 0) + 1)
          neighbors2.set(word1, (neighbors2.get(word1) || 0) + 1)
        }
      }
    }
    
    return graph
  }

  // 计算TextRank分数
  private calculateScores(graph: Map<string, Map<string, number>>): Map<string, number> {
    const words = Array.from(graph.keys())
    const scores = new Map<string, number>()
    
    // 初始化分数
    for (const word of words) {
      scores.set(word, 1.0)
    }
    
    // 迭代计算
    for (let iter = 0; iter < this.iterations; iter++) {
      const newScores = new Map<string, number>()
      let maxChange = 0
      
      for (const word of words) {
        let score = 1 - this.damping
        const neighbors = graph.get(word)!
        
        for (const [neighbor, weight] of neighbors) {
          const neighborNeighbors = graph.get(neighbor)!
          const totalWeight = Array.from(neighborNeighbors.values()).reduce((sum, w) => sum + w, 0)
          
          if (totalWeight > 0) {
            score += this.damping * (scores.get(neighbor)! * weight) / totalWeight
          }
        }
        
        newScores.set(word, score)
        maxChange = Math.max(maxChange, Math.abs(score - scores.get(word)!))
      }
      
      // 更新分数
      for (const [word, score] of newScores) {
        scores.set(word, score)
      }
      
      // 检查收敛
      if (maxChange < this.threshold) {
        break
      }
    }
    
    return scores
  }

  // 提取关键词
  extractKeywords(text: string, maxKeywords: number = 5): string[] {
    if (!text || text.trim().length === 0) {
      return []
    }
    
    // 分词
    const words = this.tokenize(text)
    
    // 过滤停用词
    const filteredWords = this.filterStopWords(words)
    
    if (filteredWords.length === 0) {
      return []
    }
    
    // 构建图
    const graph = this.buildGraph(filteredWords)
    
    // 计算分数
    const scores = this.calculateScores(graph)
    
    // 排序并返回前N个关键词
    const sortedWords = Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxKeywords)
      .map(([word]) => word)
    
    return sortedWords
  }

  // 生成对话标题
  generateTitle(messages: Array<{ content: string, type: 'user' | 'bot' }>): string {
    if (!messages || messages.length === 0) {
      return '新对话'
    }
    
    // 合并所有消息内容
    const allText = messages
      .map(msg => msg.content)
      .join(' ')
    
    // 提取关键词
    const keywords = this.extractKeywords(allText, 3)
    
    if (keywords.length === 0) {
      return '新对话'
    }
    
    // 生成标题
    if (keywords.length === 1) {
      return `关于${keywords[0]}`
    } else if (keywords.length === 2) {
      return `${keywords[0]}与${keywords[1]}`
    } else {
      return `${keywords[0]}、${keywords[1]}等话题`
    }
  }
}

// 创建默认实例
export const textRank = new TextRank({
  maxKeywords: 5,
  damping: 0.85,
  iterations: 30,
  threshold: 0.0001
})

// 便捷函数
export function generateConversationTitle(messages: Array<{ content: string, type: 'user' | 'bot' }>): string {
  return textRank.generateTitle(messages)
}
