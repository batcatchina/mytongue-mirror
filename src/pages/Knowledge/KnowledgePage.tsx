import React, { useState, useMemo } from 'react';

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
  const [activeCategory, setActiveCategory] = useState(knowledgeCategories[0].id);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  // 搜索过滤逻辑
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return knowledgeCategories;

    const query = searchQuery.toLowerCase();
    return knowledgeCategories
      .map((cat) => ({
        ...cat,
        items: cat.items.filter(
          (item) =>
            item.title.toLowerCase().includes(query) ||
            item.desc.toLowerCase().includes(query)
        ),
      }))
      .filter((cat) => cat.items.length > 0);
  }, [searchQuery]);

  const currentCategory = filteredCategories.find((c) => c.id === activeCategory);

  // 如果当前分类被过滤掉了，切换到第一个
  React.useEffect(() => {
    if (!currentCategory && filteredCategories.length > 0) {
      setActiveCategory(filteredCategories[0].id);
    }
  }, [currentCategory, filteredCategories]);

  const handleItemClick = (title: string) => {
    setExpandedItem(expandedItem === title ? null : title);
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <main className="max-w-4xl mx-auto px-4 py-4 sm:py-6">
        {/* 页面标题 */}
        <div className="mb-4 sm:mb-5">
          <h1 className="font-chinese text-xl sm:text-2xl font-semibold text-stone-800">
            知识库
          </h1>
          <p className="text-sm text-stone-500 mt-1 hidden sm:block">
            传承千年智慧，探寻舌诊奥秘
          </p>
        </div>

        {/* 搜索框 */}
        <div className="relative mb-4 sm:mb-5">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索知识内容..."
            className="tcm-input pl-10 w-full"
          />
          <svg
            className="w-5 h-5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* 分类Tab - 顶部切换（手机端友好） */}
        <div className="mb-4 -mx-4 px-2 sm:mx-0 sm:px-0 sm:mb-5 overflow-x-auto scrollbar-hide">
          <div className="flex gap-1.5 sm:gap-2 min-w-max sm:min-w-0">
            {filteredCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => {
                  setActiveCategory(category.id);
                  setExpandedItem(null);
                }}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                  activeCategory === category.id
                    ? 'bg-primary-500 text-white shadow-sm'
                    : 'bg-white text-stone-600 hover:bg-stone-100'
                }`}
              >
                <span className="text-base">{category.icon}</span>
                <span className="hidden xs:inline">{category.name}</span>
                <span className="xs:hidden">{category.icon === '👅' ? '基础' : category.icon === '📋' ? '证型' : category.icon === '💉' ? '选穴' : '病例'}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 内容区域 */}
        <div className="space-y-3">
          {currentCategory && currentCategory.items.length > 0 ? (
            currentCategory.items.map((item, index) => {
              const isExpanded = expandedItem === item.title;
              return (
                <div
                  key={index}
                  className={`tcm-card overflow-hidden transition-all duration-200 ${
                    isExpanded ? 'ring-2 ring-primary-200' : 'hover:shadow-tcm'
                  }`}
                >
                  <div
                    className="p-4 sm:p-5 cursor-pointer"
                    onClick={() => handleItemClick(item.title)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-chinese text-base sm:text-lg font-semibold text-stone-800 flex items-center gap-2">
                          {item.title}
                          {isExpanded && (
                            <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
                              即将上线
                            </span>
                          )}
                        </h3>
                        {!isExpanded && (
                          <p className="text-sm text-stone-500 mt-1 line-clamp-1">
                            {item.desc}
                          </p>
                        )}
                      </div>
                      <svg
                        className={`w-5 h-5 text-stone-400 flex-shrink-0 transition-transform duration-200 ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {/* 展开内容 */}
                  <div
                    className={`transition-all duration-300 ease-out ${
                      isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
                    }`}
                  >
                    <div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-stone-100">
                      <div className="pt-4">
                        <p className="text-stone-600 leading-relaxed mb-4">
                          {item.desc}
                        </p>

                        {/* 即将上线的暗示 */}
                        <div className="flex items-center gap-2 text-sm text-stone-400 bg-stone-50 rounded-lg p-3">
                          <svg className="w-4 h-4 text-primary-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <span>详细内容正在整理中，敬请期待...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : searchQuery ? (
            /* 搜索无结果 */
            <div className="tcm-card p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-stone-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="font-chinese text-stone-600 mb-2">未找到相关知识</p>
              <p className="text-sm text-stone-400">
                试试其他关键词，或浏览我们的分类内容
              </p>
            </div>
          ) : (
            /* 空状态 */
            <div className="tcm-card p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-primary-50 rounded-full flex items-center justify-center">
                <span className="text-3xl">📚</span>
              </div>
              <p className="font-chinese text-stone-700 mb-2">知识库正在建设中</p>
              <p className="text-sm text-stone-500 max-w-sm mx-auto">
                我们正在精心整理每一份知识内容，涵盖舌诊基础、证型辨析、针灸选穴等核心内容，很快将与您见面。
              </p>
            </div>
          )}
        </div>

        {/* 底部提示 */}
        <div className="mt-6 text-center">
          <p className="text-xs text-stone-400">
            中医知识博大精深，持续学习方能精进
          </p>
        </div>
      </main>
    </div>
  );
};

export default KnowledgePage;
