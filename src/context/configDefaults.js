const DEFAULT_CASE_STUDIES = {
  toy: {
    target: '占位：品牌定位、用户画像、传播核心信息、视觉风格基准。',
    action: '占位：电商主图/详情页、短视频脚本、素材矩阵、投放组合。',
    assets: '占位：主KV、产品白底图、组装过程短视频、店铺详情页切片。',
    review: '占位：复购内容、社媒栏目化输出、UGC 激励机制、视觉资产复用策略。',
  },
  industry: {
    target: '占位：展会主KV、传播节奏、媒体包与新闻素材、统一叙事框架。',
    action: '占位：销售手册视频、工艺亮点模块化表达、客户场景案例包装。',
    assets: '占位：生产线工艺图集、展会采访片段、企业标准化视觉模板。',
    review: '占位：客户见证内容、标准化工厂纪录资产、年度视觉策略迭代。',
  },
};

const DEFAULT_PROJECT_DATA = {
  toy_project: {
    id: 'toy_project',
    title: '《构建消费级拼装玩具数字资产》',
    subtitle: '从0到1搭建全渠道电商与社媒营销视觉库',
    coverUrl: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=1800&q=80',
    modules: {
      target: {
        headline: 'CHALLENGE',
        summary: '围绕拼装玩具从兴趣内容走向可转化内容，建立可复用视觉资产体系。',
        tags: ['#视觉溢价感低', '#用户理解门槛高', '#素材复用率不足'],
      },
      action: {
        title: '视觉策略',
        bullets: ['素材矩阵规划', '布光策略制定', '镜头语言统一', '后期调色规范'],
        supportImageUrl:
          'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1400&q=80',
      },
      assets: {
        intro: '核心素材用于电商、社媒和复盘页多场景分发。',
        assetUrls: [],
      },
      review: {
        cards: [
          { title: '产出规模', value: '0到1主导 · 100+ 素材' },
          { title: '痛点解决', value: '引入 GIF / 动图，显著降低理解门槛' },
          { title: '资产沉淀', value: '多渠道复用，跨部门协作效率提升' },
        ],
      },
      showcase: {
        heroKicker: '从0到1搭建全渠道电商与社媒营销视觉库',
        heroTitle: '《构建消费级拼装玩具数字资产》',
        brandCaptionTitle: 'BRAND SCREENING ROOM',
        brandCaptionSubtitle: '核心素材用于电商、社媒和复盘页多场景分发。',
        socialHeading: '视觉策略',
        socialSubheading: '镜头语言统一，打造可复用的社媒矩阵内容。',
        assetPhaseRaw: '围绕拼装玩具从兴趣内容走向可转化内容，建立可复用视觉资产体系。',
        assetPhaseWeb: '素材矩阵规划',
        assetPhasePrint: '多渠道复用，跨部门协作效率提升',
        bentoHeading: '全生态作品库',
        bentoSubheading: '探索更多跨渠道、跨触点的商业视觉资产。',
      },
    },
  },
  industry_project: {
    id: 'industry_project',
    title: '《ToB制造业的视觉公关与营销统筹》',
    subtitle: '大型展会纪实与工业化生产线视觉塑造',
    coverUrl: 'https://images.unsplash.com/photo-1565106430482-8f6e74349ca1?auto=format&fit=crop&w=1800&q=80',
    modules: {
      target: {
        headline: 'INDUSTRY CHALLENGE',
        summary: '将复杂工艺转化为可被市场理解与销售复用的视觉叙事。',
        tags: ['#工艺理解门槛高', '#素材分散', '#跨部门协作成本高'],
      },
      action: {
        title: '统筹策略',
        bullets: ['展会传播主线', '工艺亮点脚本化', '客户案例可视化', '销售素材模块化'],
        supportImageUrl:
          'https://images.unsplash.com/photo-1581092335397-9583eb92d232?auto=format&fit=crop&w=1400&q=80',
      },
      assets: {
        intro: '以工业质感为核心，沉淀可跨年度复用的品牌资产。',
        assetUrls: [],
      },
      review: {
        cards: [
          { title: '产出规模', value: '展会+线上双线联动' },
          { title: '痛点解决', value: '复杂工艺表达标准化，客户理解效率提升' },
          { title: '资产沉淀', value: '形成可复制素材包，支撑销售长期转化' },
        ],
      },
      showcase: {
        heroKicker: '大型展会纪实与工业化生产线视觉塑造',
        heroTitle: '《ToB制造业的视觉公关与营销统筹》',
        brandCaptionTitle: 'INDUSTRY SCREENING ROOM',
        brandCaptionSubtitle: '以工业质感为核心，沉淀可跨年度复用的品牌资产。',
        socialHeading: '统筹策略',
        socialSubheading: '工艺亮点脚本化，形成销售可复用的短视频矩阵。',
        assetPhaseRaw: '将复杂工艺转化为可被市场理解与销售复用的视觉叙事。',
        assetPhaseWeb: '展会传播主线',
        assetPhasePrint: '形成可复制素材包，支撑销售长期转化',
        bentoHeading: '全生态作品库',
        bentoSubheading: '查看更多工业与品牌传播的系统化案例。',
      },
    },
  },
};

