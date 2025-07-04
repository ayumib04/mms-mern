import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import Modal from '../common/Modal';

export default function UserModal({ isOpen, onClose, onSave, user, title, isEdit }) {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    email: '',
    phone: '',
    role: '',
    department: '',
    status: 'Active'
  });

  useEffect(() => {
    if (user && isEdit) {
      setFormData({
        name: user.name || '',
        username: user.username || '',
        password: '', // Don't populate password for security
        email: user.email || '',
        phone: user.phone || '',
        role: user.role || '',
        department: user.department || '',
        status: user.status || 'Active'
      });
    } else {
      setFormData({
        name: '',
        username: '',
        password: '',
        email: '',
        phone: '',
        role: '',
        department: '',
        status: 'Active'
      });
    }
  }, [user, isEdit]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const dataToSave = { ...formData };
    
    // Don't include password if it's empty during edit
    if (isEdit && !dataToSave.password) {
      delete dataToSave.password;
    }
    
    onSave(dataToSave);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title || 'Add New User'}
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 sm:mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[44px]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username *
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[44px]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password {!isEdit && '*'}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[44px]"
              required={!isEdit}
              placeholder={isEdit ? 'Leave blank to keep current password' : ''}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[44px]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[44px]"
              placeholder="+91-0000000000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role *
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[44px]"
              required
            >
              <option value="">Select Role</option>
              <option value="Administrator">Administrator</option>
              <option value="Department Head">Department Head</option>
              <option value="Supervisor">Supervisor</option>
              <option value="Field Technician">Field Technician</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Department *
            </label>
            <select
              value={formData.department}
              onChange={(e) => setFormData({...formData, department: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[44px]"
              required
            >
              <option value="">Select Department</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Operations">Operations</option>
              <option value="Engineering">Engineering</option>
              <option value="Safety">Safety</option>
              <option value="Mechanical">Mechanical</option>
              <option value="Electrical">Electrical</option>
            </select>
          </div>

          {isEdit && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[44px]"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors text-sm min-h-[44px]"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm min-h-[44px] flex items-center justify-center"
          >
            <Save className="w-4 h-4 mr-2" />
            {isEdit ? 'Update User' : 'Create User'}
          </button>
        </div>
      </form>
    </Modal>
  );
}