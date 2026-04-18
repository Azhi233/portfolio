import { useEffect, useMemo, useState } from 'react';

const createSiteConfigDraft = (config) => ({
  siteTitle: config.siteTitle || 'DIRECTOR.VISION',
  siteDescription: config.siteDescription || '',
  ogImage: config.ogImage || '',
  logoImageUrl: config.logoImageUrl || '',
  logoAltText: config.logoAltText || '',
  qrCodeImageUrl: config.qrCodeImageUrl || '',
  contactEmail: config.contactEmail || '',
  contactPhone: config.contactPhone || '',
  contactLocation: config.contactLocation || '',
  projectPrivateTitle: config.projectPrivateTitle || 'PRIVATE PROJECT',
  projectPrivateDescription: config.projectPrivateDescription || '该项目为私密访问，请输入密码后查看。',
  projectPrivateEmptyText: config.projectPrivateEmptyText || '暂无私密说明。',
  projectPrivatePasswordPlaceholder: config.projectPrivatePasswordPlaceholder || '请输入项目访问密码',
  projectPrivateUnlockButtonText: config.projectPrivateUnlockButtonText || 'UNSEAL PROJECT',
  projectPrivateErrorText: config.projectPrivateErrorText || '密码错误，请重试。',
  projectDownloadTitle: config.projectDownloadTitle || 'PRIVATE DELIVERY FILES',
  projectDownloadEmptyText: config.projectDownloadEmptyText || '暂无可下载文件。',
  projectDownloadAllButtonText: config.projectDownloadAllButtonText || '一键下载全部',
  projectDownloadSelectedButtonText: config.projectDownloadSelectedButtonText || '打包下载已选 (ZIP)',
  projectGalleryTitle: config.projectGalleryTitle || 'ALBUM',
  projectGalleryEmptyText: config.projectGalleryEmptyText || '暂无画廊内容。',
  projectGalleryActionBarText: config.projectGalleryActionBarText || 'ALBUM ACTION BAR',
  projectGallerySelectionText: config.projectGallerySelectionText || '已选择 X 项',
  projectButtonText: config.projectButtonText || 'BUTTON TEXT',
  privateTitle: config.privateTitle || '',
  privateDescription: config.privateDescription || '',
  privateAccessLabel: config.privateAccessLabel || '',
  privateAccessHint: config.privateAccessHint || '',
  privateAccessButtonText: config.privateAccessButtonText || '',
  privateErrorText: config.privateErrorText || '',
  deliveryTitle: config.deliveryTitle || '',
  deliverySuccessText: config.deliverySuccessText || '',
  deliveryPinPlaceholder: config.deliveryPinPlaceholder || '',
  deliveryErrorText: config.deliveryErrorText || '',
  deliveryButtonText: config.deliveryButtonText || '',
  downloadTitle: config.downloadTitle || '',
  downloadAllButtonText: config.downloadAllButtonText || '',
  downloadSelectedButtonText: config.downloadSelectedButtonText || '',
  galleryTitle: config.galleryTitle || '',
  galleryActionBarText: config.galleryActionBarText || '',
  gallerySelectionText: config.gallerySelectionText || '',
  buttonText: config.buttonText || '',
  resumeAwardsText: config.resumeAwardsText || '',
  resumeExperienceText: config.resumeExperienceText || '',
  resumeGearText: config.resumeGearText || '',
  testimonialsText: config.testimonialsText || '',
  brandNamesText: config.brandNamesText || '',
  servicesText: config.servicesText || '',
  caseToyTarget: config.caseStudies?.toy?.target || '',
  caseToyAction: config.caseStudies?.toy?.action || '',
  caseToyAssets: config.caseStudies?.toy?.assets || '',
  caseToyReview: config.caseStudies?.toy?.review || '',
  caseIndustryTarget: config.caseStudies?.industry?.target || '',
  caseIndustryAction: config.caseStudies?.industry?.action || '',
  caseIndustryAssets: config.caseStudies?.industry?.assets || '',
  caseIndustryReview: config.caseStudies?.industry?.review || '',
});

