import React, { useState } from 'react';
import Modal from '../common/Modal';

export default function BulkAssignmentModal({ isOpen, onClose, onSave, selectedCount, users }) {
  const [assignments, setAssignments] = useState({
    assignedTo: '',
    priority: '',
    dueDate: '',
    category: ''
  });

  const handleSubmit = () => {
    const filteredAssignments = Object.fromEntries(
      Object.entries(assignments).filter(([key, value]) => value !== '')
    );
    
    if (Object.keys(filteredAssignments).length === 0) {
      alert('Please select at least one field to update.');
      return;
    }

    onSave(filteredAssignments);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Bulk Assignment (${selectedCount} backlogs)`}
      size="md"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Assign To
          </label>
          <select
            value={assignments.assignedTo}
            onChange={(e) => setAssignments({...assignments, assignedTo: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Keep Current Assignment</option>
            {users.filter(u => u.role !== 'Administrator').map(user => (
              <option key={user._id} value={user._id}>
                {user.name} ({user.role})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Priority
          </label>
          <select
            value={assignments.priority}
            onChange={(e) => setAssignments({...assignments, priority: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Keep Current Priority</option>
            <option value="P1">P1 - Critical</option>
            <option value="P2">P2 - High</option>
            <option value="P3">P3 - Medium</option>
            <option value="P4">P4 - Low</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Due Date
          </label>
          <input
            type="date"
            value={assignments.dueDate}
            onChange={(e) => setAssignments({...assignments, dueDate: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <select
            value={assignments.category}
            onChange={(e) => setAssignments({...assignments, category: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Keep Current Category</option>
            <option value="Mechanical">Mechanical</option>
            <option value="Electrical">Electrical</option>
            <option value="Safety">Safety</option>
            <option value="Environmental">Environmental</option>
            <option value="Operational">Operational</option>
            <option value="Instrumentation">Instrumentation</option>
          </select>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm text-yellow-800">
            Only non-empty fields will be updated. Empty fields will keep their current values.
          </p>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Apply to {selectedCount} Backlogs
          </button>
        </div>
      </div>
    </Modal>
  );
}