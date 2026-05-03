/**
 * 付费辨证展示组件
 * 整合免费区、付费遮罩、支付弹窗
 * 实现"润物细无声"的付费体验
 */

import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import type { DiagnosisOutput } from '@/types/output';
import { FreeTongueDescription } from './FreeTongueDescription';
import { PaywallOverlay } from './PaywallOverlay';
import { PaymentModal } from './PaymentModal';
import { HealthProfile } from '../result-display/HealthProfile';
import { AcupunctureDisplay } from '../result-display/AcupunctureDisplay';
import { LifeCareDisplay } from '../result-display/LifeCareDisplay';

interface PaidDiagnosisSectionProps {
  // 完整辨证结果
  diagnosisOutput: DiagnosisOutput;
  
  // 用户输入的舌象特征（用于免费区展示）
  inputFeatures?: {
    tongueColor?: string;
    tongueShape?: string;
    tongueState?: string;
    coatingColor?: string;
    coatingTexture?: string;
    coatingMoisture?: string;
  };
  
  // 价格
  price?: number;
  
  // 用户数
  userCount?: number;
  
  // Tab类型
  activeTab: 'diagnosis' | 'acupuncture' | 'care';
}

export const PaidDiagnosisSection: React.FC<PaidDiagnosisSectionProps> = ({
  diagnosisOutput,
  inputFeatures,
  price = 9.9,
  userCount = 12847,
  activeTab,
}) => {
  // 付费状态
  const [isPaid, setIsPaid] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPaidContent, setShowPaidContent] = useState(false);
  
  // 从localStorage恢复付费状态
  useEffect(() => {
    const paidKey = `paid_diagnosis_${window.location.pathname}`;
    const savedPaid = localStorage.getItem(paidKey);
    if (savedPaid === 'true') {
      setIsPaid(true);
      setShowPaidContent(true);
    }
  }, []);
  
  // 处理解锁按钮点击
  const handleUnlock = () => {
    setShowPaymentModal(true);
  };
  
  // 支付成功
  const handlePaymentSuccess = () => {
    // 保存付费状态
    const paidKey = `paid_diagnosis_${window.location.pathname}`;
    localStorage.setItem(paidKey, 'true');
    
    setIsPaid(true);
    setShowPaymentModal(false);
    
    // 延迟展示付费内容，创造"花开"效果
    setTimeout(() => {
      setShowPaidContent(true);
    }, 300);
  };
  
  // 关闭支付弹窗
  const handleClosePaymentModal = () => {
    setShowPaymentModal(false);
  };

  // 根据Tab渲染对应的付费内容预览（证型名称，用于遮罩上的模糊影子）
  const previewContent = {
    syndromeName: activeTab === 'diagnosis' 
      ? diagnosisOutput.diagnosisResult?.primarySyndrome 
      : activeTab === 'acupuncture'
        ? '个性化配穴方案'
        : '生活调护方案',
  };

  // ===== 渲染内容 =====
  
  // 付费后全展示
  if (isPaid && showPaidContent) {
    return (
      <div className={clsx(
        "space-y-4 transition-all duration-500",
        showPaidContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}>
        {/* 辨证结果Tab */}
        {activeTab === 'diagnosis' && (
          <>
            <HealthProfile 
              diagnosisResult={diagnosisOutput.diagnosisResult}
              constitutionAssessment={diagnosisOutput.constitutionAssessment}
            />
            
            {/* 付费标识 - 淡化处理 */}
            <div className="flex items-center justify-center gap-2 py-2 text-xs text-emerald-600 bg-emerald-50 rounded-lg">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>已解锁完整辨证报告</span>
            </div>
          </>
        )}
        
        {/* 针灸方案Tab */}
        {activeTab === 'acupuncture' && (
          <AcupunctureDisplay plan={diagnosisOutput.acupuncturePlan} />
        )}
        
        {/* 生活调护Tab */}
        {activeTab === 'care' && (
          <LifeCareDisplay advice={diagnosisOutput.lifeCareAdvice} />
        )}
      </div>
    );
  }
  
  // ===== 未付费状态 =====
  
  return (
    <>
      <div className="relative">
        {/* 免费区内容 */}
        <div className={clsx(
          "transition-all duration-300",
          !isPaid && "mb-0"
        )}>
          {activeTab === 'diagnosis' && (
            <FreeTongueDescription
              tongueColor={inputFeatures?.tongueColor}
              tongueShape={inputFeatures?.tongueShape}
              tongueState={inputFeatures?.tongueState}
              coatingColor={inputFeatures?.coatingColor}
              coatingTexture={inputFeatures?.coatingTexture}
              coatingMoisture={inputFeatures?.coatingMoisture}
              constitutionAssessment={diagnosisOutput.constitutionAssessment}
            />
          )}
          
          {activeTab === 'acupuncture' && (
            <div className="space-y-4">
              {/* 针灸区免费预览 */}
              <div className="tcm-card p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
                <div className="text-center space-y-3">
                  <div className="text-4xl">📍</div>
                  <h4 className="font-medium text-stone-700">配穴方案预览</h4>
                  <p className="text-sm text-stone-500">
                    基于您的舌象分析，系统已为您匹配个性化配穴
                  </p>
                </div>
              </div>
              
              {/* 付费引导 */}
              <PaywallOverlay
                isVisible={true}
                onUnlock={handleUnlock}
                price={price}
                userCount={userCount}
                previewContent={{ syndromeName: '个性化配穴方案' }}
              />
            </div>
          )}
          
          {activeTab === 'care' && (
            <div className="space-y-4">
              {/* 调护区免费预览 */}
              <div className="tcm-card p-6 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100">
                <div className="text-center space-y-3">
                  <div className="text-4xl">🏃</div>
                  <h4 className="font-medium text-stone-700">生活调护预览</h4>
                  <p className="text-sm text-stone-500">
                    根据您的体质倾向，为您准备了专属调护方案
                  </p>
                </div>
              </div>
              
              {/* 付费引导 */}
              <PaywallOverlay
                isVisible={true}
                onUnlock={handleUnlock}
                price={price}
                userCount={userCount}
                previewContent={{ syndromeName: '生活调护方案' }}
              />
            </div>
          )}
        </div>
        
        {/* 辨证结果Tab的付费遮罩 */}
        {activeTab === 'diagnosis' && (
          <PaywallOverlay
            isVisible={true}
            onUnlock={handleUnlock}
            price={price}
            userCount={userCount}
            previewContent={previewContent}
          />
        )}
      </div>
      
      {/* 支付弹窗 */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={handleClosePaymentModal}
        onSuccess={handlePaymentSuccess}
        price={price}
      />
    </>
  );
};

export default PaidDiagnosisSection;
