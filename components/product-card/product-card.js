Component({
  // 组件的属性列表（用于接收外部传入的数据）
  properties: {
    // 商品对象属性
    product: {
      type: Object,    // 属性类型为对象
      value: {}        // 默认值为空对象
    }
  },

  lifetimes: {
    attached() {
      console.log('接收到的 product 数据：', this.properties.product);
      // 或者使用 this.data.product（效果相同）
    }
  },

  // 组件的方法列表
  methods: {
    // 商品点击事件处理函数
    onTap() {
      // 使用 wx.navigateTo 跳转到商品详情页
      wx.navigateTo({
        // 跳转路径为 /pages/product-detail/product-detail
        // 通过 URL 参数传递当前商品的 id
        url: `/pages/product-detail/product-detail?id=${this.data.product.id}`
      });
    }
  }
});