import React, { useState } from 'react';
import { Plus, Edit, Trash2, X } from 'lucide-react';
import Modal from '../common/Modal';

export default function InspectionTemplatesModal({ isOpen, onClose, templates, onSave }) {
  const [activeTab, setActiveTab] = useState('list');
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    equipmentTypes: [],
    safetyChecks: [],
    checkpoints: [],
    isActive: true
  });

  const [newSafetyCheck, setNewSafetyCheck] = useState('');
  const [newCheckpoint, setNewCheckpoint] = useState({
    name: '',
    type: 'observation',
    mandatory: true,
    parameters: []
  });

  const handleCreateTemplate = () => {
    setEditingTemplate(null);
    setFormData({
      name: '',
      equipmentTypes: [],
      safetyChecks: [],
      checkpoints: [],
      isActive: true
    });
    setActiveTab('create');
  };

  const handleEditTemplate = (template) => {
    setEditingTemplate(template);
    setFormData(template);
    setActiveTab('create');
  };

  const handleSaveTemplate = () => {
    const newTemplate = {
      _id: editingTemplate?._id || `TMPL-${Date.now()}`,
      ...formData,
      createdBy: 'Current User',
      createdDate: editingTemplate?.createdDate || new Date().toISOString()
    };

    let updatedTemplates;
    if (editingTemplate) {
      updatedTemplates = templates.map(t => t._id === editingTemplate._id ? newTemplate : t);
    } else {
      updatedTemplates = [...templates, newTemplate];
    }
    
    onSave(updatedTemplates);
    setActiveTab('list');
  };

  const handleDeleteTemplate = (templateId) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      const updatedTemplates = templates.filter(t => t._id !== templateId);
      onSave(updatedTemplates);
    }
  };

  const addSafetyCheck = () => {
    if (newSafetyCheck.trim()) {
      setFormData(prev => ({
        ...prev,
        safetyChecks: [...prev.safetyChecks, newSafetyCheck.trim()]
      }));
      setNewSafetyCheck('');
    }
  };

  const removeSafetyCheck = (index) => {
    setFormData(prev => ({
      ...prev,
      safetyChecks: prev.safetyChecks.filter((_, i) => i !== index)
    }));
  };

  const addCheckpoint = () => {
    if (newCheckpoint.name.trim()) {
      const checkpoint = {
        ...newCheckpoint,
        id: `cp-${Date.now()}`,
        parameters: newCheckpoint.parameters.filter(p => p.trim())
      };
      setFormData(prev => ({
        ...prev,
        checkpoints: [...prev.checkpoints, checkpoint]
      }));
      setNewCheckpoint({
        name: '',
        type: 'observation',
        mandatory: true,
        parameters: []
      });
    }
  };

  const removeCheckpoint = (index) => {
    setFormData(prev => ({
      ...prev,
      checkpoints: prev.checkpoints.filter((_, i) => i !== index)
    }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Inspection Templates"
      size="2xl"
    >
      <div className="space-y-4">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('list')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'list'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Templates List
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'create'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {editingTemplate ? 'Edit Template' : 'Create Template'}
            </button>
          </nav>
        </div>

        {/* Templates List */}
        {activeTab === 'list' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-lg font-medium text-gray-900">Available Templates</h4>
              <button
                onClick={handleCreateTemplate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <Plus className="w-4 h-4 mr-2 inline" />
                New Template
              </button>
            </div>
            
            <div className="space-y-3">
              {templates.map((template) => (
                <div key={template._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h5 className="text-sm font-medium text-gray-900">{template.name}</h5>
                      <p className="text-xs text-gray-500 mt-1">
                        Equipment Types: {template.equipmentTypes.join(', ')}
                      </p>
                      <p className="text-xs text-gray-500">
                        {template.safetyChecks.length} Safety Checks, {template.checkpoints.length} Checkpoints
                      </p>
                      <div className="flex items-center mt-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          template.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {template.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditTemplate(template)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(template._id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Create/Edit Template */}
        {activeTab === 'create' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter template name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Equipment Types
                </label>
                <select
                  multiple
                  value={formData.equipmentTypes}
                  onChange={(e) => setFormData({
                    ...formData, 
                    equipmentTypes: Array.from(e.target.selectedOptions, option => option.value)
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="plant">Plant</option>
                  <option value="equipment">Equipment</option>
                  <option value="assembly">Assembly</option>
                  <option value="sub-assembly">Sub-Assembly</option>
                  <option value="component">Component</option>
                </select>
              </div>
            </div>

            {/* Safety Checks */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Safety Checks
              </label>
              <div className="flex space-x-2 mb-2">
                <input
                  type="text"
                  value={newSafetyCheck}
                  onChange={(e) => setNewSafetyCheck(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add safety check..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSafetyCheck())}
                />
                <button
                  type="button"
                  onClick={addSafetyCheck}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add
                </button>
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {formData.safetyChecks.map((check, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm flex-1">{check}</span>
                    <button
                      type="button"
                      onClick={() => removeSafetyCheck(index)}
                      className="text-red-600 hover:text-red-800 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Checkpoints */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Inspection Checkpoints
              </label>
              <div className="border border-gray-200 rounded-lg p-4 mb-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                  <input
                    type="text"
                    value={newCheckpoint.name}
                    onChange={(e) => setNewCheckpoint({...newCheckpoint, name: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Checkpoint name"
                  />
                  <select
                    value={newCheckpoint.type}
                    onChange={(e) => setNewCheckpoint({...newCheckpoint, type: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="observation">Observation</option>
                    <option value="measurement">Measurement</option>
                    <option value="test">Test</option>
                  </select>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={newCheckpoint.mandatory}
                      onChange={(e) => setNewCheckpoint({...newCheckpoint, mandatory: e.target.checked})}
                      className="rounded text-blue-600"
                    />
                    <label className="text-sm text-gray-700">Mandatory</label>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newCheckpoint.parameters.join(', ')}
                    onChange={(e) => setNewCheckpoint({
                      ...newCheckpoint, 
                      parameters: e.target.value.split(',').map(p => p.trim())
                    })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Parameters (comma separated)"
                  />
                  <button
                    type="button"
                    onClick={addCheckpoint}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Add Checkpoint
                  </button>
                </div>
              </div>
              
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {formData.checkpoints.map((checkpoint, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{checkpoint.name}</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          checkpoint.type === 'measurement' ? 'bg-blue-100 text-blue-800' :
                          checkpoint.type === 'test' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {checkpoint.type}
                        </span>
                        {checkpoint.mandatory && (
                          <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                            Mandatory
                          </span>
                        )}
                      </div>
                      {checkpoint.parameters.length > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          Parameters: {checkpoint.parameters.join(', ')}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeCheckpoint(index)}
                      className="text-red-600 hover:text-red-800 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                className="rounded text-blue-600"
              />
              <label className="text-sm text-gray-700">Active Template</label>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setActiveTab('list')}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveTemplate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingTemplate ? 'Update Template' : 'Create Template'}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}