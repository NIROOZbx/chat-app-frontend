
import { Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Rooms from './pages/Rooms'
import ChatRoom from './pages/ChatRoom'
import JoinRoom from './pages/JoinRoom'

function App() {
  return (

    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/rooms" element={<Rooms />} />
      <Route path="/rooms/:id" element={<ChatRoom />} />
      <Route path="/join/:inviteCode" element={<JoinRoom />} />
    </Routes>

  )
}

export default App
