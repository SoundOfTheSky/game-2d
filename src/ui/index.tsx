import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './components/app.component'

createRoot(document.querySelector('#ui')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