const isDraftDirty = (siteConfigDraft, config) => (
  String(siteConfigDraft.siteTitle || '') !== String(config.siteTitle || '') ||
  String(siteConfigDraft.siteDescription || '') !== String(config.siteDescription || '') ||
  String(siteConfigDraft.ogImage || '') !== String(config.ogImage || '') ||
  String(siteConfigDraft.logoImageUrl || '') !== String(config.logoImageUrl || '') ||
  String(siteConfigDraft.logoAltText || '') !== String(config.logoAltText || '') ||
  String(siteConfigDraft.qrCodeImageUrl || '') !== String(config.qrCodeImageUrl || '') ||
  String(siteConfigDraft.contactEmail || '') !== String(config.contactEmail || '') ||
  String(siteConfigDraft.projectPrivateTitle || '') !== String(config.projectPrivateTitle || '') ||
  String(siteConfigDraft.projectPrivateDescription || '') !== String(config.projectPrivateDescription || '') ||
  String(siteConfigDraft.projectPrivateEmptyText || '') !== String(config.projectPrivateEmptyText || '') ||
  String(siteConfigDraft.projectPrivatePasswordPlaceholder || '') !== String(config.projectPrivatePasswordPlaceholder || '') ||
  String(siteConfigDraft.projectPrivateUnlockButtonText || '') !== String(config.projectPrivateUnlockButtonText || '') ||
  String(siteConfigDraft.projectPrivateErrorText || '') !== String(config.projectPrivateErrorText || '') ||
  String(siteConfigDraft.projectDownloadTitle || '') !== String(config.projectDownloadTitle || '') ||
  String(siteConfigDraft.projectDownloadEmptyText || '') !== String(config.projectDownloadEmptyText || '') ||
  String(siteConfigDraft.projectDownloadAllButtonText || '') !== String(config.projectDownloadAllButtonText || '') ||
  String(siteConfigDraft.projectDownloadSelectedButtonText || '') !== String(config.projectDownloadSelectedButtonText || '') ||
  String(siteConfigDraft.projectGalleryTitle || '') !== String(config.projectGalleryTitle || '') ||
  String(siteConfigDraft.projectGalleryEmptyText || '') !== String(config.projectGalleryEmptyText || '') ||
  String(siteConfigDraft.projectGalleryActionBarText || '') !== String(config.projectGalleryActionBarText || '') ||
  String(siteConfigDraft.projectGallerySelectionText || '') !== String(config.projectGallerySelectionText || '') ||
  String(siteConfigDraft.projectButtonText || '') !== String(config.projectButtonText || '') ||
  String(siteConfigDraft.privateTitle || '') !== String(config.privateTitle || '') ||
  String(siteConfigDraft.privateDescription || '') !== String(config.privateDescription || '') ||
  String(siteConfigDraft.privateAccessLabel || '') !== String(config.privateAccessLabel || '') ||
  String(siteConfigDraft.privateAccessHint || '') !== String(config.privateAccessHint || '') ||
  String(siteConfigDraft.privateAccessButtonText || '') !== String(config.privateAccessButtonText || '') ||
  String(siteConfigDraft.privateErrorText || '') !== String(config.privateErrorText || '') ||
  String(siteConfigDraft.deliveryTitle || '') !== String(config.deliveryTitle || '') ||
  String(siteConfigDraft.deliverySuccessText || '') !== String(config.deliverySuccessText || '') ||
  String(siteConfigDraft.deliveryPinPlaceholder || '') !== String(config.deliveryPinPlaceholder || '') ||
  String(siteConfigDraft.deliveryErrorText || '') !== String(config.deliveryErrorText || '') ||
  String(siteConfigDraft.deliveryButtonText || '') !== String(config.deliveryButtonText || '') ||
  String(siteConfigDraft.downloadTitle || '') !== String(config.downloadTitle || '') ||
  String(siteConfigDraft.downloadAllButtonText || '') !== String(config.downloadAllButtonText || '') ||
  String(siteConfigDraft.downloadSelectedButtonText || '') !== String(config.downloadSelectedButtonText || '') ||
  String(siteConfigDraft.galleryTitle || '') !== String(config.galleryTitle || '') ||
  String(siteConfigDraft.galleryActionBarText || '') !== String(config.galleryActionBarText || '') ||
  String(siteConfigDraft.gallerySelectionText || '') !== String(config.gallerySelectionText || '') ||
  String(siteConfigDraft.buttonText || '') !== String(config.buttonText || '') ||
  String(siteConfigDraft.contactPhone || '') !== String(config.contactPhone || '') ||
  String(siteConfigDraft.contactLocation || '') !== String(config.contactLocation || '') ||
  String(siteConfigDraft.resumeAwardsText || '') !== String(config.resumeAwardsText || '') ||
  String(siteConfigDraft.resumeExperienceText || '') !== String(config.resumeExperienceText || '') ||
  String(siteConfigDraft.resumeGearText || '') !== String(config.resumeGearText || '') ||
  String(siteConfigDraft.testimonialsText || '') !== String(config.testimonialsText || '') ||
  String(siteConfigDraft.brandNamesText || '') !== String(config.brandNamesText || '') ||
  String(siteConfigDraft.servicesText || '') !== String(config.servicesText || '') ||
  String(siteConfigDraft.caseToyTarget || '') !== String(config.caseStudies?.toy?.target || '') ||
  String(siteConfigDraft.caseToyAction || '') !== String(config.caseStudies?.toy?.action || '') ||
  String(siteConfigDraft.caseToyAssets || '') !== String(config.caseStudies?.toy?.assets || '') ||
  String(siteConfigDraft.caseToyReview || '') !== String(config.caseStudies?.toy?.review || '') ||
  String(siteConfigDraft.caseIndustryTarget || '') !== String(config.caseStudies?.industry?.target || '') ||
  String(siteConfigDraft.caseIndustryAction || '') !== String(config.caseStudies?.industry?.action || '') ||
  String(siteConfigDraft.caseIndustryAssets || '') !== String(config.caseStudies?.industry?.assets || '') ||
  String(siteConfigDraft.caseIndustryReview || '') !== String(config.caseStudies?.industry?.review || '')
);

export function useSiteConfigDraft({ config, activeTab }) {
  const [siteConfigDraft, setSiteConfigDraft] = useState(() => createSiteConfigDraft(config));

  useEffect(() => {
    if (activeTab !== 'siteConfig') return;
    setSiteConfigDraft(createSiteConfigDraft(config));
  }, [activeTab, config]);

  const hasUnsavedSiteConfig = useMemo(() => isDraftDirty(siteConfigDraft, config), [siteConfigDraft, config]);

  return {
    siteConfigDraft,
    setSiteConfigDraft,
    hasUnsavedSiteConfig,
  };
}
