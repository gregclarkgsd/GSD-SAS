
import React from 'react';
import { Card } from '../components/Card';
import { MOCK_PROJECTS, MOCK_APPLICATIONS, MOCK_CASHFLOW, MOCK_STAFF, MOCK_RETENTIONS } from '../services/mockData';
import { FORMAT_CURRENCY, STAGE_ORDER } from '../constants';
import { 
  TrendingUp, 
  Briefcase, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  FileText, 
  Activity,
  Plus,
  ArrowRight,
  Clock,
  ShieldCheck,
  Users
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  Cell
} from 'recharts';
import { Link } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  // --- Calculations ---
  
  // 1. Financial KPIs
  const totalContractValue = MOCK_PROJECTS.reduce((sum, p) => sum + p.contractValueP, 0);
  const activeValue = MOCK_PROJECTS.filter(p => p.stage === 'On-site').reduce((sum, p) => sum + p.contractValueP, 0);
  const pipelineValue = MOCK_PROJECTS.filter(p => p.stage === 'Negotiation').reduce((sum, p) => sum + p.contractValueP, 0);
  
  const totalOutstanding = MOCK_APPLICATIONS
    .filter(a => a.status === 'invoiced')
    .reduce((sum, a) => sum + a.amountP, 0);

  // 2. Action Items
  const dueApplications = MOCK_APPLICATIONS.filter(a => a.status === 'to_do').length;
  const dueRetentions = MOCK_RETENTIONS.filter(r => r.status === 'Release Due').length;
  const setupRequired = MOCK_PROJECTS.filter(p => p.stage === 'On-site' && !MOCK_APPLICATIONS.some(a => a.projectId === p.id)).length;

  // 3. Project Risk Watchlist (Sort by lowest margin)
  const riskProjects = MOCK_PROJECTS
    .filter(p => p.stage === 'On-site' || p.stage === 'Pre-Start')
    .map(p => {
      const profit = p.contractValueP - p.forecastBudgetP;
      const margin = p.contractValueP > 0 ? (profit / p.contractValueP) * 100 : 0;
      return { ...p, margin };
    })
    .sort((a, b) => a.margin - b.margin) // Ascending (Lowest first)
    .slice(0, 5);

  // 4. Staffing Metric
  const activeStaff = MOCK_STAFF.filter(s => s.active).length;
  
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Financial Control Tower</h2>
          <p className="text-sm text-gray-500">Real-time overview of project performance and cash position.</p>
        </div>
        <div className="flex gap-2">
            <button className="flex items-center gap-2 bg-[#00B5D8] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#009bb8] transition-colors shadow-lg shadow-cyan-500/20">
                <Plus className="w-4 h-4" /> New Project
            </button>
        </div>
      </div>

      {/* KPI Grid - High Level Numbers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Cash Card */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex justify-between items-start mb-4">
                <div className="p-2.5 bg-green-50 text-green-600 rounded-xl group-hover:bg-green-100 transition-colors">
                    <Wallet className="w-6 h-6" />
                </div>
                <span className="text-xs font-medium text-green-600 flex items-center bg-green-50 px-2 py-1 rounded-full">
                    <ArrowUpRight className="w-3 h-3 mr-1" /> Healthy
                </span>
            </div>
            <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">Cash Position</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">£1.25m</h3>
            <p className="text-xs text-gray-400 mt-1">Projected +£120k next 30d</p>
        </div>

        {/* Outstanding Debt Card */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex justify-between items-start mb-4">
                <div className="p-2.5 bg-red-50 text-red-500 rounded-xl group-hover:bg-red-100 transition-colors">
                    <AlertTriangle className="w-6 h-6" />
                </div>
                <span className="text-xs font-medium text-red-600 flex items-center bg-red-50 px-2 py-1 rounded-full">
                    3 Overdue
                </span>
            </div>
            <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">Outstanding Invoices</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{FORMAT_CURRENCY(totalOutstanding)}</h3>
            <p className="text-xs text-gray-400 mt-1">Awaiting payment from clients</p>
        </div>

        {/* Active Work Card */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex justify-between items-start mb-4">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-100 transition-colors">
                    <Briefcase className="w-6 h-6" />
                </div>
                <span className="text-xs font-medium text-blue-600 flex items-center bg-blue-50 px-2 py-1 rounded-full">
                    {MOCK_PROJECTS.filter(p => p.stage === 'On-site').length} Projects
                </span>
            </div>
            <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">Work In Progress</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{FORMAT_CURRENCY(activeValue)}</h3>
            <p className="text-xs text-gray-400 mt-1">Total Contract Value On-Site</p>
        </div>

        {/* Pipeline Card */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex justify-between items-start mb-4">
                <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl group-hover:bg-purple-100 transition-colors">
                    <Activity className="w-6 h-6" />
                </div>
                <span className="text-xs font-medium text-purple-600 flex items-center bg-purple-50 px-2 py-1 rounded-full">
                    {MOCK_PROJECTS.filter(p => p.stage === 'Negotiation').length} Tenders
                </span>
            </div>
            <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">Pipeline Value</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{FORMAT_CURRENCY(pipelineValue)}</h3>
            <p className="text-xs text-gray-400 mt-1">Negotiation / Tendering</p>
        </div>
      </div>

      {/* Middle Section: Chart + Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Chart */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                  <div>
                      <h3 className="text-lg font-bold text-gray-900">Cash Flow Trajectory</h3>
                      <p className="text-sm text-gray-500">Income vs Costs (12 Month Forecast)</p>
                  </div>
                  <Link to="/cashflow" className="text-sm text-[#00B5D8] font-medium hover:underline flex items-center">
                      Full Report <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={MOCK_CASHFLOW} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#00B5D8" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#00B5D8" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorCosts" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#FF9A3E" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#FF9A3E" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
                        <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                            formatter={(value: number) => [`£${value.toLocaleString()}`, '']}
                        />
                        <Area type="monotone" dataKey="income" stroke="#00B5D8" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" name="Income" />
                        <Area type="monotone" dataKey="costs" stroke="#FF9A3E" strokeWidth={3} fillOpacity={1} fill="url(#colorCosts)" name="Costs" />
                    </AreaChart>
                </ResponsiveContainer>
              </div>
          </div>

          {/* Action Center */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
              <div className="p-5 border-b border-gray-100 bg-gray-50">
                  <h3 className="font-bold text-gray-900">Action Center</h3>
                  <p className="text-xs text-gray-500">Tasks requiring attention</p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  
                  {dueApplications > 0 && (
                    <Link to="/applications" className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-100 rounded-xl hover:bg-blue-100 transition-colors cursor-pointer">
                        <div className="bg-white p-2 rounded-lg text-blue-600 shadow-sm">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-blue-900">{dueApplications} Applications Due</p>
                            <p className="text-xs text-blue-700 mt-0.5">Prepare and submit valuations</p>
                        </div>
                    </Link>
                  )}

                  {dueRetentions > 0 && (
                    <Link to="/retention" className="flex items-start gap-3 p-3 bg-green-50 border border-green-100 rounded-xl hover:bg-green-100 transition-colors cursor-pointer">
                        <div className="bg-white p-2 rounded-lg text-green-600 shadow-sm">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-green-900">{dueRetentions} Retention Releases</p>
                            <p className="text-xs text-green-700 mt-0.5">DLP expired, apply for release</p>
                        </div>
                    </Link>
                  )}

                  {setupRequired > 0 && (
                     <Link to="/applications" className="flex items-start gap-3 p-3 bg-orange-50 border border-orange-100 rounded-xl hover:bg-orange-100 transition-colors cursor-pointer">
                        <div className="bg-white p-2 rounded-lg text-orange-600 shadow-sm">
                            <Clock className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-orange-900">{setupRequired} Projects Pending</p>
                            <p className="text-xs text-orange-700 mt-0.5">Schedule setup required</p>
                        </div>
                     </Link>
                  )}

                  {/* General Stat */}
                  <div className="flex items-start gap-3 p-3 bg-gray-50 border border-gray-100 rounded-xl">
                        <div className="bg-white p-2 rounded-lg text-gray-600 shadow-sm">
                            <Users className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-900">{activeStaff} Active Staff</p>
                            <p className="text-xs text-gray-500 mt-0.5">Currently deployed on site</p>
                        </div>
                  </div>
              </div>
          </div>
      </div>

      {/* Bottom Section: Watchlist */}
      <Card title="Project Margin Watchlist" className="overflow-hidden">
         <div className="overflow-x-auto">
             <table className="w-full text-sm text-left">
                 <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-200">
                     <tr>
                         <th className="px-6 py-3">Project Name</th>
                         <th className="px-6 py-3">Client</th>
                         <th className="px-6 py-3 text-right">Contract Value</th>
                         <th className="px-6 py-3 text-right">Forecast Budget</th>
                         <th className="px-6 py-3 text-right">Margin %</th>
                         <th className="px-6 py-3 text-center">Risk Status</th>
                     </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                     {riskProjects.map(p => (
                         <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                             <td className="px-6 py-4 font-medium text-gray-900">{p.name}</td>
                             <td className="px-6 py-4 text-gray-600">{p.client}</td>
                             <td className="px-6 py-4 text-right font-medium">{FORMAT_CURRENCY(p.contractValueP)}</td>
                             <td className="px-6 py-4 text-right text-gray-600">{FORMAT_CURRENCY(p.forecastBudgetP)}</td>
                             <td className="px-6 py-4 text-right">
                                 <span className={`font-bold ${p.margin < 10 ? 'text-red-500' : (p.margin < 15 ? 'text-orange-500' : 'text-green-600')}`}>
                                     {p.margin.toFixed(1)}%
                                 </span>
                             </td>
                             <td className="px-6 py-4 text-center">
                                 <span className={`inline-flex px-2 py-1 rounded text-xs font-bold border ${
                                     p.margin < 10 
                                     ? 'bg-red-50 text-red-700 border-red-100' 
                                     : (p.margin < 15 ? 'bg-orange-50 text-orange-700 border-orange-100' : 'bg-green-50 text-green-700 border-green-100')
                                 }`}>
                                     {p.margin < 10 ? 'Critical' : (p.margin < 15 ? 'Monitor' : 'Healthy')}
                                 </span>
                             </td>
                         </tr>
                     ))}
                 </tbody>
             </table>
         </div>
         <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 text-right">
             <Link to="/projects" className="text-sm font-medium text-[#00B5D8] hover:underline">View All Projects</Link>
         </div>
      </Card>
    </div>
  );
};
