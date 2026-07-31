import { Alert, Typography } from 'antd';

export default function Settings() {
  return (
    <div>
      <Typography.Title level={5}>系统设置</Typography.Title>
      <Alert
        type="info"
        showIcon
        message="功能建设中"
        description="规划中：后端接口地址配置、DeepSeek 模型参数（temperature/max_tokens）、单位特色信息（如“党建+科研融合”提示词）维护。"
      />
    </div>
  );
}
