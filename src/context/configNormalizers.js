const VALID_CATEGORIES = ['Toys', 'Industrial', 'Misc'];
const VALID_PUBLISH_STATUS = ['Draft', 'Published', 'Private'];
const VALID_ASSET_TYPES = ['image', 'video', 'image-comparison'];
const VALID_VARIANT_KEYS = ['raw', 'graded', 'styled'];

function normalizeSortOrder(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return numeric;
}

function normalizePrivateFiles(files) {
  if (!Array.isArray(files)) return [];
  return files
    .map((item, index) => ({
      id: String(item?.id || `pf-${Date.now()}-${index}`),
      name: String(item?.name || `File ${index + 1}`),
      url: String(item?.url || ''),
      actionType: item?.actionType === 'upload' ? 'upload' : 'download',
      note: String(item?.note || ''),
      sortOrder: normalizeSortOrder(item?.sortOrder ?? index),
      enabled: item?.enabled !== false,
    }))
    .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));
}

function inferMediaGroupFromAsset(asset = {}, resolvedType = 'image') {
  const type = String(asset?.type || '').toLowerCase();
  const url = String(asset?.url || asset?.coverUrl || asset?.videoUrl || '').toLowerCase();
  if (asset?.mediaGroup === 'video' || type === 'video' || /\.(mp4|webm|mov|m4v)(\?.*)?$/.test(url)) return 'video';
  if (asset?.mediaGroup === 'photo') return 'photo';
  return resolvedType === 'video' ? 'video' : 'photo';
}

function normalizeProject(project) {
  const normalizedPublishStatus = VALID_PUBLISH_STATUS.includes(project?.publishStatus)
    ? project.publishStatus
    : project?.status === 'private'
      ? 'Private'
      : project?.isVisible === false
        ? 'Draft'
        : 'Published';

  const visibility = VALID_PUBLISH_STATUS.includes(project?.visibility) ? project.visibility : normalizedPublishStatus;
  const status =
    project?.status === 'private' || normalizedPublishStatus === 'Private'
      ? 'private'
      : normalizedPublishStatus === 'Draft'
        ? 'draft'
        : 'published';

  const password = String(project?.password || project?.accessPassword || '');
  const deliveryPin = String(project?.deliveryPin || '');
  const kind = String(project?.kind || project?.mediaType || (project?.mainVideoUrl || project?.videoUrl ? 'video' : 'image')).toLowerCase();
  const mediaType = String(project?.mediaType || project?.kind || (project?.mainVideoUrl || project?.videoUrl ? 'video' : 'image')).toLowerCase();
  const displayOn = Array.isArray(project?.displayOn)
    ? project.displayOn.map((value) => String(value || '').trim().toLowerCase()).filter(Boolean)
    : String(project?.displayOn || '').split(',').map((value) => String(value || '').trim().toLowerCase()).filter(Boolean);
  const outlineTags = Array.isArray(project?.outlineTags)
    ? project.outlineTags.map((tag) => String(tag || '').trim()).filter(Boolean)
    : [];
  const normalizedVideoUrl = String(project?.mainVideoUrl || project?.videoUrl || '');

  return {
    id: String(project?.id || ''),
    title: String(project?.title || 'Untitled Project'),
    category: VALID_CATEGORIES.includes(project?.category) ? project.category : 'Misc',
    role: String(project?.role || ''),
    releaseDate: String(project?.releaseDate || ''),
    coverUrl: String(project?.coverUrl || ''),
    thumbnailUrl: String(project?.thumbnailUrl || project?.coverUrl || ''),
    logoImageUrl: String(project?.logoImageUrl || ''),
    videoUrl: normalizedVideoUrl,
    mainVideoUrl: normalizedVideoUrl,
    btsMedia: Array.isArray(project?.btsMedia) ? project.btsMedia.map((item) => String(item || '')) : [],
    clientAgency: String(project?.clientAgency || ''),
    clientCode: String(project?.clientCode || ''),
    isFeatured: Boolean(project?.isFeatured),
    featuredOrder: normalizeSortOrder(project?.featuredOrder),
    sortOrder: normalizeSortOrder(project?.sortOrder),
    description: String(project?.description || ''),
    credits: String(project?.credits || ''),
    privateTitle: String(project?.privateTitle || ''),
    privateDescription: String(project?.privateDescription || ''),
    privateAccessLabel: String(project?.privateAccessLabel || ''),
    privateAccessHint: String(project?.privateAccessHint || ''),
    privateAccessButtonText: String(project?.privateAccessButtonText || ''),
    privateErrorText: String(project?.privateErrorText || ''),
    deliveryTitle: String(project?.deliveryTitle || ''),
    deliverySuccessText: String(project?.deliverySuccessText || ''),
    deliveryPinPlaceholder: String(project?.deliveryPinPlaceholder || ''),
    deliveryErrorText: String(project?.deliveryErrorText || ''),
    deliveryButtonText: String(project?.deliveryButtonText || ''),
    downloadTitle: String(project?.downloadTitle || ''),
    downloadAllButtonText: String(project?.downloadAllButtonText || ''),
    downloadSelectedButtonText: String(project?.downloadSelectedButtonText || ''),
    galleryTitle: String(project?.galleryTitle || ''),
    galleryActionBarText: String(project?.galleryActionBarText || ''),
    gallerySelectionText: String(project?.gallerySelectionText || ''),
    buttonText: String(project?.buttonText || ''),
    isVisible: visibility !== 'Draft',
    publishStatus: normalizedPublishStatus,
    visibility,
    accessPassword: password,
    deliveryPin,
    status,
    password,
    kind,
    mediaType,
    displayOn,
    privateFiles: normalizePrivateFiles(project?.privateFiles),
    outlineTags,
  };
}

