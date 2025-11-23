
import { PaymentScheduleConfig, ProjectPhase, TenderDoc, CribSheet, ChatMessage, RiskItem, StaffMember, Project } from '../types';
import { GoogleGenAI } from "@google/genai";

// This function simulates how the AI service would query locations using Maps Grounding
export const getProjectLocationDetails = async (address: string): Promise<string> => {
    return "Simulated Maps Grounding Response: Location details retrieved.";
};

export const analyzeContractDocument = async (file: File): Promise<Partial<PaymentScheduleConfig>> => {
  return new Promise((resolve) => {
    const fileName = file.name.toLowerCase();
    const isQueensProject = fileName.includes('queen') || fileName.includes('schedule');
    const isHornsbyProject = fileName.includes('hornsby') || fileName.includes('thomas') || fileName.includes('sinden');

    setTimeout(() => {
      console.log(`Analyzing file: ${file.name} with Gemini AI...`);
      
      if (isQueensProject) {
        const today = new Date();
        const lastDayNextMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0);
        
        resolve({
            firstDueDate: lastDayNextMonth.toISOString().split('T')[0], 
            paymentTermsDays: 35, 
            payLessNoticeOffset: 5, 
            applicationOffset: 16, 
            recurrenceMonths: 18 
        });
      } else if (isHornsbyProject) {
        resolve({
            firstDueDate: '2025-12-16', 
            paymentTermsDays: 35,       
            payLessNoticeOffset: 1,     
            applicationOffset: 7,       
            recurrenceMonths: 15        
        });
      } else {
        resolve({
            firstDueDate: new Date().toISOString().split('T')[0],
            paymentTermsDays: 14, 
            payLessNoticeOffset: 5, 
            applicationOffset: 7, 
            recurrenceMonths: 12 
        });
      }
    }, 2500);
  });
};

export const analyzeFinalAccountDocument = async (file: File): Promise<{ practicalCompletionDate?: string }> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            console.log(`Analyzing Final Account: ${file.name} with Gemini AI...`);
            const today = new Date();
            const twoWeeksAgo = new Date(today.setDate(today.getDate() - 14));
            
            resolve({
                practicalCompletionDate: twoWeeksAgo.toISOString().split('T')[0]
            });
        }, 2000);
    });
};

export const analyzeProjectProgramme = async (file: File): Promise<Partial<ProjectPhase>[]> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            console.log(`Scanning programme ${file.name} for Painting & Decorating tasks...`);
            const extractedPhases: Partial<ProjectPhase>[] = [
                { name: 'Block A - Mist Coat', startDate: '2024-06-15', endDate: '2024-06-25', type: 'Stage' },
                { name: 'Block A - Final Finishes', startDate: '2024-07-10', endDate: '2024-07-20', type: 'Stage' },
                { name: 'Block B - Mist Coat', startDate: '2024-08-01', endDate: '2024-08-10', type: 'Stage' },
                { name: 'Block B - Final Finishes', startDate: '2024-09-01', endDate: '2024-09-15', type: 'Stage' },
                { name: 'Communal Areas - Decoration', startDate: '2024-10-01', endDate: '2024-10-15', type: 'Zone' },
                { name: 'Ext. Metalwork Painting', startDate: '2024-07-01', endDate: '2024-07-15', type: 'Block' },
            ];
            resolve(extractedPhases);
        }, 3000);
    });
};

export const sortStaffByProximity = (project: Project, staffPool: StaffMember[]): Promise<StaffMember[]> => {
    return new Promise((resolve) => {
        console.log(`AI calculating optimal staff for ${project.name} based on location: ${project.city}`);
        setTimeout(() => {
            // Simple heuristic simulation: prioritize matching city
            const sorted = [...staffPool].sort((a, b) => {
                const aMatch = a.address?.toLowerCase().includes(project.city?.toLowerCase() || '');
                const bMatch = b.address?.toLowerCase().includes(project.city?.toLowerCase() || '');
                if (aMatch && !bMatch) return -1;
                if (!aMatch && bMatch) return 1;
                return 0;
            });
            resolve(sorted);
        }, 1000);
    });
};

// --- TENDER AI FUNCTIONS ---

export const classifyTenderDocument = (file: File): TenderDoc['category'] => {
    const name = file.name.toLowerCase();
    if (name.includes('contract') || name.includes('jct') || name.includes('order')) return 'Contract';
    if (name.includes('drawing') || name.includes('plan') || name.includes('elevation') || name.includes('.dwg')) return 'Drawing';
    if (name.includes('program') || name.includes('schedule') || name.includes('gantt')) return 'Program';
    if (name.includes('spec') || name.includes('scope') || name.includes('bill') || name.includes('boq')) return 'Spec';
    return 'Other';
};

