import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Calendar, Clock, CheckCircle, 
  AlertTriangle, FileText, PlayCircle 
} from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import LoadingSpinner from '../common/LoadingSpinner';
import InspectionCard from './InspectionCard';
import InspectionModal from './InspectionModal';
import InspectionTemplatesModal from './InspectionTemplatesModal';
import InspectionJourneyModal from './InspectionJourneyModal';

export default function Inspections() {
  const [inspections, setInspections] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showInspectionJourney, setShowInspectionJourney] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { request } = useApi();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [inspectionsRes, equipmentRes, templatesRes] = await Promise.all([
        request('/api/inspections'),
        request('/api/equipment'),
        request('/api/inspections/templates')
      ]);
      setInspections(inspectionsRes.data);
      setEquipment(equipmentRes.data);
      setTemplates(templatesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createInspection = async (inspectionData) => {
    try {
      const response = await request('/api/inspections', {
        method: 'POST',
        data: inspectionData
      });
      setInspections([...inspections, response.data]);
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating inspection:', error);
    }
  };

  const updateInspectionStatus = async (inspectionId, newStatus) => {
    try {
      const response = await request(`/api/inspections/${inspectionId}/status`, {
        method: 'PUT',
        data: { status: newStatus }
      });
      setInspections(inspections.map(insp => 
        insp._id === inspectionId ? response.data : insp
      ));
    } catch (error) {
      console.error('Error updating inspection status:', error);
    }
  };

  const startInspectionJourney = (inspection) => {
    setSelectedInspection(inspection);
    setShowInspectionJourney(true);
  };

  const updateInspectionJourney = async (inspectionId, journeyData) => {
    try {
      const response = await request(`/api/inspections/${inspectionId}/journey`, {
        method: 'PUT',
        data: journeyData
      });
      setInspections(inspections.map(insp => 
        insp._id === inspectionId ? response.data : insp
      ));
      setShowInspectionJourney(false);
      setSelectedInspection(null);
    } catch (error) {
      console.error('Error updating inspection journey:', error);
    }
  };

  const saveTemplates = async (updatedTemplates) => {
    try {
      await request('/api/inspections/templates', {
        method: 'PUT',
        data: { templates: updatedTemplates }
      });
      setTemplates(updatedTemplates);
    } catch (error) {
      console.error('Error saving templates:', error);
    }
  };

  const filteredInspections = inspections.filter(inspection => {
    const matchesSearch = !searchTerm || 
      inspection.equipmentId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inspection.inspectionId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inspection.status === statusFilter;
    const matchesType = typeFilter === 'all' || inspection.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const inspectionStats = {
    total: inspections.length,
    scheduled: inspections.filter(i => i.status === 'Scheduled').length,
    inProgress: inspections.filter(i => i.status === 'In Progress').length,
    completed: inspections.filter(i => i.status === 'Completed').length,
    overdue: inspections.filter(i => 
      new Date(i.scheduledDate) < new Date() && i.status !== 'Completed'
    ).length
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header and Controls */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Inspection Management</h2>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm min-h-[44px] flex items-center"
            >
              <Plus className="w-4 h-4 mr-1 sm:mr-2" />
              Schedule Inspection
            </button>
            <button
              onClick={() => setShowTemplateModal(true)}
              className="px-3 sm:px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm min-h-[44px] flex items-center"
            >
              <FileText className="w-4 h-4 mr-1 sm:mr-2" />
              Templates
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[44px]"
          >
            <option value="all">All Status</option>
            <option value="Scheduled">Scheduled</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Overdue">Overdue</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[44px]"
          >
            <option value="all">All Types</option>
            <option value="Daily Equipment Check">Daily</option>
            <option value="Weekly Comprehensive Check">Weekly</option>
            <option value="Monthly Comprehensive">Monthly</option>
            <option value="Shutdown Inspection">Shutdown</option>
          </select>
          <input
            type="text"
            placeholder="Search inspections..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[44px]"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-6">
        <StatCard title="Total" value={inspectionStats.total} icon={Search} color="blue" />
        <StatCard title="Scheduled" value={inspectionStats.scheduled} icon={Calendar} color="blue" />
        <StatCard title="In Progress" value={inspectionStats.inProgress} icon={Clock} color="yellow" />
        <StatCard title="Completed" value={inspectionStats.completed} icon={CheckCircle} color="green" />
        <StatCard title="Overdue" value={inspectionStats.overdue} icon={AlertTriangle} color="red" />
      </div>

      {/* Inspections List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h3 className="text-base sm:text-lg font-medium text-gray-900">Inspections</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredInspections.map((inspection) => (
            <InspectionCard 
              key={inspection._id} 
              inspection={inspection} 
              onUpdateStatus={updateInspectionStatus}
              onStartJourney={startInspectionJourney}
            />
          ))}
        </div>
      </div>

      {/* Modals */}
      <InspectionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={createInspection}
        equipment={equipment}
        templates={templates}
      />

      <InspectionTemplatesModal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        templates={templates}
        onSave={saveTemplates}
      />

      {selectedInspection && (
        <InspectionJourneyModal
          isOpen={showInspectionJourney}
          onClose={() => {
            setShowInspectionJourney(false);
            setSelectedInspection(null);
          }}
          inspection={selectedInspection}
          template={templates.find(t => t._id === selectedInspection.templateId)}
          onSave={(journeyData) => updateInspectionJourney(selectedInspection._id, journeyData)}
        />
      )}
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