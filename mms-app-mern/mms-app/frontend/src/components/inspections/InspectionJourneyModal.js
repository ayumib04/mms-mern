import React, { useState, useEffect } from 'react';
import { 
  AlertOctagon, Search, FileText, CheckCircle, 
  Save, AlertTriangle, Eye, BarChart, Zap, AlertCircle,
  Camera, Paperclip, MessageSquare, Image, X 
} from 'lucide-react';
import Modal from '../common/Modal';

export default function InspectionJourneyModal({ isOpen, onClose, inspection, template, onSave }) {
  const [currentStep, setCurrentStep] = useState('safety');
  const [journeyData, setJourneyData] = useState({
    safetyChecks: {},
    checkpoints: {},
    measurements: {},
    findings: [],
    photos: [],
    documents: [],
    comments: '',
    finalStatus: 'passed'
  });
  const [timeTracking, setTimeTracking] = useState({
    startTime: null,
    currentPhase: 'measurement',
    resources: []
  });

  const steps = [
    { id: 'safety', label: 'Safety Checks', icon: AlertOctagon },
    { id: 'inspection', label: 'Inspection', icon: Search },
    { id: 'documentation', label: 'Documentation', icon: FileText },
    { id: 'review', label: 'Review & Submit', icon: CheckCircle }
  ];

  useEffect(() => {
    if (inspection && isOpen) {
      setTimeTracking({
        startTime: new Date().toISOString(),
        currentPhase: 'measurement',
        resources: [{ name: 'Current User', startTime: new Date().toISOString() }]
      });
    }
  }, [inspection, isOpen]);

  const handleSafetyCheckChange = (checkIndex, checked) => {
    setJourneyData(prev => ({
      ...prev,
      safetyChecks: {
        ...prev.safetyChecks,
        [checkIndex]: checked
      }
    }));
  };

  const handleCheckpointChange = (checkpointId, data) => {
    setJourneyData(prev => ({
      ...prev,
      checkpoints: {
        ...prev.checkpoints,
        [checkpointId]: data
      }
    }));
  };

  const addFinding = (finding) => {
    setJourneyData(prev => ({
      ...prev,
      findings: [...prev.findings, {
        id: Date.now(),
        ...finding,
        timestamp: new Date().toISOString()
      }]
    }));
  };

  const canProceedFromSafety = () => {
    if (!template?.safetyChecks) return true;
    return template.safetyChecks.every((_, index) => journeyData.safetyChecks[index] === true);
  };

  const canCompleteInspection = () => {
    if (!template?.checkpoints) return true;
    return template.checkpoints
      .filter(cp => cp.mandatory)
      .every(cp => journeyData.checkpoints[cp.id]?.completed);
  };

  const handleSaveDraft = () => {
    const updatedInspection = {
      ...inspection,
      isDraft: true,
      status: 'In Progress',
      resourceTracking: {
        ...inspection.resourceTracking,
        measurementPhase: {
          ...timeTracking,
          endTime: null
        },
        totalTries: inspection.resourceTracking.totalTries + 1,
        totalTimeSpent: inspection.resourceTracking.totalTimeSpent + 
          (new Date() - new Date(timeTracking.startTime)) / (1000 * 60 * 60)
      },
      journeyData
    };
    onSave(updatedInspection);
    onClose();
  };

  const handleCompleteInspection = () => {
    const updatedInspection = {
      ...inspection,
      isDraft: false,
      status: 'Completed',
      findings: journeyData.findings,
      resourceTracking: {
        ...inspection.resourceTracking,
        measurementPhase: {
          ...timeTracking,
          endTime: new Date().toISOString()
        },
        totalTries: inspection.resourceTracking.totalTries + 1,
        totalTimeSpent: inspection.resourceTracking.totalTimeSpent + 
          (new Date() - new Date(timeTracking.startTime)) / (1000 * 60 * 60)
      },
      healthScoreAfter: calculateHealthScore(),
      journeyData
    };
    onSave(updatedInspection);
    onClose();
  };

  const calculateHealthScore = () => {
    const baseScore = inspection.healthScoreBefore;
    const failedFindings = journeyData.findings.filter(f => f.status === 'failed').length;
    const observationFindings = journeyData.findings.filter(f => f.status === 'observation').length;
    
    return Math.max(50, baseScore - (failedFindings * 10) - (observationFindings * 2));
  };

  if (!inspection || !isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Inspection Journey - ${inspection.inspectionId}`}
      size="2xl"
    >
      <div className="space-y-6">
        {/* Step Navigation */}
        <div className="flex justify-between items-center border-b border-gray-200 pb-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = step.id === currentStep;
            const isCompleted = steps.findIndex(s => s.id === currentStep) > index;
            
            return (
              <div
                key={step.id}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                  isActive 
                    ? 'bg-blue-100 text-blue-700' 
                    : isCompleted 
                      ? 'bg-green-100 text-green-700'
                      : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => {
                  if (isCompleted || isActive) {
                    setCurrentStep(step.id);
                  }
                }}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium hidden sm:inline">{step.label}</span>
                {isCompleted && <CheckCircle className="w-4 h-4" />}
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <div className="min-h-96">
          {currentStep === 'safety' && (
            <SafetyChecksStep
              template={template}
              safetyChecks={journeyData.safetyChecks}
              onCheckChange={handleSafetyCheckChange}
            />
          )}
          
          {currentStep === 'inspection' && (
            <InspectionStep
              template={template}
              checkpoints={journeyData.checkpoints}
              onCheckpointChange={handleCheckpointChange}
              onAddFinding={addFinding}
              findings={journeyData.findings}
            />
          )}
          
          {currentStep === 'documentation' && (
            <DocumentationStep
              journeyData={journeyData}
              onDataChange={setJourneyData}
            />
          )}
          
          {currentStep === 'review' && (
            <ReviewStep
              inspection={inspection}
              journeyData={journeyData}
              template={template}
              onDataChange={setJourneyData}
            />
          )}
        </div>

        {/* Navigation and Actions */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
          <div className="flex space-x-3">
            <button
              onClick={handleSaveDraft}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
            >
              <Save className="w-4 h-4 mr-2 inline" />
              Save as Draft
            </button>
          </div>
          
          <div className="flex space-x-3">
            {currentStep !== 'safety' && (
              <button
                onClick={() => {
                  const currentIndex = steps.findIndex(s => s.id === currentStep);
                  setCurrentStep(steps[currentIndex - 1].id);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors text-sm"
              >
                Previous
              </button>
            )}
            
            {currentStep !== 'review' ? (
              <button
                onClick={() => {
                  if (currentStep === 'safety' && !canProceedFromSafety()) {
                    alert('Please complete all safety checks before proceeding.');
                    return;
                  }
                  const currentIndex = steps.findIndex(s => s.id === currentStep);
                  setCurrentStep(steps[currentIndex + 1].id);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                disabled={currentStep === 'safety' && !canProceedFromSafety()}
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleCompleteInspection}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                disabled={!canCompleteInspection()}
              >
                <CheckCircle className="w-4 h-4 mr-2 inline" />
                Complete Inspection
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

// Sub-components for each step
function SafetyChecksStep({ template, safetyChecks, onCheckChange }) {
  if (!template?.safetyChecks?.length) {
    return (
      <div className="text-center py-8">
        <AlertOctagon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No safety checks defined for this template.</p>
      </div>
    );
  }

  const allChecked = template.safetyChecks.every((_, index) => safetyChecks[index] === true);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <AlertOctagon className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Safety Preparedness</h3>
        <p className="text-sm text-gray-600 mt-2">
          Complete all safety checks before proceeding with the inspection. Your safety is our priority.
        </p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex">
          <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-yellow-800">Safety Requirements</h4>
            <p className="text-sm text-yellow-700 mt-1">
              All safety checks must be completed and verified before inspection can begin. 
              Do not proceed if any safety requirement cannot be met.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {template.safetyChecks.map((check, index) => (
          <div key={index} className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg">
            <input
              type="checkbox"
              checked={safetyChecks[index] || false}
              onChange={(e) => onCheckChange(index, e.target.checked)}
              className="mt-1 h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-900 cursor-pointer">
                {check}
              </label>
            </div>
            {safetyChecks[index] && (
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
            )}
          </div>
        ))}
      </div>

      {allChecked && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <p className="text-sm font-medium text-green-800">
            All safety checks completed. You may proceed with the inspection.
          </p>
        </div>
      )}
    </div>
  );
}

function InspectionStep({ template, checkpoints, onCheckpointChange, onAddFinding, findings }) {
  const [selectedCheckpoint, setSelectedCheckpoint] = useState(null);
  const [findingForm, setFindingForm] = useState({
    description: '',
    status: 'passed',
    action: '',
    priority: 'low'
  });

  const handleCheckpointClick = (checkpoint) => {
    setSelectedCheckpoint(checkpoint);
  };

  const handleMeasurementSave = (checkpointId, data) => {
    onCheckpointChange(checkpointId, { ...data, completed: true });
    setSelectedCheckpoint(null);
  };

  const handleAddFinding = () => {
    if (findingForm.description.trim()) {
      onAddFinding(findingForm);
      setFindingForm({
        description: '',
        status: 'passed',
        action: '',
        priority: 'low'
      });
    }
  };

  if (!template?.checkpoints?.length) {
    return (
      <div className="text-center py-8">
        <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No inspection checkpoints defined for this template.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Search className="w-12 h-12 text-blue-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Equipment Inspection</h3>
        <p className="text-sm text-gray-600 mt-2">
          Complete all mandatory checkpoints and record measurements, observations, and findings.
        </p>
      </div>

      {/* Checkpoints */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {template.checkpoints.map((checkpoint) => {
          const isCompleted = checkpoints[checkpoint.id]?.completed;
          const Icon = checkpoint.type === 'measurement' ? BarChart : 
                     checkpoint.type === 'test' ? Zap : Eye;
          
          return (
            <div
              key={checkpoint.id}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                isCompleted 
                  ? 'border-green-300 bg-green-50' 
                  : checkpoint.mandatory 
                    ? 'border-red-300 bg-red-50 hover:border-red-400'
                    : 'border-gray-300 bg-white hover:border-gray-400'
              }`}
              onClick={() => handleCheckpointClick(checkpoint)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <Icon className={`w-5 h-5 mt-0.5 ${
                    isCompleted ? 'text-green-600' : 'text-gray-600'
                  }`} />
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{checkpoint.name}</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      Type: {checkpoint.type}
                      {checkpoint.mandatory && ' • Mandatory'}
                    </p>
                    {checkpoint.parameters?.length > 0 && (
                      <p className="text-xs text-gray-600 mt-1">
                        Parameters: {checkpoint.parameters.join(', ')}
                      </p>
                    )}
                  </div>
                </div>
                {isCompleted && <CheckCircle className="w-5 h-5 text-green-600" />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Findings Section */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-4">Inspection Findings</h4>
        
        {/* Add Finding Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <textarea
              value={findingForm.description}
              onChange={(e) => setFindingForm({...findingForm, description: e.target.value})}
              placeholder="Describe finding or observation..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
          <div className="space-y-3">
            <select
              value={findingForm.status}
              onChange={(e) => setFindingForm({...findingForm, status: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="passed">Passed</option>
              <option value="failed">Failed</option>
              <option value="observation">Under Observation</option>
            </select>
            <select
              value={findingForm.priority}
              onChange={(e) => setFindingForm({...findingForm, priority: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
              <option value="critical">Critical</option>
            </select>
            <button
              onClick={handleAddFinding}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Add Finding
            </button>
          </div>
        </div>

        {/* Findings List */}
        <div className="space-y-2">
          {findings.map((finding) => (
            <div key={finding.id} className="flex items-start justify-between p-3 bg-white rounded border">
              <div className="flex-1">
                <p className="text-sm text-gray-900">{finding.description}</p>
                <div className="flex items-center space-x-4 mt-1">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    finding.status === 'passed' ? 'bg-green-100 text-green-800' :
                    finding.status === 'failed' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {finding.status}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    finding.priority === 'critical' ? 'bg-red-100 text-red-800' :
                    finding.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                    finding.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {finding.priority}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {findings.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">No findings recorded yet.</p>
          )}
        </div>
      </div>

      {/* Checkpoint Detail Modal */}
      {selectedCheckpoint && (
        <CheckpointDetailModal
          checkpoint={selectedCheckpoint}
          onClose={() => setSelectedCheckpoint(null)}
          onSave={(data) => handleMeasurementSave(selectedCheckpoint.id, data)}
          existingData={checkpoints[selectedCheckpoint.id]}
        />
      )}
    </div>
  );
}

function DocumentationStep({ journeyData, onDataChange }) {
  const [newPhoto, setNewPhoto] = useState('');
  const [newDocument, setNewDocument] = useState('');

  const addPhoto = () => {
    if (newPhoto.trim()) {
      onDataChange(prev => ({
        ...prev,
        photos: [...prev.photos, {
          id: Date.now(),
          name: newPhoto,
          timestamp: new Date().toISOString()
        }]
      }));
      setNewPhoto('');
    }
  };

  const addDocument = () => {
    if (newDocument.trim()) {
      onDataChange(prev => ({
        ...prev,
        documents: [...prev.documents, {
          id: Date.now(),
          name: newDocument,
          timestamp: new Date().toISOString()
        }]
      }));
      setNewDocument('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <FileText className="w-12 h-12 text-purple-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Documentation</h3>
        <p className="text-sm text-gray-600 mt-2">
          Attach photos, documents, and additional comments to support your inspection findings.
        </p>
      </div>

      {/* Photos Section */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
          <Camera className="w-4 h-4 mr-2" />
          Photos
        </h4>
        <div className="flex space-x-2 mb-3">
          <input
            type="text"
            value={newPhoto}
            onChange={(e) => setNewPhoto(e.target.value)}
            placeholder="Photo description or filename..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={addPhoto}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            Add Photo
          </button>
        </div>
        <div className="space-y-2">
          {journeyData.photos.map((photo) => (
            <div key={photo.id} className="flex items-center justify-between p-2 bg-white rounded border">
              <div className="flex items-center space-x-2">
                <Image className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-900">{photo.name}</span>
              </div>
              <span className="text-xs text-gray-500">{new Date(photo.timestamp).toLocaleString()}</span>
            </div>
          ))}
          {journeyData.photos.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">No photos attached.</p>
          )}
        </div>
      </div>

      {/* Documents Section */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
          <Paperclip className="w-4 h-4 mr-2" />
          Documents
        </h4>
        <div className="flex space-x-2 mb-3">
          <input
            type="text"
            value={newDocument}
            onChange={(e) => setNewDocument(e.target.value)}
            placeholder="Document name or description..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={addDocument}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            Add Document
          </button>
        </div>
        <div className="space-y-2">
          {journeyData.documents.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between p-2 bg-white rounded border">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-900">{doc.name}</span>
              </div>
              <span className="text-xs text-gray-500">{new Date(doc.timestamp).toLocaleString()}</span>
            </div>
          ))}
          {journeyData.documents.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">No documents attached.</p>
          )}
        </div>
      </div>

      {/* Comments Section */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
          <MessageSquare className="w-4 h-4 mr-2" />
          Additional Comments
        </h4>
        <textarea
          value={journeyData.comments}
          onChange={(e) => onDataChange(prev => ({...prev, comments: e.target.value}))}
          placeholder="Add any additional observations, recommendations, or notes..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={4}
        />
      </div>
    </div>
  );
}

function ReviewStep({ inspection, journeyData, template, onDataChange }) {
  const completedCheckpoints = template?.checkpoints?.filter(cp => 
    journeyData.checkpoints[cp.id]?.completed
  ).length || 0;
  
  const totalCheckpoints = template?.checkpoints?.length || 0;
  const mandatoryCheckpoints = template?.checkpoints?.filter(cp => cp.mandatory).length || 0;
  const completedMandatory = template?.checkpoints?.filter(cp => 
    cp.mandatory && journeyData.checkpoints[cp.id]?.completed
  ).length || 0;

  const failedFindings = journeyData.findings.filter(f => f.status === 'failed').length;
  const observationFindings = journeyData.findings.filter(f => f.status === 'observation').length;

  const estimatedHealthScore = Math.max(50, 
    inspection.healthScoreBefore - (failedFindings * 10) - (observationFindings * 2)
  );

  return (
    <div className="space-y-6">
      <div className="text-center">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Review & Submit</h3>
        <p className="text-sm text-gray-600 mt-2">
          Review your inspection results before submitting. Ensure all required checks are completed.
        </p>
      </div>

      {/* Inspection Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-4">Inspection Progress</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Checkpoints:</span>
              <span className="font-medium">{completedCheckpoints}/{totalCheckpoints}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Mandatory Completed:</span>
              <span className={`font-medium ${completedMandatory === mandatoryCheckpoints ? 'text-green-600' : 'text-red-600'}`}>
                {completedMandatory}/{mandatoryCheckpoints}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Findings:</span>
              <span className="font-medium">{journeyData.findings.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Failed Items:</span>
              <span className={`font-medium ${failedFindings > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {failedFindings}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-4">Equipment Health</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Before Inspection:</span>
              <span className="font-medium">{inspection.healthScoreBefore}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Estimated After:</span>
              <span className={`font-medium ${
                estimatedHealthScore >= inspection.healthScoreBefore ? 'text-green-600' : 'text-orange-600'
              }`}>
                {estimatedHealthScore}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Change:</span>
              <span className={`font-medium ${
                estimatedHealthScore >= inspection.healthScoreBefore ? 'text-green-600' : 'text-red-600'
              }`}>
                {estimatedHealthScore - inspection.healthScoreBefore > 0 ? '+' : ''}
                {estimatedHealthScore - inspection.healthScoreBefore}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Final Status */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-4">Overall Assessment</h4>
        <div className="grid grid-cols-3 gap-3">
          {['passed', 'observation', 'failed'].map(status => (
            <label key={status} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="finalStatus"
                value={status}
                checked={journeyData.finalStatus === status}
                onChange={(e) => onDataChange(prev => ({...prev, finalStatus: e.target.value}))}
                className="text-blue-600"
              />
              <span className={`px-3 py-2 rounded-lg text-sm font-medium flex-1 text-center ${
                status === 'passed' ? 'bg-green-100 text-green-800' :
                status === 'observation' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Validation Messages */}
      {completedMandatory < mandatoryCheckpoints && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-red-800">Incomplete Mandatory Checks</h4>
              <p className="text-sm text-red-700 mt-1">
                Please complete all mandatory checkpoints before submitting the inspection.
              </p>
            </div>
          </div>
        </div>
      )}

      {failedFindings > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-yellow-800">Failed Items Detected</h4>
              <p className="text-sm text-yellow-700 mt-1">
                This inspection contains {failedFindings} failed item(s). Consider creating maintenance backlogs.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Checkpoint Detail Modal
function CheckpointDetailModal({ checkpoint, onClose, onSave, existingData }) {
  const [data, setData] = useState({
    measurements: {},
    observations: '',
    status: 'passed',
    notes: '',
    ...existingData
  });

  const handleSave = () => {
    onSave(data);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <h3 className="text-base sm:text-lg font-medium text-gray-900">
            {checkpoint.name} - {checkpoint.type}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 sm:p-6 space-y-4">
          {checkpoint.type === 'measurement' && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Measurements</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {checkpoint.parameters?.map((param) => (
                  <div key={param}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {param} {checkpoint.unit && `(${checkpoint.unit})`}
                    </label>
                    <input
                      type="number"
                      value={data.measurements[param] || ''}
                      onChange={(e) => setData(prev => ({
                        ...prev,
                        measurements: {
                          ...prev.measurements,
                          [param]: e.target.value
                        }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter value"
                    />
                    {checkpoint.normalRange && (
                      <p className="text-xs text-gray-500 mt-1">
                        Normal: {checkpoint.normalRange.min} - {checkpoint.normalRange.max}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observations
            </label>
            <textarea
              value={data.observations}
              onChange={(e) => setData(prev => ({...prev, observations: e.target.value}))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Record your observations..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={data.status}
              onChange={(e) => setData(prev => ({...prev, status: e.target.value}))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="passed">Passed</option>
              <option value="failed">Failed</option>
              <option value="observation">Under Observation</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes
            </label>
            <textarea
              value={data.notes}
              onChange={(e) => setData(prev => ({...prev, notes: e.target.value}))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="Any additional notes..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Save Checkpoint
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}