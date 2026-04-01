import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import AppLayout from '@/components/layout/AppLayout'
import Login from '@/pages/auth/Login'
import Dashboard from '@/pages/employee/Dashboard'
import DailyReport from '@/pages/employee/DailyReport'
import MyReports from '@/pages/employee/MyReports'
import Complaints from '@/pages/employee/Complaints'
import Profile from '@/pages/employee/Profile'
import Notifications from '@/pages/employee/Notifications'
import MyLeaves from '@/pages/employee/MyLeaves'
import AdminDashboard from '@/pages/admin/AdminDashboard'
import Employees from '@/pages/admin/Employees'
import AllReports from '@/pages/admin/AllReports'
import AllComplaints from '@/pages/admin/AllComplaints'
import Settings from '@/pages/admin/Settings'
import SendNotification from '@/pages/admin/SendNotification'
import Surveys from '@/pages/admin/Surveys'
import Departments from '@/pages/admin/Departments'
import DepartmentDetails from '@/pages/admin/DepartmentDetails'
import AdminLeaves from '@/pages/admin/Leaves'
import DeptHeadDashboard from '@/pages/department-head/Dashboard'

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

  const RequireAdminOrHR = ({ children }: { children: React.ReactNode }) => {
    if (!token) return <Navigate to="/login" />
    if (user?.role !== 'admin' && !user?.is_hr) return <Navigate to="/" />
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
           <Route path="leaves" element={<MyLeaves />} />
           <Route path="complaints" element={<Complaints />} />
           <Route path="notifications" element={<Notifications />} />
           <Route path="profile" element={<Profile />} />
           
           {/* Admin & HR Routes */}
           <Route path="admin" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
           <Route path="admin/departments" element={<RequireAdmin><Departments /></RequireAdmin>} />
           <Route path="admin/departments/:id" element={<RequireAdmin><DepartmentDetails /></RequireAdmin>} />
           <Route path="admin/leaves" element={<RequireAdminOrHR><AdminLeaves /></RequireAdminOrHR>} />
           <Route path="admin/employees" element={<RequireAdminOrHR><Employees /></RequireAdminOrHR>} />
           <Route path="admin/reports" element={<RequireAdmin><AllReports /></RequireAdmin>} />
           <Route path="admin/complaints" element={<RequireAdmin><AllComplaints /></RequireAdmin>} />
           <Route path="admin/surveys" element={<RequireAdmin><Surveys /></RequireAdmin>} />
           <Route path="admin/settings" element={<RequireAdmin><Settings /></RequireAdmin>} />
           <Route path="admin/notifications" element={<RequireAdmin><SendNotification /></RequireAdmin>} />
           
           {/* Department Head Routes */}
           <Route path="department-head" element={<RequireAuth><DeptHeadDashboard /></RequireAuth>} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
