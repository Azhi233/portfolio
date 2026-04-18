export default function DirectorConsoleAuthGate({ passwordInput, setPasswordInput, authError, setAuthError, onSubmit }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center px-4">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-2xl backdrop-blur">
        <h1 className="mb-2 text-2xl font-semibold">Director Console</h1>
        <p className="mb-6 text-sm text-zinc-400">Enter the console password to continue.</p>
        <label className="mb-2 block text-sm text-zinc-300">Password</label>
        <input
          type="password"
          value={passwordInput}
          onChange={(event) => {
            setPasswordInput(event.target.value);
            if (authError) setAuthError('');
          }}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-zinc-500"
        />
        {authError ? <p className="mt-3 text-sm text-red-400">{authError}</p> : null}
        <button type="submit" className="mt-5 w-full rounded-lg bg-white px-4 py-2 font-medium text-zinc-950 hover:bg-zinc-200">
          Unlock
        </button>
      </form>
    </div>
  );
}
