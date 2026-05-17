/**
 * 配置上下文 - 引擎切换、UI模式等配置
 * 自主进化：为后续的规则热加载和辨证记录存储留好接口
 */
import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

export type UIMode = 'simple' | 'advanced';
export type EngineMode = 'auto' | 'deepseek' | 'local';
export type ViewMode = 'input' | 'result' | 'split';

interface ConfigContextValue {
  // 引擎配置
  engineMode: EngineMode;
  setEngineMode: (mode: EngineMode) => void;
  
  // UI模式
  uiMode: UIMode;
  setUIMode: (mode: UIMode) => void;
  
  // 视图模式
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  
  // 高级功能开关
  showInferenceChain: boolean;
  toggleInferenceChain: () => void;
  showDebugInfo: boolean;
  toggleDebugInfo: () => void;
  
  // 结果Tab
  resultTab: 'pathogenesis' | 'acupuncture' | 'care';
  setResultTab: (tab: 'pathogenesis' | 'acupuncture' | 'care') => void;
  
  // 主Tab
  activeTab: 'input' | 'report' | 'history';
  setActiveTab: (tab: 'input' | 'report' | 'history') => void;
}

const ConfigContext = createContext<ConfigContextValue | null>(null);

export function ConfigProvider({ children }: { children: React.ReactNode }) {
  // 引擎模式
  const [engineMode, setEngineMode] = useState<EngineMode>('auto');
  
  // UI模式
  const [uiMode, setUIMode] = useState<UIMode>('simple');
  
  // 视图模式
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  
  // 高级功能
  const [showInferenceChain, setShowInferenceChain] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  
  // 结果Tab
  const [resultTab, setResultTab] = useState<'pathogenesis' | 'acupuncture' | 'care'>('pathogenesis');
  
  // 主Tab
  const [activeTab, setActiveTab] = useState<'input' | 'report' | 'history'>('input');
  
  // 切换推理链显示
  const toggleInferenceChain = useCallback(() => {
    setShowInferenceChain(prev => !prev);
  }, []);
  
  // 切换调试信息
  const toggleDebugInfo = useCallback(() => {
    setShowDebugInfo(prev => !prev);
  }, []);
  
  const value = useMemo(() => ({
    engineMode,
    setEngineMode,
    uiMode,
    setUIMode,
    viewMode,
    setViewMode,
    showInferenceChain,
    toggleInferenceChain,
    showDebugInfo,
    toggleDebugInfo,
    resultTab,
    setResultTab,
    activeTab,
    setActiveTab,
  }), [engineMode, uiMode, viewMode, showInferenceChain, toggleInferenceChain, showDebugInfo, toggleDebugInfo, resultTab, activeTab]);
  
  return (
    <ConfigContext.Provider value={value}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfigContext() {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfigContext must be used within ConfigProvider');
  }
  return context;
}
