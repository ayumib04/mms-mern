import React, { useState } from 'react';
import { Save, X } from 'lucide-react';
import Modal from '../common/Modal';

export default function PMScheduleModal({ isOpen, onClose, onSave, equipment }) {
  const [formData, setFormData] = useState({
    equipmentId: '',
    equipmentName: '',
    title: '',
    frequency: '',
    assignedTo: '',
    estimatedDuration: '',
    estimatedCost: '',
    nextDue: '',
    checklist: []
  });

  const [checklistInput, setChecklistInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const selectedEquipment = equipment.find(eq => eq._id === formData.equipmentId);
    if (selectedEquipment) {
      onSave({
        ...formData,
        equipmentName: selectedEquipment.name
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
      frequency: '',
      assignedTo: '',
      estimatedDuration: '',
      estimatedCost: '',
      nextDue: '',
      checklist: []
    });
    setChecklistInput('');
  };

  const addChecklistItem = () => {
    if (checklistInput.trim()) {
      setFormData(prev => ({
        ...prev,
        checklist: [...prev.checklist, checklistInput.trim()]
      }));
      setChecklistInput('');
    }
  };

  const removeChecklistItem = (index) => {
    setFormData(prev => ({
      ...prev,
      checklist: prev.checklist.filter((_, i) => i !== index)
    }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create PM Schedule"
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
              Frequency *
            </label>
            <select
              value={formData.frequency}
              onChange={(e) => setFormData({...formData, frequency: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[44px]"
              required
            >
              <option value="">Select Frequency</option>
              <option value="Daily">Daily</option>
              <option value="Weekly">Weekly</option>
              <option value="Monthly">Monthly</option>
              <option value="Quarterly">Quarterly</option>
              <option value="Annually">Annually</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Next Due Date *
            </label>
            <input
              type="date"
              value={formData.nextDue}
              onChange={(e) => setFormData({...formData, nextDue: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[44px]"
              required
            />
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
              Estimated Cost
            </label>
            <input
              type="number"
              value={formData.estimatedCost}
              onChange={(e) => setFormData({...formData, estimatedCost: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[44px]"
              placeholder="Cost in rupees"
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
            placeholder="PM schedule title"
            required
          />
        </div>

        <div className="mb-4 sm:mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Maintenance Checklist
          </label>
          <div className="flex space-x-2 mb-2">
            <input
              type="text"
              value={checklistInput}
              onChange={(e) => setChecklistInput(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[44px]"
              placeholder="Add checklist item..."
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addChecklistItem())}
            />
            <button
              type="button"
              onClick={addChecklistItem}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm min-h-[44px]"
            >
              Add
            </button>
          </div>
          <div className="space-y-1">
            {formData.checklist.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm flex-1 mr-2">{item}</span>
                <button
                  type="button"
                  onClick={() => removeChecklistItem(index)}
                  className="text-red-600 hover:text-red-800 p-1 min-h-[32px] min-w-[32px] flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
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
            Create PM Schedule
          </button>
        </div>
      </form>
    </Modal>
  );
}