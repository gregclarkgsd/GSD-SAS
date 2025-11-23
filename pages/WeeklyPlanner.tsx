
import React, { useState, useMemo, useEffect } from 'react';
import { 
  MOCK_APPLICATIONS, 
  MOCK_STARTING_BALANCE
} from '../services/mockData';
import { Application, WeeklyPeriod } from '../types';
import { FORMAT_CURRENCY } from '../constants';
import { Card } from '../components/Card';
import { 
  CalendarDays, 
  Plus, 
  ChevronDown, 
  ChevronRight,
  CreditCard,
  Zap,
  Trash2,
  Save,
  Type,
  GripVertical,
  Briefcase
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  ReferenceLine
} from 'recharts';

// --- Types for the Grid System ---

type RowType = 'item' | 'header';

interface PlannerRow {
  id: string;
  type: RowType;
  label: string; // Name or Header Title
  category?: string; // For items
  allocations: Record<string, number>; // weekDate -> amountP
}

// --- Helper Functions ---

const getMonday = (d: Date) => {
  const dClone = new Date(d);
  const day = dClone.getDay();
  const diff = dClone.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(dClone.setDate(diff));
};

const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const formatDateKey = (date: Date) => date.toISOString().split('T')[0];

const generateWeeks = (start: Date, count: number): WeeklyPeriod[] => {
  const weeks: WeeklyPeriod[] = [];
  let current = getMonday(start);
  
  for (let i = 0; i < count; i++) {
    const day = current.getDate();
    const month = current.toLocaleString('default', { month: 'short' });
    
    weeks.push({
      date: formatDateKey(current),
      label: `${day} ${month}`,
      weekNumber: i + 1
    });
    current = addDays(current, 7);
  }
  return weeks;
};

// --- Mock Initial Data ---

const INITIAL_COST_ROWS: PlannerRow[] = [
    { id: 'h1', type: 'header', label: 'Project Costs', allocations: {} },
    { id: 'r1', type: 'item', label: 'Labour', category: 'Labour', allocations: {} },
    { id: 'r2', type: 'item', label: 'Materials', category: 'Materials', allocations: {} },
    { id: 'h2', type: 'header', label: 'Overhead', allocations: {} },
    { id: 'r3', type: 'item', label: 'Rent', category: 'Rent', allocations: {} },
    { id: 'r4', type: 'item', label: 'Insurance', category: 'Insurance', allocations: {} },
];

const INITIAL_INCOME_ROWS: PlannerRow[] = [
    { id: 'inc_h1', type: 'header', label: 'Adhoc Receipts', allocations: {} },
    { id: 'inc_r1', type: 'item', label: 'VAT Refund', category: 'Tax', allocations: {} },
    { id: 'inc_r2', type: 'item', label: 'Equipment Sale', category: 'Asset', allocations: {} },
];

