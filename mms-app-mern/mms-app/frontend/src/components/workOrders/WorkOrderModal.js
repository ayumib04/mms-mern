import React, { useState } from 'react';
import { Save } from 'lucide-react';
import Modal from '../common/Modal';

export default function WorkOrderModal({ isOpen, onClose, onSave, equipment }) {
  const [formData, setFormData] = useState({
    equipmentId: '',
    equipmentName: '',
    title: '',
    description: '',
    type: '',
    priority: '',
    assignedTo: '',
    scheduledDate: '',
    estimatedHours: '',
    estimatedCost: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const selectedEquipment = equipment.find(eq => eq._id === formData.equipmentId);
    if (selectedEquipment) {
      onSave({
        ...formData,
        equipmentName: selectedEquipment.name,
        estimatedCost: formData.estimatedCost || formData.estimatedHours * 500
      });
      onClose();
      resetForm();
    }
  };

  const resetForm = () => {
    setFormData({
      equipmentId: '',
      equipmentName: '',
      title: '',
      description: '',
      type: '',
      priority: '',
      assignedTo: '',
      scheduledDate: '',
      estimatedHours: '',
      estimatedCost: ''
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Work Order"
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 sm:mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Equipment *
            </label>
            <select
              value={formData.equipmentId}
              onChange={(e) => setFormData({...formData, equipmentId: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[44px]"
              required
            >
              <option value="">Select Equipment</option>
              {equipment.map(eq => (
                <option key={eq._id} value={eq._id}>
                  {eq.name} ({eq.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Work Order Type *
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[44px]"
              required
            >
              <option value="">Select Type</option>
              <option value="Corrective">Corrective</option>
              <option value="Preventive">Preventive</option>
              <option value="Emergency">Emergency</option>
              <option value="Shutdown">Shutdown</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority *
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({...formData, priority: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[44px]"
              required
            >
              <option value="">Select Priority</option>
              <option value="P1">P1 - Critical</option>
              <option value="P2">P2 - High</option>
              <option value="P3">P3 - Medium</option>
              <option value="P4">P4 - Low</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assigned To *
            </label>
            <input
              type="text"
              value={formData.assignedTo}
              onChange={(e) => setFormData({...formData, assignedTo: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[44px]"
              placeholder="Technician name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Scheduled Date *
            </label>
            <input
              type="date"
              value={formData.scheduledDate}
              onChange={(e) => setFormData({...formData, scheduledDate: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[44px]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estimated Hours
            </label>
            <input
              type="number"
              value={formData.estimatedHours}
              onChange={(e) => setFormData({...formData, estimatedHours: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[44px]"
              min="0.5"
              step="0.5"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Title *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[44px]"
            placeholder="Work order title"
            required
          />
        </div>

        <div className="mb-4 sm:mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
            placeholder="Describe the work to be performed..."
            required
          />
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
            Create Work Order
          </button>
        </div>
      </form>
    </Modal>
  );
}