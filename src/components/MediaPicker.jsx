import Input from './Input.jsx';
import Button from './Button.jsx';

const uploadNodes = [
  { id: 'select', label: '选择文件', stage: 'preparing' },
  { id: 'transcode', label: '转码处理', stage: 'transcoding' },
  { id: 'source', label: '上传源文件', stage: 'uploading-source' },
  { id: 'upload', label: '上传存储', stage: 'uploading' },
  { id: 'writeback', label: '写回项目', stage: 'writing-back' },
  { id: 'finish', label: '完成写入', stage: 'done' },
];

function getNodeState(nodeStage, currentStage, hasError, failedStage = '') {
  const order = ['idle', 'preparing', 'transcoding', 'uploading-source', 'uploading', 'writing-back', 'done'];
  const currentIndex = order.indexOf(currentStage);
  const nodeIndex = order.indexOf(nodeStage);
  const failedIndex = order.indexOf(failedStage);

  if (hasError) {
    if (failedStage && failedIndex >= 0) {
      if (nodeIndex < failedIndex) return 'done';
      if (nodeStage === failedStage) return 'error';
      return 'pending';
    }
    if (nodeIndex < currentIndex) return 'done';
    if (nodeIndex === currentIndex) return 'error';
    return 'pending';
  }

  if (currentStage === 'idle') return 'pending';
  if (nodeIndex < currentIndex) return 'done';
  if (nodeIndex === currentIndex) return 'active';
  return 'pending';
}

function NodeDot({ state }) {
  const styles = {
    done: 'border-cyan-300 bg-cyan-300 shadow-[0_0_0_4px_rgba(103,232,249,0.12)]',
    active: 'border-white bg-white shadow-[0_0_0_4px_rgba(255,255,255,0.12)] animate-pulse',
    error: 'border-rose-300 bg-rose-500 shadow-[0_0_0_4px_rgba(251,113,133,0.12)]',
    pending: 'border-white/20 bg-transparent',
  }[state] || 'border-white/20 bg-transparent';

  return <span className={`inline-flex h-3.5 w-3.5 rounded-full border ${styles}`} />;
}

export default function MediaPicker({ label, accept, onPick, value, uploading = false, progress = 0, stage = 'idle', statusText = '', helperText = '', failedStage = '' }) {
  const width = Number.isFinite(progress) ? Math.max(0, Math.min(100, progress)) : 0;
  const stageLabel = {
    preparing: '准备中',
    transcoding: '转码中',
    'uploading-source': '上传源文件',
    uploading: '上传中',
    done: '已完成',
    error: '失败',
  }[stage] || '处理中';
  const hasError = stage === 'error' || /failed|error|失败/i.test(String(statusText));
  const finishedOk = stage === 'done' && !hasError;
  const isDone = stage === 'done';

  return (
    <label className="block">
      <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">{label}</p>
      <div className="flex flex-col gap-2">
        <Input type="file" accept={accept} onChange={(event) => onPick(event.target.files?.[0])} />
        {value ? <p className="break-all text-xs text-zinc-500">{value}</p> : null}
        {helperText ? <p className="text-xs text-zinc-500">{helperText}</p> : null}
        {uploading || stage !== 'idle' ? (
          <div className={`space-y-3 rounded-xl border p-3 ${hasError ? 'border-rose-300/40 bg-rose-500/10' : finishedOk ? 'border-emerald-300/40 bg-emerald-500/10' : 'border-white/10 bg-black/20'}`}>
            <div className="flex items-center justify-between gap-3 text-[11px] tracking-[0.12em] text-zinc-400">
              <span>{stageLabel}</span>
              <span>{width}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full transition-all duration-300 ${hasError ? 'bg-rose-400' : isDone ? 'bg-emerald-400' : 'bg-gradient-to-r from-white via-cyan-200 to-cyan-400'}`}
                style={{ width: `${width}%` }}
              />
            </div>
            <div className="grid gap-2 text-xs text-zinc-300">
              <div className="flex flex-wrap gap-2">
                {uploadNodes.map((node) => {
                  const nodeState = getNodeState(node.stage, stage, hasError, failedStage);
                  const nodeClasses = {
                    done: 'border-emerald-300/50 bg-emerald-300/10 text-emerald-100',
                    active: 'border-cyan-300/60 bg-cyan-300/10 text-cyan-100 shadow-[0_0_0_1px_rgba(103,232,249,0.12)]',
                    error: 'border-rose-300/60 bg-rose-500/15 text-rose-100',
                    pending: 'border-white/10 bg-black/20 text-zinc-400',
                  }[nodeState];

                  return (
                    <div key={node.id} className={`flex items-center gap-2 rounded-full border px-3 py-1 ${nodeClasses}`}>
                      <NodeDot state={nodeState} />
                      <span>{node.label}</span>
                    </div>
                  );
                })}
              </div>
              {hasError ? <p className="text-rose-200">{statusText || 'Upload failed.'}</p> : null}
              {finishedOk ? <p className="text-emerald-100">{statusText || 'Upload completed successfully.'}</p> : null}
              {!hasError && !finishedOk && statusText ? <p className="text-zinc-300">{statusText}</p> : null}
            </div>
          </div>
        ) : null}
      </div>
    </label>
  );
}
