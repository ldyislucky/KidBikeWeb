const api = require('../../utils/api');

Page({
  data: {
    product: {},
    imageUrls: [],       // 所有图片 URL（image 主图 + images 列表）
    currentSwiper: 0,    // 当前轮播索引
    imgLoadErrors: [],   // 每张图片的加载状态
    loading: true,
    loadError: false,
    isFavorited: false,
    favoriteLoading: false,
    isAdmin: false,
    showAdminAction: false,
    productId: null
  },

  onLoad(options) {
    const id = options.id;
    if (id) {
      this.setData({ productId: id });
      this.checkAdminStatus();
      this.fetchProduct(id);
      this.checkFavoriteStatus(id);
    }
  },

  checkAdminStatus() {
    const userInfo = wx.getStorageSync('userInfo');
    const isAdmin = userInfo && (userInfo.role === 'admin' || userInfo.isAdmin === true);
    this.setData({ isAdmin });
  },

  fetchProduct(id) {
    this.setData({ loading: true, loadError: false });
    api.getProduct(id).then(res => {
      const product = res.data || res;
      const app = getApp();
      app.globalData.currentProduct = product;

      // 构建图片列表：image 主图放第一，images 拼接在后面
      const allUrls = [];
      // 主图
      if (product.image) {
        allUrls.push(api.getImageUrl(product.image) || api.DEFAULT_PRODUCT_IMAGE);
      }
      // images 字段（逗号分隔的文件名）
      const imagesRaw = product.images || '';
      if (typeof imagesRaw === 'string' && imagesRaw.trim()) {
        imagesRaw.split(',').map(s => s.trim()).filter(Boolean).forEach(fn => {
          allUrls.push(api.getImageUrl(fn) || api.DEFAULT_PRODUCT_IMAGE);
        });
      } else if (Array.isArray(imagesRaw) && imagesRaw.length > 0) {
        imagesRaw.forEach(fn => {
          allUrls.push(api.getImageUrl(fn) || api.DEFAULT_PRODUCT_IMAGE);
        });
      }
      // 一张图片都没有时给个默认图
      if (allUrls.length === 0) {
        allUrls.push(api.DEFAULT_PRODUCT_IMAGE);
      }

      this.setData({
        product,
        imageUrls: allUrls,
        imgLoadErrors: new Array(allUrls.length).fill(false),
        loading: false
      });
    }).catch(err => {
      console.error('获取产品详情失败', err);
      this.setData({ loading: false, loadError: true });
    });
  },

  // 调用后端 GET /api/v1/favorites/check?product_id=xxx 检查收藏状态
  checkFavoriteStatus(productId) {
    const token = wx.getStorageSync('token');
    if (!token) {
      this.setData({ isFavorited: false });
      return;
    }
    api.checkFavorite(productId).then(res => {
      // 后端返回 { code:200, data:{ is_favorited: true/false } }
      const inner = res.data || res;
      const favorited = inner.is_favorited || inner.isFavorited || false;
      console.log('[checkFavoriteStatus] productId:', productId, 'is_favorited:', favorited);
      this.setData({ isFavorited: !!favorited });
    }).catch(err => {
      console.warn('[checkFavoriteStatus] failed:', err);
      this.setData({ isFavorited: false });
    });
  },

  onToggleFavorite() {
    const { productId, isFavorited, favoriteLoading } = this.data;
    if (favoriteLoading) return;

    const token = wx.getStorageSync('token');
    if (!token) {
      wx.showModal({
        title: '请先登录',
        content: '登录后才能收藏产品',
        confirmText: '去登录',
        cancelText: '取消',
        success: res => {
          if (res.confirm) wx.navigateTo({ url: '/pages/login/login' });
        }
      });
      return;
    }

    this.setData({ favoriteLoading: true });

    const request = isFavorited
      ? api.removeFavorite(productId)
      : api.addFavorite(productId);

    request.then(() => {
      this.setData({ isFavorited: !isFavorited, favoriteLoading: false });
      wx.showToast({ title: isFavorited ? '已取消收藏' : '已收藏', icon: 'success' });
    }).catch(() => {
      wx.showToast({ title: '操作失败', icon: 'none' });
      this.setData({ favoriteLoading: false });
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
  },

  onSwiperChange(e) {
    this.setData({ currentSwiper: e.detail.current });
  },

  onImageError(e) {
    const idx = e.currentTarget.dataset.idx;
    if (idx !== undefined && !this.data.imgLoadErrors[idx]) {
      this.setData({ ['imgLoadErrors[' + idx + ']']: true });
    }
  },

  // ==================== 管理员操作 ====================

  onShowMore() {
    this.setData({ showAdminAction: true });
  },

  onHideMore() {
    this.setData({ showAdminAction: false });
  },

  noop() {},

  onAdminUpdate() {
    const { productId } = this.data;
    this.setData({ showAdminAction: false });
    wx.navigateTo({ url: `/pages/product-update/product-update?id=${productId}` });
  },

  onAdminDelete() {
    const { productId, product } = this.data;
    this.setData({ showAdminAction: false });
    wx.showModal({
      title: '确认删除',
      content: `确定要删除「${product.title || product.name || '该产品'}」吗？删除后不可恢复。`,
      confirmText: '删除',
      confirmColor: '#FF4444',
      cancelText: '取消',
      success: res => {
        if (!res.confirm) return;
        wx.showLoading({ title: '删除中...' });
        api.deleteProduct(productId).then(() => {
          wx.hideLoading();
          wx.showToast({ title: '删除成功', icon: 'success' });
          setTimeout(() => wx.navigateBack(), 1000);
        }).catch(err => {
          wx.hideLoading();
          const msg = (err.data && (err.data.detail || err.data.message)) || '删除失败，请重试';
          wx.showToast({ title: msg, icon: 'none' });
        });
      }
    });
  }
});
