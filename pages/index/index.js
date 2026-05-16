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

    allProducts: [
      { id: 1, title: '闪电儿童山地自行车', itemNo: 'BK-001', updateTime: '2026-04-20', price: 568, isRecommend: true, isInStock: true, image: '' },
      { id: 2, title: '小飞侠儿童平衡车', itemNo: 'BK-002', updateTime: '2026-04-18', price: 328, isRecommend: true, isInStock: true, image: '' },
      { id: 3, title: '炫彩儿童折叠自行车 12寸', itemNo: 'BK-003', updateTime: '2026-04-15', price: 456, isRecommend: true, isInStock: true, image: '' },
      { id: 4, title: '恐龙宝宝三轮脚踏车', itemNo: 'BK-004', updateTime: '2026-03-28', price: 198, isRecommend: true, isInStock: true, image: '' },
      { id: 5, title: '极速少年变速山地车 18速', itemNo: 'BK-005', updateTime: '2026-03-10', price: 788, isRecommend: true, isInStock: true, image: '' },
      { id: 6, title: '公主款儿童自行车 14寸', itemNo: 'BK-006', updateTime: '2026-02-22', price: 438, isRecommend: true, isInStock: true, image: '' },
      { id: 7, title: '铝合金儿童越野自行车', itemNo: 'BK-007', updateTime: '2026-01-15', price: 658, isRecommend: false, isInStock: true, image: '' },
      { id: 8, title: '新款儿童滑步车 轻量款', itemNo: 'BK-008', updateTime: '2025-12-08', price: 268, isRecommend: false, isInStock: false, image: '' }
    ],
    displayProducts: [],
    totalCount: 2488
  },

  onLoad() {
    this.loadProducts();
    this.filterProducts();
  },

  loadProducts() {
    let storedProducts = [];
    try {
      storedProducts = wx.getStorageSync('products') || [];
    } catch (e) {
      storedProducts = [];
    }
    if (storedProducts.length > 0) {
      this.setData({
        allProducts: [...storedProducts, ...this.data.allProducts]
      });
    }
  },

  onCategoryTap(e) {
    const id = e.currentTarget.dataset.id;
    const categories = this.data.categories.map(cat => ({
      ...cat,
      active: cat.id === id
    }));
    this.setData({ categories, activeCategory: id });
    this.filterProducts();
  },

  onSortTap(e) {
    const type = e.currentTarget.dataset.type;
    if (this.data.sortType === type) {
      this.setData({ sortAsc: !this.data.sortAsc });
    } else {
      this.setData({ sortType: type, sortAsc: true });
    }
    this.filterProducts();
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
    this.filterProducts();
    this.setData({ showFilterPanel: false });
  },

  onFilterConfirm() {
    const hasActive = this.data.filterPriceRange !== '' ||
                      this.data.filterTimeRange !== '' ||
                      this.data.filterStockStatus !== '';
    this.setData({ hasActiveFilter: hasActive, showFilterPanel: false });
    this.filterProducts();
  },

  onSearchInput(e) {
    this.setData({ searchValue: e.detail.value });
    this.filterProducts();
  },

  filterProducts() {
    let products = [...this.data.allProducts];
    const { activeCategory, searchValue, sortType, sortAsc,
            filterPriceRange, filterTimeRange, filterStockStatus } = this.data;
    const kw = searchValue.trim().toLowerCase();

    if (activeCategory === 1) {
      products = products.filter(p => p.isRecommend);
    } else if (activeCategory === 2) {
      products = products.filter(p => p.isInStock);
    }

    if (kw) {
      products = products.filter(p =>
        p.title.toLowerCase().includes(kw) ||
        p.itemNo.toLowerCase().includes(kw)
      );
    }

    if (filterPriceRange) {
      products = products.filter(p => {
        const price = p.price;
        if (filterPriceRange === '0-300') return price >= 0 && price <= 300;
        if (filterPriceRange === '300-600') return price > 300 && price <= 600;
        if (filterPriceRange === '600+') return price > 600;
        return true;
      });
    }

    if (filterTimeRange) {
      const now = Date.now();
      const msPerDay = 86400000;
      products = products.filter(p => {
        const productTime = new Date(p.updateTime).getTime();
        const diffDays = (now - productTime) / msPerDay;
        if (filterTimeRange === '3m') return diffDays <= 90;
        if (filterTimeRange === '6m') return diffDays <= 180;
        if (filterTimeRange === '1y') return diffDays <= 365;
        return true;
      });
    }

    if (filterStockStatus) {
      products = products.filter(p => {
        if (filterStockStatus === 'inStock') return p.isInStock === true;
        if (filterStockStatus === 'preOrder') return p.isInStock !== true;
        return true;
      });
    }

    if (sortType === 0) {
      products.sort((a, b) =>
        sortAsc ? a.itemNo.localeCompare(b.itemNo) : b.itemNo.localeCompare(a.itemNo));
    } else if (sortType === 1) {
      products.sort((a, b) =>
        sortAsc ? new Date(a.updateTime) - new Date(b.updateTime)
                : new Date(b.updateTime) - new Date(a.updateTime));
    } else if (sortType === 2) {
      products.sort((a, b) =>
        sortAsc ? a.price - b.price : b.price - a.price);
    }

    this.setData({
      displayProducts: products,
      totalCount: products.length
    });
  },

  onProductTap(e) {
    const id = e.detail.id;
    wx.showToast({ title: '产品详情 ' + id, icon: 'none' });
  }
});
