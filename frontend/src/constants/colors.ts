export const PRIMARY_COLOR = '#165DFF';

export const SEVERITY_COLOR: Record<'fatal' | 'warning' | 'good', string> = {
  fatal: '#F53F3F',
  warning: '#FFAA00',
  good: '#00B42A',
};

export const SEVERITY_LABEL: Record<'fatal' | 'warning' | 'good', string> = {
  fatal: '致命错误',
  warning: '建议优化',
  good: '合规良好',
};
