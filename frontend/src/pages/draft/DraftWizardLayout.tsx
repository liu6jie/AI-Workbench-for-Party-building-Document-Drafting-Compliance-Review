import { Outlet, useLocation } from 'react-router-dom';
import { Breadcrumb, Typography } from 'antd';
import StepProcess from '../../components/StepProcess';

const STEP_BY_PATH: Record<string, 0 | 1 | 2> = {
  '/draft/select': 0,
  '/draft/form': 1,
  '/draft/result': 2,
};

export default function DraftWizardLayout() {
  const location = useLocation();
  const current = STEP_BY_PATH[location.pathname] ?? 0;

  return (
    <>
      <div className="workspace-heading">
        <Breadcrumb items={[{ title: '首页' }, { title: '材料智能起草' }]} />
        <Typography.Title level={2} className="workspace-title">材料智能起草</Typography.Title>
        <Typography.Text className="workspace-description">用标准化流程完成党务文稿起草、审查与归档</Typography.Text>
      </div>
      <StepProcess current={current} />
      <Outlet />
    </>
  );
}
