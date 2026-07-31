import { Outlet, useLocation } from 'react-router-dom';
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
      <StepProcess current={current} />
      <Outlet />
    </>
  );
}