const DEFAULT_CONFIG = {
  vignetteIntensity: 0.8,
  filmGrainOpacity: 0.03,
  spotlightRadius: 600,
  showHUD: true,
  siteTitle: 'DIRECTOR.VISION',
  siteDescription: 'Cinematic portfolio showcasing toys, industrial, and experimental visual storytelling.',
  ogImage: '',
  logoImageUrl: '',
  logoAltText: 'DIRECTOR.VISION',
  contactEmail: '',
  contactPhone: '',
  contactLocation: '',
  loginEntryLabel: 'ADMIN',
  loginModalTitle: '进入编辑后台',
  loginRegisterLabel: '没有账号？去注册',
  loginBackLabel: '返回登录',
  loginButtonText: '登录',
  registerButtonText: '注册并登录',
  loginCloseLabel: '关闭',
  loginUsernamePlaceholder: '用户名',
  loginPasswordPlaceholder: '密码',
  loginConfirmPasswordPlaceholder: '确认密码',
  resumeAwardsText: '',
  resumeExperienceText: '',
  resumeGearText: '',
  testimonialsText:
    '“团队协作顺畅，内容在投放后转化显著提升。”|市场负责人|消费品牌\n“把复杂工艺讲清楚了，销售团队复用效率很高。”|销售总监|制造业企业\n“从策略到交付都很专业，节奏和质量都可控。”|品牌经理|新消费项目',
  brandNamesText: 'TOYVERSE\nINDUSTRIAL PRO\nMOTIONLAB\nNOVA BRAND\nEXPO TECH\nVISION MAKERS',
  qrCodeImageUrl: '',
  servicesText:
    '商业视觉项目统筹|前期策略,拍摄执行,后期交付|2-6周|品牌新品发布/Campaign\n制造业内容营销体系|工艺可视化脚本,展会素材包,销售内容包|4-8周|ToB制造业企业\n长期内容资产服务|月度选题,拍摄排期,素材库维护|按月合作|需要持续内容输出的团队',
  caseStudies: DEFAULT_CASE_STUDIES,
  homeSelectedWorksTitle: 'SELECTED WORKS',
  homeSelectedWorksSubtitle: 'EXPERTISE VIEW · TECHNICAL EXECUTION',
  homeProfileImageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80',
  homeAboutKicker: 'ABOUT THE DIRECTOR',
  homeAboutHeadline: 'Silence, Frame, Emotion.',
  homeAwardsLabel: 'AWARDS',
  homeExperienceLabel: 'EXPERIENCE',
  homeGearLabel: 'GEAR LIST',
  featuredImagesTitle: 'SELECTED IMAGES',
  featuredImagesSubtitle: 'Curated stills chosen for the public image wall.',
  featuredImagesText:
    'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1600&q=80\nhttps://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1600&q=80\nhttps://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80',
};

export { DEFAULT_CASE_STUDIES, DEFAULT_PROJECT_DATA, DEFAULT_CONFIG };
