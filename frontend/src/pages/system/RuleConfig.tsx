import { Alert, Typography } from 'antd';

export default function RuleConfig() {
  return (
    <div>
      <Typography.Title level={5}>合规规则配置</Typography.Title>
      <Alert
        type="info"
        showIcon
        message="功能建设中"
        description="规划中：可视化维护规则引擎中的政治术语对照表、材料必需结构清单，无需改代码即可扩展检查规则（对应后端 rules/engine.py 中的 RULES / REQUIRED_SECTIONS）。"
      />
    </div>
  );
}
