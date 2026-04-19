import { createContext, useContext, useMemo } from 'react';
import { createConfigStore } from './configStore.js';

const ConfigContext = createContext(null);

function fetchJson() {
  throw new Error('fetchJson should be provided by the app entrypoint');
}

function persistConfigSnapshot() {
  throw new Error('persistConfigSnapshot should be provided by the app entrypoint');
}

export function ConfigProvider({ children }) {
  const store = useMemo(
    () =>
      createConfigStore({
        fetchJson,
        persistConfigSnapshot,
        createId: (prefix) => `${prefix}-${Date.now()}`,
        writePendingConfigPatch: () => {},
      }),
    [],
  );

  return <ConfigContext.Provider value={store}>{children}</ConfigContext.Provider>;
}

export function useConfig() {
  const context = useContext(ConfigContext);
  if (!context) throw new Error('useConfig must be used within a ConfigProvider');
  return context;
}
