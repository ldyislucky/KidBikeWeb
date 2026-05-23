const api = require('../../utils/api');

Component({
  properties: {
    product: {
      type: Object,
      value: {}
    }
  },

  data: {
    imageUrl: '',           // 拼接后的完整图片 URL
    imgLoadError: false     // 图片加载失败标记
  },

  observers: {
    'product.image': function(image) {
      this._updateImageUrl(image);
    }
  },

  lifetimes: {
    attached() {
      this._updateImageUrl(this.data.product.image);
    }
  },

  methods: {
    onTap() {
      wx.navigateTo({
        url: `/pages/product-detail/product-detail?id=${this.data.product.id}`
      });
    },

    onImageError() {
      if (!this.data.imgLoadError) {
        this.setData({ imgLoadError: true });
      }
    },

    _updateImageUrl(image) {
      const url = api.getImageUrl(image);
      this.setData({
        imageUrl: url || api.DEFAULT_PRODUCT_IMAGE,
        imgLoadError: false
      });
    }
  }
});
