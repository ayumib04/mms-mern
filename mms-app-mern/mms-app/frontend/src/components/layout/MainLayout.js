// frontend/src/components/layout/MainLayout.js
import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  Users, Settings, BarChart3, Wrench, Factory, Search, 
  Calendar, TrendingUp, Menu, X, Bell, LogOut, User
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useApp } from '../../hooks/useApp';
import NotificationDropdown from './NotificationDropdown';

const MainLayout = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { sidebarOpen, setSidebarOpen } = useApp();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const navigation = [
    { id: 'dashboard', path: '/', label: 'Dashboard', icon: BarChart3 },
    { id: 'equipment', path: '/equipment', label: 'Equipment Registry', icon: Factory },
    { id: 'inspections', path: '/inspections', label: 'Inspections', icon: Search },
    { id: 'backlogs', path: '/backlogs', label: 'Backlogs', icon: Wrench },
    { id: 'workorders', path: '/workorders', label: 'Work Orders', icon: Wrench },
    { id: 'preventive', path: '/preventive-maintenance', label: 'Preventive Maintenance', icon: Calendar },
    { id: 'analytics', path: '/analytics', label: 'Analytics', icon: TrendingUp },
    ...(user?.role === 'Administrator' ? [
      { id: 'users', path: '/users', label: 'User Management', icon: Users }
    ] : [])
  ];

  const handleLogout = async () => {
    await logout();
  };

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen bg-gray-100 relative">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } fixed lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out z-50 lg:z-auto w-64 bg-white shadow-lg h-full`}>
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-xl sm:text-2xl">🔧</div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">MMS</h1>
                <p className="text-xs sm:text-sm text-gray-600">Maintenance System</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <nav className="mt-4 sm:mt-6 overflow-y-auto h-full pb-20">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.id}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`w-full flex items-center px-4 sm:px-6 py-3 text-left hover:bg-gray-50 transition-colors ${
                  active ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600' : 'text-gray-700'
                } min-h-[48px]`}
              >
                <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
                <span className="text-sm sm:text-base">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 -ml-2"
              >
                <Menu className="w-5 h-5" />
              </button>
              <h2 className="text-lg sm:text-2xl font-semibold text-gray-900 capitalize">
                {navigation.find(item => isActive(item.path))?.label || 'Dashboard'}
              </h2>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              <NotificationDropdown />
              
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100"
                >
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                    {user?.name?.charAt(0)}
                  </div>
                  <span className="text-xs sm:text-sm text-gray-700 hidden sm:block">{user?.name}</span>
                </button>
                
                {showUserMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowUserMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-20">
                      <div className="px-4 py-2 border-b">
                        <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                        <p className="text-xs text-gray-500">{user?.role}</p>
                      </div>
                      <Link
                        to="/profile"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <User className="w-4 h-4 mr-2" />
                        Profile
                      </Link>
                      <Link
                        to="/settings"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
