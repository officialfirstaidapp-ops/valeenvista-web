import React from "react";
import Properties from "./pages/Properties/Properties";
import PropertyDetails from "./pages/Properties/PropertyDetails";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import { ThemeProvider } from "./context/ThemeContext";
import { NotificationProvider } from "./context/NotificationContext";
import ProtectedRoute from "./context/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminDashboard from "./pages/AdminDashboard/AdminDashboard";
import BrokerDashboard from "./pages/BrokerDashboard/BrokerDashboard";
import AgentsDashboard from "./pages/AgentsDashboard/AgentsDashboard";
import ClientDashboard from "./pages/ClientDashboard/ClientDashboard";
import Profile from "./pages/Profile/Profile";
import ChatPage from "./pages/Chat/ChatPage";
import VideoCall from './pages/VideoCall/VideoCall';
import GoogleAuthSuccess from './pages/auth/GoogleAuthSuccess';

// Broker Pages
import BrokerProperties from "./pages/BrokerDashboard/BrokerProperties";
import BrokerAgents from "./pages/BrokerDashboard/BrokerAgents";
import BrokerReservations from "./pages/BrokerDashboard/BrokerReservations";
import BrokerReports from "./pages/BrokerDashboard/BrokerReports";
import BrokerCommissions from "./pages/BrokerDashboard/BrokerCommissions";
import BrokerSettings from "./pages/BrokerDashboard/BrokerSettings";
import BrokerHelp from "./pages/BrokerDashboard/BrokerHelp";

// Agent Pages
import AgentProperties from "./pages/AgentsDashboard/AgentProperties";
import AgentReservations from "./pages/AgentsDashboard/AgentReservations";
import AgentCommissions from "./pages/AgentsDashboard/AgentCommissions";
import AgentSettings from "./pages/AgentsDashboard/AgentSettings";
import AgentHelp from "./pages/AgentsDashboard/AgentHelp";

// Admin Pages
import UserManagement from "./pages/AdminDashboard/UserManagement";
import PropertyManagement from "./pages/AdminDashboard/PropertyManagement";
import AdminReservations from "./pages/AdminDashboard/AdminReservations";
import AdminCommissions from "./pages/AdminDashboard/AdminCommissions";
import AdminReports from "./pages/AdminDashboard/AdminReports";
import AdminAnalytics from "./pages/AdminDashboard/AdminAnalytics";
import AdminSettings from "./pages/AdminDashboard/AdminSettings";

// Client Pages
import ClientSettings from "./pages/ClientDashboard/ClientSettings";
import ClientSupport from "./pages/ClientDashboard/ClientSupport";

// Add Property Page
import AddProperty from "./pages/AddProperty";

// ✅ Settings Router Component - Picks correct Settings based on role
const SettingsRouter = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (user.role === 'admin') return <AdminSettings />;
  if (user.role === 'broker') return <BrokerSettings />;
  if (user.role === 'agent') return <AgentSettings />;
  if (user.role === 'client') return <ClientSettings />;
  
  return <div>Unauthorized</div>;
};

// ✅ Help Router Component (admin removed)
const HelpRouter = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (user.role === 'broker') return <BrokerHelp />;
  if (user.role === 'agent') return <AgentHelp />;
  if (user.role === 'client') return <ClientSupport />;
  
  return <div>Unauthorized</div>;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <SocketProvider>
            <NotificationProvider>
              <Routes>
                {/* PUBLIC ROUTES */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/properties" element={<Properties />} />
                <Route path="/property/:id" element={<PropertyDetails />} />
                <Route path="/auth/google/success" element={<GoogleAuthSuccess />} />

                {/* CHAT ROUTE - All roles */}
                <Route path="/chat" element={<ProtectedRoute allowedRoles={['admin', 'broker', 'agent', 'client']}><ChatPage /></ProtectedRoute>} />
                <Route path="/video-call/:roomName" element={<VideoCall />} />

                {/* SETTINGS ROUTE - All roles (auto-selects component) */}
                <Route path="/settings" element={<ProtectedRoute allowedRoles={['admin', 'broker', 'agent', 'client']}><SettingsRouter /></ProtectedRoute>} />

                {/* HELP ROUTE - Non-admin roles only */}
                <Route path="/help" element={<ProtectedRoute allowedRoles={['broker', 'agent', 'client']}><HelpRouter /></ProtectedRoute>} />

                {/* SUPPORT ROUTE (for client) */}
                <Route path="/support" element={<ProtectedRoute allowedRoles={['client']}><ClientSupport /></ProtectedRoute>} />

                {/* ADMIN ROUTES */}
                <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
                <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><UserManagement /></ProtectedRoute>} />
                <Route path="/admin/properties" element={<ProtectedRoute allowedRoles={['admin']}><PropertyManagement /></ProtectedRoute>} />
                <Route path="/admin/reservations" element={<ProtectedRoute allowedRoles={['admin']}><AdminReservations /></ProtectedRoute>} />
                <Route path="/admin/commissions" element={<ProtectedRoute allowedRoles={['admin']}><AdminCommissions /></ProtectedRoute>} />
                <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={['admin']}><AdminReports /></ProtectedRoute>} />
                <Route path="/admin/analytics" element={<ProtectedRoute allowedRoles={['admin']}><AdminAnalytics /></ProtectedRoute>} />

                {/* BROKER ROUTES */}
                <Route path="/broker" element={<ProtectedRoute allowedRoles={['broker']}><BrokerDashboard /></ProtectedRoute>} />
                <Route path="/broker/properties" element={<ProtectedRoute allowedRoles={['broker']}><BrokerProperties /></ProtectedRoute>} />
                <Route path="/broker/agents" element={<ProtectedRoute allowedRoles={['broker']}><BrokerAgents /></ProtectedRoute>} />
                <Route path="/broker/reservations" element={<ProtectedRoute allowedRoles={['broker']}><BrokerReservations /></ProtectedRoute>} />
                <Route path="/broker/commissions" element={<ProtectedRoute allowedRoles={['broker']}><BrokerCommissions /></ProtectedRoute>} />
                <Route path="/broker/reports" element={<ProtectedRoute allowedRoles={['broker']}><BrokerReports /></ProtectedRoute>} />

                {/* AGENT ROUTES */}
                <Route path="/agent" element={<ProtectedRoute allowedRoles={['agent']}><AgentsDashboard /></ProtectedRoute>} />
                <Route path="/agent/properties" element={<ProtectedRoute allowedRoles={['agent']}><AgentProperties /></ProtectedRoute>} />
                <Route path="/agent/reservations" element={<ProtectedRoute allowedRoles={['agent']}><AgentReservations /></ProtectedRoute>} />
                <Route path="/agent/commissions" element={<ProtectedRoute allowedRoles={['agent']}><AgentCommissions /></ProtectedRoute>} />

                {/* PROFILE ROUTE - All roles */}
                <Route path="/profile" element={<ProtectedRoute allowedRoles={['admin', 'broker', 'agent', 'client']}><Profile /></ProtectedRoute>} />

                {/* SHARED ROUTES */}
                <Route path="/add-property" element={<ProtectedRoute allowedRoles={['admin', 'broker', 'agent']}><AddProperty /></ProtectedRoute>} />

                {/* CLIENT ROUTES */}
                <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['client']}><ClientDashboard /></ProtectedRoute>} />
              </Routes>
            </NotificationProvider>
          </SocketProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;