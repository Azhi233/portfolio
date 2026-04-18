export function useSettingsActions({ settingsDraft, updateConfig, resetConfig, setSettingsDraft, trackEvent }) {
  const handleApplySettings = () => {
    updateConfig('vignetteIntensity', Number(settingsDraft.vignetteIntensity));
    updateConfig('filmGrainOpacity', Number(settingsDraft.filmGrainOpacity));
    updateConfig('spotlightRadius', Number(settingsDraft.spotlightRadius));
    updateConfig('showHUD', Boolean(settingsDraft.showHUD));

    trackEvent('theme_or_settings_changed', {
      vignetteIntensity: Number(settingsDraft.vignetteIntensity),
      filmGrainOpacity: Number(settingsDraft.filmGrainOpacity),
      spotlightRadius: Number(settingsDraft.spotlightRadius),
      showHUD: Boolean(settingsDraft.showHUD),
    });
  };

  const handleResetSettingsDraft = () => {
    resetConfig();
    setSettingsDraft({
      vignetteIntensity: 0.68,
      filmGrainOpacity: 0.03,
      spotlightRadius: 700,
      showHUD: true,
    });

    trackEvent('theme_or_settings_changed', {
      action: 'reset_defaults',
    });
  };

  return {
    handleApplySettings,
    handleResetSettingsDraft,
  };
}