function normalizeAsset(asset) {
  const type = VALID_ASSET_TYPES.includes(asset?.type) ? asset.type : asset?.type === 'video' ? 'video' : 'image';
  const rawVariants = asset?.variants && typeof asset.variants === 'object' ? asset.variants : {};
  const variants = VALID_VARIANT_KEYS.reduce((acc, key) => {
    const value = String(rawVariants?.[key] || '').trim();
    if (value) acc[key] = value;
    return acc;
  }, {});

  const variantCount = Object.keys(variants).length;
  const resolvedType = type === 'image-comparison' || variantCount > 1 ? 'image-comparison' : type;
  const baseUrl = String(asset?.url || asset?.coverUrl || variants.graded || variants.raw || variants.styled || '');
  const normalizedProjectId = String(asset?.views?.project?.projectId || '').trim() || 'toy_project';
  const normalizedModuleSlot = String(asset?.views?.project?.moduleSlot || asset?.moduleSlot || '').trim();
  const normalizedPublishTarget = ['expertise', 'project', 'both'].includes(asset?.publishTarget)
    ? asset.publishTarget
    : asset?.views?.video?.isActive
      ? 'both'
      : asset?.views?.expertise?.isActive && asset?.views?.project?.isActive
        ? 'both'
        : asset?.views?.project?.isActive
          ? 'project'
          : 'expertise';

  const mediaGroup = inferMediaGroupFromAsset(asset, resolvedType);
  const isExpertiseActive = normalizedPublishTarget === 'expertise' || normalizedPublishTarget === 'both';
  const isProjectActive = normalizedPublishTarget === 'project' || normalizedPublishTarget === 'both';
  const isVideoActive =
    mediaGroup === 'video' || Boolean(asset?.views?.video?.isActive) || (resolvedType === 'video' && (normalizedPublishTarget === 'both' || normalizedPublishTarget === 'video'));

  return {
    id: String(asset?.id || `asset-${Date.now()}-${Math.round(Math.random() * 9999)}`),
    type: resolvedType,
    url: baseUrl,
    mediaGroup,
    variants,
    title: String(asset?.title || 'Untitled Asset'),
    publishTarget: isVideoActive && !isExpertiseActive && !isProjectActive ? 'video' : normalizedPublishTarget,
    moduleSlot: normalizedModuleSlot,
    autoTags: Array.isArray(asset?.autoTags)
      ? asset.autoTags.map((tag) => String(tag || '').trim()).filter(Boolean)
      : String(asset?.autoTags || '')
          .split(/[\r\n,，;]/)
          .map((tag) => tag.trim())
          .filter(Boolean),
    tags: Array.isArray(asset?.tags)
      ? asset.tags.map((tag) => String(tag || '').trim()).filter(Boolean)
      : String(asset?.tags || '')
          .split(/[\r\n,，;]/)
          .map((tag) => tag.trim())
          .filter(Boolean),
    views: {
      expertise: {
        isActive: isExpertiseActive,
        category: ['commercial', 'industrial', 'events'].includes(asset?.views?.expertise?.category)
          ? asset.views.expertise.category
          : 'commercial',
        description: String(asset?.views?.expertise?.description || ''),
      },
      project: {
        isActive: isProjectActive,
        projectId: normalizedProjectId,
        moduleSlot: normalizedModuleSlot,
        description: String(asset?.views?.project?.description || ''),
      },
      video: {
        isActive: isVideoActive,
        category: ['COMMERCIAL', 'ENGINEERING', 'CULTURE'].includes(asset?.views?.video?.category)
          ? asset.views.video.category
          : 'COMMERCIAL',
        description: String(asset?.views?.video?.description || ''),
      },
    },
  };
}

