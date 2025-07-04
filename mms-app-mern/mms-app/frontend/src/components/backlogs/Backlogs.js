import React, { useState, useEffect } from 'react';
import { Plus, FileText, Package, Clock, CheckCircle, AlertTriangle, UserCheck, Wrench } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import LoadingSpinner from '../common/LoadingSpinner';
import BacklogCard from './BacklogCard';
import BacklogKanbanCard from './BacklogKanbanCard';
import BacklogModal from './BacklogModal';
import BulkAssignmentModal from './BulkAssignmentModal';

export default function Backlogs() {
  const [backlogs, setBacklogs] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [users, setUsers] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [view, setView] = useState('list');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBacklogs, setSelectedBacklogs] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const { request } = useApi();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [backlogsRes, equipmentRes, usersRes] = await Promise.all([
        request('/api/backlogs'),
        request('/api/equipment'),
        request('/api/users')
      ]);
      setBacklogs(backlogsRes.data);
      setEquipment(equipmentRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createBacklog = async (backlogData) => {
    try {
      const response = await request('/api/backlogs', {
        method: 'POST',
        data: backlogData
      });
      setBacklogs([...backlogs, response.data]);
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating backlog:', error);
    }
  };

  const updateBacklogStatus = async (backlogId, newStatus) => {
    try {
      const response = await request(`/api/backlogs/${backlogId}/status`, {
        method: 'PUT',
        data: { status: newStatus }
      });
      setBacklogs(backlogs.map(b => b._id === backlogId ? response.data : b));
    } catch (error) {
      console.error('Error updating backlog status:', error);
    }
  };

  const generateWorkOrderFromBacklog = async (backlogId) => {
    try {
      const response = await request(`/api/backlogs/${backlogId}/generate-wo`, {
        method: 'POST'
      });
      
      // Update backlog to reflect work order creation
      setBacklogs(backlogs.map(b => 
        b._id === backlogId 
          ? { ...b, workOrderId: response.data.workOrder._id, status: 'Planned' }
          : b
      ));
      
      alert(`Work Order ${response.data.workOrder.workOrderId} created successfully!`);
    } catch (error) {
      console.error('Error generating work order:', error);
      alert('Failed to generate work order');
    }
  };

  const handleSelectBacklog = (backlogId, selected) => {
    setSelectedBacklogs(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(backlogId);
      } else {
        newSet.delete(backlogId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (selected) => {
    if (selected) {
      setSelectedBacklogs(new Set(filteredBacklogs.map(b => b._id)));
    } else {
      setSelectedBacklogs(new Set());
    }
  };

  const handleGenerateWorkOrders = async () => {
    const selectedBacklogsList = Array.from(selectedBacklogs);
    const eligibleBacklogs = selectedBacklogsList.filter(id => {
      const backlog = backlogs.find(b => b._id === id);
      return backlog && ['Open', 'Validated', 'Planned'].includes(backlog.status) && !backlog.workOrderId;
    });

    if (eligibleBacklogs.length === 0) {
      alert('No eligible backlogs selected. Backlogs must be Open, Validated, or Planned status and not already have work orders.');
      return;
    }

    try {
      const response = await request('/api/backlogs/bulk-generate-wo', {
        method: 'POST',
        data: { backlogIds: eligibleBacklogs }
      });

      // Update backlogs
      fetchData();
      
      alert(`Successfully generated ${response.data.count} work orders!`);
      setSelectedBacklogs(new Set());
    } catch (error) {
      console.error('Error generating work orders:', error);
      alert('Failed to generate work orders');
    }
  };

  const handleBulkAssign = async (assignments) => {
    const selectedBacklogsList = Array.from(selectedBacklogs);
    
    try {
      const response = await request('/api/backlogs/bulk-update', {
        method: 'PUT',
        data: {
          backlogIds: selectedBacklogsList,
          updates: assignments
        }
      });

      // Update local state
      fetchData();
      
      alert(`Successfully updated ${response.data.count} backlogs!`);
      setSelectedBacklogs(new Set());
      setShowBulkModal(false);
    } catch (error) {
      console.error('Error bulk updating backlogs:', error);
      alert('Failed to update backlogs');
    }
  };

  const filteredBacklogs = backlogs.filter(backlog => {
    const matchesSearch = !searchTerm || 
      backlog.backlogId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      backlog.equipmentId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      backlog.issue?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = priorityFilter === 'all' || backlog.priority === priorityFilter;
    const matchesStatus = statusFilter === 'all' || backlog.status === statusFilter;
    
    return matchesSearch && matchesPriority && matchesStatus;
  });

  const backlogStats = {
    total: backlogs.length,
    open: backlogs.filter(b => ['Open', 'Validated', 'Planned'].includes(b.status)).length,
    inProgress: backlogs.filter(b => b.status === 'In Progress').length,
    completed: backlogs.filter(b => b.status === 'Completed').length,
    overdue: backlogs.filter(b => 
      new Date(b.dueDate) < new Date() && b.status !== 'Completed'
    ).length
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header and Controls */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Backlog Management</h2>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm min-h-[44px] flex items-center"
            >
              <Plus className="w-4 h-4 mr-1 sm:mr-2" />
              Create Backlog
            </button>
            {selectedBacklogs.size > 0 && (
              <>
                <button
                  onClick={() => setShowBulkModal(true)}
                  className="px-3 sm:px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm min-h-[44px] flex items-center"
                >
                  <UserCheck className="w-4 h-4 mr-1 sm:mr-2" />
                  Bulk Assign ({selectedBacklogs.size})
                </button>
                <button
                  onClick={handleGenerateWorkOrders}
                  className="px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm min-h-[44px] flex items-center"
                >
                  <Wrench className="w-4 h-4 mr-1 sm:mr-2" />
                  Generate WOs ({selectedBacklogs.size})
                </button>
              </>
            )}
          </div>
        </div>

        {/* Filters and View Toggle */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between space-y-3 lg:space-y-0">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[44px]"
            >
              <option value="all">All Priority</option>
              <option value="P1">P1 - Critical</option>
              <option value="P2">P2 - High</option>
              <option value="P3">P3 - Medium</option>
              <option value="P4">P4 - Low</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[44px]"
            >
              <option value="all">All Status</option>
              <option value="Open">Open</option>
              <option value="Validated">Validated</option>
              <option value="Planned">Planned</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
            <input
              type="text"
              placeholder="Search backlogs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[44px]"
            />
          </div>
          
          <div className="flex bg-gray-100 rounded-lg p-1">
            {['list', 'kanban'].map((viewType) => (
              <button
                key={viewType}
                onClick={() => setView(viewType)}
                className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors flex-1 min-h-[40px] ${
                  view === viewType 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {viewType.charAt(0).toUpperCase() + viewType.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-6">
        <StatCard title="Total" value={backlogStats.total} icon={FileText} color="blue" />
        <StatCard title="Open" value={backlogStats.open} icon={Package} color="blue" />
        <StatCard title="In Progress" value={backlogStats.inProgress} icon={Clock} color="yellow" />
        <StatCard title="Completed" value={backlogStats.completed} icon={CheckCircle} color="green" />
        <StatCard title="Overdue" value={backlogStats.overdue} icon={AlertTriangle} color="red" />
      </div>

      {/* Backlogs Content */}
      {view === 'list' && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-medium text-gray-900">Backlogs</h3>
              {filteredBacklogs.length > 0 && (
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedBacklogs.size === filteredBacklogs.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <label className="text-sm text-gray-600">Select All</label>
                </div>
              )}
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {filteredBacklogs.map((backlog) => (
              <BacklogCard 
                key={backlog._id} 
                backlog={backlog} 
                onUpdateStatus={updateBacklogStatus}
                onGenerateWorkOrder={generateWorkOrderFromBacklog}
                onSelect={handleSelectBacklog}
                isSelected={selectedBacklogs.has(backlog._id)}
              />
            ))}
          </div>
        </div>
      )}

      {view === 'kanban' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-6">
          {['Open', 'Validated', 'Planned', 'In Progress', 'Completed'].map((status) => (
            <div key={status} className="bg-white rounded-lg shadow">
              <div className="p-3 sm:p-4 border-b border-gray-200">
                <h3 className="text-xs sm:text-sm font-medium text-gray-900">
                  {status} ({filteredBacklogs.filter(b => b.status === status).length})
                </h3>
              </div>
              <div className="p-3 sm:p-4 space-y-3 min-h-96 overflow-y-auto">
                {filteredBacklogs
                  .filter(b => b.status === status)
                  .map((backlog) => (
                    <BacklogKanbanCard 
                      key={backlog._id} 
                      backlog={backlog} 
                      onUpdateStatus={updateBacklogStatus}
                      onGenerateWorkOrder={generateWorkOrderFromBacklog}
                    />
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <BacklogModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={createBacklog}
        equipment={equipment}
      />

      <BulkAssignmentModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        onSave={handleBulkAssign}
        selectedCount={selectedBacklogs.size}
        users={users}
      />
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }) {
  const colorClasses = {
    blue: 'text-blue-500',
    yellow: 'text-yellow-500',
    green: 'text-green-500',
    red: 'text-red-500'
  };

  return (
    <div className="bg-white rounded-lg shadow p-3 sm:p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-gray-600">{title}</p>
          <p className="text-xl sm:text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <Icon className={`w-6 h-6 sm:w-8 sm:h-8 ${colorClasses[color]} flex-shrink-0`} />
      </div>
    </div>
  );
}