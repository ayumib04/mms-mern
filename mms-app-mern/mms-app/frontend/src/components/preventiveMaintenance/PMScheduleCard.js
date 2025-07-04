import React, { useState } from 'react';
import { ArrowDown, ArrowRight, Play, CheckCircle, Edit, Calendar } from 'lucide-react';

export default function PMScheduleCard({ pmSchedule, onUpdateStatus }) {
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

  const isOverdue = new Date(pmSchedule.nextDue) < new Date() && pmSchedule.status !== 'Completed';
  const actualStatus = isOverdue ? 'Overdue' : pmSchedule.status;

  const getNextStatus = (currentStatus) => {
    switch (currentStatus) {
      case 'Scheduled': return 'In Progress';
      case 'In Progress': return 'Completed';
      default: return null;
    }
  };

  const getActionLabel = (currentStatus) => {
    switch (currentStatus) {
      case 'Scheduled': return 'Start Maintenance';
      case 'In Progress': return 'Complete';
      default: return null;
    }
  };

  const handleStatusUpdate = () => {
    const nextStatus = getNextStatus(pmSchedule.status);
    if (nextStatus) {
      onUpdateStatus(pmSchedule._id, nextStatus);
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h4 className="text-sm sm:text-lg font-medium text-gray-900 truncate">{pmSchedule.title}</h4>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(actualStatus)}`}>
              {actualStatus}
            </span>
            <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
              {pmSchedule.frequency}
            </span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
            <div>
              <span className="font-medium">Equipment:</span> 
              <span className="truncate"> {pmSchedule.equipmentId?.name || pmSchedule.equipmentName}</span>
            </div>
            <div>
              <span className="font-medium">Assigned:</span> {pmSchedule.assignedTo?.name || pmSchedule.assignedTo || 'Unassigned'}
            </div>
            <div>
              <span className="font-medium">Next Due:</span> 
              <span className={isOverdue ? 'text-red-600 font-medium' : ''}> 
                {new Date(pmSchedule.nextDue).toLocaleDateString()}
              </span>
            </div>
            <div>
              <span className="font-medium">Duration:</span> {pmSchedule.estimatedDuration}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            {expanded ? <ArrowDown className="w-4 h-4 sm:w-5 sm:h-5" /> : <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>
          
          {getActionLabel(pmSchedule.status) && (
            <button
              onClick={handleStatusUpdate}
              className="px-2 sm:px-3 py-1 bg-blue-600 text-white text-xs sm:text-sm rounded-lg hover:bg-blue-700 transition-colors min-h-[36px] flex items-center"
            >
              {pmSchedule.status === 'Scheduled' && <Play className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />}
              {pmSchedule.status === 'In Progress' && <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />}
              <span className="hidden sm:inline">{getActionLabel(pmSchedule.status)}</span>
              <span className="sm:hidden">{pmSchedule.status === 'Scheduled' ? 'Start' : 'Complete'}</span>
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Checklist */}
            <div>
              <h5 className="font-medium text-gray-900 mb-3">Maintenance Checklist</h5>
              <div className="space-y-2">
                {pmSchedule.checklist?.map((item, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <input 
                      type="checkbox" 
                      className="mt-1 rounded text-blue-600 min-w-[16px] min-h-[16px]"
                    />
                    <span className="text-xs sm:text-sm text-gray-700 leading-relaxed">{item}</span>
                  </div>
                )) || <p className="text-xs sm:text-sm text-gray-500">No checklist items</p>}
              </div>
            </div>

            {/* History */}
            <div>
              <h5 className="font-medium text-gray-900 mb-3">Completion History</h5>
              <div className="space-y-2">
                {pmSchedule.completionHistory?.map((history, index) => (
                  <div key={index} className="text-xs sm:text-sm p-2 bg-gray-50 rounded">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Completed:</span>
                      <span>{new Date(history.completedDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">By:</span>
                      <span className="truncate ml-2">{history.completedBy}</span>
                    </div>
                    {history.actualCost && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Cost:</span>
                        <span>₹{history.actualCost}</span>
                      </div>
                    )}
                  </div>
                )) || <p className="text-xs sm:text-sm text-gray-500">No completion history</p>}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-600">Estimated Cost:</span>
                  <span className="font-medium">₹{pmSchedule.estimatedCost}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 sm:mt-6 flex flex-wrap items-center gap-2">
            <button className="px-3 py-2 bg-gray-600 text-white text-xs sm:text-sm rounded-lg hover:bg-gray-700 transition-colors min-h-[44px] flex items-center">
              <Edit className="w-4 h-4 mr-1 sm:mr-2" />
              Edit
            </button>
            <button className="px-3 py-2 bg-gray-600 text-white text-xs sm:text-sm rounded-lg hover:bg-gray-700 transition-colors min-h-[44px] flex items-center">
              <Calendar className="w-4 h-4 mr-1 sm:mr-2" />
              Reschedule
            </button>
          </div>
        </div>
      )}
    </div>
  );
}