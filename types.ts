
import React from 'react';

export enum ProjectStage {
  NEGOTIATION = 'Negotiation',
  PRE_START = 'Pre-Start',
  ON_SITE = 'On-site',
  CLOSING_OUT = 'Closing out',
  FINAL_ACCOUNT = 'Final Account',
  FINALISED = 'Finalised'
}

export enum ApplicationStatus {
  TO_DO = 'to_do',
  APPLIED = 'applied',
  CERTIFIED = 'certified',
  INVOICED = 'invoiced',
  PAID = 'paid'
}

export enum RetentionStatus {
  PENDING_SETUP = 'Pending Setup', // Just moved from Applications, needs PC date
  IN_DLP = 'In DLP',               // Defects Liability Period active
  RELEASE_DUE = 'Release Due',     // DLP ended, cert required
  RELEASED = 'Released',           // Certificate issued, waiting for payment
  PAID = 'Paid'                    // Fully closed
}

export interface FYAllocation {
  fyLabel: string; // e.g., "FY 2024/25"
  incomeP: number; // Pence
  costP: number;   // Pence
  progress: number; // Percentage 0-100 specific to this FY allocation
}

export interface Client {
  id: string;
  name: string;
  contactEmail: string;
  paymentTerms: string;
  paymentTermDays: number;
  paymentDelayDays: number;
  insuredAmountP: number; // Pence
}

export interface ProjectPhase {
  id: string;
  name: string; // e.g., "Zone 1", "Block A"
  startDate: string;
  endDate: string;
  type: 'Phase' | 'Zone' | 'Block' | 'Stage';
}

export interface Project {
  id: string;
  code: string;
  name: string;
  client: string; // Stores client Name for display, could be ID in real app
  clientId?: string;
  managerId?: string; // Project Manager
  stage: ProjectStage;
  contractValueP: number; // Pence (Total)
  forecastBudgetP: number; // Pence (Total)
  retentionPercentage: number; // Default Retention % (e.g., 5)
  startDate: string;
  endDate: string;
  progress: number; // Percentage 0-100 (Overall)
  fyAllocations: FYAllocation[];
  phases?: ProjectPhase[]; // Sub-dependencies
  
  // Location Data
  address?: string;
  city?: string;
  postcode?: string;
}

export interface PaymentScheduleConfig {
  firstDueDate: string; // YYYY-MM-DD
  paymentTermsDays: number; // e.g. 14
  payLessNoticeOffset: number; // e.g. 5 (Days before final date)
  applicationOffset: number; // e.g. 7 (Days before due date)
  recurrenceMonths: number; // How many months to generate
}

export interface Reminder {
  id: string;
  email: string;
  daysBefore: number;
  triggerField: 'applicationDate' | 'dueDate' | 'finalDateForPayment';
}

export interface Application {
  id: string;
  projectId: string;
  projectName: string;
  periodMonth: string; // "Jan 2024" - Display label
  
  // Amounts at different stages
  appliedAmountP: number; // Contractor's Application
  
  // Certification Breakdown
  grossCertifiedAmountP: number; // Valuation before retention
  retentionDeductedP: number; // Amount withheld
  retentionPercentage: number; // Percentage used for this application
  certifiedAmountP: number; // Net Payment Due (Gross - Retention)
  
  invoicedAmountP: number;
  
  amountP: number; // Current active amount for display/totals
  status: ApplicationStatus;
  
  // JCT Specific Dates
  applicationDate: string; // Contractor's Application
  dueDate: string; // Contract Due Date / Payment Notice Deadline
  payLessNoticeDate: string; // Pay Less Notice Deadline
  finalDateForPayment: string; // Final Date for Payment
  
  // Actuals
  actualPaymentDate?: string;
  forecastReceiptDate?: string; // Overridable date for cash flow planning

  // Reminders
  reminders: Reminder[];
}

export interface RetentionRecord {
  id: string;
  projectId: string;
  projectName: string;
  clientName: string;
  projectNumber: string;
  
  contractValueP: number; // Original Contract Value
  totalCertifiedAmountP: number; // Final account value (Invoiced Total)
  totalRetentionHeldP: number; // Total pot held at end of job
  
  status: RetentionStatus;
  
