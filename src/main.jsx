import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import { ConfigProvider } from './context/ConfigContext.jsx';
import { I18nProvider } from './context/I18nContext.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ConfigProvider>
      <I18nProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </I18nProvider>
    </ConfigProvider>
  </StrictMode>,
);
