import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext'
import { RoomProvider } from './context/RoomContext'
import { BrowserRouter } from 'react-router-dom'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
    <AuthProvider>
      <RoomProvider>
        <App />
      </RoomProvider>
    </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
