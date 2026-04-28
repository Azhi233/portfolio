ALTER TABLE media_assets
  ADD COLUMN bucket_name VARCHAR(191) NULL AFTER url,
  ADD COLUMN object_name VARCHAR(512) NULL AFTER bucket_name,
  ADD COLUMN root_folder VARCHAR(191) NULL AFTER object_name,
  ADD COLUMN asset_space VARCHAR(191) NULL AFTER root_folder,
  ADD COLUMN category VARCHAR(191) NULL AFTER asset_space,
  ADD COLUMN media_type VARCHAR(64) NULL AFTER kind,
  ADD COLUMN source VARCHAR(32) NOT NULL DEFAULT 'upload' AFTER media_type,
  ADD COLUMN synced_at DATETIME NULL AFTER source;

CREATE UNIQUE INDEX uk_media_assets_object_name ON media_assets (object_name);
