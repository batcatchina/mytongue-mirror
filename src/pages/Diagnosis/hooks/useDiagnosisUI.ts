/**
 * useDiagnosisUI - UI状态管理
 * 职责：管理currentStep、isAnalyzing等UI状态
 */

import { useState } from 'react';

type Step = 'input' | 'analyzing' | 'result' | 'error';

export function useDiagnosisUI() {
  const [currentStep, setCurrentStep] = useState<Step>('input');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showRefineButton, setShowRefineButton] = useState(false);

  const goToStep = (step: Step) => setCurrentStep(step);

  return {
    // 状态
    currentStep,
    isAnalyzing,
    showRefineButton,
    // setters
    setCurrentStep,
    setIsAnalyzing,
    setShowRefineButton,
    // actions
    goToStep,
    resetToInput: () => {
      setCurrentStep('input');
      setIsAnalyzing(false);
      setShowRefineButton(false);
    },
  };
}

export type { Step };
