import React from 'react';
import { Card } from '../components/Card';
import { MOCK_CASHFLOW } from '../services/mockData';
import { FORMAT_CURRENCY } from '../constants';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export const CashFlow: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
           <Card title="12-Month Cash Forecast">
            <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={MOCK_CASHFLOW} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                    <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00B5D8" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#00B5D8" stopOpacity={0}/>
                    </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                    />
                    <ReferenceLine y={0} stroke="#000" />
                    <Area type="monotone" dataKey="net" stroke="#00B5D8" strokeWidth={3} fillOpacity={1} fill="url(#colorNet)" name="Net Cash Position" />
                </AreaChart>
                </ResponsiveContainer>
            </div>
           </Card>

           <Card title="Monthly Breakdown">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-100 bg-gray-50">
                            <th className="text-left py-3 px-4 font-semibold text-gray-600">Month</th>
                            <th className="text-right py-3 px-4 font-semibold text-green-600">Income</th>
                            <th className="text-right py-3 px-4 font-semibold text-red-500">Costs</th>
                            <th className="text-right py-3 px-4 font-semibold text-gray-800">Net</th>
                            <th className="text-right py-3 px-4 font-semibold text-gray-600">Cumulative</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {MOCK_CASHFLOW.map((row, i) => {
                            const cumulative = MOCK_CASHFLOW.slice(0, i + 1).reduce((sum, r) => sum + r.net, 0);
                            return (
                                <tr key={row.month} className="hover:bg-gray-50">
                                    <td className="py-3 px-4 font-medium text-gray-900">{row.month}</td>
                                    <td className="py-3 px-4 text-right text-green-600">{FORMAT_CURRENCY(row.income * 100)}</td>
                                    <td className="py-3 px-4 text-right text-red-500">{FORMAT_CURRENCY(row.costs * 100)}</td>
                                    <td className="py-3 px-4 text-right font-medium">{FORMAT_CURRENCY(row.net * 100)}</td>
                                    <td className="py-3 px-4 text-right text-gray-500">{FORMAT_CURRENCY(cumulative * 100)}</td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
           </Card>
        </div>

        <div className="space-y-6">
            <div className="bg-[#2B3467] text-white p-6 rounded-2xl shadow-lg">
                <h3 className="text-lg font-semibold mb-1 opacity-80">Current Bank Position</h3>
                <div className="text-3xl font-bold mb-6">£1,245,000.00</div>
                
                <div className="space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-white/10">
                        <span className="text-sm opacity-70">Projected In (30d)</span>
                        <span className="text-green-400 font-medium">+£125k</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-white/10">
                        <span className="text-sm opacity-70">Projected Out (30d)</span>
                        <span className="text-red-400 font-medium">-£95k</span>
                    </div>
                    <div className="pt-2">
                        <button className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors">
                            View Bank Reconciliations
                        </button>
                    </div>
                </div>
            </div>

            <Card title="Overhead Allocations">
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                            <span className="text-sm text-gray-600">Office Rent</span>
                        </div>
                        <span className="text-sm font-medium">£4,500</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            <span className="text-sm text-gray-600">Software Licenses</span>
                        </div>
                        <span className="text-sm font-medium">£1,200</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                            <span className="text-sm text-gray-600">Insurance</span>
                        </div>
                        <span className="text-sm font-medium">£2,800</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                        <span className="text-sm font-bold text-gray-900">Total Fixed Costs</span>
                        <span className="text-sm font-bold text-gray-900">£8,500</span>
                    </div>
                </div>
            </Card>
        </div>
      </div>
    </div>
  );
};
