import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ApiDocsPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // 直接跳转到静态HTML页面
    window.location.href = '/api-docs.html';
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600">正在加载 API 文档...</p>
        <a 
          href="/api-docs.html" 
          className="mt-4 inline-block text-green-600 hover:text-green-700"
        >
          点击直接访问
        </a>
      </div>
    </div>
  );
};

export default ApiDocsPage;
