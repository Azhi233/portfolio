import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchJson, storeAccessToken } from '../utils/api.js';
import { useI18n } from '../context/I18nContext.jsx';
import Button from '../components/Button.jsx';
import Input from '../components/Input.jsx';
import MinimalTopNav from '../components/MinimalTopNav.jsx';

const ACCESS_PASSWORD_KEY = 'client-access-password';

function normalizePassword(value) {
  return String(value || '').trim();
}

function readStoredPassword() {
  try {
    return window.sessionStorage.getItem(ACCESS_PASSWORD_KEY) || '';
  } catch {
    return '';
  }
}

function storePassword(password) {
  try {
    window.sessionStorage.setItem(ACCESS_PASSWORD_KEY, password);
  } catch {
    // ignore storage errors
  }
}

function AccessIcon() {
  return (
    <div className="flex h-[42px] w-[42px] items-center justify-center rounded-full border border-[#d9d4cc] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <div className="relative flex h-5 w-5 items-end justify-center">
        <span className="absolute top-0 h-2.5 w-2.5 rounded-[3px] border-[1.5px] border-[#b3ada5] border-b-0 bg-transparent" />
        <span className="absolute top-[5px] h-[11px] w-[11px] rounded-[3px] bg-[#c9c2b8] shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]" />
        <span className="absolute top-[10px] h-1 w-[3px] rounded-full bg-[#a59f97]" />
      </div>
    </div>
  );
}

function ClientAccessPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [password, setPassword] = useState(readStoredPassword());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hint, setHint] = useState('');

  const canUseStored = useMemo(() => Boolean(readStoredPassword()), []);

  const unlock = async (nextPassword = password) => {
    const normalizedPassword = normalizePassword(nextPassword);
    if (!normalizedPassword) {
      setError(t('clientAccess.passwordRequired', 'Please enter a password.'));
      setHint('');
      return;
    }

    setLoading(true);
    setError('');
    setHint('');

    try {
      const response = await fetchJson('/client-access/unlock', {
        method: 'POST',
        data: { password: normalizedPassword },
      });

      const matchedProject = response?.project || null;
      const token = response?.token || '';

      if (!matchedProject || !token) {
        setHint(t('clientAccess.noMatchHint', 'Sorry, this password didn’t open anything. Please check it and try again.'));
        return;
      }

      storePassword(normalizedPassword);
      storeAccessToken(token);
      setPassword(normalizedPassword);
      navigate(`/projects/${matchedProject.id}`, {
        state: {
          clientAccessToken: token,
          clientAccessPassword: normalizedPassword,
        },
      });
    } catch (err) {
      setError(err.message || t('clientAccess.failed', 'Failed to unlock private work.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f7f6f1] text-[#161616]">
      <MinimalTopNav />

      <section className="flex min-h-screen items-center justify-center px-6 pt-10 md:pt-0">
        <div className="flex w-full max-w-[210px] flex-col items-center gap-3">
          <AccessIcon />

          <form
            onSubmit={(event) => {
              event.preventDefault();
              unlock(password);
            }}
            className="w-full"
          >
            <div className="flex h-[40px] items-center border border-[#e6e0d8] bg-white px-3 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
              <Input
                type="password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError('');
                  setHint('');
                }}
                placeholder={t('clientAccess.placeholders.password', 'Password')}
                className="h-full flex-1 border-0 bg-transparent px-0 text-[11px] tracking-[0.01em] text-[#161616] shadow-none placeholder:text-[#d0cac0] focus:ring-0"
              />
              <Button
                type="submit"
                variant="subtle"
                className="ml-1.5 h-auto border-0 bg-transparent p-0 text-[24px] leading-none text-[#ded8cf] hover:bg-transparent hover:text-[#cdc6bb]"
              >
                →
              </Button>
            </div>
          </form>

          <div className="min-h-[26px] text-center">
            {error ? <p className="text-[10px] leading-5 text-rose-600">{error}</p> : null}
            {!error && hint ? <p className="text-[10px] leading-5 text-[#161616]/50">{hint}</p> : null}
            {!error && !hint && canUseStored ? (
              <button
                type="button"
                onClick={() => unlock(readStoredPassword())}
                className="mt-1 text-[11px] uppercase tracking-[0.12em] text-[#161616]/28 transition hover:text-[#161616]/45"
              >
                {t('clientAccess.useStored', 'Use last password')}
              </button>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}

export default ClientAccessPage;