  // Phase 3 Data
  finalAccountDocument?: string; // Filename of the uploaded Final Account
  practicalCompletionDate?: string;
  dlpMonths?: number; // e.g. 12
  dlpEndDate?: string; // Calculated
  finalCertificateDate?: string; // When making good defects cert is issued
  
  amountReleasedP: number; // For Phase 3 tracking

  // Automation
  clientContactEmail?: string;
  staffContactEmail?: string;
  applicationSendDate?: string; // Date to email client
  staffReminderDate?: string; // Date to email staff
  automationEnabled?: boolean;
}

export interface CashFlowData {
  month: string;
  income: number;
  costs: number;
  net: number;
}

// Weekly Planner Types
export interface WeeklyPeriod {
  date: string; // Monday date YYYY-MM-DD
  label: string; // "Week Commencing 12 Feb"
  weekNumber: number;
}

export interface Transaction {
  id: string;
  description: string;
  amountP: number; // Pence
  date: string; // YYYY-MM-DD
  type: 'IN' | 'OUT';
  category: 'Application' | 'Adhoc Income' | 'Fixed Cost' | 'Project Cost';
  status?: string;
  relatedId?: string; // e.g. Application ID
}

export interface AdhocTransaction {
  id: string;
  description: string;
  amountP: number;
  date: string;
  type: 'IN' | 'OUT'; // Income or Expense
  category: string; // VAT, Grant, Sale, etc.
}

export interface FixedCost {
  id: string;
  name: string;
  category: 'Labour' | 'Rent' | 'Utilities' | 'Finance' | 'Other';
  amountP: number;
  frequency: 'weekly' | 'monthly' | 'quarterly';
  startDate: string;
  dayOfWeek?: number; // 1 = Mon
}

// Staffing Types
export interface Role {
  id: string;
  name: string;
  defaultDayRateP: number;
  color: string; // Tailwind class string for badge
}

export interface StaffMember {
  id: string;
  name: string;
  roleId: string;
  email?: string;
  phone?: string;
  active: boolean;
  // Extended Profile
  address?: string;
  dailyRateP?: number; // Specific override
  rating?: string; // 'Very Good', 'Good', 'OK', 'Not Good'
  abilities?: string[]; // 'Spraying', 'Wallpaper', etc.
  qualifications?: string; // 'CSCS Gold', 'Blue', 'Green'
  training?: string[]; // 'IPAF', 'PASMA', 'First Aid'
}

export interface StaffingForecast {
  id: string;
  projectId: string;
  roleId: string;
  weekStartDate: string; // YYYY-MM-DD (Monday)
  headcount: number;
  daysPerWeek: number; // Default 5
}

export interface StaffAssignment {
  id: string;
  staffId: string;
  projectId: string;
  roleId: string; // The role they are fulfilling (usually their default, but can act up/down)
  date: string; // YYYY-MM-DD
  shift: 'Full' | 'AM' | 'PM';
}

export interface MetricCardProps {
  title: string;
  value: string;
  subValue?: string;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'teal' | 'lime' | 'orange' | 'purple';
  icon?: React.ReactNode;
}

// --- Tender AI Types ---

export interface TenderDoc {
  id: string;
  name: string;
  category: 'Contract' | 'Drawing' | 'Program' | 'Spec' | 'Other';
  status: 'analyzing' | 'ready' | 'error';
  uploadDate: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isWebSearch?: boolean; // Indicates if this response used web grounding
  sources?: string[]; // Links to documents or web pages
}

export interface RiskItem {
  id: string;
  category: 'Commercial' | 'Program' | 'Scope' | 'Legal';
  description: string;
  severity: 'High' | 'Medium' | 'Low';
  clauseRef?: string; // e.g., "Clause 2.14"
}

export interface CribSheet {
  contractSum: string;
  startDate: string;
  duration: string;
  lads: string; // Liquidated Damages
  paymentTerms: string;
  retention: string;
  risks: RiskItem[];
}

// --- Settings & User Types ---

export type UserRole = 'Admin' | 'Manager' | 'Editor' | 'Viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  lastLogin?: string;
  avatarUrl?: string;
}

export interface SystemSettings {
  companyName: string;
  currency: 'GBP' | 'USD' | 'EUR';
  dateFormat: string;
  fiscalYearStartMonth: string;
}
