import { useEffect, useMemo, useState } from 'react';
import { fetchJson } from '../../utils/api.js';
import Button from '../../components/Button.jsx';
import Input from '../../components/Input.jsx';
import MediaPicker from '../../components/MediaPicker.jsx';
import Modal from '../../components/Modal.jsx';
import ConsolePanelShell from './ConsolePanelShell.jsx';
import { uploadHomepageVideo } from '../../utils/homepageVideoUpload.js';

const createDraft = () => ({
  homeVideoTitle: '',
  homeVideoUrl: '',
});

const steps = [
  { id: 'select', label: '选择文件' },
  { id: 'transcode', label: '转码处理' },
  { id: 'upload', label: '上传文件' },
  { id: 'writeback', label: '写回配置' },
  { id: 'finish', label: '完成' },
];

function getStepState(currentStage, stage, hasError) {
  const order = ['idle', 'preparing', 'transcoding', 'uploading-source', 'uploading', 'writing-back', 'done', 'error'];
  const currentIndex = order.indexOf(String(currentStage || 'idle'));
  const stageIndex = { select: 1, transcode: 2, upload: 4, writeback: 5, finish: 6 }[stage] ?? 0;
  if (hasError) {
    if (stage === 'finish') return 'pending';
    if (stageIndex < currentIndex) return 'done';
    if (stageIndex === currentIndex) return 'error';
    return 'pending';
  }
  if (currentStage === 'done') return 'done';
  if (stageIndex < currentIndex) return 'done';
  if (stageIndex === currentIndex) return 'active';
  return 'pending';
}

function StepDot({ state }) {
  const styles = {
    done: 'border-emerald-300 bg-emerald-300',
    active: 'border-cyan-300 bg-cyan-300 animate-pulse',
    error: 'border-rose-300 bg-rose-500',
    pending: 'border-white/20 bg-transparent',
  }[state] || 'border-white/20 bg-transparent';
  return <span className={`inline-flex h-3.5 w-3.5 rounded-full border ${styles}`} />;
}

