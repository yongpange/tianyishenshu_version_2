export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">欢迎来到天乙神数</h1>
          <p className="text-gray-600 mb-8">您已成功登录，开始您的命理探索之旅吧！</p>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-xl">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">小道童</h3>
              <p className="text-gray-600 text-sm">命理学习助手</p>
              <button className="mt-4 w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                开始学习
              </button>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">一事一卦</h3>
              <p className="text-gray-600 text-sm">周易占卜工具</p>
              <button className="mt-4 w-full py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors">
                开始占卜
              </button>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-blue-50 p-6 rounded-xl">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">大司命</h3>
              <p className="text-gray-600 text-sm">命盘分析专家</p>
              <button className="mt-4 w-full py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                分析命盘
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 