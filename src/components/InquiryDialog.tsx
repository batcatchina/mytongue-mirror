import React, { useState } from 'react';

export interface InquiryQuestion {
  id: string;
  text: string;
  options: string[];
  reason?: string;
}

interface InquiryDialogProps {
  questions: InquiryQuestion[];
  conversationId: string;
  preliminaryResult?: any;
  onSubmit: (answers: { questionId: string; selectedOption: string; reason?: string }[]) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

/**
 * 问诊对话框组件 v3.2
 * 用于显示DeepSeek生成的选择题，让用户确认证型
 */
const InquiryDialog: React.FC<InquiryDialogProps> = ({
  questions,
  conversationId,
  preliminaryResult,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ questionId: string; selectedOption: string }[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const progress = `第 ${currentQuestionIndex + 1} 题 / 共 ${questions.length} 题`;

  const handleOptionSelect = (option: string) => {
    setSelectedOption(option);
  };

  const handleNext = () => {
    if (!selectedOption) return;
    
    const newAnswer = {
      questionId: currentQuestion.id,
      selectedOption,
    };
    
    const newAnswers = [...answers, newAnswer];
    setAnswers(newAnswers);
    
    if (isLastQuestion) {
      // 提交所有答案
      onSubmit(newAnswers);
    } else {
      // 下一题
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOption(null);
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      const prevAnswers = answers.slice(0, -1);
      setAnswers(prevAnswers);
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setSelectedOption(prevAnswers[prevAnswers.length - 1]?.selectedOption || null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* 头部 */}
        <div className="bg-gradient-to-r from-primary-500 to-secondary-500 p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <span>💬</span>
                <span>补充几个小问题</span>
              </h2>
              <p className="text-xs text-white/80 mt-0.5">帮您更准确地确认证型</p>
            </div>
            <button
              onClick={onCancel}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
              disabled={isLoading}
            >
              <span className="text-white text-lg">×</span>
            </button>
          </div>
        </div>

        {/* 进度条 */}
        <div className="h-1 bg-stone-100">
          <div 
            className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 transition-all duration-300"
            style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
          />
        </div>

        {/* 内容区 */}
        <div className="p-5">
          {/* 初步辨证结果提示 */}
          {preliminaryResult && (
            <div className="mb-4 p-3 bg-amber-50 rounded-xl border border-amber-200">
              <p className="text-xs text-amber-700">
                <span className="font-medium">初步判断：</span>
                {preliminaryResult.mainSyndrome || '待确认'}
              </p>
            </div>
          )}

          {/* 问题 */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-stone-400">{progress}</span>
              {currentQuestion.reason && (
                <span className="text-xs text-stone-400 bg-stone-100 px-2 py-1 rounded-full">
                  💡 {currentQuestion.reason}
                </span>
              )}
            </div>
            
            <h3 className="text-lg font-medium text-stone-800 mb-4">
              {currentQuestion.text}
            </h3>

            {/* 选项列表 */}
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => {
                const isSelected = selectedOption === option;
                return (
                  <button
                    key={index}
                    onClick={() => handleOptionSelect(option)}
                    disabled={isLoading}
                    className={`
                      w-full py-4 px-4 rounded-xl text-left text-sm font-medium transition-all
                      ${isSelected 
                        ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg scale-[1.02]' 
                        : 'bg-stone-50 text-stone-700 hover:bg-stone-100 border border-stone-200'
                      }
                      ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                  >
                    <span className={`
                      inline-flex items-center justify-center w-6 h-6 rounded-full mr-3 text-xs font-bold
                      ${isSelected ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-600'}
                    `}>
                      {String.fromCharCode(65 + index)}
                    </span>
                    {option}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 底部按钮 */}
          <div className="flex gap-3">
            {currentQuestionIndex > 0 && (
              <button
                onClick={handleBack}
                disabled={isLoading}
                className="flex-1 py-3 rounded-xl text-sm font-medium text-stone-600 bg-stone-100 hover:bg-stone-200 transition-colors disabled:opacity-50"
              >
                ← 上一题
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={!selectedOption || isLoading}
              className={`
                flex-1 py-3 rounded-xl text-sm font-medium text-white transition-all
                ${selectedOption && !isLoading
                  ? 'bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 shadow-lg'
                  : 'bg-stone-300 cursor-not-allowed'
                }
              `}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  分析中...
                </span>
              ) : isLastQuestion ? (
                '完成分析 →'
              ) : (
                '下一题 →'
              )}
            </button>
          </div>
        </div>

        {/* 底部提示 */}
        <div className="px-5 pb-4 text-center">
          <p className="text-xs text-stone-400">
            回答越多，辨证越准确 ✨
          </p>
        </div>
      </div>
    </div>
  );
};

export default InquiryDialog;
