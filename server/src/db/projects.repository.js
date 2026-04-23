import { pool } from '../db.js';
import { parseJson, toDateTime, toInt } from './helpers.js';

function normalizeProjectRow(row) {
  const extra = parseJson(row.content_json, {});
  const normalizedVideoUrl = row.main_video_url || row.video_url || '';
  const normalizedKind = String(extra.kind || (normalizedVideoUrl ? 'video' : 'image')).toLowerCase();
  const normalizedMediaType = String(extra.mediaType || extra.media_type || (normalizedVideoUrl ? 'video' : 'image')).toLowerCase();
  const normalizedVisibility = String(extra.visibility || row.visibility || row.publish_status || 'public').toLowerCase();

  return {
    id: row.id,
    title: row.title,
    category: row.category,
    role: row.role || '',
    releaseDate: row.release_date || '',
    kind: normalizedKind,
    mediaType: normalizedMediaType,
    displayOn: Array.isArray(extra.displayOn) ? extra.displayOn : Array.isArray(extra.display_on) ? extra.display_on : [],
    coverUrl: row.cover_url || '',
    coverAssetUrl: row.cover_asset_url || row.cover_url || '',
    coverAssetObjectName: row.cover_asset_object_name || '',
    coverAssetFileType: row.cover_asset_file_type || '',
    coverAssetIsPrivate: Boolean(toInt(row.cover_asset_is_private, 0)),
    thumbnailUrl: row.thumbnail_url || row.cover_url || '',
    videoUrl: normalizedVideoUrl,
    mainVideoUrl: normalizedVideoUrl,
    btsMedia: parseJson(row.bts_media_json, []).map((item) => (typeof item === 'string' ? { url: item, isGroupCover: false } : { ...item, isGroupCover: Boolean(item?.isGroupCover) })),
    clientAgency: row.client_agency || '',
    clientCode: row.client_code || '',
    isFeatured: Boolean(toInt(row.is_featured, 0)),
    sortOrder: toInt(row.sort_order, 0),
    description: row.description || '',
    credits: row.credits || '',
    isVisible: normalizedVisibility !== 'private' && Boolean(toInt(row.is_visible, 1)),
    publishStatus: row.publish_status || 'Draft',
    visibility: normalizedVisibility,
    accessPassword: row.access_password || '',
    deliveryPin: row.delivery_pin || '',
    status: row.status || 'draft',
    password: row.password || '',
    privateFiles: parseJson(row.private_files_json, []),
    outlineTags: parseJson(row.outline_tags_json, []),
    createdAt: row.created_at,
    ...extra,
  };
}

function normalizeProjectPayload(project = {}) {
  const { id, title, category, role, releaseDate, kind, mediaType, displayOn, coverUrl, coverAssetUrl, coverAssetObjectName, coverAssetFileType, coverAssetIsPrivate, thumbnailUrl, videoUrl, mainVideoUrl, btsMedia, clientAgency, clientCode, isFeatured, sortOrder, description, credits, isVisible, publishStatus, visibility, accessPassword, deliveryPin, status, password, privateFiles, outlineTags, createdAt, ...extra } = project || {};
  const normalizedKind = String(kind || extra.kind || (mainVideoUrl || videoUrl ? 'video' : 'image')).toLowerCase();
  const normalizedMediaType = String(mediaType || extra.mediaType || extra.media_type || (mainVideoUrl || videoUrl ? 'video' : 'image')).toLowerCase();
  const normalizedVisibility = String(visibility || extra.visibility || publishStatus || 'public').toLowerCase();
  const normalizedDisplayOn = Array.isArray(displayOn) ? displayOn : String(extra.displayOn || extra.display_on || '').split(',').map((value) => String(value || '').trim()).filter(Boolean);

  return {
    id,
    title,
    category: category || null,
    role: role || null,
    release_date: releaseDate || null,
    cover_url: coverUrl || null,
    cover_asset_url: coverAssetUrl || coverUrl || null,
    cover_asset_object_name: coverAssetObjectName || null,
    cover_asset_file_type: coverAssetFileType || null,
    cover_asset_is_private: coverAssetIsPrivate ? 1 : 0,
    thumbnail_url: thumbnailUrl || coverUrl || null,
    video_url: videoUrl || null,
    main_video_url: mainVideoUrl || videoUrl || null,
    bts_media_json: JSON.stringify(Array.isArray(btsMedia) ? btsMedia.map((item) => (typeof item === 'string' ? { url: item, isGroupCover: false } : { ...item, isGroupCover: Boolean(item?.isGroupCover) })) : []),
    client_agency: clientAgency || null,
    client_code: clientCode || null,
    is_featured: isFeatured ? 1 : 0,
    sort_order: Number.isFinite(Number(sortOrder)) ? Number(sortOrder) : 0,
    description: description || null,
    credits: credits || null,
    is_visible: normalizedVisibility !== 'private' && isVisible === false ? 0 : 1,
    publish_status: publishStatus || 'Draft',
    visibility: normalizedVisibility,
    access_password: accessPassword || null,
    delivery_pin: deliveryPin || null,
    status: status || 'draft',
    password: password || null,
    private_files_json: JSON.stringify(Array.isArray(privateFiles) ? privateFiles : []),
    outline_tags_json: JSON.stringify(Array.isArray(outlineTags) ? outlineTags : []),
    content_json: JSON.stringify({ ...extra, kind: normalizedKind, mediaType: normalizedMediaType, displayOn: normalizedDisplayOn }),
    created_at: toDateTime(createdAt),
  };
}

