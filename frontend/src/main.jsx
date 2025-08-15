import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom' 
import { AppContextProvider } from './contexts/AppContext.jsx'
import 'react-quill/dist/quill.snow.css';

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
<AppContextProvider>
      <App />
</AppContextProvider>
  </BrowserRouter>,
)
