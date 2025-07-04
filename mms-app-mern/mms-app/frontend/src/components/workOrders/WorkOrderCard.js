import React, { useState } from 'react';
import { 
  ArrowDown, ArrowRight, Play, Pause, CheckCircle, 
  Edit, FileText, Eye 
} from 'lucide-react';

export default function WorkOrderCard({ workOrder, onUpdateStatus }) {
  const [expanded, setExpanded] = useState(false);
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'Planned': return 'bg-blue-100 text-blue-800';
      case 'In Progress': return 'bg-yellow-100 text-yellow-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'On Hold': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'P1': return 'bg-red-100 text-red-800';
      case 'P2': return 'bg-orange-100 text-orange-800';
      case 'P3': return 'bg-yellow-100 text-yellow-800';
      case 'P4': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStatusUpdate = (newStatus) => {
    onUpdateStatus(workOrder._id, newStatus);
  };

  const isOverdue = new Date(workOrder.scheduledDate) < new Date() && workOrder.status !== 'Completed';

  return (
    <div className={`p-4 sm:p-6 ${isOverdue ? 'bg-red-50' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h4 className="text-sm sm:text-lg font-medium text-gray-900 truncate">{workOrder.title}</h4>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(workOrder.status)}`}>
              {workOrder.status}
            </span>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(workOrder.priority)}`}>
              {workOrder.priority}
            </span>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              workOrder.woType === 'Auto Generated' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
            }`}>
              {workOrder.woType}
            </span>
            {workOrder.triggerCondition && (
              <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
                AUTO TRIGGER
              </span>
            )}
            {isOverdue && (
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                OVERDUE
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
            <div>
              <span className="font-medium">Equipment:</span> 
              <span className="truncate"> {workOrder.equipmentId?.name || workOrder.equipmentName}</span>
            </div>
            <div>
              <span className="font-medium">Assigned:</span> {workOrder.assignedTo?.name || workOrder.assignedTo}
            </div>
            <div>
              <span className="font-medium">Scheduled:</span> 
              <span className={isOverdue ? 'text-red-600 font-medium' : ''}> 
                {new Date(workOrder.scheduledDate).toLocaleDateString()}
              </span>
            </div>
            <div>
              <span className="font-medium">Est. Hours:</span> {workOrder.estimatedHours}h
            </div>
          </div>

          {workOrder.triggerCondition && (
            <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-xs sm:text-sm">
              <span className="font-medium text-orange-800">Trigger:</span>
              <span className="text-orange-700 ml-1">{workOrder.triggerCondition.description}</span>
            </div>
          )}

          {workOrder.progress > 0 && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs sm:text-sm text-gray-600 mb-1">
                <span>Progress</span>
                <span>{workOrder.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
                <div 
                  className="bg-blue-500 h-1.5 sm:h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${workOrder.progress}%` }}
                ></div>
              </div>
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
            {workOrder.status === 'Planned' && (
              <button
                onClick={() => handleStatusUpdate('In Progress')}
                className="px-2 sm:px-3 py-1 bg-blue-600 text-white text-xs sm:text-sm rounded-lg hover:bg-blue-700 transition-colors min-h-[36px] flex items-center justify-center"
              >
                <Play className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                Start
              </button>
            )}
            {workOrder.status === 'In Progress' && (
              <>
                <button
                  onClick={() => handleStatusUpdate('On Hold')}
                  className="px-2 sm:px-3 py-1 bg-yellow-600 text-white text-xs sm:text-sm rounded-lg hover:bg-yellow-700 transition-colors min-h-[36px] flex items-center justify-center"
                >
                  <Pause className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  Pause
                </button>
                <button
                  onClick={() => handleStatusUpdate('Completed')}
                  className="px-2 sm:px-3 py-1 bg-green-600 text-white text-xs sm:text-sm rounded-lg hover:bg-green-700 transition-colors min-h-[36px] flex items-center justify-center"
                >
                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  Complete
                </button>
              </>
            )}
            {workOrder.status === 'On Hold' && (
              <button
                onClick={() => handleStatusUpdate('In Progress')}
                className="px-2 sm:px-3 py-1 bg-blue-600 text-white text-xs sm:text-sm rounded-lg hover:bg-blue-700 transition-colors min-h-[36px] flex items-center justify-center"
              >
                <Play className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                Resume
              </button>
            )}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <h5 className="font-medium text-gray-900 mb-3">Description</h5>
              <p className="text-xs sm:text-sm text-gray-600 mb-4">{workOrder.description}</p>
              
              <h5 className="font-medium text-gray-900 mb-3">Timeline</h5>
              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Created:</span>
                  <span>{new Date(workOrder.createdDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Scheduled:</span>
                  <span>{new Date(workOrder.scheduledDate).toLocaleDateString()}</span>
                </div>
                {workOrder.actualHours && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Actual Hours:</span>
                    <span>{workOrder.actualHours}h</span>
                  </div>
                )}
                {workOrder.backlogId && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">From Backlog:</span>
                    <span className="text-blue-600">{workOrder.backlogId}</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h5 className="font-medium text-gray-900 mb-3">Materials</h5>
              <div className="space-y-2 mb-4">
                {workOrder.materials?.map((material, index) => (
                  <div key={index} className="flex justify-between text-xs sm:text-sm">
                    <span className="text-gray-600 truncate">{material.item} (x{material.quantity})</span>
                    <span className="font-medium flex-shrink-0 ml-2">₹{material.totalCost}</span>
                  </div>
                ))}
                {(!workOrder.materials || workOrder.materials.length === 0) && (
                  <p className="text-xs sm:text-sm text-gray-500">No materials assigned</p>
                )}
              </div>

              <h5 className="font-medium text-gray-900 mb-3">Labor</h5>
              <div className="space-y-2">
                {workOrder.labor?.map((labor, index) => (
                  <div key={index} className="flex justify-between text-xs sm:text-sm">
                    <span className="text-gray-600 truncate">{labor.technician} ({labor.hours}h)</span>
                    <span className="font-medium flex-shrink-0 ml-2">₹{labor.total}</span>
                  </div>
                ))}
                {(!workOrder.labor || workOrder.labor.length === 0) && (
                  <p className="text-xs sm:text-sm text-gray-500">No labor assigned</p>
                )}
              </div>

              {(workOrder.estimatedCost || workOrder.actualCost) && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between text-xs sm:text-sm font-medium">
                    <span>Total Cost:</span>
                    <span>₹{workOrder.actualCost || workOrder.estimatedCost}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 sm:mt-6 flex flex-wrap items-center gap-2">
            <button className="px-3 py-2 bg-gray-600 text-white text-xs sm:text-sm rounded-lg hover:bg-gray-700 transition-colors min-h-[44px] flex items-center">
              <FileText className="w-4 h-4 mr-1 sm:mr-2" />
              Print
            </button>
            {workOrder.backlogId && (
              <button className="px-3 py-2 bg-blue-600 text-white text-xs sm:text-sm rounded-lg hover:bg-blue-700 transition-colors min-h-[44px] flex items-center">
                <Eye className="w-4 h-4 mr-1 sm:mr-2" />
                View Backlog
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}