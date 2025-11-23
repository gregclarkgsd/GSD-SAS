import React, { useState } from 'react';
import { MOCK_PROJECTS, MOCK_CLIENTS, MOCK_APPLICATIONS } from '../services/mockData';
import { FORMAT_CURRENCY } from '../constants';
import { Card } from '../components/Card';
import { ApplicationStatus } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, Briefcase, Download, DollarSign, FileText, ShieldCheck, AlertCircle } from 'lucide-react';

interface ReportRow {
  id: string;
  name: string;
  contractValue: number;
  applied: number;
  certified: number;
  invoiced: number;
  paid: number;
  outstanding: number;
  retention: number;
}

export const Reporting: React.FC = () => {
  const [viewMode, setViewMode] = useState<'project' | 'client'>('project');

  // --- Aggregation Logic ---
  const reportData: ReportRow[] = viewMode === 'project'
    ? MOCK_PROJECTS.map(proj => {
        const apps = MOCK_APPLICATIONS.filter(a => a.projectId === proj.id);
        
        // Cumulative sums across all applications for this project
        const applied = apps.reduce((sum, a) => sum + a.appliedAmountP, 0);
        const certified = apps.reduce((sum, a) => sum + a.certifiedAmountP, 0);
        const invoiced = apps.reduce((sum, a) => sum + a.invoicedAmountP, 0); // Total value ever invoiced
        const retention = apps.reduce((sum, a) => sum + a.retentionDeductedP, 0);
        
        // Status-based sums
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
    })
    : MOCK_CLIENTS.map(client => {
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

  // --- KPI Totals ---
  const totals = reportData.reduce((acc, row) => ({
      contractValue: acc.contractValue + row.contractValue,
      invoiced: acc.invoiced + row.invoiced,
      paid: acc.paid + row.paid,
      outstanding: acc.outstanding + row.outstanding,
      retention: acc.retention + row.retention
  }), { contractValue: 0, invoiced: 0, paid: 0, outstanding: 0, retention: 0 });

  // --- Chart Data Preparation (Top 5 items) ---
  const chartData = [...reportData]
    .sort((a, b) => b.contractValue - a.contractValue)
    .slice(0, 5)
    .map(row => ({
        name: row.name.length > 15 ? row.name.substring(0, 15) + '...' : row.name,
        Applied: row.applied / 100,
        Certified: row.certified / 100,
        Paid: row.paid / 100
    }));

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h2 className="text-2xl font-bold text-gray-900">Financial Reporting</h2>
            <p className="text-sm text-gray-500">Comprehensive breakdown of project finance and cash status.</p>
        </div>
        
        <div className="flex gap-3 bg-gray-100 p-1 rounded-xl border border-gray-200 self-start md:self-auto">
            <button
              onClick={() => setViewMode('project')}
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'project' 
                  ? 'bg-white text-[#00B5D8] shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Briefcase className="w-4 h-4 mr-2" />
              Project View
            </button>
            <button
              onClick={() => setViewMode('client')}
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'client' 
                  ? 'bg-white text-[#00B5D8] shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users className="w-4 h-4 mr-2" />
              Client View
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
              <div className="text-xl font-bold text-gray-900">{FORMAT_CURRENCY(totals.contractValue)}</div>
          </div>
          
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
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
          <Card className="lg:col-span-3" title="Financial Overview (Top 5)">
             <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} />
                        <Tooltip 
                            cursor={{fill: '#F9FAFB'}}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                            formatter={(value: number) => [`£${value.toLocaleString()}`, '']}
                        />
                        <Legend />
                        <Bar dataKey="Applied" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={30} />
                        <Bar dataKey="Certified" fill="#6366F1" radius={[4, 4, 0, 0]} barSize={30} />
                        <Bar dataKey="Paid" fill="#10B981" radius={[4, 4, 0, 0]} barSize={30} />
                    </BarChart>
                </ResponsiveContainer>
             </div>
          </Card>

          {/* Detailed Table */}
          <Card className="lg:col-span-3" title={`Detailed ${viewMode === 'project' ? 'Project' : 'Client'} Ledger`}>
              <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-200 uppercase text-xs">
                          <tr>
                              <th className="px-6 py-4">{viewMode === 'project' ? 'Project Name' : 'Client Name'}</th>
                              <th className="px-6 py-4 text-right">Contract Value</th>
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
                                  <td className="px-6 py-4 text-right font-medium">{FORMAT_CURRENCY(row.contractValue)}</td>
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
                              <td className="px-6 py-4 text-right">{FORMAT_CURRENCY(totals.contractValue)}</td>
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
