
import { Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Rooms from './pages/Rooms'
import ChatRoom from './pages/ChatRoom'

function App() {
  return (

    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/rooms" element={<Rooms />} />
      <Route path="/rooms/:id" element={<ChatRoom />} />
    </Routes>

  )
}

export default App
