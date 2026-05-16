import React, { useState } from 'react';

/**
 * 推理链可视化组件 v2.0
 * 展示四层推理过程：舌质舌苔 → 舌形舌态 → 分区凹凸 → 综合推理
 */

// ========== 类型定义 ==========
export interface InferenceLayer {
  layer: 1 | 2 | 3 | 4;
  name: string;
  conclusion: {
    label: string;       // 如"气虚湿盛"
    confidence: number; // 0-1
    evidence: string[];  // 支撑证据
  };
  input?: string;        // 本层输入
  reasoning?: string;    // 推理说明
}

export interface InferenceChain {
  layers: InferenceLayer[];
  currentStep: number;   // 推理到第几层
  finalOutput: {
    syndrome: string;     // 最终证型
    rootCause: string;   // 根本原因
    transmission: string[]; // 传变路径
  };
}

export interface InferenceChainViewProps {
  chain: InferenceChain;
  compact?: boolean;  // 紧凑模式
}

// ========== 层级配置 ==========
const LAYER_CONFIG = {
  1: {
    icon: '🔴',
    color: 'red',
    bgClass: 'bg-red-50',
    borderClass: 'border-red-200',
    textClass: 'text-red-600',
    label: 'L1',
    title: '舌质舌苔',
    subtitle: '气血与脾胃整体判断',
  },
  2: {
    icon: '🟠',
    color: 'orange',
    bgClass: 'bg-orange-50',
    borderClass: 'border-orange-200',
    textClass: 'text-orange-600',
    label: 'L2',
    title: '舌形舌态',
    subtitle: '虚实本质分析',
  },
  3: {
    icon: '🟣',
    color: 'purple',
    bgClass: 'bg-purple-50',
    borderClass: 'border-purple-200',
    textClass: 'text-purple-600',
    label: 'L3',
    title: '分区凹凸',
    subtitle: '脏腑精确定位',
  },
  4: {
    icon: '🟢',
    color: 'green',
    bgClass: 'bg-green-50',
    borderClass: 'border-green-200',
    textClass: 'text-green-600',
    label: 'L4',
    title: '综合推理',
    subtitle: '证型与配穴方案',
  },
} as const;

// ========== 置信度条组件 ==========
const ConfidenceBar: React.FC<{ confidence: number }> = ({ confidence }) => {
  const percentage = Math.round(confidence * 100);
  const colorClass = percentage >= 80 
    ? 'bg-emerald-500' 
    : percentage >= 60 
      ? 'bg-amber-500' 
      : 'bg-stone-400';
  
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-stone-200 rounded-full overflow-hidden">
        <div 
          className={`h-full ${colorClass} transition-all duration-500 rounded-full`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs text-stone-500 font-medium w-10 text-right">
        {percentage}%
      </span>
    </div>
  );
};

