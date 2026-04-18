export default function SettingsPanel({
  settingsDraft,
  setSettingsDraft,
  hasUnsavedSettings,
  handleResetSettingsDraft,
  handleApplySettings,
  FieldLabel,
  hudOnClass,
  hudOffClass,
}) {
  return (
    <>
      <section className="mt-6 grid gap-4 rounded-2xl border border-zinc-700/60 bg-zinc-900/60 p-5 md:grid-cols-2">
        <div className="rounded-xl border border-zinc-700/60 bg-zinc-950/55 p-4">
          <FieldLabel title="Vignette Intensity" value={Number(settingsDraft.vignetteIntensity).toFixed(2)} />
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={settingsDraft.vignetteIntensity}
            onChange={(event) =>
              setSettingsDraft((prev) => ({ ...prev, vignetteIntensity: Number(event.target.value) }))
            }
            className="w-full accent-emerald-400"
          />
        </div>
        <div className="rounded-xl border border-zinc-700/60 bg-zinc-950/55 p-4">
          <FieldLabel title="Film Grain Opacity" value={Number(settingsDraft.filmGrainOpacity).toFixed(2)} />
          <input
            type="range"
            min="0"
            max="0.2"
            step="0.005"
            value={settingsDraft.filmGrainOpacity}
            onChange={(event) =>
              setSettingsDraft((prev) => ({ ...prev, filmGrainOpacity: Number(event.target.value) }))
            }
            className="w-full accent-emerald-400"
          />
        </div>
        <div className="rounded-xl border border-zinc-700/60 bg-zinc-950/55 p-4">
          <FieldLabel title="Spotlight Radius" value={`${Number(settingsDraft.spotlightRadius)}px`} />
          <input
            type="range"
            min="200"
            max="1200"
            step="10"
            value={settingsDraft.spotlightRadius}
            onChange={(event) =>
              setSettingsDraft((prev) => ({ ...prev, spotlightRadius: Number(event.target.value) }))
            }
            className="w-full accent-emerald-400"
          />
        </div>

        <div className="rounded-xl border border-zinc-700/60 bg-zinc-950/55 p-4">
          <FieldLabel title="Monitor HUD" value={settingsDraft.showHUD ? 'ON' : 'OFF'} />
          <button
            type="button"
            onClick={() => setSettingsDraft((prev) => ({ ...prev, showHUD: !prev.showHUD }))}
            className={`rounded-md border px-4 py-2 text-sm tracking-[0.08em] transition ${
              settingsDraft.showHUD ? hudOnClass : hudOffClass
            }`}
          >
            {settingsDraft.showHUD ? 'Disable HUD' : 'Enable HUD'}
          </button>
        </div>
      </section>

      <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
        {hasUnsavedSettings ? (
          <p className="rounded-md border border-amber-300/60 bg-amber-300/10 px-3 py-2 text-xs tracking-[0.12em] text-amber-200">
            UNSAVED CHANGES
          </p>
        ) : (
          <p className="rounded-md border border-emerald-300/40 bg-emerald-300/10 px-3 py-2 text-xs tracking-[0.12em] text-emerald-200">
            ALL CHANGES SAVED
          </p>
        )}

        <button
          type="button"
          onClick={handleResetSettingsDraft}
          className="rounded-md border border-zinc-600 bg-zinc-900 px-4 py-2 text-xs tracking-[0.14em] text-zinc-200 transition hover:border-zinc-400 hover:text-zinc-100"
        >
          RESET DEFAULTS
        </button>
        <button
          type="button"
          onClick={handleApplySettings}
          disabled={!hasUnsavedSettings}
          className={`rounded-md border px-4 py-2 text-xs tracking-[0.14em] transition ${
            hasUnsavedSettings
              ? 'border-emerald-300/70 bg-emerald-300/10 text-emerald-200 hover:bg-emerald-300/20'
              : 'cursor-not-allowed border-zinc-700 bg-zinc-900 text-zinc-500'
          }`}
        >
          SAVE TO SERVER
        </button>
      </div>
    </>
  );
}
