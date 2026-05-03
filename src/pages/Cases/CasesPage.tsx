import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDiagnosisStore } from '@/stores/diagnosisStore';

const CasesPage: React.FC = () => {
  const navigate = useNavigate();
  const { caseList } = useDiagnosisStore();

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <main className="max-w-4xl mx-auto px-4 py-4 sm:py-6">
        {/* 页面标题 */}
        <div className="mb-4 sm:mb-6">
          <h1 className="font-chinese text-xl sm:text-2xl font-semibold text-stone-800">
            我的病例
          </h1>
          <p className="text-sm text-stone-500 mt-1 hidden sm:block">
            记录每一次辨证，见证健康轨迹
          </p>
        </div>

        {caseList.length > 0 ? (
          <div className="space-y-3">
            {caseList.map((caseRecord) => (
              <div
                key={caseRecord.id}
                className="tcm-card p-4 sm:p-5 hover:shadow-tcm transition-all duration-200 cursor-pointer"
                onClick={() => navigate(`/cases/${caseRecord.id}`)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-chinese text-base sm:text-lg font-semibold text-primary-700 truncate">
                        {caseRecord.diagnosisResult.primarySyndrome}
                      </h3>
                      <span className="tcm-tag-primary flex-shrink-0">
                        {(caseRecord.diagnosisResult.confidence * 100).toFixed(0)}%
                      </span>
                    </div>

                    <div className="text-sm text-stone-500 mb-2 sm:mb-3">
                      <span>
                        {caseRecord.patientInfo.gender}，{caseRecord.patientInfo.age}岁
                      </span>
                      <span className="mx-2 text-stone-300">•</span>
                      <span className="text-stone-600 truncate block sm:inline">
                        {caseRecord.patientInfo.chiefComplaint.slice(0, 20)}
                        {caseRecord.patientInfo.chiefComplaint.length > 20 && '...'}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {caseRecord.diagnosisResult.organLocation.slice(0, 3).map((organ) => (
                        <span key={organ} className="tcm-tag bg-stone-100 text-stone-600 text-xs sm:text-sm">
                          {organ}
                        </span>
                      ))}
                      {caseRecord.diagnosisResult.organLocation.length > 3 && (
                        <span className="tcm-tag bg-stone-100 text-stone-600 text-xs sm:text-sm">
                          +{caseRecord.diagnosisResult.organLocation.length - 3}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end flex-shrink-0">
                    <span className="text-xs text-stone-400 whitespace-nowrap">
                      {formatDate(caseRecord.createdAt)}
                    </span>
                    <div className="flex gap-1 mt-2">
                      <button
                        className="p-1.5 sm:p-2 text-stone-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/cases/${caseRecord.id}`);
                        }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button
                        className="p-1.5 sm:p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* 空状态 - 有温度的引导 */
          <div className="tcm-card p-8 sm:p-12 text-center">
            {/* 装饰性图标 */}
            <div className="w-20 h-20 mx-auto mb-6 relative">
              <div className="absolute inset-0 bg-primary-100 rounded-full animate-pulse opacity-50"></div>
              <div className="absolute inset-2 bg-primary-50 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-primary-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>

            <h3 className="font-chinese text-lg font-medium text-stone-700 mb-3">
              开启您的健康记录之旅
            </h3>
            <p className="text-stone-500 leading-relaxed max-w-sm mx-auto mb-6">
              每次辨证都是一次自我认知，完成舌诊后可在此回顾健康轨迹。身体的每一次变化，都值得被温柔记录。
            </p>

            <button
              onClick={() => navigate('/diagnosis')}
              className="tcm-btn-primary"
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                开始舌诊
              </span>
            </button>

            <p className="text-xs text-stone-400 mt-4">
              在首页「开始舌诊」同样可以进入
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default CasesPage;
