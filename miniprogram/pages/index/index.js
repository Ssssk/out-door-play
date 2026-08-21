// index.js · 出门溜车首页
Page({
  data: {
    tab: "drive",   // drive | fish
    tabbar: "drive", // drive | gas | me
    routes: [
      {
        id: 1,
        rank: 9,
        distance: "7.6km",
        title: "八分山日落自驾观光线",
        lengthNum: "5.0KM",
        diffNum: "220",
        level: "入门级",
        // 封面图：来自 Ardot 设计稿 (节点 3:86)
        cover: "../../images/liuche/card1.jpg"
      },
      {
        id: 2,
        rank: 7,
        distance: "8.0km",
        title: "大花山-青龙山-八分山三山连穿自驾线路",
        lengthNum: "33.0KM",
        diffNum: "61",
        level: "入门级",
        cover: "../../images/liuche/card2.jpg"
      },
      {
        id: 3,
        rank: 10,
        distance: "10.3km",
        title: "青龙山森林氧吧自驾线路",
        lengthNum: "18.5KM",
        diffNum: "145",
        level: "轻松级",
        cover: "../../images/liuche/card3.jpg"
      },
    ],
  },

  onLoad() {
    this.initNavbar();
    // TODO: 后续从云函数/数据库拉取真实路线数据
  },

  // 计算自定义导航栏尺寸，并避让微信右上角系统胶囊
  initNavbar() {
    try {
      const windowInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
      const statusBarHeight = windowInfo.statusBarHeight || 20;
      const menu = wx.getMenuButtonBoundingClientRect();
      // 导航栏内容区高度：让品牌行与系统胶囊垂直居中
      const navBarHeight = (menu.top - statusBarHeight) * 2 + menu.height;
      // 城市胶囊右侧需避让系统胶囊：系统胶囊左边缘到屏幕右边缘的距离 + 间距
      const cityRight = windowInfo.windowWidth - menu.left + 12;
      this.setData({
        statusBarHeight,
        navBarHeight,
        cityRight,
      });
    } catch (e) {
      this.setData({ statusBarHeight: 20, navBarHeight: 44, cityRight: 100 });
    }
  },

  onSwitchTab(e) {
    this.setData({ tab: e.currentTarget.dataset.tab });
  },

  onSwitchTabbar(e) {
    this.setData({ tabbar: e.currentTarget.dataset.key });
    // TODO: 后续接入实际页面：出车/加油/我的
  },

  onTapCity() {
    wx.showToast({ title: "切换城市敬请期待", icon: "none" });
  },

  onTapRoute(e) {
    const { id } = e.currentTarget.dataset;
    console.log("tap route", id);
    // TODO: 跳转路线详情页
  },
});
