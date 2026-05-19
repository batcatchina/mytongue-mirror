/**
 * 结果展示区组件
 * 包含辨证结果、病机病理、针方穴位、生活调理等
 */
import React from 'react';
import { DiagnosisOutput, SecondarySyndrome } from '@/types';
import { useDiagnosisStore } from '@/stores/diagnosisStore';
import { PaidDiagnosisSection } from '@/components/paywall/PaidDiagnosisSection';
import DiagnosisResultDisplay from '@/components/result-display/DiagnosisResultDisplay';
import AcupunctureDisplay from '@/components/result-display/AcupunctureDisplay';
import LifeCareDisplay from '@/components/result-display/LifeCareDisplay';
import HealthReport from '@/components/result-display/HealthReport';
import PayButton from '@/components/payment/PayButton';
import toast from 'react-hot-toast';

interface ResultSectionProps {
  diagnosisResult: DiagnosisOutput | null;
  isUnlocked: boolean;
  currentReportId: string | null;
  resultTab: 'pathogenesis' | 'acupuncture' | 'care';
  activeTab: 'input' | 'report' | 'history';
  showRefineButton: boolean;
  isRefiningDiagnosis: boolean;
  inputFeatures: {
    tongueColor: string;
    tongueShape: string;
    tongueState: string;
    coatingColor: string;
    coatingTexture: string;
    coatingMoisture: string;
  };
  onResultTabChange: (tab: 'pathogenesis' | 'acupuncture' | 'care') => void;
  onRefineDiagnosis: () => void;
  onUnlock: () => void;
}

