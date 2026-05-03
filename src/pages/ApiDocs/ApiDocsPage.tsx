import React from 'react';
import { useNavigate } from 'react-router-dom';

const ApiDocsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-stone-50">
      {/* 顶部导航 */}
      <div className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="text-stone-600 hover:text-green-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-stone-800">API 文档</h1>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="max-w-2xl mx-auto px-4 py-6 pb-12">
        {/* 标题区 */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-green-600 mb-2">舌镜辨证 API</h2>
          <p className="text-stone-500 text-sm">版本 v1.0 · 基于Coze智能问诊引擎</p>
        </div>

        {/* 概述 */}
        <section className="mb-8">
          <h3 className="text-lg font-semibold text-stone-800 mb-3 flex items-center gap-2">
            <span className="w-1 h-5 bg-green-500 rounded-full"></span>
            概述
          </h3>
          <p className="text-stone-600 leading-relaxed">
            舌镜是辨证能力引擎，提供舌象识别与中医辨证分析API。通过上传舌象图片，
            返回结构化的舌诊数据，可对接本地辨证引擎实现完整的中医智能诊断。
          </p>
        </section>

        {/* 已开放接口 */}
        <section className="mb-8">
          <h3 className="text-lg font-semibold text-stone-800 mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-green-500 rounded-full"></span>
            已开放接口
          </h3>

          {/* 接口1 */}
          <div className="bg-white rounded-xl border border-stone-200 p-4 mb-4 shadow-sm">
            <div className="flex items-start gap-3 mb-3">
              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                POST
              </span>
              <code className="text-sm text-stone-700 font-mono flex-1 break-all">
                /api/tongue-ai/tongue
              </code>
            </div>
            <p className="text-stone-600 text-sm mb-3">
              上传舌象图片，创建舌诊分析任务
            </p>
            
            <div className="bg-stone-50 rounded-lg p-3 mb-3">
              <p className="text-xs font-medium text-stone-500 mb-2">请求参数</p>
              <pre className="text-xs text-stone-600 font-mono overflow-x-auto">
{`{
  "image": "data:image/jpeg;base64,..."  // Base64编码的图片
}`}
              </pre>
            </div>

            <div className="bg-stone-50 rounded-lg p-3 mb-3">
              <p className="text-xs font-medium text-stone-500 mb-2">成功响应</p>
              <pre className="text-xs text-stone-600 font-mono overflow-x-auto">
{`{
  "success": true,
  "chat_id": "xxx",
  "conversation_id": "xxx",
  "status": "in_progress"
}`}
              </pre>
            </div>

            <div className="bg-stone-50 rounded-lg p-3">
              <p className="text-xs font-medium text-stone-500 mb-2">curl 示例</p>
              <pre className="text-xs text-stone-600 font-mono overflow-x-auto whitespace-pre-wrap break-all">
{`curl -X POST https://she-zhen.top/api/tongue-ai/tongue \\
  -H "Content-Type: application/json" \\
  -d '{"image":"data:image/jpeg;base64,..."}'`}
              </pre>
            </div>
          </div>

          {/* 接口2 */}
          <div className="bg-white rounded-xl border border-stone-200 p-4 mb-4 shadow-sm">
            <div className="flex items-start gap-3 mb-3">
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                GET
              </span>
              <code className="text-sm text-stone-700 font-mono flex-1 break-all">
                /api/tongue-ai/result?chat_id=xxx&conversation_id=xxx
              </code>
            </div>
            <p className="text-stone-600 text-sm mb-3">
              轮询查询舌诊分析结果
            </p>
            
            <div className="bg-stone-50 rounded-lg p-3 mb-3">
              <p className="text-xs font-medium text-stone-500 mb-2">处理中响应</p>
              <pre className="text-xs text-stone-600 font-mono overflow-x-auto">
{`{
  "success": true,
  "status": "in_progress"
}`}
              </pre>
            </div>

            <div className="bg-stone-50 rounded-lg p-3 mb-3">
              <p className="text-xs font-medium text-stone-500 mb-2">完成响应</p>
              <pre className="text-xs text-stone-600 font-mono overflow-x-auto">
{`{
  "success": true,
  "status": "completed",
  "data": {
    "tongueDetected": true,
    "tongue_color": "淡红",
    "tongue_shape": "淡胖",
    "tongue_coating": "薄白",
    "region_features": "...",
    "shape_distribution": "..."
  }
}`}
              </pre>
            </div>

            <div className="bg-stone-50 rounded-lg p-3">
              <p className="text-xs font-medium text-stone-500 mb-2">curl 示例</p>
              <pre className="text-xs text-stone-600 font-mono overflow-x-auto whitespace-pre-wrap break-all">
{`curl "https://she-zhen.top/api/tongue-ai/result?chat_id=xxx&conversation_id=xxx"`}
              </pre>
            </div>
          </div>
        </section>

        {/* 调用流程 */}
        <section className="mb-8">
          <h3 className="text-lg font-semibold text-stone-800 mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-green-500 rounded-full"></span>
            调用流程
          </h3>
          <div className="bg-white rounded-xl border border-stone-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="text-center flex-1">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-green-600 font-bold">1</span>
                </div>
                <p className="text-xs text-stone-600">POST上传图片</p>
                <p className="text-xs text-stone-400">获取chat_id</p>
              </div>
              <div className="flex-1 flex justify-center">
                <svg className="w-6 h-6 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <div className="text-center flex-1">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-green-600 font-bold">2</span>
                </div>
                <p className="text-xs text-stone-600">GET轮询结果</p>
                <p className="text-xs text-stone-400">建议1秒间隔</p>
              </div>
              <div className="flex-1 flex justify-center">
                <svg className="w-6 h-6 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <div className="text-center flex-1">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-green-600 font-bold">3</span>
                </div>
                <p className="text-xs text-stone-600">本地辨证</p>
                <p className="text-xs text-stone-400">完整诊断</p>
              </div>
            </div>
          </div>
        </section>

        {/* 规划中 */}
        <section className="mb-8">
          <h3 className="text-lg font-semibold text-stone-800 mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-stone-300 rounded-full"></span>
            规划中
          </h3>
          <div className="space-y-2">
            {[
              { version: 'v1.1', name: '问诊交互API', desc: '支持多轮对话追问' },
              { version: 'v1.2', name: '穴位查询API', desc: '穴位定位与功效查询' },
              { version: 'v1.3', name: '体质辨识API', desc: '九种体质分类评估' },
              { version: 'v2.0', name: '健康画像API', desc: '全方位健康状态评估' },
            ].map((item) => (
              <div key={item.version} className="bg-stone-100 rounded-lg px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 bg-stone-200 text-stone-500 text-xs font-mono rounded">
                    {item.version}
                  </span>
                  <span className="text-stone-600 text-sm">{item.name}</span>
                </div>
                <span className="text-stone-400 text-xs">{item.desc}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 其他接入方式 */}
        <section className="mb-8">
          <h3 className="text-lg font-semibold text-stone-800 mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-green-500 rounded-full"></span>
            其他接入方式
          </h3>

          <div className="bg-white rounded-xl border border-stone-200 p-4 mb-4 shadow-sm">
            <h4 className="font-medium text-stone-700 mb-2">MCP 接入</h4>
            <p className="text-xs text-stone-500 mb-2">适用于 Claude Desktop 等 MCP 客户端</p>
            <div className="bg-stone-50 rounded-lg p-3">
              <p className="text-xs text-stone-500 mb-1">Server Address</p>
              <code className="text-xs text-green-600 font-mono break-all">
                https://mcp.zheng-he.top/mcp
              </code>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {['tongue_analyze', 'tongue_interrogate', 'acupoint_query'].map((tool) => (
                <span key={tool} className="text-xs text-stone-600 bg-stone-100 px-2 py-1 rounded text-center">
                  {tool}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-stone-200 p-4 mb-4 shadow-sm">
            <h4 className="font-medium text-stone-700 mb-2">扣子 Bot 接入</h4>
            <p className="text-xs text-stone-500 mb-2">对话式舌诊体验</p>
            <div className="bg-stone-50 rounded-lg p-3">
              <p className="text-xs text-stone-500 mb-1">Bot ID</p>
              <code className="text-xs text-green-600 font-mono">
                7634049322782785572
              </code>
            </div>
          </div>
        </section>

        {/* 定价 */}
        <section className="mb-8">
          <h3 className="text-lg font-semibold text-stone-800 mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-green-500 rounded-full"></span>
            定价
          </h3>
          <div className="grid grid-cols-1 gap-3">
            <div className="bg-white rounded-xl border border-stone-200 p-4 text-center">
              <p className="text-stone-400 text-sm mb-1">免费试用</p>
              <p className="text-2xl font-bold text-green-600">每日 3 次</p>
            </div>
            <div className="bg-white rounded-xl border border-stone-200 p-4 text-center">
              <p className="text-stone-400 text-sm mb-1">标准版</p>
              <p className="text-2xl font-bold text-stone-700">9.9 积分/次</p>
            </div>
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-4 text-center text-white">
              <p className="text-green-100 text-sm mb-1">企业版</p>
              <p className="text-lg font-bold">联系商务定制</p>
            </div>
          </div>
        </section>

        {/* 底部 */}
        <div className="text-center pt-4 border-t border-stone-200">
          <p className="text-stone-400 text-xs">
            © 2024 舌镜 · she-zhen.top
          </p>
        </div>
      </div>
    </div>
  );
};

export default ApiDocsPage;
