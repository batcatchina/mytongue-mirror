import React from 'react';
import type { DiagnosisOutput, DiagnosisResult, AcupuncturePlan, LifeCareAdvice } from '@/types';

/**
 * 健康报告组件 - 付费完整报告
 * 一页纸设计，每句都有分量
 */
interface HealthReportProps {
  diagnosisResult: DiagnosisResult;
  acupuncturePlan: AcupuncturePlan;
  lifeCareAdvice: LifeCareAdvice;
  reportId: string;
}

export const HealthReport: React.FC<HealthReportProps> = ({
  diagnosisResult,
  acupuncturePlan,
  lifeCareAdvice,
  reportId,
}) => {
  const now = new Date();
  const reportTime = now.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  // 格式化置信度
  const formatConfidence = (conf: number) => `${Math.round(conf * 100)}%`;

  // 获取手法emoji
  const getTechniqueEmoji = (tech: string) => {
    if (tech.includes('补')) return '➕';
    if (tech.includes('泻')) return '➖';
    return '⚖️';
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* 报告头部 */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-5 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold mb-1">📋 舌镜健康报告</h2>
            <p className="text-emerald-100 text-sm">深度辨证 · 专业分析</p>
          </div>
          <div className="text-right text-sm text-emerald-100">
            <div>报告编号</div>
            <div className="font-mono text-xs">{reportId.slice(0, 8)}</div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* ===== 证型诊断 ===== */}
        <section>
          <h3 className="text-sm font-semibold text-stone-700 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold">1</span>
            证型诊断
          </h3>
          <div className="bg-stone-50 rounded-xl p-4 space-y-3">
            {/* 主证 */}
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs text-stone-500">主证</span>
                <div className="text-lg font-bold text-red-700">{diagnosisResult.primarySyndrome}</div>
              </div>
              <div className="text-right">
                <span className="text-xs text-stone-500">置信度</span>
                <div className="text-lg font-semibold text-emerald-600">{formatConfidence(diagnosisResult.confidence)}</div>
              </div>
            </div>

            {/* 兼证 */}
            {diagnosisResult.secondarySyndromes.length > 0 && (
              <div>
                <span className="text-xs text-stone-500">兼证</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {diagnosisResult.secondarySyndromes.slice(0, 2).map((s, i) => (
                    <span key={i} className="px-2 py-1 bg-amber-50 text-amber-700 rounded-lg text-sm">
                      {s.syndrome}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 传变预警 */}
            {diagnosisResult.organLocation.length > 1 && (
              <div>
                <span className="text-xs text-stone-500">传变预警</span>
                <div className="text-sm text-orange-600 mt-1">
                  {diagnosisResult.organLocation[0]} → {diagnosisResult.organLocation.slice(1).join(' · ')}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ===== 选穴方案 ===== */}
        <section>
          <h3 className="text-sm font-semibold text-stone-700 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold">2</span>
            选穴方案
          </h3>
          <div className="bg-stone-50 rounded-xl p-4 space-y-4">
            {/* 主穴 */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded">主穴</span>
                <span className="text-xs text-stone-500">
                  手法: {acupuncturePlan.treatmentPrinciple.includes('补') ? '补法为主' : acupuncturePlan.treatmentPrinciple.includes('泻') ? '泻法为主' : '平补平泻'}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {acupuncturePlan.mainPoints.map((p, i) => (
                  <span key={i} className="px-3 py-1.5 bg-white border border-green-200 text-green-700 rounded-lg text-sm font-medium">
                    {getTechniqueEmoji(p.technique)} {p.point}
                  </span>
                ))}
              </div>
            </div>

            {/* 配穴 */}
            {acupuncturePlan.secondaryPoints.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-blue-700 bg-blue-100 px-2 py-0.5 rounded">配穴</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {acupuncturePlan.secondaryPoints.map((p, i) => (
                    <span key={i} className="px-3 py-1.5 bg-white border border-blue-200 text-blue-700 rounded-lg text-sm">
                      {p.point}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 疗程 */}
            <div className="pt-2 border-t border-stone-200">
              <span className="text-xs text-stone-500">疗程建议</span>
              <div className="text-sm text-stone-700 mt-1">
                {acupuncturePlan.treatmentAdvice.treatmentFrequency}，{acupuncturePlan.treatmentAdvice.treatmentSessions}
              </div>
            </div>
          </div>
        </section>

        {/* ===== 经络推理 ===== */}
        <section>
          <h3 className="text-sm font-semibold text-stone-700 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-bold">3</span>
            经络推理
          </h3>
          <div className="bg-gradient-to-r from-purple-50 to-white rounded-xl p-4">
            <div className="text-xs text-stone-500 mb-2">推理链</div>
            <div className="flex items-center flex-wrap gap-2 text-sm">
              <span className="px-2 py-1 bg-red-100 text-red-700 rounded">舌象特征</span>
              <span className="text-stone-400">→</span>
              <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded">脏腑定位</span>
              <span className="text-stone-400">→</span>
              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">证型推理</span>
              <span className="text-stone-400">→</span>
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded">选穴依据</span>
            </div>
            <div className="mt-3 text-xs text-stone-600 bg-white rounded-lg p-3">
              <div className="font-medium mb-1">病机简述</div>
              <div>{diagnosisResult.pathogenesis}</div>
            </div>
          </div>
        </section>

        {/* ===== 生活调理 ===== */}
        <section>
          <h3 className="text-sm font-semibold text-stone-700 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs font-bold">4</span>
            生活调理
          </h3>
          <div className="bg-stone-50 rounded-xl p-4 space-y-3">
            {/* 饮食 */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">🍽️</span>
                <span className="text-xs font-medium text-stone-700">饮食</span>
              </div>
              <div className="space-y-1">
                {lifeCareAdvice.dietSuggestions.slice(0, 3).map((item, i) => (
                  <div key={i} className="text-sm text-stone-600 flex items-start gap-2">
                    <span className="text-emerald-500 mt-0.5">✓</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 起居 */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">🏃</span>
                <span className="text-xs font-medium text-stone-700">起居</span>
              </div>
              <div className="space-y-1">
                {lifeCareAdvice.dailyRoutine.slice(0, 2).map((item, i) => (
                  <div key={i} className="text-sm text-stone-600 flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">✓</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ===== 警示信号 ===== */}
        <section>
          <h3 className="text-sm font-semibold text-stone-700 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold">!</span>
            警示信号
          </h3>
          <div className="bg-red-50 rounded-xl p-4 border border-red-100">
            <div className="text-xs text-red-600 mb-2">出现以下情况请及时就医</div>
            <ul className="space-y-1.5">
              {[
                '症状持续加重或出现新症状',
                '舌象明显变化（如突然发紫、发黑）',
                '伴随高热、胸痛、呼吸困难',
                '长期调理无明显改善',
              ].map((item, i) => (
                <li key={i} className="text-sm text-red-700 flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 报告底部 */}
        <div className="pt-4 border-t border-stone-200 text-center">
          <div className="text-xs text-stone-400">
            报告生成时间：{reportTime}
          </div>
          <div className="text-xs text-emerald-600 mt-1 font-medium">
            舌镜 · 让古老中医走到每个人身边
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthReport;
