const api = require('../../utils/api');

Page({
  data: {
    product: {},
    loading: true,
    loadError: false
  },

  onLoad(options) {
    const id = options.id;
    if (id) {
      this.fetchProduct(id);
    }
  },

  fetchProduct(id) {
    this.setData({ loading: true, loadError: false });
    api.getProduct(id).then(res => {
      const product = res.data || res;
      this.setData({ product, loading: false });
    }).catch(err => {
      console.error('获取产品详情失败', err);
      this.setData({ loading: false, loadError: true });
    });
  },

  onShareAppMessage() {
    return {
      title: this.data.product.title || 'KidBike 儿童自行车',
      path: '/pages/index/index'
    };
  }
});
