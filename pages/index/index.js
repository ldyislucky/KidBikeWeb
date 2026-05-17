const api = require('../../utils/api');

Page({
  data: {
    searchValue: '',

    categories: [
      { id: 0, name: '所有产品', active: true },
      { id: 1, name: '主推产品', active: false },
      { id: 2, name: '现货产品', active: false }
    ],
    activeCategory: 0,

    sortType: 0,
    sortAsc: true,

    showFilterPanel: false,

    filterPriceRange: '',
    filterTimeRange: '',
    filterStockStatus: '',

    hasActiveFilter: false,

    priceRanges: [
      { label: '全部', value: '' },
      { label: '¥0-300', value: '0-300' },
      { label: '¥300-600', value: '300-600' },
      { label: '¥600以上', value: '600+' }
    ],
    timeRanges: [
      { label: '全部', value: '' },
      { label: '近3个月', value: '3m' },
      { label: '近6个月', value: '6m' },
      { label: '近1年', value: '1y' }
    ],
    stockStatuses: [
      { label: '全部', value: '' },
      { label: '现货', value: 'inStock' },
      { label: '预售', value: 'preOrder' }
    ],

    displayProducts: [],
    totalCount: 0,

    page: 1,
    pageSize: 20,
    hasMore: true,
    loading: false,
    loadError: false,
    searchTimer: null
  },

  onLoad() {
    console.log('fetchProducts called执行');
    this.fetchProducts();
  },

  onShow() {
    // 从详情页返回时可刷新列表
  },

  onPullDownRefresh() {
    console.log('onPullDownRefresh 执行');
    this.setData({ page: 1, hasMore: true });
    this.fetchProducts().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  onReachBottom() {
    console.log('onReachBottom called执行');
    if (this.data.hasMore && !this.data.loading) {
      this.loadMore();
    }
  },

  /** 构建 API 查询参数 */
  buildQueryParams() {
    const { activeCategory, searchValue, sortType, sortAsc,
            filterPriceRange, filterTimeRange, filterStockStatus,
            page, pageSize } = this.data;

    const categoryMap = { 0: 'all', 1: 'recommended', 2: 'inStock' };
    const sortByMap = { 0: 'itemNo', 1: 'updateTime', 2: 'price' };

    const params = {
      category: categoryMap[activeCategory] || 'all',
      sortBy: sortByMap[sortType] || 'updateTime',
      sortOrder: sortAsc ? 'asc' : 'desc',
      page: page,
      pageSize: pageSize
    };

    const kw = searchValue.trim();
    if (kw) {
      params.search = kw;
    }

    if (filterPriceRange === '0-300') {
      params.priceMin = 0;
      params.priceMax = 300;
    } else if (filterPriceRange === '300-600') {
      params.priceMin = 300;
      params.priceMax = 600;
    } else if (filterPriceRange === '600+') {
      params.priceMin = 600;
    }

    if (filterTimeRange) {
      params.timeRange = filterTimeRange;
    }

    if (filterStockStatus) {
      params.stockStatus = filterStockStatus;
    }

    return params;
  },

  /** 请求产品列表（首页 / 刷新） */
  fetchProducts() {
    console.log('fetchProducts正式执行'); 
    const params = this.buildQueryParams();
    this.setData({ loading: true, loadError: false });

    return api.getProducts(params).then(res => {
      console.log('相应信息！！！'); 
      console.log(res);
      const items = this.extractItems(res);
      const total = res.total !== undefined ? res.total : items.length;
      const hasMore = items.length >= this.data.pageSize &&
                      this.data.displayProducts.length + items.length < total;

      console.log('items信息',items);

      this.setData({
        displayProducts: items,
        totalCount: total,
        hasMore: hasMore,
        loading: false,
        loadError: false
      });
      console.log('产品信息：',this.data.displayProducts); 
    }).catch(err => {
      console.error('获取产品列表失败', err);
      this.setData({ loading: false, loadError: true });
    });
  },

  /** 加载更多 */
  loadMore() {
    if (!this.data.hasMore || this.data.loading) return;

    const page = this.data.page + 1;
    this.setData({ page: page, loading: true });

    const params = this.buildQueryParams();
    params.page = page;

    return api.getProducts(params).then(res => {
      console.log('完整相应',res);
      const items = this.extractItems(res);
      const total = res.total !== undefined ? res.total : this.data.totalCount;
      const newProducts = [...this.data.displayProducts, ...items];
      const hasMore = items.length >= this.data.pageSize &&
                      newProducts.length < total;

      this.setData({
        displayProducts: newProducts,
        totalCount: total,
        hasMore: hasMore,
        loading: false
      });
    }).catch(err => {
      console.error('加载更多失败', err);
      this.setData({ page: page - 1, loading: false });
    });
  },

  /** 从响应中提取产品数组 */
  extractItems(res) {
    
    console.log('res.data信息', res.data);
    console.log('res.data.items信息', res.data.items);
    
    if (Array.isArray(res)) return res;
    // 新增：处理 { data: { items: [...] } } 结构
    if (res && Array.isArray(res.data)) return res.data;
    if (res && res.data && Array.isArray(res.data.items)) return res.data.items;
    return [];
  },

  /** 重置并重新查询 */
  refreshProducts() {
    this.setData({ page: 1, hasMore: true, displayProducts: [] });
    this.fetchProducts();
  },

  onCategoryTap(e) {
    const id = e.currentTarget.dataset.id;
    const categories = this.data.categories.map(cat => ({
      ...cat,
      active: cat.id === id
    }));
    this.setData({ categories, activeCategory: id });
    this.refreshProducts();
  },

  onSortTap(e) {
    const type = e.currentTarget.dataset.type;
    if (this.data.sortType === type) {
      this.setData({ sortAsc: !this.data.sortAsc });
    } else {
      this.setData({ sortType: type, sortAsc: true });
    }
    this.refreshProducts();
  },

  onFilterTap() {
    this.setData({ showFilterPanel: !this.data.showFilterPanel });
  },

  onFilterOverlayTap() {
    this.setData({ showFilterPanel: false });
  },

  onFilterOptionTap(e) {
    const { key, value } = e.currentTarget.dataset;
    const update = {};
    update[key] = value;
    this.setData(update);
  },

  onFilterReset() {
    this.setData({
      filterPriceRange: '',
      filterTimeRange: '',
      filterStockStatus: '',
      hasActiveFilter: false
    });
    this.refreshProducts();
    this.setData({ showFilterPanel: false });
  },

  onFilterConfirm() {
    const hasActive = this.data.filterPriceRange !== '' ||
                      this.data.filterTimeRange !== '' ||
                      this.data.filterStockStatus !== '';
    this.setData({ hasActiveFilter: hasActive, showFilterPanel: false });
    this.refreshProducts();
  },

  onSearchInput(e) {
    this.setData({ searchValue: e.detail.value });

    if (this.data.searchTimer) {
      clearTimeout(this.data.searchTimer);
    }
    this.data.searchTimer = setTimeout(() => {
      this.refreshProducts();
    }, 400);
  },

  onProductTap(e) {
    wx.navigateTo({ url: `/pages/product-detail/product-detail?id=${e.detail.id}` });
  }
});