export async function readProjects() {
  const [rows] = await pool.query('SELECT id, title, category, role, release_date, cover_url, cover_asset_url, cover_asset_object_name, cover_asset_file_type, cover_asset_is_private, thumbnail_url, video_url, main_video_url, bts_media_json, client_agency, client_code, is_featured, sort_order, description, credits, is_visible, publish_status, visibility, access_password, delivery_pin, status, password, private_files_json, outline_tags_json, content_json, created_at FROM projects ORDER BY created_at DESC');
  return rows.map(normalizeProjectRow);
}

export async function findProjectById(id) {
  const [rows] = await pool.execute('SELECT id, title, category, role, release_date, cover_url, cover_asset_url, cover_asset_object_name, cover_asset_file_type, cover_asset_is_private, thumbnail_url, video_url, main_video_url, bts_media_json, client_agency, client_code, is_featured, sort_order, description, credits, is_visible, publish_status, visibility, access_password, delivery_pin, status, password, private_files_json, outline_tags_json, content_json, created_at FROM projects WHERE id = ? LIMIT 1', [id]);
  return rows[0] ? normalizeProjectRow(rows[0]) : null;
}

export async function createProject(project) {
  const values = normalizeProjectPayload(project);
  await pool.execute('INSERT INTO projects (id, title, category, role, release_date, cover_url, cover_asset_url, cover_asset_object_name, cover_asset_file_type, cover_asset_is_private, thumbnail_url, video_url, main_video_url, bts_media_json, client_agency, client_code, is_featured, sort_order, description, credits, is_visible, publish_status, visibility, access_password, delivery_pin, status, password, private_files_json, outline_tags_json, content_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [values.id, values.title, values.category, values.role, values.release_date, values.cover_url, values.cover_asset_url, values.cover_asset_object_name, values.cover_asset_file_type, values.cover_asset_is_private, values.thumbnail_url, values.video_url, values.main_video_url, values.bts_media_json, values.client_agency, values.client_code, values.is_featured, values.sort_order, values.description, values.credits, values.is_visible, values.publish_status, values.visibility, values.access_password, values.delivery_pin, values.status, values.password, values.private_files_json, values.outline_tags_json, values.content_json, values.created_at]);
  return findProjectById(values.id);
}

export async function editProject(id, project) {
  const values = normalizeProjectPayload({ ...project, id });
  await pool.execute('UPDATE projects SET title = ?, category = ?, role = ?, release_date = ?, cover_url = ?, cover_asset_url = ?, cover_asset_object_name = ?, cover_asset_file_type = ?, cover_asset_is_private = ?, thumbnail_url = ?, video_url = ?, main_video_url = ?, bts_media_json = ?, client_agency = ?, client_code = ?, is_featured = ?, sort_order = ?, description = ?, credits = ?, is_visible = ?, publish_status = ?, visibility = ?, access_password = ?, delivery_pin = ?, status = ?, password = ?, private_files_json = ?, outline_tags_json = ?, content_json = ?, created_at = ? WHERE id = ?', [values.title, values.category, values.role, values.release_date, values.cover_url, values.cover_asset_url, values.cover_asset_object_name, values.cover_asset_file_type, values.cover_asset_is_private, values.thumbnail_url, values.video_url, values.main_video_url, values.bts_media_json, values.client_agency, values.client_code, values.is_featured, values.sort_order, values.description, values.credits, values.is_visible, values.publish_status, values.visibility, values.access_password, values.delivery_pin, values.status, values.password, values.private_files_json, values.outline_tags_json, values.content_json, values.created_at, id]);
  return findProjectById(id);
}

export async function removeProjectById(id) {
  const [result] = await pool.execute('DELETE FROM projects WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

export const deleteProjectById = removeProjectById;
