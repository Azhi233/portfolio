export function applySiteConfigChanges({
  siteConfigDraft,
  updateConfig,
  updateCaseStudy,
  trackEvent,
}) {
  const configKeys = [
    'siteTitle',
    'siteDescription',
    'ogImage',
    'logoImageUrl',
    'logoAltText',
    'qrCodeImageUrl',
    'contactEmail',
    'projectPrivateTitle',
    'projectPrivateDescription',
    'projectPrivateEmptyText',
    'projectPrivatePasswordPlaceholder',
    'projectPrivateUnlockButtonText',
    'projectPrivateErrorText',
    'projectDownloadTitle',
    'projectDownloadEmptyText',
    'projectDownloadAllButtonText',
    'projectDownloadSelectedButtonText',
    'projectGalleryTitle',
    'projectGalleryEmptyText',
    'projectGalleryActionBarText',
    'projectGallerySelectionText',
    'projectButtonText',
    'privateTitle',
    'privateDescription',
    'privateAccessLabel',
    'privateAccessHint',
    'privateAccessButtonText',
    'privateErrorText',
    'deliveryTitle',
    'deliverySuccessText',
    'deliveryPinPlaceholder',
    'deliveryErrorText',
    'deliveryButtonText',
    'downloadTitle',
    'downloadAllButtonText',
    'downloadSelectedButtonText',
    'galleryTitle',
    'galleryActionBarText',
    'gallerySelectionText',
    'buttonText',
    'contactPhone',
    'contactLocation',
    'resumeAwardsText',
    'resumeExperienceText',
    'resumeGearText',
    'testimonialsText',
    'brandNamesText',
    'servicesText',
  ];

  configKeys.forEach((key) => {
    updateConfig(key, String(siteConfigDraft[key] || '').trim());
  });

  updateCaseStudy('toy', 'target', String(siteConfigDraft.caseToyTarget || '').trim());
  updateCaseStudy('toy', 'action', String(siteConfigDraft.caseToyAction || '').trim());
  updateCaseStudy('toy', 'assets', String(siteConfigDraft.caseToyAssets || '').trim());
  updateCaseStudy('toy', 'review', String(siteConfigDraft.caseToyReview || '').trim());

  updateCaseStudy('industry', 'target', String(siteConfigDraft.caseIndustryTarget || '').trim());
  updateCaseStudy('industry', 'action', String(siteConfigDraft.caseIndustryAction || '').trim());
  updateCaseStudy('industry', 'assets', String(siteConfigDraft.caseIndustryAssets || '').trim());
  updateCaseStudy('industry', 'review', String(siteConfigDraft.caseIndustryReview || '').trim());

  trackEvent('site_config_updated', {
    siteTitle: String(siteConfigDraft.siteTitle || '').trim(),
  });
}
