import React, { useState, useEffect } from 'react';
import { Plus, Users, Settings, Wrench, UserCheck, Edit, Trash2 } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import LoadingSpinner from '../common/LoadingSpinner';
import UserModal from './UserModal';
import ConfirmDialog from '../common/ConfirmDialog';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [loading, setLoading] = useState(true);
  const { request } = useApi();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await request('/api/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (userData) => {
    try {
      const response = await request('/api/users', {
        method: 'POST',
        data: userData
      });
      setUsers([...users, response.data]);
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating user:', error);
      alert(error.response?.data?.message || 'Failed to create user');
    }
  };

  const updateUser = async (userId, userData) => {
    try {
      const response = await request(`/api/users/${userId}`, {
        method: 'PUT',
        data: userData
      });
      setUsers(users.map(u => u._id === userId ? response.data : u));
      setShowEditModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error updating user:', error);
      alert(error.response?.data?.message || 'Failed to update user');
    }
  };

  const deleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      await request(`/api/users/${userToDelete._id}`, {
        method: 'DELETE'
      });
      setUsers(users.filter(u => u._id !== userToDelete._id));
      setShowDeleteDialog(false);
      setUserToDelete(null);
    } catch (error) {
      console.error('Error deleting user:', error);
      alert(error.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleDeleteUser = (user) => {
    setUserToDelete(user);
    setShowDeleteDialog(true);
  };

  const userStats = {
    total: users.length,
    active: users.filter(u => u.status === 'Active').length,
    administrators: users.filter(u => u.role === 'Administrator').length,
    technicians: users.filter(u => u.role === 'Field Technician').length
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">User Management</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm min-h-[44px] flex items-center justify-center"
          >
            <Plus className="w-4 h-4 mr-1 sm:mr-2" />
            Add User
          </button>
        </div>

        {/* User Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6">
          <StatCard
            title="Total Users"
            value={userStats.total}
            icon={Users}
            color="blue"
          />
          <StatCard
            title="Active"
            value={userStats.active}
            icon={UserCheck}
            color="green"
          />
          <StatCard
            title="Administrators"
            value={userStats.administrators}
            icon={Settings}
            color="purple"
          />
          <StatCard
            title="Technicians"
            value={userStats.technicians}
            icon={Wrench}
            color="orange"
          />
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-lg shadow">
        {/* Mobile-friendly list */}
        <div className="block sm:hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-base font-medium text-gray-900">Users</h3>
          </div>
          {users.map((user) => (
            <div key={user._id} className="p-4 border-b border-gray-200 last:border-b-0">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
                    {user.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{user.name}</div>
                    <div className="text-xs text-gray-500">{user.username}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <button 
                    onClick={() => handleEditUser(user)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDeleteUser(user)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-500">Role:</span> {user.role}
                </div>
                <div>
                  <span className="text-gray-500">Department:</span> {user.department}
                </div>
                <div className="flex items-center">
                  <span className="text-gray-500 mr-1">Status:</span>
                  <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${
                    user.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user.status}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Last Login:</span> 
                  {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                <div>Email: {user.email}</div>
                <div>Phone: {user.phone}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                        {user.name.charAt(0)}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.role}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.department}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.email}</div>
                    <div className="text-sm text-gray-500">{user.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      user.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleEditUser(user)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(user)}
                        className="text-red-600 hover:text-red-900 p-1 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <UserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={createUser}
        title="Add New User"
      />

      <UserModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedUser(null);
        }}
        onSave={(userData) => updateUser(selectedUser._id, userData)}
        user={selectedUser}
        title="Edit User"
        isEdit={true}
      />

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setUserToDelete(null);
        }}
        onConfirm={deleteUser}
        title="Delete User"
        message={`Are you sure you want to delete user "${userToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        confirmColor="red"
      />
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }) {
  const colorClasses = {
    blue: 'text-blue-500',
    green: 'text-green-500',
    purple: 'text-purple-500',
    orange: 'text-orange-500'
  };

  return (
    <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-gray-600">{title}</p>
          <p className="text-lg sm:text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${colorClasses[color]} flex-shrink-0`} />
      </div>
    </div>
  );
}