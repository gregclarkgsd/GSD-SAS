
import React, { useState, useRef } from 'react';
import { X, Upload, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { StaffMember, Role } from '../types';

interface StaffImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (staff: StaffMember[]) => void;
  existingRoles: Role[];
}

export const StaffImportModal: React.FC<StaffImportModalProps> = ({ isOpen, onClose, onImport, existingRoles }) => {
  const [previewData, setPreviewData] = useState<Partial<StaffMember>[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        parseCSV(e.target.files[0]);
    }
  };

  const parseCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target?.result as string;
        try {
            const lines = text.split('\n').filter(l => l.trim());
            if (lines.length < 2) throw new Error("CSV is empty or missing headers");

            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
            // Basic mapping logic
            const data: Partial<StaffMember>[] = lines.slice(1).map(line => {
                const values = line.split(','); // Simple split, ideally use a library for quotes
                const member: any = {
                    id: Math.random().toString(36).substr(2, 9),
                    active: true,
                    abilities: [],
                    training: []
                };

                headers.forEach((header, i) => {
                    const val = values[i]?.trim();
                    if (!val) return;

                    if (header.includes('name')) member.name = val;
                    else if (header.includes('email')) member.email = val;
                    else if (header.includes('phone')) member.phone = val;
                    else if (header.includes('role')) {
                        // Try to match role name
                        const role = existingRoles.find(r => r.name.toLowerCase() === val.toLowerCase());
                        member.roleId = role ? role.id : existingRoles[0].id; // Fallback to first role
                    }
                    else if (header.includes('rate')) member.dailyRateP = parseFloat(val) * 100;
                    else if (header.includes('qual')) member.qualifications = val;
                    else if (header.includes('rating')) member.rating = val;
                    else if (header.includes('skill') || header.includes('ability')) member.abilities = val.split(';').map((s:string) => s.trim());
                });
                return member;
            });
            
            setPreviewData(data);
            setError(null);
        } catch (err) {
            setError("Failed to parse CSV. Please ensure it matches the template.");
        }
    };
    reader.readAsText(file);
  };

  const handleConfirm = () => {
      onImport(previewData as StaffMember[]);
      setPreviewData([]);
      onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Bulk Import Staff</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
            {previewData.length === 0 ? (
                <div 
                    className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <Upload className="w-10 h-10 text-[#00B5D8] mx-auto mb-3" />
                    <h3 className="font-bold text-gray-900">Upload CSV File</h3>
                    <p className="text-sm text-gray-500 mb-4">Drag and drop or click to browse</p>
                    <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleFileSelect} />
                    <div className="text-xs text-gray-400 bg-gray-100 p-3 rounded-lg inline-block text-left">
                        <strong>Required Columns:</strong> Name, Role, Daily Rate<br/>
                        <strong>Optional:</strong> Email, Phone, Rating, Qualifications, Skills (semicolon separated)
                    </div>
                </div>
            ) : (
                <div>
                    <div className="flex items-center gap-2 mb-4 text-green-600">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-bold">{previewData.length} staff members found</span>
                    </div>
                    <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-xl">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 sticky top-0">
                                <tr>
                                    <th className="px-4 py-2">Name</th>
                                    <th className="px-4 py-2">Role</th>
                                    <th className="px-4 py-2">Rate</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {previewData.map((p, i) => (
                                    <tr key={i}>
                                        <td className="px-4 py-2 font-medium">{p.name}</td>
                                        <td className="px-4 py-2">{existingRoles.find(r => r.id === p.roleId)?.name || 'Unknown'}</td>
                                        <td className="px-4 py-2">{p.dailyRateP ? `£${(p.dailyRateP/100).toFixed(2)}` : '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
                <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button 
                    onClick={handleConfirm} 
                    disabled={previewData.length === 0}
                    className="px-6 py-2 bg-[#00B5D8] text-white font-bold rounded-lg hover:bg-[#009bb8] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Import Data
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
