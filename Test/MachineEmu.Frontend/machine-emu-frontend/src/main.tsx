import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ConfirmDialogProvider } from './components'
import { I18nProvider } from './i18n'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <ConfirmDialogProvider>
        <App />
      </ConfirmDialogProvider>
    </I18nProvider>
  </StrictMode>,
)

