import React, { useState, useEffect, useRef } from 'react';

export type DiagnosisStepType = 'idle' | 'validating' | 'recognizing' | 'analyzing' | 'reasoning' | 'matching' | 'result';

interface DiagnosisProgressProps {
  currentStep: DiagnosisStepType;
  isLocalEngine: boolean;
  onFallbackToLocal?: () => void;
}

const STEPS = [
  { label: '采集舌象', key: 'recognizing' as DiagnosisStepType },
  { label: '分析特征', key: 'analyzing' as DiagnosisStepType },
  { label: '辨证推理', key: 'reasoning' as DiagnosisStepType },
  { label: '生成方案', key: 'matching' as DiagnosisStepType },
];

const TIPS = [
  '舌为心之苗，脾之外候',
  '望舌可知脏腑寒热虚实',
  '齿痕多为脾虚湿盛之象',
  '裂纹舌多属阴虚血虚',
  '舌尖属心肺，舌中属脾胃',
  '舌根属肾，舌边属肝胆',
  '苔薄者正气尚存，苔厚者邪气较盛',
  '望而知之谓之神',
];

const TIMEOUT_DURATION = 15000;

const DiagnosisProgress: React.FC<DiagnosisProgressProps> = ({ currentStep, isLocalEngine, onFallbackToLocal }) => {
  const [tipIndex, setTipIndex] = useState(0);
  const [showTimeout, setShowTimeout] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % TIPS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isLocalEngine && currentStep !== 'idle' && currentStep !== 'result') {
      timeoutRef.current = setTimeout(() => setShowTimeout(true), TIMEOUT_DURATION);
    } else {
      setShowTimeout(false);
    }
    return () => {
      if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
    };
  }, [currentStep, isLocalEngine]);

  const getStepStatus = (stepKey: DiagnosisStepType): 'completed' | 'active' | 'pending' => {
    const stepOrder = STEPS.map((s) => s.key);
    const currentIndex = stepOrder.indexOf(currentStep);
    const stepIndex = stepOrder.indexOf(stepKey);
    if (currentIndex === -1) return 'pending';
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return 'pending';
  };

  const renderStepIcon = (status: 'completed' | 'active' | 'pending') => {
    switch (status) {
      case 'completed': return <span className="text-green-500 text-lg">✅</span>;
      case 'active': return <span className="inline-block w-5 h-5 bg-blue-500 rounded-full animate-pulse" />;
      case 'pending': return <span className="text-gray-300 text-lg">⚪</span>;
    }
  };

  return (
    <div className="w-full p-4 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl">
      <div className="flex items-center justify-between mb-4">
        {STEPS.map((step, index) => {
          const status = getStepStatus(step.key);
          return (
            <div key={step.key} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div className="mb-1">{renderStepIcon(status)}</div>
                <span className={`text-xs font-medium ${status === 'active' ? 'text-blue-600' : status === 'completed' ? 'text-green-600' : 'text-gray-400'}`}>
                  {step.label}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1.5 rounded ${status === 'completed' ? 'bg-green-400' : 'bg-gray-200'}`} />
              )}
            </div>
          );
        })}
      </div>
      {showTimeout && (
        <div className="mb-3 p-2.5 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
          <p className="text-yellow-800 text-sm mb-2">AI深度思考中，请稍候...</p>
          {onFallbackToLocal && (
            <button onClick={onFallbackToLocal} className="px-3 py-1.5 bg-white border border-yellow-300 rounded-lg text-xs text-yellow-700 hover:bg-yellow-50 transition-colors">
              使用本地快速分析
            </button>
          )}
        </div>
      )}
      <div className="pt-3 border-t border-primary-100">
        <div className="flex items-center justify-center gap-2">
          <span className="text-primary-300 text-xs">📜</span>
          <p className="text-stone-500 text-xs italic">{TIPS[tipIndex]}</p>
        </div>
        <div className="flex justify-center mt-2 gap-1">
          {TIPS.map((_, idx) => (
            <div key={idx} className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === tipIndex ? 'bg-primary-400' : 'bg-gray-300'}`} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default DiagnosisProgress;
