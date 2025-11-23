import React from 'react';
import { X, Printer, Download, Mail } from 'lucide-react';
import { PaymentApplicationDocument } from './PaymentApplicationDocument';

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any; // Passed to the document component
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({ isOpen, onClose, data }) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm print:p-0 print:bg-white print:static">
      <div className="bg-gray-100 rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden print:h-auto print:w-full print:max-w-none print:shadow-none print:rounded-none">
        
        {/* Toolbar (Hidden on Print) */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#2B3467] text-white shrink-0 print:hidden">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold">Document Preview</h2>
            <div className="h-6 w-[1px] bg-white/20"></div>
            <span className="text-sm text-gray-300">{data.project.name} - {data.type}</span>
          </div>
          <div className="flex items-center gap-3">
            <button 
                onClick={handlePrint}
                className="flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
            >
                <Printer className="w-4 h-4 mr-2" />
                Print
            </button>
            <button className="flex items-center px-4 py-2 bg-[#00B5D8] hover:bg-[#009bb8] rounded-lg text-sm font-medium transition-colors shadow-lg">
                <Mail className="w-4 h-4 mr-2" />
                Email Client
            </button>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Document Container */}
        <div className="flex-1 overflow-auto p-8 flex justify-center bg-gray-200 print:p-0 print:bg-white print:overflow-visible">
            <div className="shadow-xl print:shadow-none">
                <PaymentApplicationDocument data={data} />
            </div>
        </div>
      </div>
    </div>
  );
};