import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DiagnosisPage from './pages/Diagnosis/DiagnosisPage';
import CasesPage from './pages/Cases/CasesPage';
import KnowledgePage from './pages/Knowledge/KnowledgePage';
import ApiDocsPage from './pages/ApiDocs';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DiagnosisPage />} />
        <Route path="/cases" element={<CasesPage />} />
        <Route path="/knowledge" element={<KnowledgePage />} />
        <Route path="/api-docs" element={<ApiDocsPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
