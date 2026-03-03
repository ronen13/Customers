import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login.jsx'
import Admin from './pages/Admin.jsx'
import ClientPortal from './pages/ClientPortal.jsx'
function Guard({ children }) {
  return localStorage.getItem("tk") ? children : <Navigate to="/login" replace />
}
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/admin/*" element={<Guard><Admin /></Guard>} />
      <Route path="/client/:token" element={<ClientPortal />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
