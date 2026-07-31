import { useMemo } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Avatar, Dropdown, Layout, Menu, Typography, message } from 'antd';
import {
  BookOutlined,
  EditOutlined,
  HistoryOutlined,
  LogoutOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  SettingOutlined,
  UserOutlined,
} from '@ant-design/icons';

const { Header, Sider, Content } = Layout;

const MENU_ITEMS = [
  { key: '/draft/select', icon: <EditOutlined />, label: <Link to="/draft/select">材料智能起草</Link> },
  { key: '/history', icon: <HistoryOutlined />, label: <Link to="/history">历史文稿记录</Link> },
  { key: '/knowledge', icon: <BookOutlined />, label: <Link to="/knowledge">知识库管理</Link> },
  { key: '/rules', icon: <SafetyCertificateOutlined />, label: <Link to="/rules">合规规则配置</Link> },
  { key: '/settings', icon: <SettingOutlined />, label: <Link to="/settings">系统设置</Link> },
];

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const selectedKey = useMemo(() => {
    if (location.pathname.startsWith('/draft')) return '/draft/select';
    const match = MENU_ITEMS.find((item) => location.pathname.startsWith(item.key));
    return match?.key ?? '/draft/select';
  }, [location.pathname]);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          background: '#fff',
          borderBottom: '1px solid #f0f0f0',
        }}
      >
        <Typography.Title level={4} style={{ margin: 0, color: '#165DFF' }}>
          AI 党建材料智能起草与合规检查工作台
        </Typography.Title>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <a onClick={() => navigate('/knowledge')} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <SearchOutlined /> 知识库检索
          </a>
          <Dropdown
            menu={{
              items: [{ key: 'logout', icon: <LogoutOutlined />, label: '退出登录' }],
              onClick: () => message.info('演示环境未接入登录态，暂不支持退出'),
            }}
          >
            <span style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar size="small" icon={<UserOutlined />} />
              党建专员 · 张老师
            </span>
          </Dropdown>
        </div>
      </Header>
      <Layout>
        <Sider width={200} style={{ background: '#fff' }}>
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            items={MENU_ITEMS}
            style={{ height: '100%', borderRight: 0 }}
          />
        </Sider>
        <Layout style={{ padding: 24 }}>
          <Content
            style={{
              background: '#fff',
              padding: 24,
              margin: 0,
              minHeight: 280,
              borderRadius: 8,
            }}
          >
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
}
