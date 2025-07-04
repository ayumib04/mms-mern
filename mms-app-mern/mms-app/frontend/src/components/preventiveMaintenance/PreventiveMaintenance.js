import React, { useState, useEffect } from 'react';
import { Calendar, Plus, AlertTriangle, CheckCircle, Target } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import LoadingSpinner from '../common/LoadingSpinner';
import PMScheduleCard from './PMScheduleCard';
import PMScheduleModal from './PMScheduleModal';

export default function PreventiveMaintenance() {
  const [pmSchedules, setPmSchedules] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [view, setView] = useState('schedule');
  const [loading, setLoading] = useState(true);
  const { request } = useApi();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pmResponse, equipmentResponse] = await Promise.all([
        request('/api/preventive-maintenance'),
        request('/api/equipment')
      ]);
      setPmSchedules(pmResponse.data);
      setEquipment(equipmentResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createPMSchedule = async (pmData) => {
    try {
      const response = await request('/api/preventive-maintenance', {
        method: 'POST',
        data: pmData
      });
      setPmSchedules([...pmSchedules, response.data]);
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating PM schedule:', error);
    }
  };

  const updatePMStatus = async (pmId, newStatus) => {
    try {
      const response = await request(`/api/preventive-maintenance/${pmId}/status`, {
        method: 'PUT',
        data: { status: newStatus }
      });
      setPmSchedules(pmSchedules.map(pm => 
        pm._id === pmId ? response.data : pm
      ));
    } catch (error) {
      console.error('Error updating PM status:', error);
    }
  };

  const autoGeneratePMSchedules = async () => {
    try {
      const response = await request('/api/preventive-maintenance/auto-generate', {
        method: 'POST'
      });
      setPmSchedules([...pmSchedules, ...response.data.schedules]);
      alert(`Successfully generated ${response.data.count} PM schedules!`);
    } catch (error) {
      console.error('Error auto-generating PM schedules:', error);
      alert('Failed to auto-generate PM schedules');
    }
  };

  const pmStats = {
    scheduled: pmSchedules.filter(pm => pm.status === 'Scheduled').length,
    overdue: pmSchedules.filter(pm => 
      new Date(pm.nextDue) < new Date() && pm.status !== 'Completed'
    ).length,
    completed: pmSchedules.filter(pm => pm.status === 'Completed').length,
    compliance: 87 // This should be calculated from actual data
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header and Controls */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Preventive Maintenance</h2>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              onClick={autoGeneratePMSchedules}
              className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm min-h-[44px] flex items-center"
            >
              <Calendar className="w-4 h-4 mr-1 sm:mr-2" />
              Auto-Generate Schedules
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm min-h-[44px] flex items-center"
            >
              <Plus className="w-4 h-4 mr-1 sm:mr-2" />
              Create PM Schedule
            </button>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          {['schedule', 'calendar', 'analytics'].map((viewType) => (
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

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <StatCard
          title="Scheduled"
          value={pmStats.scheduled}
          icon={Calendar}
          color="blue"
        />
        <StatCard
          title="Overdue"
          value={pmStats.overdue}
          icon={AlertTriangle}
          color="red"
        />
        <StatCard
          title="Completed"
          value={pmStats.completed}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="Compliance"
          value={`${pmStats.compliance}%`}
          icon={Target}
          color="blue"
        />
      </div>

      {/* Content based on view */}
      {view === 'schedule' && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h3 className="text-base sm:text-lg font-medium text-gray-900">PM Schedules</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {pmSchedules.map((pm) => (
              <PMScheduleCard 
                key={pm._id} 
                pmSchedule={pm} 
                onUpdateStatus={updatePMStatus}
              />
            ))}
          </div>
        </div>
      )}

      {view === 'calendar' && <PMCalendarView schedules={pmSchedules} />}
      {view === 'analytics' && <PMAnalyticsView schedules={pmSchedules} equipment={equipment} />}

      {/* Create PM Schedule Modal */}
      <PMScheduleModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={createPMSchedule}
        equipment={equipment}
      />
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }) {
  const colorClasses = {
    blue: 'text-blue-500',
    red: 'text-red-500',
    green: 'text-green-500'
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

function PMCalendarView({ schedules }) {
  const getDaysInMonth = () => {
    const days = [];
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const hasPM = schedules.some(pm => 
        new Date(pm.nextDue).toDateString() === date.toDateString()
      );
      days.push({ date: i, hasPM });
    }
    return days;
  };

  const days = getDaysInMonth();

  return (
    <div className="bg-white rounded-lg shadow p-4 sm:p-6">
      <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">PM Calendar View</h3>
      <div className="grid grid-cols-7 gap-2 sm:gap-4">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-xs sm:text-sm font-medium text-gray-600">
            {day}
          </div>
        ))}
        {days.map((day, index) => (
          <div key={index} className={`p-1 sm:p-2 text-center rounded-lg border min-h-[40px] sm:min-h-[60px] ${
            day.hasPM ? 'bg-blue-100 border-blue-300' : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="text-xs sm:text-sm font-medium">{day.date}</div>
            {day.hasPM && <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full mx-auto mt-1"></div>}
          </div>
        ))}
      </div>
    </div>
  );
}

function PMAnalyticsView({ schedules, equipment }) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">PM Effectiveness</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-green-600">87%</div>
            <div className="text-xs sm:text-sm text-gray-600">Schedule Compliance</div>
          </div>
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-blue-600">23%</div>
            <div className="text-xs sm:text-sm text-gray-600">Reduction in Breakdowns</div>
          </div>
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-yellow-600">₹1.2M</div>
            <div className="text-xs sm:text-sm text-gray-600">Cost Savings</div>
          </div>
        </div>
      </div>
    </div>
  );
}