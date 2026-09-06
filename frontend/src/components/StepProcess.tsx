import { CheckOutlined, EditOutlined, FileTextOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { Steps } from 'antd';

const STEPS = [
  { title: '选择材料模板', icon: <FileTextOutlined /> },
  { title: '填写结构化表单', icon: <EditOutlined /> },
  { title: 'AI 生成与合规审查', icon: <SafetyCertificateOutlined /> },
];

export default function StepProcess({ current }: { current: 0 | 1 | 2 }) {
  return (
    <div className="process-strip">
      <div className="process-strip-label"><CheckOutlined /> 起草流程</div>
      <Steps current={current} items={STEPS} className="process-steps" />
    </div>
  );
}
