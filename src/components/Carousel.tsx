'use client'

interface CarouselProps {
  images: string[]
  mobileImages?: string[]
  className?: string
  useFullHeight?: boolean
}

export default function Carousel({
  images,
  mobileImages,
  className = '',
  useFullHeight = false
}: CarouselProps) {

  if (!images || images.length === 0) {
    const heightClass = useFullHeight ? 'h-full' : 'h-64 md:h-80 lg:h-[42.9vw]'
    return (
      <div className={`relative w-full ${heightClass} bg-gray-100 rounded-2xl lg:rounded-none flex items-center justify-center ${className}`}>
        <p className="text-gray-500 text-lg">轮播图预留位置</p>
      </div>
    )
  }

  const heightClass = useFullHeight ? 'h-full' : 'h-64 md:h-80 lg:h-[42.9vw]'

  return (
    <div className={`relative w-full ${heightClass} overflow-hidden rounded-2xl lg:rounded-none ${className}`}>
      {/* 移动端图片 (768px以下) */}
      {mobileImages && mobileImages[0] && (
        <div className="w-full h-full md:hidden">
          <img
            src={mobileImages[0]}
            alt="海报图片"
            className="w-full h-full object-cover bg-gray-50"
            loading="eager"
          />
        </div>
      )}

      {/* PC端图片 (768px以上) */}
      <div className="w-full h-full hidden md:block">
        <img
          src={images[0]}
          alt="海报图片"
          className="w-full h-full object-contain bg-gray-50"
          loading="eager"
        />
      </div>

      {/* 如果没有移动端图片，在移动端也显示PC端图片 */}
      {(!mobileImages || !mobileImages[0]) && (
        <div className="w-full h-full md:hidden">
          <img
            src={images[0]}
            alt="海报图片"
            className="w-full h-full object-cover bg-gray-50"
            loading="eager"
          />
        </div>
      )}
    </div>
  )
}
