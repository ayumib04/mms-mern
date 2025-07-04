import React, { useState } from 'react';
import { Save } from 'lucide-react';
import Modal from '../common/Modal';

export default function BacklogModal({ isOpen, onClose, onSave, equipment }) {
  const [formData, setFormData] = useState({
    equipmentId: '',
    equipmentName: '',
    issue: '',
    category: '',
    priority: '',
    assignedTo: '',
    estimatedHours: '',
    dueDate: '',
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
      issue: '',
      category: '',
      priority: '',
      assignedTo: '',
      estimatedHours: '',
      dueDate: '',
      estimatedCost: ''
    });
  };

  const updateDueDate = (priority) => {
    if (priority) {
      const now = new Date();
      let dueDate = new Date();
      
      switch (priority) {
        case 'P1':
          dueDate.setHours(now.getHours() + 4);
          break;
        case 'P2':
          dueDate.setHours(now.getHours() + 48);
          break;
        case 'P3':
          dueDate.setDate(now.getDate() + 7);
          break;
        case 'P4':
          dueDate.setMonth(now.getMonth() + 1);
          break;
      }
      
      setFormData(prev => ({
        ...prev,
        priority,
        dueDate: dueDate.toISOString().split('T')[0]
      }));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Backlog"
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
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[44px]"
              required
            >
              <option value="">Select Category</option>
              <option value="Mechanical">Mechanical</option>
              <option value="Electrical">Electrical</option>
              <option value="Safety">Safety</option>
              <option value="Environmental">Environmental</option>
              <option value="Operational">Operational</option>
              <option value="Instrumentation">Instrumentation</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority *
            </label>
            <select
              value={formData.priority}
              onChange={(e) => updateDueDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[44px]"
              required
            >
              <option value="">Select Priority</option>
              <option value="P1">P1 - Critical (4 hours)</option>
              <option value="P2">P2 - High (48 hours)</option>
              <option value="P3">P3 - Medium (1 week)</option>
              <option value="P4">P4 - Low (1 month)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assigned To
            </label>
            <input
              type="text"
              value={formData.assignedTo}
              onChange={(e) => setFormData({...formData, assignedTo: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[44px]"
              placeholder="Technician name"
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Due Date
            </label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[44px]"
            />
          </div>
        </div>

        <div className="mb-4 sm:mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Issue Description *
          </label>
          <textarea
            value={formData.issue}
            onChange={(e) => setFormData({...formData, issue: e.target.value})}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
            placeholder="Describe the issue in detail..."
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
            Create Backlog
          </button>
        </div>
      </form>
    </Modal>
  );
}