import { Route, Routes } from 'react-router-dom'
import AdminDashboard from './pages/AdminDashboard'
import AdminLayout from './pages/AdminLayout'
import AdminStations from './pages/AdminStations'
import AdminTeams from './pages/AdminTeams'
import Landing from './pages/Landing'
import StationLeader from './pages/StationLeader'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/station" element={<StationLeader />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="teams" element={<AdminTeams />} />
        <Route path="stations" element={<AdminStations />} />
      </Route>
    </Routes>
  )
}

export default App
