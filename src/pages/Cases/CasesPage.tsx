import React from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '@/components/common/NavBar';
import StatusBar from '@/components/common/StatusBar';
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
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <NavBar currentPath="/cases" onNavigate={(path) => navigate(path)} />
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-chinese text-2xl font-semibold text-stone-800">病例管理</h1>
          <button className="tcm-btn-primary">
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              新建病例
            </span>
          </button>
        </div>

        {caseList.length > 0 ? (
          <div className="grid gap-4">
            {caseList.map((caseRecord) => (
              <div key={caseRecord.id} className="tcm-card p-5 hover:shadow-tcm transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-chinese text-lg font-semibold text-primary-700">
                        {caseRecord.diagnosisResult.primarySyndrome}
                      </h3>
                      <span className="tcm-tag-primary">
                        置信度 {(caseRecord.diagnosisResult.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-stone-500 mb-3">
                      <span>
                        {caseRecord.patientInfo.gender}，{caseRecord.patientInfo.age}岁
                      </span>
                      <span>•</span>
                      <span className="text-stone-600">
                        {caseRecord.patientInfo.chiefComplaint.slice(0, 30)}
                        {caseRecord.patientInfo.chiefComplaint.length > 30 && '...'}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {caseRecord.diagnosisResult.organLocation.slice(0, 4).map((organ) => (
                        <span key={organ} className="tcm-tag bg-stone-100 text-stone-600">
                          {organ}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <div className="text-right">
                      <p className="text-xs text-stone-400">
                        {formatDate(caseRecord.createdAt)}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button className="p-2 text-stone-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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
          <div className="tcm-card p-12 flex flex-col items-center justify-center">
            <div className="w-20 h-20 mb-4 text-stone-300">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
              </svg>
            </div>
            <p className="text-lg font-chinese text-stone-500">暂无病例记录</p>
            <p className="text-sm text-stone-400 mt-2">在舌诊辨证页面完成分析后可保存病例</p>
          </div>
        )}
      </main>

      <StatusBar />
    </div>
  );
};

export default CasesPage;
