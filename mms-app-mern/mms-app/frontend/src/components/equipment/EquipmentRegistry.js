// frontend/src/components/equipment/EquipmentRegistry.js
import React, { useState, useEffect } from 'react';
import { 
  Plus, Upload, Download, Edit, Trash2, Eye, 
  ChevronRight, ChevronDown, Search, Filter,
  Factory, Cog, Package, Wrench, Settings
} from 'lucide-react';
import apiService from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';
import Pagination from '../common/Pagination';
import EquipmentModal from './EquipmentModal';
import EquipmentDetails from './EquipmentDetails';
import { toast } from 'react-toastify';
import { useWebSocket } from '../../hooks/useWebSocket';

const EquipmentRegistry = () => {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('tree');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    level: 'all',
    criticality: 'all',
    status: 'all'
  });
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    if (view === 'tree') {
      fetchEquipmentHierarchy();
    } else {
      fetchEquipment();
    }
  }, [view, filters, searchTerm, pagination.page]);

  // Subscribe to real-time equipment updates
  useWebSocket('equipment:created', (data) => {
    toast.success('New equipment added');
    if (view === 'tree') {
      fetchEquipmentHierarchy();
    } else {
      fetchEquipment();
    }
  });

  useWebSocket('equipment:updated', (data) => {
    setEquipment(prev => prev.map(eq => eq._id === data._id ? data : eq));
  });

  useWebSocket('equipment:deleted', (equipmentId) => {
    setEquipment(prev => prev.filter(eq => eq._id !== equipmentId));
    toast.info('Equipment deleted');
  });

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
        ...(filters.level !== 'all' && { level: filters.level }),
        ...(filters.criticality !== 'all' && { criticality: filters.criticality }),
        ...(filters.status !== 'all' && { status: filters.status })
      };
      
      const response = await apiService.equipment.getAll(params);
      setEquipment(response.data.data);
      setPagination({
        ...pagination,
        total: response.data.total,
        pages: response.data.pages
      });
    } catch (error) {
      toast.error('Failed to load equipment');
    } finally {
      setLoading(false);
    }
  };

  const fetchEquipmentHierarchy = async () => {
    try {
      setLoading(true);
      const response = await apiService.equipment.getHierarchy();
      setEquipment(response.data.data);
    } catch (error) {
      toast.error('Failed to load equipment hierarchy');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEquipment = async (data) => {
    try {
      await apiService.equipment.create(data);
      toast.success('Equipment created successfully');
      setShowCreateModal(false);
      if (view === 'tree') {
        fetchEquipmentHierarchy();
      } else {
        fetchEquipment();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create equipment');
    }
  };

  const handleUpdateEquipment = async (id, data) => {
    try {
      await apiService.equipment.update(id, data);
      toast.success('Equipment updated successfully');
      if (view === 'tree') {
        fetchEquipmentHierarchy();
      } else {
        fetchEquipment();
      }
    } catch (error) {
      toast.error('Failed to update equipment');
    }
  };

  const handleDeleteEquipment = async (id) => {
    if (window.confirm('Are you sure you want to delete this equipment?')) {
      try {
        await apiService.equipment.delete(id);
        toast.success('Equipment deleted successfully');
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete equipment');
      }
    }
  };

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const response = await apiService.equipment.import(file);
      toast.success(`Imported ${response.data.created} equipment successfully`);
      if (response.data.errors > 0) {
        toast.warning(`${response.data.errors} items failed to import`);
      }
      fetchEquipment();
    } catch (error) {
      toast.error('Import failed');
    }
  };

  const handleExport = async () => {
    try {
      const params = {
        format: 'csv',
        ...(filters.level !== 'all' && { level: filters.level }),
        ...(filters.criticality !== 'all' && { criticality: filters.criticality }),
        ...(filters.status !== 'all' && { status: filters.status })
      };
      
      const response = await apiService.equipment.export(params);
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `equipment_export_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Export completed');
    } catch (error) {
      toast.error('Export failed');
    }
  };

  const toggleNodeExpansion = (nodeId) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const renderEquipmentTree = (items, level = 0) => {
    return items.map(item => {
      const hasChildren = item.children && item.children.length > 0;
      const isExpanded = expandedNodes.has(item._id);
      
      return (
        <div key={item._id} className={`ml-${level * 4}`}>
          <div className="flex items-center py-2 px-3 hover:bg-gray-50 rounded-lg group min-h-[44px]">
            {hasChildren ? (
              <button
                onClick={() => toggleNodeExpansion(item._id)}
                className="p-1 rounded hover:bg-gray-200 mr-2 min-h-[32px] min-w-[32px] flex items-center justify-center"
              >
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            ) : (
              <div className="w-8 mr-2"></div>
            )}
            
            <div className={`w-4 h-4 rounded mr-3 flex-shrink-0 ${
              item.level === 1 ? 'bg-blue-500' :
              item.level === 2 ? 'bg-green-500' :
              item.level === 3 ? 'bg-yellow-500' :
              item.level === 4 ? 'bg-orange-500' : 'bg-purple-500'
            }`}></div>
            
            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => {
              setSelectedEquipment(item);
              setShowDetailsModal(true);
            }}>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-900 truncate">{item.name}</span>
                <span className="text-xs text-gray-500 flex-shrink-0">({item.code})</span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full flex-shrink-0 ${
                  item.criticality === 'A' ? 'bg-red-100 text-red-800' :
                  item.criticality === 'B' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {item.criticality}
                </span>
              </div>
              <div className="text-xs text-gray-500 truncate">
                Level {item.level} • {item.type} • {item.location}
              </div>
            </div>
            
            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setSelectedEquipment(item);
                  setShowDetailsModal(true);
                }}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setSelectedEquipment(item);
                  setShowCreateModal(true);
                }}
                className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  handleDeleteEquipment(item._id);
                }}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {hasChildren && isExpanded && (
            <div className="ml-4">
              {renderEquipmentTree(item.children, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  const getEquipmentIcon = (type) => {
    switch (type) {
      case 'plant': return Factory;
      case 'equipment': return Cog;
      case 'assembly': return Package;
      case 'sub-assembly': return Wrench;
      case 'component': return Settings;
      default: return Cog;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header and Controls */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Equipment Registry</h2>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              onClick={() => {
                setSelectedEquipment(null);
                setShowCreateModal(true);
              }}
              className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm min-h-[44px] flex items-center"
            >
              <Plus className="w-4 h-4 mr-1 sm:mr-2" />
              <span>Add Equipment</span>
            </button>
            <label className="px-3 sm:px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm min-h-[44px] flex items-center cursor-pointer">
              <Upload className="w-4 h-4 mr-1 sm:mr-2" />
              <span>Import</span>
              <input
                type="file"
                accept=".csv,.xlsx,.xls,.json"
                onChange={handleImport}
                className="hidden"
              />
            </label>
            <button
              onClick={handleExport}
              className="px-3 sm:px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm min-h-[44px] flex items-center"
            >
              <Download className="w-4 h-4 mr-1 sm:mr-2" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-4">
          <div className="sm:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search equipment..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[44px]"
              />
            </div>
          </div>
          <select
            value={filters.level}
            onChange={(e) => setFilters({ ...filters, level: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[44px]"
          >
            <option value="all">All Levels</option>
            <option value="1">Plant</option>
            <option value="2">Equipment</option>
            <option value="3">Assembly</option>
            <option value="4">Sub-Assembly</option>
            <option value="5">Component</option>
          </select>
          <select
            value={filters.criticality}
            onChange={(e) => setFilters({ ...filters, criticality: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[44px]"
          >
            <option value="all">All Criticality</option>
            <option value="A">Critical (A)</option>
            <option value="B">Important (B)</option>
            <option value="C">Standard (C)</option>
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[44px]"
          >
            <option value="all">All Status</option>
            <option value="Active">Active</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Decommissioned">Decommissioned</option>
          </select>
        </div>

        {/* View Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          {['tree', 'cards', 'list'].map((viewType) => (
            <button
              key={viewType}
              onClick={() => setView(viewType)}
              className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors min-h-[40px] flex-1 ${
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

      {/* Equipment Content */}
      {loading ? (
        <LoadingSpinner text="Loading equipment..." />
      ) : equipment.length === 0 ? (
        <EmptyState
          icon={Factory}
          title="No equipment found"
          description="Get started by adding your first equipment"
          action={
            <button
              onClick={() => {
                setSelectedEquipment(null);
                setShowCreateModal(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2 inline" />
              Add Equipment
            </button>
          }
        />
      ) : (
        <>
          {view === 'tree' && (
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Equipment Hierarchy</h3>
              {renderEquipmentTree(equipment)}
            </div>
          )}

          {view === 'cards' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {equipment.map((item) => {
                const Icon = getEquipmentIcon(item.type);
                return (
                  <div key={item._id} className="bg-white rounded-lg shadow p-4 sm:p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${
                          item.level === 1 ? 'bg-blue-100' :
                          item.level === 2 ? 'bg-green-100' :
                          item.level === 3 ? 'bg-yellow-100' :
                          item.level === 4 ? 'bg-orange-100' : 'bg-purple-100'
                        }`}>
                          <Icon className={`w-5 h-5 ${
                            item.level === 1 ? 'text-blue-600' :
                            item.level === 2 ? 'text-green-600' :
                            item.level === 3 ? 'text-yellow-600' :
                            item.level === 4 ? 'text-orange-600' : 'text-purple-600'
                          }`} />
                        </div>
                        <div>
                          <h3 className="text-base font-medium text-gray-900">{item.name}</h3>
                          <p className="text-xs text-gray-500">{item.code}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        item.criticality === 'A' ? 'bg-red-100 text-red-800' :
                        item.criticality === 'B' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {item.criticality}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Type:</span>
                        <span className="font-medium">{item.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Location:</span>
                        <span className="font-medium truncate ml-2">{item.location}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Health Score:</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-12 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                item.healthScore >= 90 ? 'bg-green-500' :
                                item.healthScore >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${item.healthScore}%` }}
                            ></div>
                          </div>
                          <span className="font-medium">{item.healthScore}%</span>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          item.status === 'Active' ? 'bg-green-100 text-green-800' :
                          item.status === 'Maintenance' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        <button 
                          onClick={() => {
                            setSelectedEquipment(item);
                            setShowDetailsModal(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedEquipment(item);
                            setShowCreateModal(true);
                          }}
                          className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteEquipment(item._id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="text-xs text-gray-500">
                        Running: {item.runningHours}h
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {view === 'list' && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipment</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level/Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Criticality</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Health</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {equipment.map((item) => (
                      <tr key={item._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{item.name}</div>
                            <div className="text-sm text-gray-500">{item.code}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">
                            Level {item.level} - {item.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.location}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            item.criticality === 'A' ? 'bg-red-100 text-red-800' :
                            item.criticality === 'B' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {item.criticality}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-3">
                              <div 
                                className={`h-2 rounded-full ${
                                  item.healthScore >= 90 ? 'bg-green-500' :
                                  item.healthScore >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${item.healthScore}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-900">{item.healthScore}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            item.status === 'Active' ? 'bg-green-100 text-green-800' :
                            item.status === 'Maintenance' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => {
                                setSelectedEquipment(item);
                                setShowDetailsModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => {
                                setSelectedEquipment(item);
                                setShowCreateModal(true);
                              }}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteEquipment(item._id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {view === 'list' && pagination.pages > 1 && (
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.pages}
                  onPageChange={(page) => setPagination({ ...pagination, page })}
                />
              )}
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <EquipmentModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setSelectedEquipment(null);
        }}
        onSave={selectedEquipment ? 
          (data) => handleUpdateEquipment(selectedEquipment._id, data) : 
          handleCreateEquipment
        }
        equipment={selectedEquipment}
        isEdit={!!selectedEquipment}
        availableParents={equipment}
      />

      <EquipmentDetails
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedEquipment(null);
        }}
        equipment={selectedEquipment}
      />
    </div>
  );
};

export default EquipmentRegistry;
