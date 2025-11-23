import React, { useState } from 'react';
import { MOCK_PROJECTS, MOCK_CLIENTS, MOCK_APPLICATIONS } from '../services/mockData';
import { FORMAT_CURRENCY } from '../constants';
import { Card } from '../components/Card';
import { ApplicationStatus } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, Briefcase, DollarSign, FileText, ShieldCheck, AlertCircle, Calendar, Layers } from 'lucide-react';

interface ReportRow {
  id: string;
  name: string;
  month?: string;
  contractValue: number;
  applied: number;
  certified: number;
  invoiced: number;
  paid: number;
  outstanding: number;
  retention: number;
}

export const ReportingView: React.FC = () => {
  const [viewMode, setViewMode] = useState<'project' | 'client' | 'month' | 'project_month'>('project');

  // Helper to parse "MMM YYYY" for sorting
  const parseMonthYear = (dateStr: string) => {
    const [month, year] = dateStr.split(' ');
    const monthIndex = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(month);
    return new Date(parseInt(year), monthIndex).getTime();
  };

  // --- Aggregation Logic ---
  let reportData: ReportRow[] = [];

  if (viewMode === 'project') {
    reportData = MOCK_PROJECTS.map(proj => {
        const apps = MOCK_APPLICATIONS.filter(a => a.projectId === proj.id);
        
        const applied = apps.reduce((sum, a) => sum + a.appliedAmountP, 0);
        const certified = apps.reduce((sum, a) => sum + a.certifiedAmountP, 0);
        const invoiced = apps.reduce((sum, a) => sum + a.invoicedAmountP, 0); 
        const retention = apps.reduce((sum, a) => sum + a.retentionDeductedP, 0);
        
        const paid = apps.filter(a => a.status === ApplicationStatus.PAID)
                         .reduce((sum, a) => sum + a.amountP, 0);
        
        const outstanding = apps.filter(a => a.status === ApplicationStatus.INVOICED)
                                .reduce((sum, a) => sum + a.amountP, 0);

        return {
            id: proj.id,
            name: proj.name,
            contractValue: proj.contractValueP,
            applied,
            certified,
            invoiced,
            paid,
            outstanding,
            retention
        };
    });
  } else if (viewMode === 'client') {
    reportData = MOCK_CLIENTS.map(client => {
        const clientProjects = MOCK_PROJECTS.filter(p => p.clientId === client.id || p.client === client.name);
        const projectIds = clientProjects.map(p => p.id);
        const apps = MOCK_APPLICATIONS.filter(a => projectIds.includes(a.projectId));

        const contractValue = clientProjects.reduce((sum, p) => sum + p.contractValueP, 0);
        const applied = apps.reduce((sum, a) => sum + a.appliedAmountP, 0);
        const certified = apps.reduce((sum, a) => sum + a.certifiedAmountP, 0);
        const invoiced = apps.reduce((sum, a) => sum + a.invoicedAmountP, 0);
        const retention = apps.reduce((sum, a) => sum + a.retentionDeductedP, 0);
        
        const paid = apps.filter(a => a.status === ApplicationStatus.PAID)
                         .reduce((sum, a) => sum + a.amountP, 0);
        
        const outstanding = apps.filter(a => a.status === ApplicationStatus.INVOICED)
                                .reduce((sum, a) => sum + a.amountP, 0);

        return {
            id: client.id,
            name: client.name,
            contractValue,
            applied,
            certified,
            invoiced,
            paid,
            outstanding,
            retention
        };
    });
  } else if (viewMode === 'month') {
    // Month View (Aggregated)
    const uniqueMonths = Array.from(new Set(MOCK_APPLICATIONS.map(a => a.periodMonth)));
    
    reportData = uniqueMonths.map(month => {
        const apps = MOCK_APPLICATIONS.filter(a => a.periodMonth === month);
        
        const applied = apps.reduce((sum, a) => sum + a.appliedAmountP, 0);
        const certified = apps.reduce((sum, a) => sum + a.certifiedAmountP, 0);
        const invoiced = apps.reduce((sum, a) => sum + a.invoicedAmountP, 0);
        const retention = apps.reduce((sum, a) => sum + a.retentionDeductedP, 0);
        
        const paid = apps.filter(a => a.status === ApplicationStatus.PAID)
                         .reduce((sum, a) => sum + a.amountP, 0);
        
        const outstanding = apps.filter(a => a.status === ApplicationStatus.INVOICED)
                                .reduce((sum, a) => sum + a.amountP, 0);

        return {
            id: month,
            name: month,
            contractValue: 0, // N/A for month view
            applied,
            certified,
            invoiced,
            paid,
            outstanding,
            retention
        };
    });

    // Sort chronologically
    reportData.sort((a, b) => parseMonthYear(a.name) - parseMonthYear(b.name));
  } else {
    // Project by Month View (Detailed breakdown)
    reportData = MOCK_APPLICATIONS.map(app => {
        const project = MOCK_PROJECTS.find(p => p.id === app.projectId);
        return {
            id: app.id,
            name: project ? project.name : 'Unknown Project',
            month: app.periodMonth,
            contractValue: 0, // Per-row contract value not applicable/summed here
            applied: app.appliedAmountP,
            certified: app.certifiedAmountP,
            invoiced: app.invoicedAmountP,
            paid: app.status === ApplicationStatus.PAID ? app.amountP : 0,
            outstanding: app.status === ApplicationStatus.INVOICED ? app.amountP : 0,
            retention: app.retentionDeductedP
        };
    });

    // Sort by Project Name, then Chronologically
    reportData.sort((a, b) => {
        const nameCompare = a.name.localeCompare(b.name);
        if (nameCompare !== 0) return nameCompare;
        return parseMonthYear(a.month || '') - parseMonthYear(b.month || '');
    });
  }

  // --- KPI Totals ---
  // For project_month view, contract value total needs to be calculated from projects to be meaningful, 
  // otherwise it's 0 because row values are 0.
  const totalContractValue = viewMode === 'project_month' || viewMode === 'month'
    ? MOCK_PROJECTS.reduce((sum, p) => sum + p.contractValueP, 0)
    : reportData.reduce((sum, row) => sum + row.contractValue, 0);

  const totals = reportData.reduce((acc, row) => ({
      invoiced: acc.invoiced + row.invoiced,
      paid: acc.paid + row.paid,
      outstanding: acc.outstanding + row.outstanding,
      retention: acc.retention + row.retention
  }), { invoiced: 0, paid: 0, outstanding: 0, retention: 0 });

  // --- Chart Data Preparation (Top 5 items) ---
  // If month view or project_month, keep chronological/list order logic, otherwise sort by value
  let chartData = [...reportData];
  
  if (viewMode === 'project' || viewMode === 'client') {
      chartData = chartData.sort((a, b) => b.invoiced - a.invoiced).slice(0, 5);
  } else if (viewMode === 'month') {
      // Already sorted chronologically
  } else {
      // Project by Month: Show top 10 recent/largest transactions maybe? 
      // Or just aggregate by month for the chart while showing details in table?
      // Let's aggregate by month for the chart to be useful
      const monthlyAgg = chartData.reduce((acc, row) => {
          const m = row.month || row.name;
          if (!acc[m]) acc[m] = { name: m, Applied: 0, Certified: 0, Paid: 0 };
          acc[m].Applied += row.applied;
          acc[m].Certified += row.certified;
          acc[m].Paid += row.paid;
          return acc;
      }, {} as Record<string, any>);
      chartData = Object.values(monthlyAgg).sort((a: any, b: any) => parseMonthYear(a.name) - parseMonthYear(b.name));
  }

  const formattedChartData = chartData.map((row: any) => ({
      name: row.name.length > 15 ? row.name.substring(0, 15) + '...' : row.name,
      Applied: (row.applied || row.Applied) / 100,
      Certified: (row.certified || row.Certified) / 100,
      Paid: (row.paid || row.Paid) / 100
  }));

  const getHeaderLabel = () => {
      switch(viewMode) {
          case 'client': return 'Client Name';
          case 'month': return 'Month';
          case 'project_month': return 'Project';
          default: return 'Project Name';
      }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h3 className="text-lg font-bold text-gray-900">Financial Overview</h3>
            <p className="text-sm text-gray-500">Cumulative breakdown of project finance and cash status.</p>
        </div>
        
        <div className="flex flex-wrap gap-2 bg-gray-100 p-1 rounded-xl border border-gray-200 self-start md:self-auto">
            <button
              onClick={() => setViewMode('project')}
              className={`flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'project' 
                  ? 'bg-white text-[#00B5D8] shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Briefcase className="w-4 h-4 mr-2" />
              Project
            </button>
            <button
              onClick={() => setViewMode('client')}
              className={`flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'client' 
                  ? 'bg-white text-[#00B5D8] shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users className="w-4 h-4 mr-2" />
              Client
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'month' 
                  ? 'bg-white text-[#00B5D8] shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Month
            </button>
            <button
              onClick={() => setViewMode('project_month')}
              className={`flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'project_month' 
                  ? 'bg-white text-[#00B5D8] shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Layers className="w-4 h-4 mr-2" />
              Project by Month
            </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-500 uppercase">Total Contract Value</span>
                    <Briefcase className="w-4 h-4 text-gray-400" />
                </div>
                <div className="text-xl font-bold text-gray-900">{FORMAT_CURRENCY(totalContractValue)}</div>
          </div>
          
          <div className={`bg-white p-4 rounded-xl border border-gray-200 shadow-sm`}>
              <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase">Total Invoiced</span>
                  <FileText className="w-4 h-4 text-cyan-500" />
              </div>
              <div className="text-xl font-bold text-gray-900">{FORMAT_CURRENCY(totals.invoiced)}</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase">Total Paid</span>
                  <DollarSign className="w-4 h-4 text-green-500" />
              </div>
              <div className="text-xl font-bold text-green-600">{FORMAT_CURRENCY(totals.paid)}</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm border-l-4 border-l-red-500">
              <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-red-500 uppercase">Outstanding Debt</span>
                  <AlertCircle className="w-4 h-4 text-red-500" />
              </div>
              <div className="text-xl font-bold text-red-600">{FORMAT_CURRENCY(totals.outstanding)}</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-orange-500 uppercase">Retention Held</span>
                  <ShieldCheck className="w-4 h-4 text-orange-500" />
              </div>
              <div className="text-xl font-bold text-orange-600">{FORMAT_CURRENCY(totals.retention)}</div>
          </div>
      </div>

      {/* Main Content: Chart & Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Chart */}
          <Card className="lg:col-span-3" title={viewMode.includes('month') ? 'Financial Trend by Month' : 'Financial Overview (Top 5)'}>
             <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={formattedChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} />
                        <Tooltip 
                            cursor={{fill: '#F9FAFB'}}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                            formatter={(value: number) => [`£${value.toLocaleString()}`, '']}
                        />
                        <Legend />
                        <Bar dataKey="Applied" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={viewMode === 'month' ? undefined : 30} />
                        <Bar dataKey="Certified" fill="#6366F1" radius={[4, 4, 0, 0]} barSize={viewMode === 'month' ? undefined : 30} />
                        <Bar dataKey="Paid" fill="#10B981" radius={[4, 4, 0, 0]} barSize={viewMode === 'month' ? undefined : 30} />
                    </BarChart>
                </ResponsiveContainer>
             </div>
          </Card>

          {/* Detailed Table */}
          <Card className="lg:col-span-3" title={`Detailed ${getHeaderLabel()} Ledger`}>
              <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-200 uppercase text-xs">
                          <tr>
                              <th className="px-6 py-4">{getHeaderLabel()}</th>
                              {viewMode === 'project_month' && <th className="px-6 py-4">Month</th>}
                              {(viewMode === 'project' || viewMode === 'client') && <th className="px-6 py-4 text-right">Contract Value</th>}
                              <th className="px-6 py-4 text-right text-blue-600">Total Applied</th>
                              <th className="px-6 py-4 text-right text-indigo-600">Total Certified</th>
                              <th className="px-6 py-4 text-right text-cyan-600">Total Invoiced</th>
                              <th className="px-6 py-4 text-right text-green-600">Total Paid</th>
                              <th className="px-6 py-4 text-right text-red-500">Outstanding</th>
                              <th className="px-6 py-4 text-right text-orange-500">Retention Held</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                          {reportData.map(row => (
                              <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                                  <td className="px-6 py-4 font-medium text-gray-900">{row.name}</td>
                                  {viewMode === 'project_month' && <td className="px-6 py-4 text-gray-600">{row.month}</td>}
                                  {(viewMode === 'project' || viewMode === 'client') && <td className="px-6 py-4 text-right font-medium">{FORMAT_CURRENCY(row.contractValue)}</td>}
                                  <td className="px-6 py-4 text-right text-blue-600">{FORMAT_CURRENCY(row.applied)}</td>
                                  <td className="px-6 py-4 text-right text-indigo-600">{FORMAT_CURRENCY(row.certified)}</td>
                                  <td className="px-6 py-4 text-right text-cyan-600 font-medium">{FORMAT_CURRENCY(row.invoiced)}</td>
                                  <td className="px-6 py-4 text-right text-green-600 font-bold">{FORMAT_CURRENCY(row.paid)}</td>
                                  <td className="px-6 py-4 text-right text-red-500 font-medium">{FORMAT_CURRENCY(row.outstanding)}</td>
                                  <td className="px-6 py-4 text-right text-orange-500">{FORMAT_CURRENCY(row.retention)}</td>
                              </tr>
                          ))}
                          <tr className="bg-gray-50/80 font-bold text-gray-900 border-t-2 border-gray-200">
                              <td className="px-6 py-4">TOTALS</td>
                              {viewMode === 'project_month' && <td></td>}
                              {(viewMode === 'project' || viewMode === 'client') && <td className="px-6 py-4 text-right">{FORMAT_CURRENCY(totalContractValue)}</td>}
                              <td className="px-6 py-4 text-right">{FORMAT_CURRENCY(reportData.reduce((s,r) => s + r.applied, 0))}</td>
                              <td className="px-6 py-4 text-right">{FORMAT_CURRENCY(reportData.reduce((s,r) => s + r.certified, 0))}</td>
                              <td className="px-6 py-4 text-right">{FORMAT_CURRENCY(totals.invoiced)}</td>
                              <td className="px-6 py-4 text-right">{FORMAT_CURRENCY(totals.paid)}</td>
                              <td className="px-6 py-4 text-right text-red-600">{FORMAT_CURRENCY(totals.outstanding)}</td>
                              <td className="px-6 py-4 text-right text-orange-600">{FORMAT_CURRENCY(totals.retention)}</td>
                          </tr>
                      </tbody>
                  </table>
              </div>
          </Card>
      </div>
    </div>
  );
};
