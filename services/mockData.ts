
import { Project, ProjectStage, Application, ApplicationStatus, CashFlowData, Client, RetentionRecord, RetentionStatus, FixedCost, AdhocTransaction, Role, StaffMember, StaffingForecast, User, SystemSettings, StaffAssignment } from '../types';

export const MOCK_CLIENTS: Client[] = [
  {
    id: '1',
    name: 'Apex Holdings',
    contactEmail: 'accounts@apexholdings.com',
    paymentTerms: '30 Days End of Month',
    paymentTermDays: 30,
    paymentDelayDays: 5,
    insuredAmountP: 500000000 // £5m
  },
  {
    id: '2',
    name: 'City Council',
    contactEmail: 'finance@citycouncil.gov.uk',
    paymentTerms: 'Net 30',
    paymentTermDays: 30,
    paymentDelayDays: 15,
    insuredAmountP: 1000000000 // £10m
  },
  {
    id: '3',
    name: 'Maritime Group',
    contactEmail: 'inv@maritime.com',
    paymentTerms: '45 Days End of Month',
    paymentTermDays: 45,
    paymentDelayDays: 0,
    insuredAmountP: 250000000 // £2.5m
  },
  {
    id: '4',
    name: 'EcoEnergy Ltd',
    contactEmail: 'billing@ecoenergy.com',
    paymentTerms: '14 Days',
    paymentTermDays: 14,
    paymentDelayDays: 2,
    insuredAmountP: 100000000 // £1m
  }
];

export const MOCK_PROJECTS: Project[] = [
  {
    id: '1',
    code: 'P-2024-001',
    name: 'Skyline Tower Refurb',
    client: 'Apex Holdings',
    clientId: '1',
    managerId: 'u2',
    stage: ProjectStage.ON_SITE,
    contractValueP: 150000000, // £1.5m Total
    forecastBudgetP: 120000000, // £1.2m Total
    retentionPercentage: 5,
    startDate: '2024-01-15',
    endDate: '2024-12-20',
    progress: 35,
    address: '1 Skyline Way',
    city: 'London',
    postcode: 'E14 9AA',
    fyAllocations: [
      { fyLabel: 'FY 2023/24', incomeP: 20000000, costP: 15000000, progress: 100 }, // Jan 2024 (Completed)
      { fyLabel: 'FY 2024/25', incomeP: 130000000, costP: 105000000, progress: 25 } // Feb 24 - Dec 24 (In Progress)
    ],
    phases: [
        { id: 'ph1', name: 'Strip Out', startDate: '2024-01-15', endDate: '2024-03-01', type: 'Stage' },
        { id: 'ph2', name: 'First Fix', startDate: '2024-03-02', endDate: '2024-06-15', type: 'Stage' },
        { id: 'ph3', name: 'Second Fix', startDate: '2024-06-16', endDate: '2024-09-30', type: 'Stage' },
        { id: 'ph4', name: 'Commissioning', startDate: '2024-10-01', endDate: '2024-12-15', type: 'Stage' }
    ]
  },
  {
    id: '2',
    code: 'P-2024-002',
    name: 'Westside Community Centre',
    client: 'City Council',
    clientId: '2',
    managerId: 'u2',
    stage: ProjectStage.PRE_START,
    contractValueP: 45000000, // £450k
    forecastBudgetP: 38000000,
    retentionPercentage: 3,
    startDate: '2024-06-01',
    endDate: '2025-02-28',
    progress: 0,
    address: '45 Westside Avenue',
    city: 'Manchester',
    postcode: 'M1 5AN',
    fyAllocations: [
      { fyLabel: 'FY 2024/25', incomeP: 35000000, costP: 30000000, progress: 0 },
      { fyLabel: 'FY 2025/26', incomeP: 10000000, costP: 8000000, progress: 0 }
    ],
    phases: [
        { id: 'ph5', name: 'Block A', startDate: '2024-06-01', endDate: '2024-11-30', type: 'Block' },
        { id: 'ph6', name: 'Block B', startDate: '2024-08-01', endDate: '2025-02-15', type: 'Block' }
    ]
  },
  {
    id: '3',
    code: 'P-2023-045',
    name: 'Harbour Logistics Hub',
    client: 'Maritime Group',
    clientId: '3',
    managerId: 'u1',
    stage: ProjectStage.FINALISED,
    contractValueP: 220000000, // £2.2m
    forecastBudgetP: 195000000,
    retentionPercentage: 5,
    startDate: '2023-03-01',
    endDate: '2024-02-15',
    progress: 100,
    address: 'Dockside Road',
    city: 'Southampton',
    postcode: 'SO14 3TG',
    fyAllocations: [
      { fyLabel: 'FY 2023/24', incomeP: 200000000, costP: 180000000, progress: 100 },
      { fyLabel: 'FY 2024/25', incomeP: 20000000, costP: 15000000, progress: 100 }
    ],
    phases: []
  },
  {
    id: '4',
    code: 'P-2024-003',
    name: 'Greenfield Solar Park',
    client: 'EcoEnergy Ltd',
    clientId: '4',
    managerId: 'u1',
    stage: ProjectStage.NEGOTIATION,
    contractValueP: 85000000,
    forecastBudgetP: 70000000,
    retentionPercentage: 5,
    startDate: '2024-09-01',
    endDate: '2025-06-30',
    progress: 0,
    address: 'Solar Farm Lane',
    city: 'Exeter',
    postcode: 'EX5 2DB',
    fyAllocations: [
      { fyLabel: 'FY 2024/25', incomeP: 40000000, costP: 35000000, progress: 0 },
      { fyLabel: 'FY 2025/26', incomeP: 45000000, costP: 35000000, progress: 0 }
    ],
    phases: [
        { id: 'ph7', name: 'Zone 1 (North)', startDate: '2024-09-01', endDate: '2025-01-30', type: 'Zone' },
        { id: 'ph8', name: 'Zone 2 (South)', startDate: '2025-02-01', endDate: '2025-06-30', type: 'Zone' }
    ]
  },
];

