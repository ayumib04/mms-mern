// frontend/src/components/equipment/EquipmentDetails.js
import React, { useState, useEffect } from 'react';
import { 
  X, Calendar, Clock, DollarSign, User, Activity, 
  AlertTriangle, CheckCircle, Settings, MapPin,
  Factory, Wrench, Package
} from 'lucide-react';
import Modal from '../common/Modal';
import apiService from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import { toast } from 'react-toastify';

const EquipmentDetails = ({ isOpen, onClose, equipment }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (equipment?._id && isOpen) {
      fetchEquipmentDetails();
    }
  }, [equipment, isOpen]);

  const fetchEquipmentDetails = async () => {
    try {
      setLoading(true);
      const response = await apiService.equipment.getById(equipment._id);
      setDetails(response.data.data);
    } catch (error) {
      toast.error('Failed to load equipment details');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !equipment) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Equipment Details"
      size="2xl"
    >
      {loading ? (
        <LoadingSpinner text="Loading details..." />
      ) : details ? (
        <div>
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{details.name}</h2>
              <p className="text-sm text-gray-500 mt-1">Code: {details.code}</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                details.criticality === 'A' ? 'bg-red-100 text-red-800' :
                details.criticality === 'B' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                Criticality {details.criticality}
              </span>
              <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                details.status === 'Active' ? 'bg-green-100 text-green-800' :
                details.status === 'Maintenance' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {details.status}
              </span>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              {['overview', 'technical', 'maintenance', 'hierarchy'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Health Score</p>
                      <p className="text-2xl font-bold text-gray-900">{details.healthScore}%</p>
                    </div>
                    <Activity className={`w-8 h-8 ${
                      details.healthScore >= 90 ? 'text-green-500' :
                      details.healthScore >= 70 ? 'text-yellow-500' : 'text-red-500'
                    }`} />
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Running Hours</p>
                      <p className="text-2xl font-bold text-gray-900">{details.runningHours}h</p>
                    </div>
                    <Clock className="w-8 h-8 text-blue-500" />
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Uptime</p>
                      <p className="text-2xl font-bold text-gray-900">{details.uptimePercentage}%</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Maint. Cost</p>
                      <p className="text-2xl font-bold text-gray-900">₹{(details.maintenanceCost / 1000).toFixed(0)}K</p>
                    </div>
                    <DollarSign className="w-8 h-8 text-yellow-500" />
                  </div>
                </div>
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Type:</span>
                      <span className="text-sm font-medium">{details.type} (Level {details.level})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Location:</span>
                      <span className="text-sm font-medium">{details.location}</span>
                    </div>
                    {details.description && (
                      <div>
                        <span className="text-sm text-gray-600">Description:</span>
                        <p className="text-sm font-medium mt-1">{details.description}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Ownership</h4>
                  <div className="space-y-3">
                    {details.ownership?.mechanical && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Mechanical:</span>
                        <span className="text-sm font-medium">{details.ownership.mechanical}</span>
                      </div>
                    )}
                    {details.ownership?.electrical && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Electrical:</span>
                        <span className="text-sm font-medium">{details.ownership.electrical}</span>
                      </div>
                    )}
                    {details.ownership?.operations && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Operations:</span>
                        <span className="text-sm font-medium">{details.ownership.operations}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'technical' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Technical Details</h4>
                  <div className="space-y-3">
                    {details.manufacturer && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Manufacturer:</span>
                        <span className="text-sm font-medium">{details.manufacturer}</span>
                      </div>
                    )}
                    {details.model && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Model:</span>
                        <span className="text-sm font-medium">{details.model}</span>
                      </div>
                    )}
                    {details.serialNumber && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Serial Number:</span>
                        <span className="text-sm font-medium">{details.serialNumber}</span>
                      </div>
                    )}
                    {details.commissionDate && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Commission Date:</span>
                        <span className="text-sm font-medium">
                          {new Date(details.commissionDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {details.specifications && Object.keys(details.specifications).length > 0 && (
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Specifications</h4>
                    <div className="space-y-3">
                      {Object.entries(details.specifications).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-sm text-gray-600">{key}:</span>
                          <span className="text-sm font-medium">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'maintenance' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Maintenance Schedule</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Last Maintenance:</span>
                      <span className="text-sm font-medium">
                        {details.lastMaintenance ? 
                          new Date(details.lastMaintenance).toLocaleDateString() : 
                          'Not recorded'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Next Maintenance:</span>
                      <span className="text-sm font-medium">
                        {details.nextMaintenance ? 
                          new Date(details.nextMaintenance).toLocaleDateString() : 
                          'Not scheduled'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Last Maintenance Hours:</span>
                      <span className="text-sm font-medium">{details.lastMaintenanceHours}h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Next Maintenance Hours:</span>
                      <span className="text-sm font-medium">{details.nextMaintenanceHours}h</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Maintenance Alerts</h4>
                  <div className="space-y-3">
                    {details.runningHours >= details.nextMaintenanceHours && (
                      <div className="flex items-center space-x-2 p-3 bg-red-50 rounded-lg">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        <span className="text-sm text-red-800">
                          Maintenance overdue by {details.runningHours - details.nextMaintenanceHours} hours
                        </span>
                      </div>
                    )}
                    {details.healthScore < 70 && (
                      <div className="flex items-center space-x-2 p-3 bg-yellow-50 rounded-lg">
                        <AlertTriangle className="w-5 h-5 text-yellow-600" />
                        <span className="text-sm text-yellow-800">
                          Low health score - inspection recommended
                        </span>
                      </div>
                    )}
                    {details.runningHours >= details.nextMaintenanceHours * 0.9 && 
                     details.runningHours < details.nextMaintenanceHours && (
                      <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
                        <Clock className="w-5 h-5 text-blue-600" />
                        <span className="text-sm text-blue-800">
                          Maintenance due in {details.nextMaintenanceHours - details.runningHours} hours
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'hierarchy' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Parent Equipment</h4>
                  {details.parent ? (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Factory className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{details.parent.name}</p>
                          <p className="text-xs text-gray-500">{details.parent.code}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No parent (Root level)</p>
                  )}
                </div>

                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">
                    Child Equipment ({details.children?.length || 0})
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {details.children && details.children.length > 0 ? (
                      details.children.map(child => (
                        <div key={child._id} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Package className="w-4 h-4 text-gray-600" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{child.name}</p>
                              <p className="text-xs text-gray-500">
                                {child.code} • Level {child.level} - {child.type}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No child equipment</p>
                    )}
                  </div>
                </div>
              </div>

              {details.createdBy && (
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Created By</h4>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                      {details.createdBy.name?.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{details.createdBy.name}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(details.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          No details available
        </div>
      )}
    </Modal>
  );
};

export default EquipmentDetails;
