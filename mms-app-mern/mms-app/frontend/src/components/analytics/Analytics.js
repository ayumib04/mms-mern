import React, { useState, useEffect } from 'react';
import {
  Timer, Target, Gauge, DollarSign, Download,
  BarChart, LineChart, TrendingUp
} from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import LoadingSpinner from '../common/LoadingSpinner';

export default function Analytics() {
  const [timeRange, setTimeRange] = useState('30d');
  const [viewType, setViewType] = useState('overview');
  const [analyticsData, setAnalyticsData] = useState(null);
  const { request, loading } = useApi();

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      const response = await request(`/api/analytics?timeRange=${timeRange}`);
      setAnalyticsData(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const exportAnalytics = () => {
    const dataStr = JSON.stringify(analyticsData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics_report_${timeRange}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (loading || !analyticsData) return <LoadingSpinner />;

  const { kpis, maintenanceTrends, costBreakdown, equipmentCriticality } = analyticsData;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Controls */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Analytics Dashboard</h2>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-h-[44px]"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <button
              onClick={exportAnalytics}
              className="px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm min-h-[44px] flex items-center justify-center"
            >
              <Download className="w-4 h-4 mr-1 sm:mr-2" />
              Export Report
            </button>
            <div className="flex bg-gray-100 rounded-lg p-1">
              {['overview', 'costs', 'performance', 'reliability'].map((type) => (
                <button
                  key={type}
                  onClick={() => setViewType(type)}
                  className={`px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm font-medium transition-colors flex-1 min-h-[36px] ${
                    viewType === type 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <KPICard
          title="MTTR"
          value={`${kpis.mttr}h`}
          change={kpis.mttrChange}
          icon={Timer}
          color="blue"
        />
        <KPICard
          title="MTBF"
          value={`${kpis.mtbf}h`}
          change={kpis.mtbfChange}
          icon={Target}
          color="green"
        />
        <KPICard
          title="Availability"
          value={`${kpis.availability}%`}
          change={kpis.availabilityChange}
          icon={Gauge}
          color="purple"
        />
        <KPICard
          title="Maintenance Costs"
          value={`₹${(kpis.maintenanceCosts / 1000).toFixed(0)}K`}
          change={kpis.costsChange}
          icon={DollarSign}
          color="yellow"
        />
      </div>

      {/* View-specific content */}
      {viewType === 'overview' && (
        <OverviewTab 
          maintenanceTrends={maintenanceTrends}
          equipmentCriticality={equipmentCriticality}
        />
      )}
      {viewType === 'costs' && (
        <CostsTab costBreakdown={costBreakdown} />
      )}
      {viewType === 'performance' && (
        <PerformanceTab analyticsData={analyticsData} />
      )}
      {viewType === 'reliability' && (
        <ReliabilityTab kpis={kpis} />
      )}
    </div>
  );
}

function KPICard({ title, value, change, icon: Icon, color }) {
  const colorClasses = {
    blue: 'text-blue-500',
    green: 'text-green-500',
    purple: 'text-purple-500',
    yellow: 'text-yellow-500'
  };

  return (
    <div className="bg-white rounded-lg shadow p-3 sm:p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-gray-600">{title}</p>
          <p className="text-lg sm:text-2xl font-bold text-gray-900">{value}</p>
          {change && (
            <p className={`text-xs sm:text-sm ${change > 0 ? 'text-green-600' : 'text-red-600'} hidden sm:block`}>
              {change > 0 ? '↑' : '↓'} {Math.abs(change)}% from last period
            </p>
          )}
        </div>
        <Icon className={`w-6 h-6 sm:w-8 sm:h-8 ${colorClasses[color]} flex-shrink-0`} />
      </div>
    </div>
  );
}

function OverviewTab({ maintenanceTrends, equipmentCriticality }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      {/* Maintenance Trends */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Maintenance Trends</h3>
        <div className="space-y-3 sm:space-y-4">
          {maintenanceTrends.map((trend) => (
            <div key={trend.month} className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">{trend.month}</span>
              <div className="flex flex-col sm:flex-row items-end sm:items-center space-y-1 sm:space-y-0 sm:space-x-4">
                <TrendItem label="Planned" value={trend.planned} color="green" />
                <TrendItem label="Unplanned" value={trend.unplanned} color="yellow" />
                <TrendItem label="Emergency" value={trend.emergency} color="red" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Equipment by Criticality */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Equipment by Criticality</h3>
        <div className="space-y-3 sm:space-y-4">
          {equipmentCriticality.map((item) => (
            <div key={item.level} className="flex items-center justify-between">
              <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full flex-shrink-0 ${
                  item.level.includes('Critical') ? 'bg-red-500' :
                  item.level.includes('Important') ? 'bg-yellow-500' : 'bg-green-500'
                }`}></div>
                <span className="text-xs sm:text-sm font-medium text-gray-700 truncate">{item.level}</span>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-xs sm:text-sm font-medium text-gray-900">{item.count} units</div>
                <div className="text-xs text-gray-500">{item.downtime}% downtime</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TrendItem({ label, value, color }) {
  const colorClasses = {
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500'
  };

  return (
    <div className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm">
      <div className={`w-2 h-2 sm:w-3 sm:h-3 ${colorClasses[color]} rounded-full`}></div>
      <span className="text-gray-600">{value} {label}</span>
    </div>
  );
}

function CostsTab({ costBreakdown }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Cost Breakdown</h3>
        <div className="space-y-3 sm:space-y-4">
          {costBreakdown.map((item) => (
            <div key={item.category} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-medium text-gray-700">{item.category}</span>
                <span className="text-xs sm:text-sm font-medium text-gray-900">
                  ₹{(item.cost / 1000).toFixed(0)}K ({item.percentage}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
                <div 
                  className="bg-blue-500 h-1.5 sm:h-2 rounded-full" 
                  style={{ width: `${item.percentage}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PerformanceTab({ analyticsData }) {
  return (
    <div className="bg-white rounded-lg shadow p-4 sm:p-6">
      <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Performance Metrics</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="text-center">
          <div className="text-2xl sm:text-3xl font-bold text-green-600">94%</div>
          <div className="text-xs sm:text-sm text-gray-600">Work Order Completion Rate</div>
        </div>
        <div className="text-center">
          <div className="text-2xl sm:text-3xl font-bold text-blue-600">87%</div>
          <div className="text-xs sm:text-sm text-gray-600">Planned Maintenance Compliance</div>
        </div>
        <div className="text-center">
          <div className="text-2xl sm:text-3xl font-bold text-purple-600">4.2</div>
          <div className="text-xs sm:text-sm text-gray-600">Average Response Time (hours)</div>
        </div>
      </div>
    </div>
  );
}

function ReliabilityTab({ kpis }) {
  return (
    <div className="bg-white rounded-lg shadow p-4 sm:p-6">
      <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Reliability Metrics</h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Mean Time Between Failures:</span>
          <span className="font-bold text-lg text-green-600">{kpis.mtbf}h</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Mean Time To Repair:</span>
          <span className="font-bold text-lg text-blue-600">{kpis.mttr}h</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Overall Equipment Effectiveness:</span>
          <span className="font-bold text-lg text-purple-600">{kpis.availability}%</span>
        </div>
      </div>
    </div>
  );
}