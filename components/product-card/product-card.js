Component({
  properties: {
    product: {
      type: Object,
      value: {}
    }
  },

  methods: {
    onTap() {
      const app = getApp();
      app.globalData.currentProduct = this.data.product;
      wx.navigateTo({
        url: '/pages/product-detail/product-detail'
      });
    }
  }
});
