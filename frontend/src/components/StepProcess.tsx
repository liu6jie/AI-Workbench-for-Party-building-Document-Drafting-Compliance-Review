import { Steps } from 'antd';

const STEPS = [
  { title: '选择材料模板' },
  { title: '填写结构化表单' },
  { title: 'AI生成文稿 + 合规审查' },
];

export default function StepProcess({ current }: { current: 0 | 1 | 2 }) {
  return (
    <Steps
      current={current}
      items={STEPS}
      style={{ maxWidth: 720, margin: '0 auto 24px' }}
    />
  );
}