export const generateCribSheet = async (projectCode: string): Promise<CribSheet> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                contractSum: "£1,250,000 (Fixed Price)",
                startDate: "15 Jan 2024",
                duration: "42 Weeks",
                lads: "£2,500 per week (uncapped)",
                paymentTerms: "30 Days from End of Month",
                retention: "5% (2.5% release at PC, 2.5% at DLP)",
                risks: [
                    { id: 'r1', category: 'Commercial', severity: 'High', description: 'Fixed price period extends 12 months; no inflation clause.', clauseRef: 'Clause 4.2' },
                    { id: 'r2', category: 'Legal', severity: 'High', description: 'LADs are uncapped; standard JCT cap removed.', clauseRef: 'Schedule 2' },
                    { id: 'r3', category: 'Scope', severity: 'Medium', description: 'Drawings show "Making Good" by others, but Spec says "by Subcontractor". Conflict.', clauseRef: 'Spec Pg 45 vs Dwg A-102' },
                    { id: 'r4', category: 'Program', severity: 'Medium', description: 'Tight interface with M&E commissioning in Weeks 30-32.', clauseRef: 'Gantt Row 45' },
                ]
            });
        }, 2000);
    });
};

export const queryTenderAgent = async (query: string, contextFiles: TenderDoc[]): Promise<ChatMessage> => {
    return new Promise((resolve) => {
        const isFinancialSearch = query.toLowerCase().includes('financial') || query.toLowerCase().includes('credit') || query.toLowerCase().includes('client');
        const isDelayQuery = query.toLowerCase().includes('delay') || query.toLowerCase().includes('eot') || query.toLowerCase().includes('extension');
        const isScopeQuery = query.toLowerCase().includes('scope') || query.toLowerCase().includes('include') || query.toLowerCase().includes('exclude');

        setTimeout(() => {
            if (isFinancialSearch) {
                resolve({
                    id: Date.now().toString(),
                    role: 'assistant',
                    timestamp: new Date(),
                    isWebSearch: true,
                    content: `I've searched the web for recent financial data on this client.
                    
**Financial Health Check:**
*   **Credit Safe:** Rating 45/100 (Moderate Risk). Trend is stable.
*   **Companies House:** Last accounts filed 30 Sept 2023. Net assets £4.2m.
*   **News:** They recently secured a £50m funding round for the 'Skyline' development phase.

**Advisory:** While they are solvent, payment terms of 30 days should be strictly enforced given the moderate credit rating.`,
                    sources: ['Companies House', 'Construction News', 'Credit Safe']
                });
            } else if (isDelayQuery) {
                resolve({
                    id: Date.now().toString(),
                    role: 'assistant',
                    timestamp: new Date(),
                    content: `Regarding delays and extensions of time (EOT):

**Contract Position (JCT D&B):**
You are entitled to an EOT for "Relevant Events" (Clause 2.26). However, **Clause 2.26.14** has been amended in the attached Schedule of Amendments to exclude "force majeure".

**Action Required:**
If you are delayed by the Main Contractor (e.g., M&E delays in Zone 3), you must issue a **Notice of Delay** within 7 days (Clause 2.24). Failure to do so is a condition precedent – meaning you lose your right to claim loss and expense.

Would you like me to draft a formal Notice of Delay template for this specific issue?`,
                    sources: ['Contract_Amended.pdf (Page 42)', 'JCT Standard Terms']
                });
            } else if (isScopeQuery) {
                resolve({
                    id: Date.now().toString(),
                    role: 'assistant',
                    timestamp: new Date(),
                    content: `I've cross-referenced the **Specification (Section M60)** against **Drawing A-204**.

**Discrepancy Found:**
*   **Spec:** States "All ceilings to receive 2 coats vinyl matt".
*   **Drawing:** Notes "Exposed concrete soffit" in the Reception Area.

**Commercial Advice:**
This is a potential variation. If you priced for painting the reception ceiling based on the spec, this is a saving. If you priced based on the drawing (no paint), but they now want paint, you should raise an RFI immediately to clarify before ordering materials.`,
                    sources: ['055-SPE-002.pdf', '055-PLN-310A.dwg']
                });
            } else {
                resolve({
                    id: Date.now().toString(),
                    role: 'assistant',
                    timestamp: new Date(),
                    content: `I've analyzed the package. As your commercial advisor, I'm monitoring the contract terms, scope gaps, and program risks.

You can ask me to:
*   Check for contradictions between drawings and specs.
*   Draft contractual notices (EOT, Loss & Expense).
*   Summarize specific clauses (e.g., "What is the retention release mechanism?").
*   Perform a web search on the client's recent activity.`
                });
            }
        }, 1500);
    });
};