export default function ResultSection({
  diagnosisResult,
  isUnlocked,
  currentReportId,
  resultTab,
  activeTab,
  showRefineButton,
  isRefiningDiagnosis,
  inputFeatures,
  onResultTabChange,
  onRefineDiagnosis,
  onUnlock,
}: ResultSectionProps) {
  const { saveCase } = useDiagnosisStore();

  // 保存病例
  const handleSaveCase = () => {
    if (!diagnosisResult) {
      toast.error('请先完成辨证分析');
      return;
    }
    saveCase(diagnosisResult);
    toast.success('病例已保存');
  };

  // 生成报告ID
  const generateReportId = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `RPT${timestamp}${random}`;
  };

  if (!diagnosisResult) {
    return (
      <div className="tcm-card p-8 flex flex-col items-center justify-center text-center">
        <div className="text-5xl mb-3">🔍</div>
        <h3 className="text-base font-medium text-stone-600 mb-1">
          等待辨证分析
        </h3>
        <p className="text-xs text-stone-400">
          拍照上传或填写舌象特征，点击开始辨证
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* 辨证结果 - 付费分层展示 */}
      <PaidDiagnosisSection
        diagnosisOutput={diagnosisResult}
        inputFeatures={inputFeatures}
        activeTab={activeTab}
        price={9.9}
        userCount={12847}
      />

      {/* 证型结论 */}
      <DiagnosisResultDisplay 
        result={diagnosisResult?.diagnosisResult || { 
          primarySyndrome: "分析中...", 
          confidence: 0, 
          pathogenesis: "", 
          organLocation: [], 
          priority: "中" 
        }} 
        className="animate-fade-in"
      />

      {/* 完整健康报告 - 解锁后展示 */}
      {isUnlocked && (
        <div className="mt-4 animate-fade-in">
          <HealthReport
            diagnosisResult={diagnosisResult.diagnosisResult}
            acupuncturePlan={diagnosisResult.acupuncturePlan}
            lifeCareAdvice={diagnosisResult.lifeCareAdvice}
            reportId={currentReportId || generateReportId()}
          />
        </div>
      )}

      {/* 问诊入口 */}
      {diagnosisResult && !showRefineButton && (
        <button
          onClick={onRefineDiagnosis}
          disabled={isRefiningDiagnosis}
          className={`
            w-full py-3 rounded-xl text-sm font-medium transition-all mt-2
            ${isRefiningDiagnosis
              ? 'bg-stone-100 text-stone-400 cursor-wait'
              : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 shadow-sm hover:shadow-md'
            }
          `}
        >
          {isRefiningDiagnosis ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              生成问诊问题中...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              💬 智能问诊，更准辨证
            </span>
          )}
        </button>
      )}

      {/* Tab切换：病机病理 | 针方穴位 | 生活调理 */}
      <div className="flex border-b border-stone-200 animate-fade-in animation-delay-100">
        <button
          onClick={() => onResultTabChange('pathogenesis')}
          className={`flex-1 py-2.5 text-sm font-medium text-center transition-colors ${
            resultTab === 'pathogenesis'
              ? 'text-primary-600 border-b-2 border-primary-500'
              : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          病机病理
        </button>
        <button
          onClick={() => onResultTabChange('acupuncture')}
          className={`flex-1 py-2.5 text-sm font-medium text-center transition-colors ${
            resultTab === 'acupuncture'
              ? 'text-primary-600 border-b-2 border-primary-500'
              : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          针方穴位
        </button>
        <button
          onClick={() => onResultTabChange('care')}
          className={`flex-1 py-2.5 text-sm font-medium text-center transition-colors ${
            resultTab === 'care'
              ? 'text-primary-600 border-b-2 border-primary-500'
              : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          生活调理
        </button>
      </div>

      {/* Tab内容 */}
      {resultTab === 'pathogenesis' && (
        <div className="tcm-card p-4 space-y-3 animate-fade-in animation-delay-200">
          <div>
            <span className="text-xs text-stone-500 block mb-1">病机</span>
            <p className="text-sm text-primary-700 font-medium">{diagnosisResult?.diagnosisResult?.pathogenesis || '-'}</p>
          </div>
          <div>
            <span className="text-xs text-stone-500 block mb-1">脏腑定位</span>
            <div className="flex flex-wrap gap-1.5">
              {diagnosisResult?.diagnosisResult?.organLocation?.map((organ: string, i: number) => (
                <span key={i} className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded-full border border-red-200">
                  {organ}{i === 0 && <span className="ml-0.5 opacity-60">(主)</span>}
                </span>
              ))}
            </div>
          </div>
          {diagnosisResult?.diagnosisResult?.secondarySyndromes?.length > 0 && (
            <div>
              <span className="text-xs text-stone-500 block mb-1">也需关注</span>
              {diagnosisResult.diagnosisResult.secondarySyndromes.slice(0, 2).map((s: SecondarySyndrome, i: number) => (
                <span key={i} className="text-sm text-stone-600 mr-2">· {s.syndrome}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {resultTab === 'acupuncture' && (
        // 临时开放，后续恢复付费墙
        <AcupunctureDisplay plan={diagnosisResult.acupuncturePlan} />
      )}

      {resultTab === 'care' && (
        // 临时开放，后续恢复付费墙
        <LifeCareDisplay advice={diagnosisResult.lifeCareAdvice} />
      )}

      {/* 保存病例 */}
      <button
        onClick={handleSaveCase}
        className="w-full py-2 rounded-xl text-xs font-medium bg-stone-100 text-stone-500 hover:bg-stone-200 transition-colors"
      >
        保存此病例
      </button>

      {/* 深度辨证解锁区域 */}
      {/* 临时开放，后续恢复付费墙：底部解锁提示区域暂时隐藏 */}
      {false && !isUnlocked ? (
        <div className="tcm-card p-4 text-center space-y-3 bg-gradient-to-r from-primary-50 to-secondary-50">
          <div className="text-sm text-stone-600">
            <span className="text-lg mr-1">🔒</span>
            针方穴位和生活调理需解锁查看
          </div>
          <div className="flex justify-center">
            <PayButton 
              amount={9.9} 
              title="舌镜深度辨证方案"
              size="medium"
            />
          </div>
          <p className="text-xs text-stone-400">包含完整针方穴位和个性化生活调理建议</p>
        </div>
      ) : (
        <div className="tcm-card p-3 text-center bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
          <span className="text-green-600 text-sm">✓ 已解锁深度辨证</span>
        </div>
      )}
    </div>
  );
}
