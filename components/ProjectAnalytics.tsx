import React from 'react';
import { Project } from '../types';
import { Card } from './Card';
import { FORMAT_CURRENCY, STAGE_ORDER } from '../constants';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  ScatterChart, Scatter, ZAxis, Cell, Legend 
} from 'recharts';
import { TrendingUp, AlertTriangle, Briefcase, Target, PieChart } from 'lucide-react';

interface ProjectAnalyticsProps {
  projects: Project[];
  selectedFy?: string;
}

export const ProjectAnalytics: React.FC<ProjectAnalyticsProps> = ({ projects, selectedFy }) => {
  
  // --- KPI Calculations ---
  // If selectedFy is provided, sum up allocations for that year
  // Otherwise sum up project totals
  
  const totalValue = projects.reduce((sum, p) => {
      if (selectedFy) {
          const alloc = p.fyAllocations.find(a => a.fyLabel === selectedFy);
          return sum + (alloc?.incomeP || 0);
      }
      return sum + p.contractValueP;
  }, 0);

  const totalCost = projects.reduce((sum, p) => {
      if (selectedFy) {
          const alloc = p.fyAllocations.find(a => a.fyLabel === selectedFy);
          return sum + (alloc?.costP || 0);
      }
      return sum + p.forecastBudgetP;
  }, 0);

  const totalProfit = totalValue - totalCost;
  const avgMargin = totalValue > 0 ? (totalProfit / totalValue) * 100 : 0;
  
  const lowMarginCount = projects.filter(p => {
    let value = 0;
    let cost = 0;
    
    if (selectedFy) {
        const alloc = p.fyAllocations.find(a => a.fyLabel === selectedFy);
        value = alloc?.incomeP || 0;
        cost = alloc?.costP || 0;
        // Only count projects that actually have value in this FY
        if (value === 0) return false;
    } else {
        value = p.contractValueP;
        cost = p.forecastBudgetP;
    }

    const m = value > 0 ? ((value - cost) / value) * 100 : 0;
    return m < 5;
  }).length;

  // Count only projects active in this FY (have income allocation)
  const activeCount = selectedFy 
    ? projects.filter(p => {
        const alloc = p.fyAllocations.find(a => a.fyLabel === selectedFy);
        return (alloc?.incomeP || 0) > 0;
      }).length 
    : projects.length;

  // --- Funnel Data (Stage Distribution) ---
  const funnelData = STAGE_ORDER.map(stage => {
    const stageProjects = projects.filter(p => p.stage === stage);
    
    const value = stageProjects.reduce((sum, p) => {
        if (selectedFy) {
            const alloc = p.fyAllocations.find(a => a.fyLabel === selectedFy);
            return sum + (alloc?.incomeP || 0);
        }
        return sum + p.contractValueP;
    }, 0);

    return {
      name: stage,
      value: value / 100, // Convert to pounds for chart
      count: stageProjects.length
    };
  }).filter(d => d.value > 0 || (d.count > 0 && !selectedFy)); // Show stages with value, or counts if global

  // --- Scatter Plot Data (Margin vs Value) ---
  const scatterData = projects.map(p => {
    let value = 0;
    let cost = 0;

    if (selectedFy) {
        const alloc = p.fyAllocations.find(a => a.fyLabel === selectedFy);
        value = alloc?.incomeP || 0;
        cost = alloc?.costP || 0;
    } else {
        value = p.contractValueP;
        cost = p.forecastBudgetP;
    }

    if (value === 0) return null; // Skip projects with no value in this view

    const margin = value > 0 ? ((value - cost) / value) * 100 : 0;
    
    return {
      id: p.id,
      name: p.name,
      x: value / 100, // Value (£)
      y: parseFloat(margin.toFixed(2)), // Margin (%)
      z: 1 // Bubble size (could be duration or risk score)
    };
  }).filter(Boolean) as any[];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                {selectedFy ? `${selectedFy} Value` : 'Portfolio Value'}
            </p>
            <p className="text-xl font-bold text-gray-900">{FORMAT_CURRENCY(totalValue)}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Avg. Margin</p>
            <p className="text-xl font-bold text-gray-900">{avgMargin.toFixed(1)}%</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                {selectedFy ? `Projects in ${selectedFy}` : 'Active Projects'}
            </p>
            <p className="text-xl font-bold text-gray-900">{activeCount}</p>
          </div>
        </div>

        <div className={`bg-white p-5 rounded-2xl border shadow-sm flex items-center gap-4 ${lowMarginCount > 0 ? 'border-orange-200 bg-orange-50/30' : 'border-gray-200'}`}>
          <div className={`p-3 rounded-xl ${lowMarginCount > 0 ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-500'}`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Low Margin Risk</p>
            <p className={`text-xl font-bold ${lowMarginCount > 0 ? 'text-orange-600' : 'text-gray-900'}`}>{lowMarginCount} <span className="text-sm font-normal text-gray-500">projects</span></p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Stage Funnel / Distribution */}
        <Card title="Pipeline Value by Stage">
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={funnelData}
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false}
                  width={100}
                  tick={{fill: '#4B5563', fontSize: 12, fontWeight: 500}} 
                />
                <Tooltip 
                  cursor={{fill: '#F3F4F6'}}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  formatter={(value: number) => [`£${value.toLocaleString()}`, 'Value']}
                />
                <Bar dataKey="value" fill="#00B5D8" radius={[0, 4, 4, 0]} barSize={30}>
                   {funnelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#EAB308', '#A855F7', '#22C55E', '#06B6D4', '#F97316', '#64748B'][index % 6]} />
                    ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Margin vs Value Scatter */}
        <Card title="Margin Analysis (Risk Matrix)">
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  type="number" 
                  dataKey="x" 
                  name="Contract Value" 
                  unit="£" 
                  axisLine={false}
                  tickLine={false}
                  tick={{fill: '#9CA3AF', fontSize: 11}}
                  tickFormatter={(val) => `£${(val/1000).toFixed(0)}k`}
                />
                <YAxis 
                  type="number" 
                  dataKey="y" 
                  name="Margin" 
                  unit="%" 
                  axisLine={false}
                  tickLine={false}
                  tick={{fill: '#9CA3AF', fontSize: 11}}
                />
                <ZAxis type="number" dataKey="z" range={[60, 400]} />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }} 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 border border-gray-100 shadow-lg rounded-xl">
                          <p className="font-bold text-gray-900 mb-1">{data.name}</p>
                          <p className="text-xs text-gray-500">Value: <span className="font-medium text-gray-700">{FORMAT_CURRENCY(data.x * 100)}</span></p>
                          <p className="text-xs text-gray-500">Margin: <span className={`font-medium ${data.y < 10 ? 'text-red-500' : 'text-green-600'}`}>{data.y}%</span></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter name="Projects" data={scatterData} fill="#00B5D8">
                  {scatterData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.y < 10 ? '#EF4444' : (entry.y > 20 ? '#10B981' : '#00B5D8')} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </Card>

      </div>
    </div>
  );
};