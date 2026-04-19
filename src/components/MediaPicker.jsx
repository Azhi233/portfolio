import Input from './Input.jsx';
import Button from './Button.jsx';

export default function MediaPicker({ label, accept, onPick, value, uploading = false, helperText = '' }) {
  return (
    <label className="block">
      <p className="mb-2 text-xs tracking-[0.12em] text-zinc-400">{label}</p>
      <div className="flex flex-col gap-2">
        <Input type="file" accept={accept} onChange={(event) => onPick(event.target.files?.[0])} />
        {value ? <p className="break-all text-xs text-zinc-500">{value}</p> : null}
        {helperText ? <p className="text-xs text-zinc-500">{helperText}</p> : null}
        {uploading ? <p className="text-xs text-zinc-400">Uploading...</p> : null}
      </div>
    </label>
  );
}
