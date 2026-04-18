import AssetCreateForm from './AssetCreateForm.jsx';
import AssetList from './AssetList.jsx';

export default function DistributionPanel({
  assetForm,
  assetFormError,
  assetUrlWarning,
  editingAssetId,
  formInputClass,
  formTextareaClass,
  moduleSlotOptions,
  getPublishTargetHint,
  inferMediaGroup,
  getAssetUrlWarning,
  onAssetFormChange,
  onAssetFormErrorChange,
  onAssetUrlWarningChange,
  onResetAssetForm,
  onSubmitAssetForm,
  filteredAssetsForPanel,
  getAssetDistributionSummary,
  onEditAsset,
  onDeleteAsset,
}) {
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm tracking-[0.16em] text-zinc-100">DUAL VIEW DISTRIBUTION</h2>
          <p className="mt-1 text-[11px] tracking-[0.12em] text-zinc-500">在作品管理页配置作品投放到专业技能页/商业项目页的归属</p>
        </div>
      </div>

      <AssetCreateForm
        assetForm={assetForm}
        assetFormError={assetFormError}
        assetUrlWarning={assetUrlWarning}
        editingAssetId={editingAssetId}
        formInputClass={formInputClass}
        formTextareaClass={formTextareaClass}
        moduleSlotOptions={moduleSlotOptions}
        getPublishTargetHint={getPublishTargetHint}
        inferMediaGroup={inferMediaGroup}
        getAssetUrlWarning={getAssetUrlWarning}
        onAssetFormChange={onAssetFormChange}
        onAssetFormErrorChange={onAssetFormErrorChange}
        onAssetUrlWarningChange={onAssetUrlWarningChange}
        onReset={onResetAssetForm}
        onSubmit={onSubmitAssetForm}
      />

      <AssetList
        filteredAssetsForPanel={filteredAssetsForPanel}
        getAssetDistributionSummary={getAssetDistributionSummary}
        getAssetUrlWarning={getAssetUrlWarning}
        onEditAsset={onEditAsset}
        onDeleteAsset={onDeleteAsset}
      />
    </div>
  );
}