export default function HomepageVideoPanel() {
  const [state, setState] = useState({ loading: true, saving: false, uploading: false, error: '', draft: createDraft(), isOpen: false, uploadStage: 'idle', uploadProgress: 0, uploadStatus: '', uploadFailureStage: '' });

  const load = async () => {
    setState((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      const config = await fetchJson('/config');
      setState((prev) => ({ ...prev, loading: false, error: '', draft: { homeVideoTitle: config?.homeVideoTitle || '', homeVideoUrl: config?.homeVideoUrl || '' } }));
    } catch (error) {
      setState((prev) => ({ ...prev, loading: false, error: error.message || 'Failed to load homepage video.' }));
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateDraft = (key, value) => setState((prev) => ({ ...prev, draft: { ...(prev.draft || {}), [key]: value } }));
  const hasError = Boolean(state.error) || state.uploadStage === 'error';
  const stageLabel = useMemo(() => {
    if (state.uploadStage === 'preparing') return '准备中';
    if (state.uploadStage === 'transcoding') return '转码中';
    if (state.uploadStage === 'uploading-source' || state.uploadStage === 'uploading') return '上传中';
    if (state.uploadStage === 'writing-back') return '写回配置';
    if (state.uploadStage === 'done') return '已完成';
    if (state.uploadStage === 'error') return '失败';
    return '等待操作';
  }, [state.uploadStage]);

  const resetUploadState = () => setState((prev) => ({ ...prev, uploadStage: 'idle', uploadProgress: 0, uploadStatus: '', uploadFailureStage: '' }));

  const uploadHomeVideo = async (file) => {
    if (!file) return;
    setState((prev) => ({ ...prev, uploading: true, error: '', isOpen: true, uploadStage: 'preparing', uploadProgress: 0, uploadStatus: `Preparing ${file.name}...` }));
    try {
      const { result, file: uploadFileObject } = await uploadHomepageVideo(file, {
        onProgress: ({ stage, progress, fileName }) => setState((prev) => ({
          ...prev,
          uploadStage: stage,
          uploadProgress: progress,
          uploadStatus: stage === 'transcoding' ? `Transcoding ${fileName || file.name}...` : stage === 'uploading-source' ? `Uploading source video ${fileName || file.name}...` : `Uploading ${fileName || file.name}...`,
        })),
        onStage: ({ stage, status, message, fileName }) => setState((prev) => ({
          ...prev,
          uploadStage: stage,
          uploadStatus: stage === 'transcoding' ? `Transcoding ${fileName || file.name} to MP4...` : stage === 'preparing' ? `Preparing ${fileName || file.name}...` : stage === 'writing-back' ? 'Writing uploaded video back to homepage config...' : status === 'completed' ? 'Transcoding complete.' : message || prev.uploadStatus,
        })),
      });
      setState((prev) => ({
        ...prev,
        uploading: false,
        uploadStage: 'done',
        uploadProgress: 100,
        uploadStatus: 'Homepage video ready.',
        draft: { ...(prev.draft || {}), homeVideoUrl: result?.url || uploadFileObject?.url || result?.targetUrl || '', homeVideoTitle: file.name || 'Homepage video' },
      }));
    } catch (error) {
      const message = error?.message || 'Failed to upload homepage video.';
      const authHint = /401|unauthorized/i.test(message) ? ' Please unlock the console again.' : '';
      setState((prev) => ({ ...prev, uploading: false, uploadStage: 'error', uploadFailureStage: /401|unauthorized/i.test(message) ? 'auth' : 'transcoding', uploadProgress: 0, uploadStatus: `Upload failed: ${message}${authHint}`, error: message }));
    }
  };

  const save = async () => {
    setState((prev) => ({ ...prev, saving: true, error: '', isOpen: true }));
    try {
      await fetchJson('/config/homepage-video', { method: 'POST', body: JSON.stringify({ homeVideoTitle: state.draft?.homeVideoTitle || '', homeVideoUrl: state.draft?.homeVideoUrl || '' }) });
      await load();
      setState((prev) => ({ ...prev, saving: false, uploadStage: 'done', uploadStatus: 'Homepage video saved.' }));
    } catch (error) {
      const message = error?.message || 'Failed to save homepage video.';
      const authHint = /401|unauthorized/i.test(message) ? ' Please unlock the console again.' : '';
      setState((prev) => ({ ...prev, saving: false, error: message + authHint, uploadStage: /401|unauthorized/i.test(message) ? 'error' : prev.uploadStage, uploadFailureStage: /401|unauthorized/i.test(message) ? 'auth' : prev.uploadFailureStage, uploadStatus: `Save failed: ${message}${authHint}` }));
    }
  };

  const clear = () => {
    setState((prev) => ({ ...prev, draft: createDraft(), uploadStage: 'idle', uploadProgress: 0, uploadStatus: '', uploadFailureStage: '', isOpen: true }));
  };

  return (
    <>
      <ConsolePanelShell
        eyebrow="HOMEPAGE"
        title="Homepage Video"
        description="单独管理首页欢迎语下方的循环视频。"
        badge={{ label: 'HOME HERO', tone: 'warning' }}
        footer={(
          <div className="flex gap-3">
            <Button type="button" variant="subtle" onClick={load}>REFRESH</Button>
            <Button type="button" variant="primary" onClick={clear}>UPLOAD HERO VIDEO</Button>
          </div>
        )}
      >
        {state.loading ? <p className="text-sm text-white/75">Loading homepage video...</p> : null}
        {state.error ? <p className="text-sm text-rose-300">{state.error}</p> : null}
        <div className="space-y-3">
          <p className="text-xs tracking-[0.16em] text-white/60">{state.draft?.homeVideoTitle || 'No homepage video selected yet.'}</p>
          <p className="text-sm text-white/75">{state.draft?.homeVideoUrl || 'Upload a looping hero video for the homepage.'}</p>
        </div>
      </ConsolePanelShell>

      <Modal open={state.isOpen} title="Homepage Video" onClose={() => setState((prev) => ({ ...prev, isOpen: false }))}>
        <div className="grid gap-5">
          <MediaPicker label="Upload Homepage Video" accept="video/*" onPick={uploadHomeVideo} value={state.draft?.homeVideoUrl} uploading={state.uploading} helperText="Upload the homepage hero video here." />

          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs tracking-[0.16em] text-white/70">流程状态</p>
              <p className="text-xs tracking-[0.16em] text-white/60">{stageLabel}</p>
            </div>
            <div className="mt-4 grid gap-3">
              {steps.map((step) => {
                const stepState = getStepState(state.uploadStage, step.id, hasError);
                return (
                  <div key={step.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 px-3 py-2">
                    <div className="flex items-center gap-3">
                      <StepDot state={stepState} />
                      <div>
                        <p className="text-sm tracking-[0.08em] text-white">{step.label}</p>
                        <p className="mt-1 text-xs text-white/60">{step.id === 'select' ? '选择本地视频文件。' : step.id === 'transcode' ? '转码成可播放的 MP4。' : step.id === 'upload' ? '上传到存储。' : step.id === 'writeback' ? '写回首页配置。' : '流程结束。'}</p>
                      </div>
                    </div>
                    <p className="text-xs tracking-[0.12em] text-white/60">{stepState.toUpperCase()}</p>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/75">{state.uploadStatus || '等待上传...'}</div>
          </div>

          <label className="block">
            <p className="mb-2 text-xs tracking-[0.12em] text-white/80">Homepage Video Title</p>
            <Input value={state.draft?.homeVideoTitle || ''} onChange={(event) => updateDraft('homeVideoTitle', event.target.value)} />
          </label>
          <label className="block">
            <p className="mb-2 text-xs tracking-[0.12em] text-white/80">Homepage Video URL</p>
            <Input value={state.draft?.homeVideoUrl || ''} onChange={(event) => updateDraft('homeVideoUrl', event.target.value)} />
          </label>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <Button type="button" variant="subtle" onClick={() => { resetUploadState(); setState((prev) => ({ ...prev, isOpen: false })); }}>CANCEL</Button>
          <Button type="button" variant="subtle" onClick={() => { clear(); }}>CLEAR</Button>
          <Button type="button" variant="primary" onClick={save}>{state.saving ? 'SAVING...' : 'SAVE'}</Button>
        </div>
      </Modal>
    </>
  );
}
