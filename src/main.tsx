import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext.tsx'

// Use /NathanType as basename in production (GitHub Pages subdirectory),
// empty string in dev so localhost:5173/ works normally.
const basename = import.meta.env.BASE_URL.replace(/\/$/, '');

createRoot(document.getElementById('root')!).render(
  <BrowserRouter basename={basename}>
    <AuthProvider>
      <App />
    </AuthProvider>
  </BrowserRouter>
)
