import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { SocketProvider } from './hooks/SocketContext'
import { AppProvider } from './hooks/AppContext'
import HomePage from './pages/HomePage'
import CreateRoomPage from './pages/CreateRoomPage'
import JoinRoomPage from './pages/JoinRoomPage'
import LobbyPage from './pages/LobbyPage'
import GamePage from './pages/GamePage'

function App() {
  return (
    <AppProvider>
      <SocketProvider>
        <Router>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/create" element={<CreateRoomPage />} />
            <Route path="/join" element={<JoinRoomPage />} />
            <Route path="/lobby/:roomCode" element={<LobbyPage />} />
            <Route path="/game/:roomCode" element={<GamePage />} />
          </Routes>
        </Router>
      </SocketProvider>
    </AppProvider>
  )
}

export default App
