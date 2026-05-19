const api = require('../../utils/api');

Page({
  data: {
    wallet: null,
    transactions: [],
    page: 1,
    pageSize: 20,
    hasMore: true,
    loading: false,
    loadError: false,
    txLoading: false
  },

  onLoad() {
    this.fetchWallet();
    this.fetchTransactions();
  },

  fetchWallet() {
    this.setData({ loading: true, loadError: false });
    api.getWallet().then(res => {
      const wallet = res.data || res;
      this.setData({ wallet, loading: false });
    }).catch(err => {
      console.error('获取钱包信息失败', err);
      this.setData({ loading: false, loadError: true });
    });
  },

  fetchTransactions() {
    this.setData({ txLoading: true, page: 1, hasMore: true });
    api.getTransactions({ page: 1, pageSize: this.data.pageSize }).then(res => {
      const items = this.extractItems(res);
      this.setData({
        transactions: items,
        hasMore: items.length >= this.data.pageSize,
        txLoading: false
      });
    }).catch(err => {
      console.error('获取交易记录失败', err);
      this.setData({ txLoading: false });
    });
  },

  loadMoreTransactions() {
    if (!this.data.hasMore || this.data.txLoading) return;
    const page = this.data.page + 1;
    this.setData({ page, txLoading: true });

    api.getTransactions({ page, pageSize: this.data.pageSize }).then(res => {
      const items = this.extractItems(res);
      const newList = [...this.data.transactions, ...items];
      this.setData({
        transactions: newList,
        hasMore: items.length >= this.data.pageSize,
        txLoading: false
      });
    }).catch(() => {
      this.setData({ page: page - 1, txLoading: false });
    });
  },

  extractItems(res) {
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.data)) return res.data;
    if (res && res.data && Array.isArray(res.data.items)) return res.data.items;
    return [];
  },

  onPullDownRefresh() {
    Promise.all([this.fetchWallet(), this.fetchTransactions()])
      .then(() => wx.stopPullDownRefresh());
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.txLoading) this.loadMoreTransactions();
  }
});
