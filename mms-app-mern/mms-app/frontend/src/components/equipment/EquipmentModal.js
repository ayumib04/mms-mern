// frontend/src/components/equipment/EquipmentModal.js
import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import Modal from '../common/Modal';
import apiService from '../../services/api';
import { toast } from 'react-toastify';

const EquipmentModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  equipment, 
  isEdit, 
  availableParents 
}) => {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'equipment',
    level: 2,
    parent: '',
    criticality: '',
    location: '',
    status: 'Active',
    description: '',
    manufacturer: '',
    model: '',
    serialNumber: '',
    commissionDate: '',
    runningHours: 0,
    specifications: {},
    ownership: {
      mechanical: '',
      electrical: '',
      operations: ''
    }
  });

  const [loading, setLoading] = useState(false);

  const equipmentTypes = [
    { value: 'plant', label: 'Plant', level: 1 },
    { value: 'equipment', label: 'Equipment', level: 2 },
    { value: 'assembly', label: 'Assembly', level: 3 },
    { value: 'sub-assembly', label: 'Sub-Assembly', level: 4 },
    { value: 'component', label: 'Component', level: 5 }
  ];

  useEffect(() => {
    if (equipment && isEdit) {
      setFormData({
        code: equipment.code || '',
        name: equipment.name || '',
        type: equipment.type || 'equipment',
        level: equipment.level || 2,
        parent: equipment.parent?._id || equipment.parent || '',
        criticality: equipment.criticality || '',
        location: equipment.location || '',
        status: equipment.status || 'Active',
        description: equipment.description || '',
        manufacturer: equipment.manufacturer || '',
        model: equipment.model || '',
        serialNumber: equipment.serialNumber || '',
        commissionDate: equipment.commissionDate?.split('T')[0] || '',
        runningHours: equipment.runningHours || 0,
        specifications: equipment.specifications || {},
        ownership: equipment.ownership || {
          mechanical: '',
          electrical: '',
          operations: ''
        }
      });
    } else {
      setFormData({
        code: '',
        name: '',
        type: 'equipment',
        level: 2,
        parent: '',
        criticality: '',
        location: '',
        status: 'Active',
        description: '',
        manufacturer: '',
        model: '',
        serialNumber: '',
        commissionDate: '',
        runningHours: 0,
        specifications: {},
        ownership: {
          mechanical: '',
          electrical: '',
          operations: ''
        }
      });
    }
  }, [equipment, isEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Prepare data for submission
      const submitData = {
        ...formData,
        parent: formData.parent || null,
        specifications: formData.specifications
      };

      await onSave(submitData);
      onClose();
    } catch (error) {
      console.error('Error saving equipment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleOwnershipChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      ownership: {
        ...prev.ownership,
        [field]: value
      }
    }));
  };

  const handleTypeChange = (type) => {
    const selectedType = equipmentTypes.find(t => t.value === type);
    if (selectedType) {
      setFormData(prev => ({
        ...prev,
        type: type,
        level: selectedType.level,
        parent: selectedType.level === 1 ? '' : prev.parent
      }));
    }
  };

  // Filter available parents based on hierarchy rules
  const getAvailableParents = () => {
    if (formData.level === 1) return [];
    
    const targetParentLevel = formData.level - 1;
    return availableParents.filter(eq => 
      eq.level === targetParentLevel && 
      eq._id !== equipment?._id
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Equipment' : 'Add New Equipment'}
      size="xl"
    >
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 sm:mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Equipment Code *
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => handleInputChange('code', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[44px]"
              required
              disabled={loading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Equipment Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[44px]"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type & Level *
            </label>
            <select
              value={formData.type}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[44px]"
              required
              disabled={loading}
            >
              <option value="">Select Type</option>
              {equipmentTypes.map(type => (
                <option key={type.value} value={type.value}>
                  Level {type.level} - {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Parent Equipment
            </label>
            <select
              value={formData.parent}
              onChange={(e) => handleInputChange('parent', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[44px]"
              disabled={formData.level === 1 || loading}
            >
              <option value="">
                {formData.level === 1 ? 'None (Plant Level)' : 'Select Parent'}
              </option>
              {getAvailableParents().map(eq => (
                <option key={eq._id} value={eq._id}>
                  {eq.name} ({eq.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Criticality *
            </label>
            <select
              value={formData.criticality}
              onChange={(e) => handleInputChange('criticality', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[44px]"
              required
              disabled={loading}
            >
              <option value="">Select Criticality</option>
              <option value="A">A - Critical</option>
              <option value="B">B - Important</option>
              <option value="C">C - Standard</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location *
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[44px]"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Manufacturer
            </label>
            <input
              type="text"
              value={formData.manufacturer}
              onChange={(e) => handleInputChange('manufacturer', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[44px]"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Model
            </label>
            <input
              type="text"
              value={formData.model}
              onChange={(e) => handleInputChange('model', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[44px]"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Serial Number
            </label>
            <input
              type="text"
              value={formData.serialNumber}
              onChange={(e) => handleInputChange('serialNumber', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[44px]"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Commission Date
            </label>
            <input
              type="date"
              value={formData.commissionDate}
              onChange={(e) => handleInputChange('commissionDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[44px]"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Running Hours
            </label>
            <input
              type="number"
              value={formData.runningHours}
              onChange={(e) => handleInputChange('runningHours', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[44px]"
              min="0"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleInputChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[44px]"
              disabled={loading}
            >
              <option value="Active">Active</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Decommissioned">Decommissioned</option>
            </select>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
            disabled={loading}
          />
        </div>

        <div className="mb-4 sm:mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ownership
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Mechanical</label>
              <input
                type="text"
                value={formData.ownership.mechanical}
                onChange={(e) => handleOwnershipChange('mechanical', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="Name"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Electrical</label>
              <input
                type="text"
                value={formData.ownership.electrical}
                onChange={(e) => handleOwnershipChange('electrical', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="Name"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Operations</label>
              <input
                type="text"
                value={formData.ownership.operations}
                onChange={(e) => handleOwnershipChange('operations', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="Name"
                disabled={loading}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors text-sm min-h-[44px]"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm min-h-[44px] flex items-center justify-center disabled:opacity-50"
            disabled={loading}
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Saving...' : (isEdit ? 'Update' : 'Create')} Equipment
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EquipmentModal;
