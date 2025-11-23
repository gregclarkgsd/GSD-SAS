
import React, { useState } from 'react';
import { Users, Building2, Shield, Globe, Save, Plus, Edit2, Trash2, CheckCircle, UserPlus, KeyRound } from 'lucide-react';
import { Card } from '../components/Card';
import { MOCK_USERS, MOCK_SETTINGS } from '../services/mockData';
import { User, SystemSettings, UserRole } from '../types';
import { UserModal } from '../components/UserModal';

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'users' | 'security'>('general');
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [settings, setSettings] = useState<SystemSettings>(MOCK_SETTINGS);
  
  // User Modal State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>(undefined);

  // Password Form State
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    // In real app, this would allow saving via API
    alert('Settings updated successfully.');
  };

  const handleAddUser = (userData: Omit<User, 'id' | 'lastLogin'>) => {
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      ...userData,
      lastLogin: 'Never'
    };
    setUsers([...users, newUser]);
  };

  const handleEditUser = (userData: Omit<User, 'id' | 'lastLogin'>) => {
    if (editingUser) {
      setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...userData } : u));
    }
  };

  const handleDeleteUser = (id: string) => {
    if (window.confirm('Are you sure you want to remove this user?')) {
      setUsers(users.filter(u => u.id !== id));
    }
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setIsUserModalOpen(true);
  };

  const openAddModal = () => {
    setEditingUser(undefined);
    setIsUserModalOpen(true);
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.new !== passwordForm.confirm) {
      alert("New passwords do not match.");
      return;
    }
    alert("Password changed successfully.");
    setPasswordForm({ current: '', new: '', confirm: '' });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
          <p className="text-sm text-gray-500">Manage system preferences and team access.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('general')}
            className={`
              group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors
              ${activeTab === 'general' 
                ? 'border-[#00B5D8] text-[#00B5D8]' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
            `}
          >
            <Building2 className="w-4 h-4 mr-2" />
            General
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`
              group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors
              ${activeTab === 'users' 
                ? 'border-[#00B5D8] text-[#00B5D8]' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
            `}
          >
            <Users className="w-4 h-4 mr-2" />
            Team Access
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`
              group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors
              ${activeTab === 'security' 
                ? 'border-[#00B5D8] text-[#00B5D8]' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
            `}
          >
            <Shield className="w-4 h-4 mr-2" />
            Security
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="max-w-4xl">
        
        {/* General Settings */}
        {activeTab === 'general' && (
          <Card title="System Configuration">
            <form onSubmit={handleSaveSettings} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700">Company Name</label>
                  <input 
                    type="text"
                    value={settings.companyName}
                    onChange={(e) => setSettings({...settings, companyName: e.target.value})}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#00B5D8] text-gray-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700">Base Currency</label>
                  <select 
                    value={settings.currency}
                    onChange={(e) => setSettings({...settings, currency: e.target.value as any})}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#00B5D8] text-gray-900"
                  >
                    <option value="GBP">GBP (£)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700">Date Format</label>
                  <select 
                    value={settings.dateFormat}
                    onChange={(e) => setSettings({...settings, dateFormat: e.target.value})}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#00B5D8] text-gray-900"
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700">Fiscal Year Start</label>
                  <select 
                    value={settings.fiscalYearStartMonth}
                    onChange={(e) => setSettings({...settings, fiscalYearStartMonth: e.target.value})}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#00B5D8] text-gray-900"
                  >
                    {['January', 'February', 'April', 'July', 'September'].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end pt-4 border-t border-gray-100">
                <button type="submit" className="flex items-center px-4 py-2 bg-[#00B5D8] text-white rounded-lg hover:bg-[#009bb8] shadow-sm transition-colors font-medium text-sm">
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </button>
              </div>
            </form>
          </Card>
        )}

        {/* User Management */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex justify-end">
              <button 
                onClick={openAddModal}
                className="flex items-center px-4 py-2 bg-[#00B5D8] text-white rounded-lg hover:bg-[#009bb8] shadow-sm transition-colors font-medium text-sm"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Enroll New User
              </button>
            </div>

            <Card className="overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3">User</th>
                    <th className="px-6 py-3">Role</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Last Login</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{user.name}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${user.role === 'Admin' ? 'bg-purple-100 text-purple-800' : 
                            user.role === 'Manager' ? 'bg-blue-100 text-blue-800' : 
                            'bg-gray-100 text-gray-800'
                          }
                        `}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {user.active ? (
                          <span className="text-green-600 text-xs font-medium flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Active
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs font-medium">Inactive</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-xs">
                        {user.lastLogin || 'Never'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => openEditModal(user)}
                            className="p-1 text-gray-400 hover:text-[#00B5D8] transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        )}

        {/* Security */}
        {activeTab === 'security' && (
          <Card title="Change Password">
            <form onSubmit={handlePasswordChange} className="space-y-6 max-w-md">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Current Password</label>
                <div className="relative">
                  <input 
                    type="password"
                    required
                    value={passwordForm.current}
                    onChange={(e) => setPasswordForm({...passwordForm, current: e.target.value})}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#00B5D8] text-gray-900"
                  />
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">New Password</label>
                <input 
                  type="password"
                  required
                  value={passwordForm.new}
                  onChange={(e) => setPasswordForm({...passwordForm, new: e.target.value})}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#00B5D8] text-gray-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Confirm New Password</label>
                <input 
                  type="password"
                  required
                  value={passwordForm.confirm}
                  onChange={(e) => setPasswordForm({...passwordForm, confirm: e.target.value})}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#00B5D8] text-gray-900"
                />
              </div>

              <div className="pt-2">
                <button type="submit" className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 shadow-sm transition-colors font-medium text-sm">
                  Update Password
                </button>
              </div>
            </form>
          </Card>
        )}

      </div>

      <UserModal 
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        user={editingUser}
        onSave={editingUser ? handleEditUser : handleAddUser}
      />
    </div>
  );
};
