import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { CompanyProvider } from './context/CompanyContext.jsx'
import './index.css'
import './components/PageBackground.css'
import './responsive.css'
import './screen-fit.css'

createRoot(document.getElementById('root')).render(
  <CompanyProvider>
    <App />
  </CompanyProvider>,
)