// ========== 单层推理卡片 ==========
const LayerCard: React.FC<{
  layer: InferenceLayer;
  isActive: boolean;
  isCompleted: boolean;
  isPending: boolean;
  compact?: boolean;
}> = ({ layer, isActive, isCompleted, isPending, compact = false }) => {
  const config = LAYER_CONFIG[layer.layer];
  const [isExpanded, setIsExpanded] = useState(isActive && !compact);

  const borderClass = isActive 
    ? `border-${config.color}-400 ring-2 ring-${config.color}-100` 
    : isCompleted 
      ? `border-${config.color}-200` 
      : 'border-stone-200 opacity-50';
  
  const bgClass = isActive 
    ? config.bgClass 
    : isCompleted 
      ? 'bg-white' 
      : 'bg-stone-50';

  return (
    <div 
      className={`relative rounded-xl border-2 ${borderClass} ${bgClass} transition-all duration-300 ${
        isActive ? 'shadow-md' : 'shadow-sm'
      }`}
    >
      {/* 层级标签 */}
      <div className="absolute -left-3 top-4">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
          isActive ? `bg-${config.color}-500` : isCompleted ? `bg-${config.color}-400` : 'bg-stone-400'
        }`}>
          {layer.layer}
        </div>
      </div>

      {/* 连接线 */}
      {layer.layer < 4 && (
        <div className="absolute left-3 -bottom-6 w-0.5 h-6 bg-stone-300 z-10">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-stone-400" />
        </div>
      )}

      <div className="p-4 pl-4">
        {/* 层级标题 */}
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg">{config.icon}</span>
              <span className={`font-semibold ${isActive ? config.textClass : 'text-stone-700'}`}>
                {config.title}
              </span>
              {isActive && (
                <span className={`px-1.5 py-0.5 text-xs rounded-full ${config.bgClass} ${config.textClass} font-medium`}>
                  进行中
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500 mt-0.5">{config.subtitle}</p>
          </div>
          
          {!compact && (
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-stone-400 hover:text-stone-600 transition-colors"
            >
              <svg className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
        </div>

        {/* 推理结论 */}
        <div className={`${config.textClass} font-semibold text-base mb-2`}>
          {layer.conclusion.label}
        </div>

        {/* 置信度条 */}
        <ConfidenceBar confidence={layer.conclusion.confidence} />

        {/* 展开详情 */}
        {isExpanded && !compact && (
          <div className="mt-3 pt-3 border-t border-stone-200 space-y-2 animate-fade-in">
            {/* 输入 */}
            {layer.input && (
              <div className="text-xs">
                <span className="text-stone-500">输入：</span>
                <span className="text-stone-700">{layer.input}</span>
              </div>
            )}
            
            {/* 推理说明 */}
            {layer.reasoning && (
              <div className="text-xs">
                <span className="text-stone-500">推理：</span>
                <span className="text-stone-700">{layer.reasoning}</span>
              </div>
            )}
            
            {/* 证据列表 */}
            {layer.conclusion.evidence.length > 0 && (
              <div className="text-xs">
                <span className="text-stone-500">证据：</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {layer.conclusion.evidence.map((e, i) => (
                    <span key={i} className={`px-2 py-0.5 rounded-full text-xs ${config.bgClass} ${config.textClass}`}>
                      {e}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ========== 最终结论组件 ==========
const FinalConclusion: React.FC<{ output: InferenceChain['finalOutput'] }> = ({ output }) => {
  return (
    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border-2 border-emerald-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">🎯</span>
        <span className="font-semibold text-emerald-700">最终结论</span>
      </div>
      
      <div className="space-y-3">
        {/* 证型 */}
        <div>
          <div className="text-xs text-emerald-600 mb-1">证型</div>
          <div className="text-lg font-bold text-emerald-800">
            {output.syndrome}
          </div>
        </div>
        
        {/* 根本原因 */}
        <div>
          <div className="text-xs text-emerald-600 mb-1">根本原因</div>
          <div className="text-sm text-emerald-700">
            {output.rootCause}
          </div>
        </div>
        
        {/* 传变路径 */}
        {output.transmission.length > 0 && (
          <div>
            <div className="text-xs text-emerald-600 mb-1">传变路径</div>
            <div className="space-y-1">
              {output.transmission.map((t, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-emerald-700">
                  <span className="w-4 h-4 rounded-full bg-emerald-200 text-emerald-700 flex items-center justify-center text-xs font-bold">
                    {i + 1}
                  </span>
                  {t}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ========== 主组件 ==========
const InferenceChainView: React.FC<InferenceChainViewProps> = ({ chain, compact = false }) => {
  return (
    <div className={`${compact ? '' : 'bg-stone-50 rounded-2xl p-4'}`}>
      {!compact && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🧠</span>
            <span className="font-semibold text-stone-700">推理链分析</span>
          </div>
          <span className="text-xs text-stone-500">
            {chain.currentStep}/4 层推理完成
          </span>
        </div>
      )}

      {/* 层级卡片 */}
      <div className={`space-y-6 ${compact ? 'space-y-4' : ''}`}>
        {chain.layers.map((layer) => {
          const isActive = layer.layer === chain.currentStep;
          const isCompleted = layer.layer < chain.currentStep;
          const isPending = layer.layer > chain.currentStep;
          
          return (
            <LayerCard
              key={layer.layer}
              layer={layer}
              isActive={isActive}
              isCompleted={isCompleted}
              isPending={isPending}
              compact={compact}
            />
          );
        })}
      </div>

      {/* 最终结论 */}
      {chain.currentStep === 4 && (
        <div className="mt-6">
          <FinalConclusion output={chain.finalOutput} />
        </div>
      )}
    </div>
  );
};

export default InferenceChainView;
