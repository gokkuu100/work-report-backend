import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import AppLayout from '@/components/layout/AppLayout'
import Login from '@/pages/auth/Login'
import Dashboard from '@/pages/employee/Dashboard'
import DailyReport from '@/pages/employee/DailyReport'
import MyReports from '@/pages/employee/MyReports'
import Complaints from '@/pages/employee/Complaints'
import Profile from '@/pages/employee/Profile'
import AdminDashboard from '@/pages/admin/AdminDashboard'
import Employees from '@/pages/admin/Employees'
import AllReports from '@/pages/admin/AllReports'
import AllComplaints from '@/pages/admin/AllComplaints'
import Settings from '@/pages/admin/Settings'

function App() {
  const { token, user } = useAuthStore()
  
  const RequireAuth = ({ children }: { children: React.ReactNode }) => {
    if (!token) return <Navigate to="/login" />
    return <>{children}</>
  }

  const RequireAdmin = ({ children }: { children: React.ReactNode }) => {
    if (!token) return <Navigate to="/login" />
    if (user?.role !== 'admin') return <Navigate to="/" />
    return <>{children}</>
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={token ? <Navigate to="/" /> : <Login />} />
        
        <Route path="/" element={<RequireAuth><AppLayout /></RequireAuth>}>
           <Route index element={user?.role === 'admin' ? <Navigate to="/admin" replace /> : <Dashboard />} />
           <Route path="report/new" element={<DailyReport />} />
           <Route path="reports" element={<MyReports />} />
           <Route path="complaints" element={<Complaints />} />
           <Route path="profile" element={<Profile />} />
           
           {/* Admin Routes */}
           <Route path="admin" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
           <Route path="admin/employees" element={<RequireAdmin><Employees /></RequireAdmin>} />
           <Route path="admin/reports" element={<RequireAdmin><AllReports /></RequireAdmin>} />
           <Route path="admin/complaints" element={<RequireAdmin><AllComplaints /></RequireAdmin>} />
           <Route path="admin/settings" element={<RequireAdmin><Settings /></RequireAdmin>} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