export const MOCK_APPLICATIONS: Application[] = [
  { 
    id: 'A1', 
    projectId: '1', 
    projectName: 'Skyline Tower Refurb', 
    periodMonth: 'Mar 2024', 
    amountP: 12500000, // Paid amount
    appliedAmountP: 13000000,
    grossCertifiedAmountP: 13157895, // Approx gross to result in 12.5m net with 5% ret
    retentionDeductedP: 657895,
    retentionPercentage: 5,
    certifiedAmountP: 12500000,
    invoicedAmountP: 12500000,
    status: ApplicationStatus.PAID, 
    applicationDate: '2024-03-23',
    dueDate: '2024-03-30', 
    payLessNoticeDate: '2024-04-09',
    finalDateForPayment: '2024-04-14',
    actualPaymentDate: '2024-04-12',
    reminders: []
  },
  { 
    id: 'A2', 
    projectId: '1', 
    projectName: 'Skyline Tower Refurb', 
    periodMonth: 'Apr 2024', 
    amountP: 15000000, // Invoiced amount
    appliedAmountP: 15000000,
    grossCertifiedAmountP: 15789473,
    retentionDeductedP: 789473,
    retentionPercentage: 5,
    certifiedAmountP: 15000000,
    invoicedAmountP: 15000000,
    status: ApplicationStatus.INVOICED, 
    applicationDate: '2024-04-23',
    dueDate: '2024-04-30', 
    payLessNoticeDate: '2024-05-09',
    finalDateForPayment: '2024-05-14',
    forecastReceiptDate: '2024-05-20', // Added for cashflow
    reminders: [
        { id: 'r1', email: 'accounts@apexholdings.com', daysBefore: 3, triggerField: 'finalDateForPayment' }
    ]
  },
  { 
    id: 'A3', 
    projectId: '1', 
    projectName: 'Skyline Tower Refurb', 
    periodMonth: 'May 2024', 
    amountP: 18000000, // Certified amount
    appliedAmountP: 20000000,
    grossCertifiedAmountP: 18947368,
    retentionDeductedP: 947368,
    retentionPercentage: 5,
    certifiedAmountP: 18000000,
    invoicedAmountP: 0,
    status: ApplicationStatus.CERTIFIED, 
    applicationDate: '2024-05-23',
    dueDate: '2024-05-30', 
    payLessNoticeDate: '2024-06-09',
    finalDateForPayment: '2024-06-14',
    forecastReceiptDate: '2024-06-20', // Added for cashflow
    reminders: []
  },
  { 
    id: 'A4', 
    projectId: '1', 
    projectName: 'Skyline Tower Refurb', 
    periodMonth: 'Jun 2024', 
    amountP: 11000000, // Applied amount
    appliedAmountP: 11000000,
    grossCertifiedAmountP: 0,
    retentionDeductedP: 0,
    retentionPercentage: 5,
    certifiedAmountP: 0,
    invoicedAmountP: 0,
    status: ApplicationStatus.APPLIED, 
    applicationDate: '2024-06-23',
    dueDate: '2024-06-30', 
    payLessNoticeDate: '2024-07-09',
    finalDateForPayment: '2024-07-14',
    reminders: []
  },
];

