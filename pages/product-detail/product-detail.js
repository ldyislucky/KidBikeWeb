const api = require('../../utils/api');

Page({
  data: {
    product: {},
    loading: true,
    loadError: false,
    isFavorited: false,
    favoriteLoading: false
  },

  onLoad(options) {
    const id = options.id;
    if (id) {
      this.setData({ productId: id });
      this.fetchProduct(id);
      this.checkFavoriteStatus(id);
    }
  },

  fetchProduct(id) {
    this.setData({ loading: true, loadError: false });
    api.getProduct(id).then(res => {
      const product = res.data || res;
      const app = getApp();
      app.globalData.currentProduct = product;
      this.setData({ product, loading: false });
    }).catch(err => {
      console.error('获取产品详情失败', err);
      this.setData({ loading: false, loadError: true });
    });
  },

  checkFavoriteStatus(productId) {
    const token = wx.getStorageSync('token');
    if (!token) return;
    api.getFavorites({ pageSize: 50 }).then(res => {
      const items = res.data || res.items || res || [];
      const fav = items.find(item => {
        const pid = item.productId || item.product_id || (item.product && item.product.id);
        return pid === Number(productId) || pid === String(productId);
      });
      if (fav) this.setData({ isFavorited: true });
    }).catch(() => {});
  },

  onToggleFavorite() {
    const { productId, isFavorited, favoriteLoading } = this.data;
    if (favoriteLoading) return;

    const token = wx.getStorageSync('token');
    if (!token) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    this.setData({ favoriteLoading: true });

    const request = isFavorited
      ? api.removeFavorite(productId)
      : api.addFavorite(productId);

    request.then(() => {
      this.setData({
        isFavorited: !isFavorited,
        favoriteLoading: false
      });
      wx.showToast({ title: isFavorited ? '已取消收藏' : '已收藏', icon: 'success' });
    }).catch(err => {
      console.error('收藏操作失败', err);
      wx.showToast({ title: '操作失败', icon: 'none' });
      this.setData({ favoriteLoading: false });
    });
  },

  onOrder() {
    const token = wx.getStorageSync('token');
    if (!token) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    wx.navigateTo({
      url: `/pages/addresses/addresses?action=select&productId=${this.data.productId}`
    });
  },

  onContact() {
    const { product } = this.data;
    wx.navigateTo({
      url: `/pages/support/support?productId=${product.id || ''}&productTitle=${encodeURIComponent(product.title || '')}`
    });
  },

  onShareAppMessage() {
    return {
      title: this.data.product.title || 'KidBike 儿童自行车',
      path: '/pages/index/index'
    };
  }
});
