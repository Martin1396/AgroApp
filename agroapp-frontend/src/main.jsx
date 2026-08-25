import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import AppErrorBoundary from './components/AppErrorBoundary.jsx'
import { CompanyProvider } from './context/CompanyContext.jsx'
import './index.css'
import './components/PageBackground.css'
import './responsive.css'
import './screen-fit.css'

createRoot(document.getElementById('root')).render(
  <AppErrorBoundary>
    <CompanyProvider>
      <App />
    </CompanyProvider>
  </AppErrorBoundary>,
)