export const MOCK_RETENTIONS: RetentionRecord[] = [
  {
    id: 'R1',
    projectId: '3', // Harbour Logistics
    projectName: 'Harbour Logistics Hub',
    clientName: 'Maritime Group',
    projectNumber: 'P-2023-045',
    contractValueP: 220000000,
    totalCertifiedAmountP: 220000000, // £2.2m
    totalRetentionHeldP: 5500000, // 2.5% held (Second Moiety)
    status: RetentionStatus.IN_DLP,
    practicalCompletionDate: '2024-02-15',
    dlpMonths: 12,
    dlpEndDate: '2025-02-15',
    amountReleasedP: 0,
    automationEnabled: true,
    clientContactEmail: 'inv@maritime.com',
    staffContactEmail: 'greg@gsdecorating.com',
    applicationSendDate: '2025-02-10',
    staffReminderDate: '2025-02-01'
  },
  {
    id: 'R2',
    projectId: '99', // Example finalized project
    projectName: 'Riverside Apartments',
    clientName: 'Apex Holdings',
    projectNumber: 'P-2022-010',
    contractValueP: 500000000,
    totalCertifiedAmountP: 500000000,
    totalRetentionHeldP: 12500000,
    status: RetentionStatus.RELEASE_DUE,
    practicalCompletionDate: '2023-03-30',
    dlpMonths: 12,
    dlpEndDate: '2024-03-30',
    amountReleasedP: 0,
    automationEnabled: false
  },
  {
    id: 'R3',
    projectId: '100', 
    projectName: 'Oakwood Primary School',
    clientName: 'City Council',
    projectNumber: 'P-2024-008',
    contractValueP: 75000000,
    totalCertifiedAmountP: 75000000,
    totalRetentionHeldP: 3750000, // Full 5% held currently
    status: RetentionStatus.PENDING_SETUP,
    amountReleasedP: 0,
    automationEnabled: false
  }
];

export const MOCK_CASHFLOW: CashFlowData[] = [
  { month: 'Jan', income: 120000, costs: 95000, net: 25000 },
  { month: 'Feb', income: 135000, costs: 100000, net: 35000 },
  { month: 'Mar', income: 110000, costs: 105000, net: 5000 },
  { month: 'Apr', income: 160000, costs: 110000, net: 50000 },
  { month: 'May', income: 190000, costs: 125000, net: 65000 },
  { month: 'Jun', income: 140000, costs: 120000, net: 20000 },
  { month: 'Jul', income: 155000, costs: 115000, net: 40000 },
  { month: 'Aug', income: 180000, costs: 130000, net: 50000 },
  { month: 'Sep', income: 200000, costs: 140000, net: 60000 },
  { month: 'Oct', income: 210000, costs: 145000, net: 65000 },
  { month: 'Nov', income: 195000, costs: 135000, net: 60000 },
  { month: 'Dec', income: 150000, costs: 110000, net: 40000 },
];

// WEEKLY PLANNER MOCK DATA
export const MOCK_STARTING_BALANCE = 12500000; // £125k

export const MOCK_FIXED_COSTS: FixedCost[] = [
  { id: 'fc1', name: 'Weekly Payroll', category: 'Labour', amountP: 1500000, frequency: 'weekly', startDate: '2024-01-01', dayOfWeek: 5 }, // Friday
  { id: 'fc2', name: 'Office Rent', category: 'Rent', amountP: 450000, frequency: 'monthly', startDate: '2024-01-01' },
  { id: 'fc3', name: 'Van Lease', category: 'Finance', amountP: 120000, frequency: 'monthly', startDate: '2024-01-15' },
];

export const MOCK_ADHOC_TRANSACTIONS: AdhocTransaction[] = [
  { id: 'ah1', description: 'VAT Refund', amountP: 850000, date: '2024-05-15', type: 'IN', category: 'Tax' },
  { id: 'ah2', description: 'Equipment Sale', amountP: 250000, date: '2024-06-01', type: 'IN', category: 'Asset Sale' },
  { id: 'ah3', description: 'Insurance Premium', amountP: 500000, date: '2024-06-10', type: 'OUT', category: 'Insurance' },
];

