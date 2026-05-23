const api = require('../../utils/api');

Page({
  data: {
    favorites: [],
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
    this.fetchFavorites();
  },

  // 登录守卫
  _checkLogin() {
    const token = wx.getStorageSync('token');
    if (!token) {
      wx.showModal({
        title: '请先登录',
        content: '登录后才能查看收藏',
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

  fetchFavorites() {
    this.setData({ loading: true, loadError: false, page: 1, hasMore: true });
    return api.getFavorites({ page: 1, pageSize: this.data.pageSize }).then(res => {
      const items = this.extractItems(res);
      this.setData({
        favorites: items,
        hasMore: items.length >= this.data.pageSize,
        loading: false
      });
    }).catch(err => {
      console.error('获取收藏列表失败', err);
      this.setData({ loading: false, loadError: true });
    });
  },

  loadMore() {
    if (!this.data.hasMore || this.data.loading) return;
    const page = this.data.page + 1;
    this.setData({ page, loading: true });

    api.getFavorites({ page, pageSize: this.data.pageSize }).then(res => {
      const items = this.extractItems(res);
      this.setData({
        favorites: [...this.data.favorites, ...items],
        hasMore: items.length >= this.data.pageSize,
        loading: false
      });
    }).catch(() => {
      this.setData({ page: page - 1, loading: false });
    });
  },

  extractItems(res) {
    let items = [];
    if (Array.isArray(res)) items = res;
    else if (res && Array.isArray(res.data)) items = res.data;
    else if (res && res.data && Array.isArray(res.data.items)) items = res.data.items;

    // 为每个收藏项计算图片完整 URL
    items.forEach(item => {
      const imageName = (item.product && item.product.image) || item.image || '';
      item._imageUrl = api.getImageUrl(imageName) || api.DEFAULT_PRODUCT_IMAGE;
    });

    return items;
  },

  getProductId(item) {
    return item.productId || item.product_id || (item.product && item.product.id) || item.id;
  },

  onItemTap(e) {
    const item = e.currentTarget.dataset.item;
    const pid = this.getProductId(item);
    if (pid) {
      wx.navigateTo({ url: `/pages/product-detail/product-detail?id=${pid}` });
    }
  },

  onRemoveFavorite(e) {
    const item = e.currentTarget.dataset.item;
    const pid = this.getProductId(item);
    if (!pid) return;

    wx.showModal({
      title: '取消收藏',
      content: '确定要取消收藏该产品吗？',
      confirmText: '确定',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          api.removeFavorite(pid).then(() => {
            const favorites = this.data.favorites.filter(f => this.getProductId(f) !== pid);
            this.setData({ favorites });
            wx.showToast({ title: '已取消收藏', icon: 'success' });
          }).catch(() => {
            wx.showToast({ title: '操作失败', icon: 'none' });
          });
        }
      }
    });
  },

  onPullDownRefresh() {
    this.fetchFavorites()
      .then(() => wx.stopPullDownRefresh())
      .catch(() => wx.stopPullDownRefresh());
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) this.loadMore();
  },

  onFavImgError(e) {
    const idx = e.currentTarget.dataset.idx;
    const key = `favorites[${idx}]._imageUrl`;
    this.setData({ [key]: '/static/images/default-product.png' });
  }
});
