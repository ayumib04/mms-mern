import React, { useState } from 'react';
import { 
  ArrowDown, ArrowRight, Play, CheckCircle, 
  PlayCircle, Edit, FileText, Bell 
} from 'lucide-react';

export default function InspectionCard({ inspection, onUpdateStatus, onStartJourney }) {
  const [expanded, setExpanded] = useState(false);
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'Scheduled': return 'bg-blue-100 text-blue-800';
      case 'In Progress': return 'bg-yellow-100 text-yellow-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isOverdue = new Date(inspection.scheduledDate) < new Date() && inspection.status !== 'Completed';
  const actualStatus = isOverdue ? 'Overdue' : inspection.status;

  const handleStatusUpdate = (newStatus) => {
    onUpdateStatus(inspection._id, newStatus);
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h4 className="text-sm sm:text-lg font-medium text-gray-900">{inspection.inspectionId}</h4>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(actualStatus)}`}>
              {actualStatus}
            </span>
            <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
              {inspection.type}
            </span>
            {inspection.isDraft && (
              <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
                DRAFT
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
            <div>
              <span className="font-medium">Equipment:</span> 
              <span className="truncate"> {inspection.equipmentId?.name || 'N/A'}</span>
            </div>
            <div>
              <span className="font-medium">Assigned:</span> {inspection.assignedTo?.name || inspection.assignedTo}
            </div>
            <div>
              <span className="font-medium">Scheduled:</span> 
              <span className={isOverdue ? 'text-red-600 font-medium' : ''}> 
                {new Date(inspection.scheduledDate).toLocaleDateString()}
              </span>
            </div>
            <div>
              <span className="font-medium">Duration:</span> {inspection.estimatedDuration}
            </div>
          </div>

          {inspection.resourceTracking?.totalTimeSpent > 0 && (
            <div className="mt-2 text-xs text-gray-600">
              <span className="font-medium">Time Spent:</span> {inspection.resourceTracking.totalTimeSpent}h 
              <span className="ml-2 font-medium">Tries:</span> {inspection.resourceTracking.totalTries}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            {expanded ? <ArrowDown className="w-4 h-4 sm:w-5 sm:h-5" /> : <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
            {(inspection.status === 'Scheduled' || inspection.status === 'In Progress') && (
              <button
                onClick={() => onStartJourney(inspection)}
                className="px-2 sm:px-3 py-1 bg-green-600 text-white text-xs sm:text-sm rounded-lg hover:bg-green-700 transition-colors min-h-[36px] flex items-center justify-center"
              >
                <PlayCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                Start Inspection
              </button>
            )}
            {inspection.status === 'Scheduled' && (
              <button
                onClick={() => handleStatusUpdate('In Progress')}
                className="px-2 sm:px-3 py-1 bg-blue-600 text-white text-xs sm:text-sm rounded-lg hover:bg-blue-700 transition-colors min-h-[36px] flex items-center justify-center"
              >
                <Play className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                Start
              </button>
            )}
            {inspection.status === 'In Progress' && !inspection.isDraft && (
              <button
                onClick={() => handleStatusUpdate('Completed')}
                className="px-2 sm:px-3 py-1 bg-green-600 text-white text-xs sm:text-sm rounded-lg hover:bg-green-700 transition-colors min-h-[36px] flex items-center justify-center"
              >
                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                Complete
              </button>
            )}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <h5 className="font-medium text-gray-900 mb-3">Inspection Details</h5>
              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Priority:</span>
                  <span className="font-medium">{inspection.priority}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Template:</span>
                  <span className="font-medium">{inspection.templateId?.name || 'No Template'}</span>
                </div>
                {inspection.healthScoreBefore && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Health Score Before:</span>
                    <span className="font-medium">{inspection.healthScoreBefore}%</span>
                  </div>
                )}
                {inspection.healthScoreAfter && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Health Score After:</span>
                    <span className="font-medium">{inspection.healthScoreAfter}%</span>
                  </div>
                )}
              </div>
            </div>
            <div>
              <h5 className="font-medium text-gray-900 mb-3">Resource Tracking</h5>
              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Tries:</span>
                  <span className="font-medium">{inspection.resourceTracking?.totalTries || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Time:</span>
                  <span className="font-medium">{inspection.resourceTracking?.totalTimeSpent || 0}h</span>
                </div>
                {inspection.resourceTracking?.measurementPhase?.startTime && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Measurement Phase:</span>
                    <span className="font-medium">
                      {inspection.resourceTracking.measurementPhase.endTime ? 'Completed' : 'In Progress'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 sm:mt-6 flex flex-wrap items-center gap-2">
            <button className="px-3 py-2 bg-gray-600 text-white text-xs sm:text-sm rounded-lg hover:bg-gray-700 transition-colors min-h-[44px] flex items-center">
              <Edit className="w-4 h-4 mr-1 sm:mr-2" />
              Edit
            </button>
            <button className="px-3 py-2 bg-gray-600 text-white text-xs sm:text-sm rounded-lg hover:bg-gray-700 transition-colors min-h-[44px] flex items-center">
              <FileText className="w-4 h-4 mr-1 sm:mr-2" />
              Report
            </button>
            {inspection.escalationSettings?.escalationContacts?.length > 0 && (
              <button className="px-3 py-2 bg-orange-600 text-white text-xs sm:text-sm rounded-lg hover:bg-orange-700 transition-colors min-h-[44px] flex items-center">
                <Bell className="w-4 h-4 mr-1 sm:mr-2" />
                Escalate
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}