interface StatusBarProps {
  systemStatus?: 'ready' | 'loading' | 'error';
  knowledgeVersion?: string;
  skillVersion?: string;
  diagnosisTime?: string;
  onSaveCase?: () => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  systemStatus = 'ready',
  knowledgeVersion = 'v3.0',
  skillVersion = '1.0',
  diagnosisTime,
  onSaveCase,
}) => {
  const statusConfig = {
    ready: { color: 'bg-green-500', text: '系统就绪' },
    loading: { color: 'bg-yellow-500 animate-pulse', text: '分析中...' },
    error: { color: 'bg-red-500', text: '系统异常' },
  };

  const status = statusConfig[systemStatus];

  return (
    <footer className="bg-white border-t border-stone-200 py-2 px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          {/* 系统状态 */}
          <div className="flex items-center gap-2">
            <span className={clsx('w-2 h-2 rounded-full', status.color)} />
            <span className="text-stone-600">{status.text}</span>
          </div>
          
          <div className="text-stone-300">|</div>
          
          {/* 知识库版本 */}
          <span className="text-stone-500">
            知识库: <span className="text-stone-700">{knowledgeVersion}</span>
          </span>
          
          {/* 技能版本 */}
          <span className="text-stone-500">
            技能: <span className="text-stone-700">{skillVersion}</span>
          </span>
          
          {/* 辨证时间 */}
          {diagnosisTime && (
            <>
              <div className="text-stone-300">|</div>
              <span className="text-stone-500">
                辨证时间: <span className="text-stone-700">{diagnosisTime}</span>
              </span>
            </>
          )}
        </div>

        {/* 保存病例按钮 */}
        {onSaveCase && (
          <button
            onClick={onSaveCase}
            className="tcm-btn-primary flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            保存病例
          </button>
        )}
      </div>
    </footer>
  );
};

// 辅助函数
import { clsx } from 'clsx';

export default StatusBar;
