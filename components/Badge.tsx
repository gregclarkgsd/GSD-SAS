import React from 'react';
import { ProjectStage, ApplicationStatus } from '../types';

interface BadgeProps {
  status: ProjectStage | ApplicationStatus | string;
  size?: 'sm' | 'md';
}

const getStatusStyles = (status: string) => {
  switch (status) {
    // Project Stages
    case ProjectStage.ON_SITE: // Was LIVE
      return 'bg-green-100 text-green-700 border-green-200';
    case ProjectStage.NEGOTIATION: // Was TENDERING
      return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case ProjectStage.FINALISED: // Was COMPLETED
      return 'bg-slate-100 text-slate-700 border-slate-200';
    case ProjectStage.CLOSING_OUT: // New
      return 'bg-cyan-100 text-cyan-700 border-cyan-200';
    case ProjectStage.FINAL_ACCOUNT: // New
      return 'bg-orange-100 text-orange-700 border-orange-200';
    case ProjectStage.PRE_START: // Was PLANNING
      return 'bg-purple-100 text-purple-700 border-purple-200';
    
    // Application Status
    case ApplicationStatus.PAID:
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case ApplicationStatus.INVOICED:
      return 'bg-cyan-100 text-cyan-700 border-cyan-200';
    case ApplicationStatus.CERTIFIED:
      return 'bg-indigo-100 text-indigo-700 border-indigo-200';
    case ApplicationStatus.APPLIED:
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case ApplicationStatus.TO_DO:
      return 'bg-gray-100 text-gray-600 border-gray-200';
    
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const Badge: React.FC<BadgeProps> = ({ status, size = 'md' }) => {
  const styles = getStatusStyles(status);
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span className={`inline-flex items-center justify-center font-medium rounded-full border ${styles} ${sizeClasses}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
};