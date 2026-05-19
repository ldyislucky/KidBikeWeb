const api = require('../../utils/api');

Page({
  data: {
    about: null,
    loading: true,
    loadError: false
  },

  onLoad() {
    this.fetchAbout();
  },

  fetchAbout() {
    this.setData({ loading: true, loadError: false });
    api.getAboutInfo().then(res => {
      const about = res.data || res;
      this.setData({ about, loading: false });
    }).catch(err => {
      console.error('获取关于信息失败', err);
      this.setData({ loading: false, loadError: true });
    });
  },

  onPullDownRefresh() {
    this.fetchAbout().then(() => wx.stopPullDownRefresh());
  }
});
