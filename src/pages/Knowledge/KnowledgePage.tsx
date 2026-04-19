import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '@/components/common/NavBar';
import StatusBar from '@/components/common/StatusBar';

// 知识库分类数据
const knowledgeCategories = [
  {
    id: 'tongue',
    name: '舌诊基础',
    icon: '👅',
    items: [
      { title: '舌诊概述', desc: '舌诊的基本原理与临床意义' },
      { title: '舌色辨识', desc: '淡红、淡白、红、绛、紫等舌色的诊断意义' },
      { title: '舌形分类', desc: '胖大舌、瘦薄舌、裂纹舌、齿痕舌等特征' },
      { title: '舌苔分析', desc: '苔色、苔质、润燥、腻腐的辨证应用' },
    ],
  },
  {
    id: 'syndrome',
    name: '证型辨析',
    icon: '📋',
    items: [
      { title: '八纲辨证', desc: '阴阳、表里、寒热、虚实的辨证要点' },
      { title: '脏腑辨证', desc: '心、肝、脾、肺、肾等脏腑病证特征' },
      { title: '气血津液辨证', desc: '气虚、血虚、阴虚、阳虚等证候分析' },
      { title: '常见复合证', desc: '阴虚火旺、脾虚湿盛等复合证型' },
    ],
  },
  {
    id: 'acupoint',
    name: '针灸选穴',
    icon: '💉',
    items: [
      { title: '经络基础', desc: '十二经脉循行与主治概要' },
      { title: '常用穴位', desc: '100+临床常用穴位定位与主治' },
      { title: '配穴原则', desc: '主穴、配穴的选取原则与方法' },
      { title: '刺法要诀', desc: '补泻手法与操作注意事项' },
    ],
  },
  {
    id: 'cases',
    name: '典型病例',
    icon: '📖',
    items: [
      { title: '阴虚火旺证', desc: '红瘦舌、少苔、失眠多梦等典型表现' },
      { title: '痰湿内阻证', desc: '胖大舌、白腻苔、身体困重等特征' },
      { title: '气滞血瘀证', desc: '紫暗舌、瘀斑、疼痛固定等表现' },
      { title: '脾胃虚弱证', desc: '淡胖舌、齿痕舌、纳差便溏等特征' },
    ],
  },
];

const KnowledgePage: React.FC = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState(knowledgeCategories[0].id);
  const [searchQuery, setSearchQuery] = useState('');

  const currentCategory = knowledgeCategories.find((c) => c.id === activeCategory);

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <NavBar currentPath="/knowledge" onNavigate={(path) => navigate(path)} />
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className="font-chinese text-2xl font-semibold text-stone-800 mb-4">知识库</h1>
          
          {/* 搜索框 */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索知识内容..."
              className="tcm-input pl-10"
            />
            <svg
              className="w-5 h-5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <div className="flex gap-6">
          {/* 分类侧边栏 */}
          <div className="w-64 flex-shrink-0">
            <div className="tcm-card p-2">
              {knowledgeCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                    activeCategory === category.id
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <span className="text-xl">{category.icon}</span>
                  <span className="font-medium">{category.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 内容区域 */}
          <div className="flex-1">
            {currentCategory && (
              <div className="space-y-4">
                {currentCategory.items.map((item, index) => (
                  <div key={index} className="tcm-card p-5 hover:shadow-tcm transition-shadow cursor-pointer">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-chinese text-lg font-semibold text-stone-800">
                          {item.title}
                        </h3>
                        <p className="text-sm text-stone-500 mt-1">{item.desc}</p>
                      </div>
                      <svg className="w-5 h-5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <StatusBar />
    </div>
  );
};

export default KnowledgePage;