export const WeeklyPlanner: React.FC = () => {
  const [startBalance, setStartBalance] = useState(MOCK_STARTING_BALANCE);
  const [weekCount, setWeekCount] = useState(6);
  const [startDate, setStartDate] = useState(formatDateKey(new Date()));
  const [activeTab, setActiveTab] = useState<'planner' | 'adhoc' | 'costs'>('planner');
  
  const [sections, setSections] = useState({ income: true, costs: true });
  const [applications] = useState<Application[]>(MOCK_APPLICATIONS);
  
  const [costRows, setCostRows] = useState<PlannerRow[]>(INITIAL_COST_ROWS);
  const [incomeRows, setIncomeRows] = useState<PlannerRow[]>(INITIAL_INCOME_ROWS);
  
  const [draggedRowIndex, setDraggedRowIndex] = useState<number | null>(null);

  // Initialize dates and demo data
  useEffect(() => {
      const today = new Date();
      const monday = getMonday(today);
      setStartDate(formatDateKey(monday));
      
      const demoWeeks = generateWeeks(monday, 12);
      
      const populateDemoData = (rows: PlannerRow[]) => rows.map(row => {
          if (row.type === 'header') return row;
          const newAllocations = { ...row.allocations };
          if (Object.keys(newAllocations).length === 0) {
              demoWeeks.forEach((w, i) => {
                  if (row.label === 'Labour') newAllocations[w.date] = 1500000;
                  if (row.label === 'Rent' && i % 4 === 0) newAllocations[w.date] = 450000;
                  if (row.label === 'Insurance' && i === 2) newAllocations[w.date] = 120000;
                  if (row.label === 'VAT Refund' && i === 3) newAllocations[w.date] = 850000;
              });
          }
          return { ...row, allocations: newAllocations };
      });

      setCostRows(prev => populateDemoData(prev));
      setIncomeRows(prev => populateDemoData(prev));
  }, []);

  const weeks = useMemo(() => generateWeeks(new Date(startDate), weekCount), [startDate, weekCount]);

  // --- Aggregation Logic ---

  const weeklyData = useMemo(() => {
    let runningBalance = startBalance;
    
    return weeks.map(week => {
      const weekStart = new Date(week.date);
      const weekEnd = addDays(weekStart, 6);
      const weekStartStr = formatDateKey(weekStart);
      const weekEndStr = formatDateKey(weekEnd);

      const openingBalance = runningBalance;

      // Applications Income
      const appIncome = applications
        .filter(app => {
            const d = app.forecastReceiptDate || app.dueDate;
            return d >= weekStartStr && d <= weekEndStr;
        })
        .reduce((sum, a) => sum + a.amountP, 0);

      // Adhoc Income
      const adhocIncome = incomeRows.reduce((sum, row) => {
          return sum + (row.type === 'item' ? (row.allocations[week.date] || 0) : 0);
      }, 0);

      // Costs
      const totalCosts = costRows.reduce((sum, row) => {
          return sum + (row.type === 'item' ? (row.allocations[week.date] || 0) : 0);
      }, 0);

      const totalIncome = appIncome + adhocIncome;
      const netChange = totalIncome - totalCosts;
      const closingBalance = openingBalance + netChange;
      
      runningBalance = closingBalance;

      return {
        ...week,
        openingBalance,
        appIncome,
        adhocIncome,
        totalCosts,
        totalIncome,
        netChange,
        closingBalance
      };
    });
  }, [weeks, startBalance, applications, costRows, incomeRows]);

  const chartData = weeklyData.map(w => ({
      name: w.label,
      Balance: w.closingBalance / 100,
      Income: w.totalIncome / 100,
      Costs: w.totalCosts / 100
  }));

  // --- Grid Handlers ---

  const getRows = (type: 'cost' | 'income') => type === 'cost' ? costRows : incomeRows;
  const setRows = (type: 'cost' | 'income', newRows: PlannerRow[]) => type === 'cost' ? setCostRows(newRows) : setIncomeRows(newRows);

  const handleAddRow = (type: 'cost' | 'income', isHeader: boolean) => {
      const newRow: PlannerRow = {
          id: Math.random().toString(36).substr(2, 9),
          type: isHeader ? 'header' : 'item',
          label: isHeader ? 'New Section' : 'New Item',
          category: isHeader ? undefined : 'General',
          allocations: {}
      };
      setRows(type, [...getRows(type), newRow]);
  };

  const handleDeleteRow = (type: 'cost' | 'income', id: string) => {
      setRows(type, getRows(type).filter(r => r.id !== id));
  };

  const handleUpdateRow = (type: 'cost' | 'income', id: string, field: keyof PlannerRow, value: string) => {
      setRows(type, getRows(type).map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleAllocationChange = (type: 'cost' | 'income', id: string, weekDate: string, value: string) => {
      const numValue = Math.round(parseFloat(value || '0') * 100);
      setRows(type, getRows(type).map(r => {
          if (r.id !== id) return r;
          return { ...r, allocations: { ...r.allocations, [weekDate]: numValue } };
      }));
  };

  // Drag & Drop
  const onDragStart = (index: number) => setDraggedRowIndex(index);
  const onDragOver = (e: React.DragEvent) => e.preventDefault();
  
  const onDrop = (index: number, type: 'cost' | 'income') => {
      if (draggedRowIndex === null || draggedRowIndex === index) return;
      const rows = [...getRows(type)];
      const [draggedItem] = rows.splice(draggedRowIndex, 1);
      rows.splice(index, 0, draggedItem);
      setRows(type, rows);
      setDraggedRowIndex(null);
  };

  const renderGrid = (type: 'cost' | 'income') => {
      const rows = getRows(type);
      return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4">
            <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between gap-4 bg-white">
                <div>
                    <h3 className="text-xl font-bold text-gray-900">{type === 'cost' ? 'Weekly Costs' : 'Adhoc Income'}</h3>
                    <p className="text-sm text-gray-500">Drag rows to reorder. Use headers to group items.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => handleAddRow(type, false)} className="btn-secondary flex items-center gap-2 text-xs">
                        <Plus className="w-4 h-4" /> Add Row
                    </button>
                    <button onClick={() => handleAddRow(type, true)} className="btn-secondary flex items-center gap-2 text-xs">
                        <Type className="w-4 h-4" /> Add Header
                    </button>
                    <button className="btn-primary flex items-center gap-2 text-xs ml-2 bg-gray-900 text-white hover:bg-gray-800">
                        <Save className="w-4 h-4" /> Save
                    </button>
                </div>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                    <thead>
                        <tr className="bg-white border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold">
                            <th className="w-10 p-3"></th>
                            <th className="p-3 text-left min-w-[200px] border-r border-gray-100">{type === 'cost' ? 'Cost Item' : 'Source'}</th>
                            <th className="p-3 text-left w-32 border-r border-gray-100">Category</th>
                            {weeks.map(w => <th key={w.date} className="p-3 text-center min-w-[100px] border-r border-gray-100">{w.label}</th>)}
                            <th className="w-10 p-3"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {rows.map((row, idx) => {
                            if (row.type === 'header') {
                                return (
                                    <tr key={row.id} draggable onDragStart={() => onDragStart(idx)} onDragOver={onDragOver} onDrop={() => onDrop(idx, type)} className="bg-gray-50/80">
                                        <td className="p-3 text-center text-gray-400 cursor-move"><GripVertical className="w-4 h-4 mx-auto" /></td>
                                        <td colSpan={weeks.length + 2} className="p-3 relative">
                                            <div className="flex items-center gap-2 font-bold text-gray-900">
                                                <Type className="w-4 h-4 text-gray-400" />
                                                <input type="text" value={row.label} onChange={(e) => handleUpdateRow(type, row.id, 'label', e.target.value)} className="bg-transparent border-none focus:ring-0 font-bold w-full p-0" placeholder="Section Header" />
                                            </div>
                                            <button onClick={() => handleDeleteRow(type, row.id)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                                        </td>
                                        <td></td>
                                    </tr>
                                );
                            }
                            return (
                                <tr key={row.id} draggable onDragStart={() => onDragStart(idx)} onDragOver={onDragOver} onDrop={() => onDrop(idx, type)} className="group hover:bg-blue-50/20">
                                    <td className="p-3 text-center text-gray-300 cursor-move group-hover:text-gray-400"><GripVertical className="w-4 h-4 mx-auto" /></td>
                                    <td className="p-3 border-r border-gray-100"><input type="text" value={row.label} onChange={(e) => handleUpdateRow(type, row.id, 'label', e.target.value)} className="w-full bg-transparent border-none focus:ring-0 font-medium text-gray-900 p-0" placeholder="Item Name" /></td>
                                    <td className="p-3 border-r border-gray-100"><input type="text" value={row.category || ''} onChange={(e) => handleUpdateRow(type, row.id, 'category', e.target.value)} className="w-full bg-transparent border-none focus:ring-0 text-gray-500 p-0" placeholder="Category" /></td>
                                    {weeks.map(w => (
                                        <td key={w.date} className="p-2 border-r border-gray-100 text-center">
                                            <input type="number" step="0.01" placeholder="-" 
                                                className={`w-24 text-center bg-gray-50 hover:border-gray-300 focus:border-[#00B5D8] focus:bg-white rounded-md px-2 py-1 outline-none transition-all text-sm ${(row.allocations[w.date] || 0) > 0 ? 'font-medium text-gray-900 bg-gray-100' : 'text-gray-400'}`}
                                                value={row.allocations[w.date] ? (row.allocations[w.date] / 100).toFixed(2) : ''}
                                                onChange={(e) => handleAllocationChange(type, row.id, w.date, e.target.value)}
                                            />
                                        </td>
                                    ))}
                                    <td className="p-2 text-center"><button onClick={() => handleDeleteRow(type, row.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4 mx-auto" /></button></td>
                                </tr>
                            );
                        })}
                        {/* Totals Row */}
                        <tr className="bg-gray-50 font-bold border-t-2 border-gray-200 text-xs">
                            <td colSpan={3} className="p-4 text-right text-gray-600 border-r border-gray-200">Total</td>
                            {weeks.map(w => {
                                const total = rows.reduce((sum, r) => sum + (r.type === 'item' ? (r.allocations[w.date] || 0) : 0), 0);
                                return <td key={w.date} className="p-4 text-center border-r border-gray-200 text-gray-900">{FORMAT_CURRENCY(total)}</td>;
                            })}
                            <td></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
      );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-10">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
            <h2 className="text-2xl font-bold text-gray-900">Weekly Planner</h2>
            <p className="text-sm text-gray-500">Tactical short-term forecasting</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 px-3 border-r border-gray-200">
                <Briefcase className="w-4 h-4 text-gray-400" />
                <div className="text-sm">
                    <span className="text-gray-500 block text-[10px] uppercase font-bold">Opening Bank</span>
                    <input type="number" value={(startBalance / 100).toFixed(2)} onChange={(e) => setStartBalance(parseFloat(e.target.value) * 100)} className="font-bold text-gray-900 w-28 outline-none bg-transparent" />
                </div>
            </div>
            <div className="flex items-center gap-2 px-2">
                <select value={weekCount} onChange={(e) => setWeekCount(parseInt(e.target.value))} className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-[#00B5D8] focus:border-[#00B5D8] block p-2">
                    <option value={4}>4 Weeks</option>
                    <option value={6}>6 Weeks</option>
                    <option value={8}>8 Weeks</option>
                    <option value={12}>12 Weeks</option>
                </select>
            </div>
            <button className="flex items-center gap-1 bg-[#00B5D8] hover:bg-[#009bb8] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                <Zap className="w-4 h-4" /> Quick Add
            </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
            <button onClick={() => setActiveTab('planner')} className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'planner' ? 'border-[#00B5D8] text-[#00B5D8]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                <CalendarDays className="mr-2 h-5 w-5" /> Weekly Actions
            </button>
            <button onClick={() => setActiveTab('adhoc')} className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'adhoc' ? 'border-[#00B5D8] text-[#00B5D8]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                <Plus className="mr-2 h-5 w-5" /> Adhoc Income
            </button>
            <button onClick={() => setActiveTab('costs')} className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'costs' ? 'border-[#00B5D8] text-[#00B5D8]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                <CreditCard className="mr-2 h-5 w-5" /> Costs
            </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'planner' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <Card className="overflow-hidden">
                  <div className="overflow-x-auto">
                      <table className="w-full text-sm border-collapse">
                          <thead>
                              <tr className="bg-gray-50 border-b border-gray-200">
                                  <th className="p-4 text-left min-w-[200px] font-semibold text-gray-600 sticky left-0 bg-gray-50 border-r border-gray-200 z-10">Category</th>
                                  {weeklyData.map(w => (
                                      <th key={w.date} className="p-4 text-right min-w-[140px] font-medium text-gray-600 border-r border-gray-100">
                                          <div className="text-gray-900 font-bold">{w.label}</div>
                                          <div className="text-xs text-gray-400 font-normal">{w.date}</div>
                                      </th>
                                  ))}
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                              <tr className="bg-blue-50/30">
                                  <td className="p-4 text-left font-bold text-gray-700 sticky left-0 bg-blue-50/30 border-r border-gray-200">Opening Balance</td>
                                  {weeklyData.map(w => <td key={w.date} className="p-4 text-right font-medium text-gray-600 border-r border-gray-100">{FORMAT_CURRENCY(w.openingBalance)}</td>)}
                              </tr>
                              
                              <tr className="bg-gray-50/50 cursor-pointer hover:bg-gray-100" onClick={() => setSections({...sections, income: !sections.income})}>
                                  <td className="p-3 text-left font-bold text-gray-800 sticky left-0 bg-gray-50/50 border-r border-gray-200 flex items-center gap-2">
                                      {sections.income ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />} Incoming
                                  </td>
                                  {weeklyData.map(w => <td key={w.date} className="p-3 text-right font-bold text-green-600 border-r border-gray-100 bg-gray-50/50">{FORMAT_CURRENCY(w.totalIncome)}</td>)}
                              </tr>
                              {sections.income && (
                                  <>
                                    <tr>
                                        <td className="p-3 pl-8 text-left text-gray-600 sticky left-0 bg-white border-r border-gray-200">Applications</td>
                                        {weeklyData.map(w => <td key={w.date} className="p-3 text-right text-gray-500 border-r border-gray-100">{w.appIncome > 0 ? <span className="text-green-600">{FORMAT_CURRENCY(w.appIncome)}</span> : '-'}</td>)}
                                    </tr>
                                    <tr>
                                        <td className="p-3 pl-8 text-left text-gray-600 sticky left-0 bg-white border-r border-gray-200">Adhoc Income</td>
                                        {weeklyData.map(w => <td key={w.date} className="p-3 text-right text-gray-500 border-r border-gray-100">{w.adhocIncome > 0 ? <span className="text-green-600">{FORMAT_CURRENCY(w.adhocIncome)}</span> : '-'}</td>)}
                                    </tr>
                                  </>
                              )}

                              <tr className="bg-gray-50/50 cursor-pointer hover:bg-gray-100" onClick={() => setSections({...sections, costs: !sections.costs})}>
                                  <td className="p-3 text-left font-bold text-gray-800 sticky left-0 bg-gray-50/50 border-r border-gray-200 flex items-center gap-2">
                                      {sections.costs ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />} Outgoing
                                  </td>
                                  {weeklyData.map(w => <td key={w.date} className="p-3 text-right font-bold text-red-500 border-r border-gray-100 bg-gray-50/50">{FORMAT_CURRENCY(w.totalCosts)}</td>)}
                              </tr>

                              <tr className="bg-gray-100 font-bold border-t-2 border-gray-200">
                                  <td className="p-4 text-left text-gray-900 sticky left-0 bg-gray-100 border-r border-gray-200 shadow-sm">Closing Balance</td>
                                  {weeklyData.map(w => <td key={w.date} className={`p-4 text-right border-r border-gray-200 ${w.closingBalance < 0 ? 'text-red-600 bg-red-50' : 'text-gray-900'}`}>{FORMAT_CURRENCY(w.closingBalance)}</td>)}
                              </tr>
                          </tbody>
                      </table>
                  </div>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card title="Projected Balance">
                      <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                                <ReferenceLine y={0} stroke="#000" strokeDasharray="3 3" />
                                <Line type="monotone" dataKey="Balance" stroke="#00B5D8" strokeWidth={3} dot={{r: 4, fill: '#00B5D8'}} />
                            </LineChart>
                        </ResponsiveContainer>
                      </div>
                  </Card>
                  <Card title="Cash Movement">
                      <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} />
                                <Tooltip cursor={{fill: '#F9FAFB'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                                <Legend />
                                <Bar dataKey="Income" fill="#6DD3A6" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Costs" fill="#FF9A3E" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                      </div>
                  </Card>
              </div>
          </div>
      )}

      {activeTab === 'adhoc' && renderGrid('income')}
      {activeTab === 'costs' && renderGrid('cost')}
    </div>
  );
};
