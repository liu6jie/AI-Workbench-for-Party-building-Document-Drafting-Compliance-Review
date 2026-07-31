import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { Navigate, Route, BrowserRouter, Routes } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import DraftWizardLayout from './pages/draft/DraftWizardLayout';
import TemplateSelect from './pages/draft/TemplateSelect';
import DynamicForm from './pages/draft/DynamicForm';
import ResultCheck from './pages/draft/ResultCheck';
import HistoryList from './pages/history/HistoryList';
import KnowledgeLib from './pages/knowledge/KnowledgeLib';
import RuleConfig from './pages/system/RuleConfig';
import Settings from './pages/system/Settings';
import { DraftProvider } from './context/DraftContext';
import { PRIMARY_COLOR } from './constants/colors';

export default function App() {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: PRIMARY_COLOR,
          borderRadius: 4,
        },
      }}
    >
      <DraftProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<MainLayout />}>
              <Route index element={<Navigate to="/draft/select" replace />} />
              <Route path="draft" element={<DraftWizardLayout />}>
                <Route index element={<Navigate to="select" replace />} />
                <Route path="select" element={<TemplateSelect />} />
                <Route path="form" element={<DynamicForm />} />
                <Route path="result" element={<ResultCheck />} />
              </Route>
              <Route path="history" element={<HistoryList />} />
              <Route path="knowledge" element={<KnowledgeLib />} />
              <Route path="rules" element={<RuleConfig />} />
              <Route path="settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/draft/select" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </DraftProvider>
    </ConfigProvider>
  );
}
