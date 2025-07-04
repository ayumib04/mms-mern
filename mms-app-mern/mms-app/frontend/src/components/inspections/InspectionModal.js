import React, { useState } from 'react';
import { Save } from 'lucide-react';
import Modal from '../common/Modal';

export default function InspectionModal({ isOpen, onClose, onSave, equipment, templates }) {
  const [formData, setFormData] = useState({
    equipmentId: '',
    equipmentName: '',
    templateId: '',
    templateName: '',
    type: '',
    scheduledDate: '',
    assignedTo: '',
    estimatedDuration: '',
    priority: 'Normal',
    escalationSettings: {
      delayThreshold: 24,
      criticalityThreshold: 'High',
      escalationContacts: []
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const selectedEquipment = equipment.find(eq => eq._id === formData.equipmentId);
    const selectedTemplate = templates.find(t => t._id === formData.templateId);
    if (selectedEquipment) {
      onSave({
        ...formData,
        equipmentName: selectedEquipment.name,
        templateName: selectedTemplate?.name || '',
        type: selectedTemplate?.name || formData.type,
        healthScoreBefore: selectedEquipment.healthScore
      });
      onClose();
      resetForm();
    }
  };

  const resetForm = () => {
    setFormData({
      equipmentId: '',
      equipmentName: '',
      templateId: '',
      templateName: '',
      type: '',
      scheduledDate: '',
      assignedTo: '',
      estimatedDuration: '',
      priority: 'Normal',
      escalationSettings: {
        delayThreshold: 24,
        criticalityThreshold: 'High',
        escalationContacts: []
      }
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Schedule New Inspection"
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
              Inspection Template
            </label>
            <select
              value={formData.templateId}
              onChange={(e) => {
                const template = templates.find(t => t._id === e.target.value);
                setFormData({
                  ...formData, 
                  templateId: e.target.value,
                  templateName: template?.name || '',
                  type: template?.name || ''
                });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[44px]"
            >
              <option value="">Select Template</option>
              {templates.filter(t => t.isActive).map(template => (
                <option key={template._id} value={template._id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Inspection Type *
            </label>
            <input
              type="text"
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[44px]"
              placeholder="Enter inspection type"
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
              Estimated Duration
            </label>
            <input
              type="text"
              value={formData.estimatedDuration}
              onChange={(e) => setFormData({...formData, estimatedDuration: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[44px]"
              placeholder="e.g., 2 hours"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({...formData, priority: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[44px]"
            >
              <option value="Normal">Normal</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Escalation Threshold (hours)
            </label>
            <input
              type="number"
              value={formData.escalationSettings.delayThreshold}
              onChange={(e) => setFormData({
                ...formData, 
                escalationSettings: {
                  ...formData.escalationSettings,
                  delayThreshold: parseInt(e.target.value) || 24
                }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[44px]"
              min="1"
            />
          </div>
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
            Schedule Inspection
          </button>
        </div>
      </form>
    </Modal>
  );
}