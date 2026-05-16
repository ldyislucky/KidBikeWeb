Page({
  data: {
    product: {}
  },

  onLoad() {
    const app = getApp();
    const product = app.globalData.currentProduct || {};
    this.setData({ product });
  },

  onShareAppMessage() {
    return {
      title: this.data.product.title || 'KidBike 儿童自行车',
      path: '/pages/index/index'
    };
  }
});
