const api = require('../../utils/api');

Page({
  data: {
    tabs: [
      { label: '全部', value: '', active: true },
      { label: '待确认', value: 'pending', active: false },
      { label: '已确认', value: 'confirmed', active: false },
      { label: '配送中', value: 'shipped', active: false },
      { label: '已送达', value: 'delivered', active: false }
    ],
    activeStatus: '',
    orders: [],
    page: 1,
    pageSize: 10,
    hasMore: true,
    loading: false,
    loadError: false
  },

  onLoad() {
    // 数据加载在 onShow 统一处理
  },

  onShow() {
    if (!this._checkLogin()) return;
    this.fetchOrders();
  },

  // 登录守卫：未登录则引导跳转，返回 false
  _checkLogin() {
    const token = wx.getStorageSync('token');
    if (!token) {
      wx.showModal({
        title: '请先登录',
        content: '登录后才能查看订单',
        confirmText: '去登录',
        cancelText: '返回',
        success: res => {
          if (res.confirm) {
            wx.navigateTo({ url: '/pages/login/login' });
          } else {
            wx.navigateBack();
          }
        }
      });
      return false;
    }
    return true;
  },

  fetchOrders() {
    this.setData({ loading: true, loadError: false, page: 1, hasMore: true });
    const { activeStatus, pageSize } = this.data;
    const params = { page: 1, pageSize };
    if (activeStatus) params.status = activeStatus;

    return api.getOrders(params).then(res => {
      const items = this.extractItems(res);
      this.setData({
        orders: items,
        hasMore: items.length >= pageSize,
        loading: false
      });
    }).catch(err => {
      console.error('获取订单列表失败', err);
      this.setData({ loading: false, loadError: true });
    });
  },

  loadMore() {
    if (!this.data.hasMore || this.data.loading) return;
    const page = this.data.page + 1;
    this.setData({ page, loading: true });

    const { activeStatus, pageSize } = this.data;
    const params = { page, pageSize };
    if (activeStatus) params.status = activeStatus;

    api.getOrders(params).then(res => {
      const items = this.extractItems(res);
      this.setData({
        orders: [...this.data.orders, ...items],
        hasMore: items.length >= pageSize,
        loading: false
      });
    }).catch(() => {
      this.setData({ page: page - 1, loading: false });
    });
  },

  extractItems(res) {
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.data)) return res.data;
    if (res && res.data && Array.isArray(res.data.items)) return res.data.items;
    return [];
  },

  onTabTap(e) {
    const value = e.currentTarget.dataset.value;
    const tabs = this.data.tabs.map(t => ({ ...t, active: t.value === value }));
    this.setData({ tabs, activeStatus: value });
    this.fetchOrders();
  },

  onOrderTap(e) {
    const id = e.currentTarget.dataset.id;
    api.getOrder(id).then(res => {
      const order = res.data || res;
      const statusMap = {
        pending: '待确认', confirmed: '已确认',
        shipped: '配送中', delivered: '已送达', cancelled: '已取消'
      };
      const productTitle = (order.product && order.product.title) || order.productTitle || '商品';
      wx.showModal({
        title: '订单详情',
        content: `商品：${productTitle}\n数量：${order.quantity || 1}\n金额：¥${order.totalAmount || order.amount || '-'}\n状态：${statusMap[order.status] || order.status}\n备注：${order.remark || '无'}`,
        showCancel: false
      });
    }).catch(() => {
      wx.showToast({ title: '获取订单详情失败', icon: 'none' });
    });
  },

  onPullDownRefresh() {
    this.fetchOrders()
      .then(() => wx.stopPullDownRefresh())
      .catch(() => wx.stopPullDownRefresh());
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) this.loadMore();
  }
});
