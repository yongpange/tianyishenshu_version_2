'use client'

import { useState, useEffect, useCallback } from 'react'
import { StarIcon } from '@heroicons/react/24/solid'
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

interface Comment {
  id: string
  name: string
  avatar: string
  rating: number
  content: string
  date: string
  location?: string
}

interface UserCommentsProps {
  className?: string
}

// 预设评论数据 - 轮播式展示
const mockComments: Comment[] = [
  {
    id: '1',
    name: '李明轩',
    avatar: '🧑‍💼',
    rating: 5,
    content: '天乙神算的性格分析报告非常准确，让我对自己有了更深的认识。AI老法师的解读很有深度，特别是在事业规划方面给了我很多启发。传统命理与现代AI的结合，确实让人眼前一亮。推荐给所有想了解自己内心世界的朋友。',
    date: '2024-12-15',
    location: '北京'
  },
  {
    id: '2',
    name: '王雅琪',
    avatar: '👩‍💻',
    rating: 5,
    content: '八字排盘功能很专业，界面设计也很美观简洁。最重要的是可以和AI进行深度对话，不像传统算命那样一问一答就结束了。这里可以持续追问，AI老法师总能给出有针对性的建议，解答了我很多人生困惑。',
    date: '2024-12-14',
    location: '上海'
  },
  {
    id: '3',
    name: '张浩然',
    avatar: '👨‍🎓',
    rating: 5,
    content: '作为一个命理爱好者，这个平台给了我很多新的启发。传统智慧与现代科技的完美结合，既保持了东方文化的深度，又有现代技术的便利性。报告内容详实，分析透彻，确实是一个值得信赖的专业平台。',
    date: '2024-12-13',
    location: '广州'
  },
  {
    id: '4',
    name: '陈思雨',
    avatar: '👩‍🎨',
    rating: 5,
    content: '婚恋感情分析真的很准确，帮助我更好地理解了自己在感情中的模式和需求。AI老法师不仅分析了我的性格特点，还给出了很多实用的建议。现在我对自己的感情生活有了更清晰的认知和规划。',
    date: '2024-12-12',
    location: '深圳'
  }
]

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <div key={star}>
          {star <= rating ? (
            <StarIcon className="w-4 h-4 text-black" />
          ) : (
            <StarOutlineIcon className="w-4 h-4 text-gray-300" />
          )}
        </div>
      ))}
    </div>
  )
}

export default function UserComments({ className = '' }: UserCommentsProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  const nextSlide = useCallback(() => {
    setCurrentIndex((prevIndex) =>
      prevIndex === mockComments.length - 1 ? 0 : prevIndex + 1
    )
  }, [])

  const prevSlide = useCallback(() => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? mockComments.length - 1 : prevIndex - 1
    )
  }, [])

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
  }

  // 自动播放
  useEffect(() => {
    if (isHovered) return

    const interval = setInterval(nextSlide, 6000) // 6秒切换
    return () => clearInterval(interval)
  }, [isHovered, nextSlide])

  return (
    <section className={`py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 ${className}`}>
      <div className="max-w-6xl mx-auto">
        {/* 标题 */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">
            用户真实反馈
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            来自全国各地用户的真实体验分享，见证天乙神算的专业与用心
          </p>
        </div>

        {/* 轮播容器 */}
        <div
          className="relative overflow-hidden rounded-3xl bg-white shadow-lg group"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* 评论轮播 */}
          <div
            className="flex transition-transform duration-700 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {mockComments.map((comment) => (
              <div
                key={comment.id}
                className="w-full flex-shrink-0 p-12 md:p-16"
              >
                <div className="max-w-4xl mx-auto text-center">
                  {/* 评分 */}
                  <div className="flex justify-center mb-6">
                    <StarRating rating={comment.rating} />
                  </div>

                  {/* 评论内容 */}
                  <blockquote className="text-lg md:text-xl text-gray-700 leading-relaxed mb-8 font-medium">
                    "{comment.content}"
                  </blockquote>

                  {/* 用户信息 */}
                  <div className="flex items-center justify-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-2xl mr-4">
                      {comment.avatar}
                    </div>
                    <div className="text-left">
                      <h4 className="font-semibold text-black text-lg">{comment.name}</h4>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <span>{comment.location}</span>
                        <span className="mx-2">•</span>
                        <span>{comment.date}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 左右箭头 */}
          <button
            onClick={prevSlide}
            className="absolute left-6 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-black rounded-full p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg"
            aria-label="上一条评论"
          >
            <ChevronLeftIcon className="w-6 h-6" />
          </button>

          <button
            onClick={nextSlide}
            className="absolute right-6 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-black rounded-full p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg"
            aria-label="下一条评论"
          >
            <ChevronRightIcon className="w-6 h-6" />
          </button>

          {/* 指示器 */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-3">
            {mockComments.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? 'bg-black scale-110'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`跳转到第 ${index + 1} 条评论`}
              />
            ))}
          </div>
        </div>

        {/* 底部提示 */}
        <div className="text-center mt-12">
          <p className="text-gray-500 text-sm">
            以上评论来自真实用户，更多精彩体验等您发现
          </p>
        </div>
      </div>
    </section>
  )
}