// STAFFING MOCK DATA
export const MOCK_ROLES: Role[] = [
    { id: 'r1', name: 'Site Manager', defaultDayRateP: 35000, color: 'bg-purple-100 text-purple-800 border-purple-200' },
    { id: 'r2', name: 'Supervisor', defaultDayRateP: 25000, color: 'bg-blue-100 text-blue-800 border-blue-200' },
    { id: 'r3', name: 'Painter', defaultDayRateP: 18000, color: 'bg-green-100 text-green-800 border-green-200' },
    { id: 'r4', name: 'Labourer', defaultDayRateP: 14000, color: 'bg-gray-100 text-gray-800 border-gray-200' },
    { id: 'r5', name: 'Electrician', defaultDayRateP: 28000, color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
];

export const MOCK_STAFF: StaffMember[] = [
    { 
      id: 's1', 
      name: 'Dave Smith', 
      roleId: 'r1', 
      active: true, 
      email: 'dave@co.com',
      phone: '07700 900123',
      rating: 'Very Good',
      abilities: ['Site Management', 'First Aid', 'H&S'],
      qualifications: 'CSCS Black',
      training: ['SMSTS', 'First Aid'],
      address: '123 High St, London'
    },
    { 
      id: 's2', 
      name: 'John Doe', 
      roleId: 'r3', 
      active: true,
      rating: 'Good',
      abilities: ['Painting', 'Wallpaper', 'Spraying'],
      qualifications: 'CSCS Blue',
      training: ['IPAF', 'PASMA'],
      address: '45 Side Rd, Manchester'
    },
    { 
      id: 's3', 
      name: 'Jane Doe', 
      roleId: 'r3', 
      active: true,
      rating: 'Excellent',
      abilities: ['High End', 'Spraying'],
      qualifications: 'CSCS Gold',
      training: ['IPAF'],
      address: '99 Park Ave, London'
    },
    { 
      id: 's4', 
      name: 'Bob Builder', 
      roleId: 'r4', 
      active: true,
      rating: 'OK',
      abilities: ['General Labour', 'Driving'],
      qualifications: 'CSCS Green',
      training: [],
      address: '10 Brick Ln, London'
    },
    { 
      id: 's5', 
      name: 'Steve Spark', 
      roleId: 'r5', 
      active: true,
      rating: 'Good',
      abilities: ['Electrical', 'Testing'],
      qualifications: 'CSCS Gold',
      training: ['18th Edition'],
      address: '3 Wire Way, Exeter'
    },
];

export const MOCK_STAFFING_FORECAST: StaffingForecast[] = [
    // Skyline Tower Refurb (Project 1)
    { id: 'sf1', projectId: '1', roleId: 'r1', weekStartDate: '2024-05-27', headcount: 1, daysPerWeek: 5 },
    { id: 'sf2', projectId: '1', roleId: 'r3', weekStartDate: '2024-05-27', headcount: 4, daysPerWeek: 5 },
    { id: 'sf3', projectId: '1', roleId: 'r4', weekStartDate: '2024-05-27', headcount: 2, daysPerWeek: 5 },
    
    { id: 'sf4', projectId: '1', roleId: 'r1', weekStartDate: '2024-06-03', headcount: 1, daysPerWeek: 5 },
    { id: 'sf5', projectId: '1', roleId: 'r3', weekStartDate: '2024-06-03', headcount: 4, daysPerWeek: 5 },
    { id: 'sf6', projectId: '1', roleId: 'r4', weekStartDate: '2024-06-03', headcount: 2, daysPerWeek: 5 },
    
    // Westside Community (Project 2)
    { id: 'sf7', projectId: '2', roleId: 'r1', weekStartDate: '2024-06-03', headcount: 1, daysPerWeek: 3 },
    { id: 'sf8', projectId: '2', roleId: 'r2', weekStartDate: '2024-06-03', headcount: 1, daysPerWeek: 5 },
];

export const MOCK_STAFF_ASSIGNMENTS: StaffAssignment[] = [
    { id: 'as1', staffId: 's1', projectId: '1', roleId: 'r1', date: '2024-06-03', shift: 'Full' },
    { id: 'as2', staffId: 's1', projectId: '1', roleId: 'r1', date: '2024-06-04', shift: 'Full' },
    { id: 'as3', staffId: 's1', projectId: '1', roleId: 'r1', date: '2024-06-05', shift: 'Full' },
    { id: 'as4', staffId: 's1', projectId: '1', roleId: 'r1', date: '2024-06-06', shift: 'Full' },
    { id: 'as5', staffId: 's1', projectId: '1', roleId: 'r1', date: '2024-06-07', shift: 'Full' },
    
    { id: 'as6', staffId: 's2', projectId: '1', roleId: 'r3', date: '2024-06-03', shift: 'Full' },
    { id: 'as7', staffId: 's2', projectId: '1', roleId: 'r3', date: '2024-06-04', shift: 'Full' },
];

// SETTINGS MOCK DATA
export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Alex Morgan', email: 'alex@construflow.com', role: 'Admin', active: true, lastLogin: '2024-06-12 09:30', avatarUrl: '' },
  { id: 'u2', name: 'Sarah Jones', email: 'sarah@construflow.com', role: 'Manager', active: true, lastLogin: '2024-06-11 14:20' },
  { id: 'u3', name: 'Mike Ross', email: 'mike@construflow.com', role: 'Viewer', active: false, lastLogin: '2024-05-20 10:00' },
];

export const MOCK_SETTINGS: SystemSettings = {
  companyName: 'ConstruFlow Ltd',
  currency: 'GBP',
  dateFormat: 'DD/MM/YYYY',
  fiscalYearStartMonth: 'February'
};
