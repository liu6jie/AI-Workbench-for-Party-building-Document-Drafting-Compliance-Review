import { useMemo } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Avatar, Dropdown, Layout, Menu, Typography, message } from 'antd';
import {
  BookOutlined,
  EditOutlined,
  FlagFilled,
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
    <Layout className="app-layout">
      <Header className="app-header">
        <div className="app-brand" aria-label="AI党建材料工作台">
          <div className="brand-mark"><FlagFilled /></div>
          <div>
            <Typography.Title level={4} className="app-brand-title">AI 党建材料工作台</Typography.Title>
            <div className="app-brand-subtitle">智能起草 · 合规检查 · 规范归档</div>
          </div>
        </div>
        <div className="app-header-actions">
          <button type="button" className="header-link" onClick={() => navigate('/knowledge')}>
            <SearchOutlined />
            <span>知识库检索</span>
          </button>
          <Dropdown
            menu={{
              items: [{ key: 'logout', icon: <LogoutOutlined />, label: '退出登录' }],
              onClick: () => message.info('演示环境未接入登录态，暂不支持退出'),
            }}
          >
            <button type="button" className="user-entry">
              <Avatar size={30} icon={<UserOutlined />} />
              <span>党建专员 · 张老师</span>
            </button>
          </Dropdown>
        </div>
      </Header>
      <Layout>
        <Sider width={224} className="app-sider">
          <div className="sider-intro">
            <div className="sider-intro-kicker">PARTY WORKBENCH</div>
            <div className="sider-intro-title">组织工作管理</div>
          </div>
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            items={MENU_ITEMS}
            className="app-menu"
          />
          <div className="sider-footer">
            <span className="footer-star">★</span>
            <span>让党务工作更规范、更高效</span>
          </div>
        </Sider>
        <Layout className="main-panel">
          <Content className="app-content">
            <div className="content-cloud cloud-one" />
            <div className="content-cloud cloud-two" />
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
}