export function normalizeReview(item, index = 0) {
  const type = item?.authorType === 'company' ? 'company' : 'personal';
  const status = ['pending', 'approved', 'rejected'].includes(item?.status) ? item.status : 'approved';

  return {
    id: String(item?.id || `review-${Date.now()}-${index}`),
    projectId: String(item?.projectId || ''),
    projectName: String(item?.projectName || 'Untitled Project'),
    clientName: String(item?.clientName || '匿名用户'),
    companyName: type === 'company' ? String(item?.companyName || '') : '',
    position: type === 'company' ? String(item?.position || '') : '',
    content: String(item?.content || ''),
    coverUrl: String(item?.coverUrl || ''),
    isFeatured: Boolean(item?.isFeatured),
    authorType: type,
    isAnonymous: Boolean(item?.isAnonymous),
    status,
    createdAt: String(item?.createdAt || new Date().toISOString()),
  };
}

function normalizeCaseStudies(caseStudies, defaultCaseStudies) {
  const defaults = defaultCaseStudies && typeof defaultCaseStudies === 'object' ? defaultCaseStudies : { toy: {}, industry: {} };
  return {
    toy: {
      ...defaults.toy,
      ...(caseStudies?.toy || {}),
    },
    industry: {
      ...defaults.industry,
      ...(caseStudies?.industry || {}),
    },
  };
}

function normalizeConfig(input, defaultConfig, defaultCaseStudies) {
  const stored = input && typeof input === 'object' ? input : {};
  const defaults = defaultConfig && typeof defaultConfig === 'object' ? defaultConfig : {};
  const caseStudyDefaults = defaultCaseStudies || defaults.caseStudies || { toy: {}, industry: {} };
  return {
    ...defaults,
    ...stored,
    vignetteIntensity: Number(stored.vignetteIntensity ?? defaults.vignetteIntensity),
    filmGrainOpacity: Number(stored.filmGrainOpacity ?? defaults.filmGrainOpacity),
    spotlightRadius: Number(stored.spotlightRadius ?? defaults.spotlightRadius),
    showHUD: stored.showHUD !== undefined ? Boolean(stored.showHUD) : defaults.showHUD,
    caseStudies: normalizeCaseStudies(stored.caseStudies || defaults.caseStudies, caseStudyDefaults),
  };
}

function normalizeProjectData(input, defaultProjectData) {
  const base = input || {};
  return {
    toy_project: {
      ...defaultProjectData.toy_project,
      ...(base.toy_project || {}),
      modules: {
        ...defaultProjectData.toy_project.modules,
        ...(base.toy_project?.modules || {}),
        target: {
          ...defaultProjectData.toy_project.modules.target,
          ...(base.toy_project?.modules?.target || {}),
        },
        action: {
          ...defaultProjectData.toy_project.modules.action,
          ...(base.toy_project?.modules?.action || {}),
        },
        assets: {
          ...defaultProjectData.toy_project.modules.assets,
          ...(base.toy_project?.modules?.assets || {}),
        },
        review: {
          ...defaultProjectData.toy_project.modules.review,
          ...(base.toy_project?.modules?.review || {}),
        },
        showcase: {
          ...defaultProjectData.toy_project.modules.showcase,
          ...(base.toy_project?.modules?.showcase || {}),
        },
      },
    },
    industry_project: {
      ...defaultProjectData.industry_project,
      ...(base.industry_project || {}),
      modules: {
        ...defaultProjectData.industry_project.modules,
        ...(base.industry_project?.modules || {}),
        target: {
          ...defaultProjectData.industry_project.modules.target,
          ...(base.industry_project?.modules?.target || {}),
        },
        action: {
          ...defaultProjectData.industry_project.modules.action,
          ...(base.industry_project?.modules?.action || {}),
        },
        assets: {
          ...defaultProjectData.industry_project.modules.assets,
          ...(base.industry_project?.modules?.assets || {}),
        },
        review: {
          ...defaultProjectData.industry_project.modules.review,
          ...(base.industry_project?.modules?.review || {}),
        },
        showcase: {
          ...defaultProjectData.industry_project.modules.showcase,
          ...(base.industry_project?.modules?.showcase || {}),
        },
      },
    },
  };
}

export {
  normalizeAsset,
  normalizeConfig,
  normalizeProject,
  normalizeProjectData,
  normalizeCaseStudies,
  inferMediaGroupFromAsset,
};
