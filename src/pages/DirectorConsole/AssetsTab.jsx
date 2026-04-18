import AssetPanel from './AssetPanel.jsx';
import BulkAssetPreview from './BulkAssetPreview.jsx';
import AssetCreateForm from './AssetCreateForm.jsx';
import AssetList from './AssetList.jsx';

export default function AssetsTab({
  assets,
  assetFilterMode,
  onAssetFilterModeChange,
  bulkAssetInput,
  onBulkAssetInputChange,
  bulkAssetError,
  onBulkAssetParse,
  onBulkAssetCreate,
  bulkAssetPreview,
  bulkAssetSelectedKeys,
  onBulkAssetSelectedKeysChange,
  bulkAssetGroupBy,
  onBulkAssetGroupByChange,
  bulkAssetCollapsedGroups,
  onBulkAssetCollapsedGroupsChange,
  bulkAssetForm,
  onBulkAssetFormChange,
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
    <section className="mt-6 rounded-2xl border border-zinc-700/60 bg-zinc-900/60 p-5">
      <AssetPanel
        assets={assets}
        assetFilterMode={assetFilterMode}
        onAssetFilterModeChange={onAssetFilterModeChange}
        bulkAssetInput={bulkAssetInput}
        onBulkAssetInputChange={onBulkAssetInputChange}
        bulkAssetError={bulkAssetError}
        onBulkAssetParse={onBulkAssetParse}
        onBulkAssetCreate={onBulkAssetCreate}
        bulkAssetPreviewCount={bulkAssetPreview.length}
        bulkAssetSelectedCount={bulkAssetSelectedKeys.length}
      />

      <BulkAssetPreview
        bulkAssetPreview={bulkAssetPreview}
        bulkAssetSelectedKeys={bulkAssetSelectedKeys}
        onBulkAssetSelectedKeysChange={onBulkAssetSelectedKeysChange}
        bulkAssetGroupBy={bulkAssetGroupBy}
        onBulkAssetGroupByChange={onBulkAssetGroupByChange}
        bulkAssetCollapsedGroups={bulkAssetCollapsedGroups}
        onBulkAssetCollapsedGroupsChange={onBulkAssetCollapsedGroupsChange}
        bulkAssetForm={bulkAssetForm}
        onBulkAssetFormChange={onBulkAssetFormChange}
      />

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
    </section>
  );
}
