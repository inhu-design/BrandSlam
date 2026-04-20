/** 네비「My Campaign」호버/포커스 시 대시보드 번들 선로드로 첫 진입 체감 단축 */
export function preloadDashboardRoute() {
  void import('../pages/Dashboard.jsx');
}
