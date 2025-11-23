import React from 'react';
import { FORMAT_CURRENCY } from '../constants';

interface DocumentData {
  type: 'Interim' | 'Retention Release' | 'Final Account';
  applicationNo: number | string;
  date: string;
  project: {
    name: string;
    code: string;
    ref: string;
  };
  client: {
    name: string;
    address: string[];
  };
  financials: {
    grossValuation: number;
    lessRetention: number;
    netValuation: number;
    lessPrevious: number;
    amountDue: number;
  };
}

interface PaymentApplicationDocumentProps {
  data: DocumentData;
}

export const PaymentApplicationDocument: React.FC<PaymentApplicationDocumentProps> = ({ data }) => {
  return (
    <div id="printable-document" className="w-[210mm] min-h-[297mm] bg-white p-12 mx-auto text-gray-900 font-serif text-sm leading-relaxed shadow-lg relative">
      
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-gray-800 pb-8 mb-8">
        <div className="flex items-center gap-3">
            {/* Logo Placeholder */}
            <div className="w-12 h-12 bg-[#2B3467] text-white flex items-center justify-center rounded-lg font-sans font-bold text-2xl">
                C
            </div>
            <div>
                <h1 className="text-2xl font-bold text-[#2B3467] uppercase tracking-wide font-sans">ConstruFlow</h1>
                <p className="text-xs text-gray-500 font-sans tracking-widest uppercase">Construction Ltd</p>
            </div>
        </div>
        <div className="text-right text-xs text-gray-600">
          <p className="font-bold text-gray-900 text-base mb-1">ConstruFlow Construction Ltd</p>
          <p>123 Building Way</p>
          <p>Canary Wharf, London</p>
          <p>E14 5AB</p>
          <p className="mt-2">Tel: 020 7123 4567</p>
          <p>Email: accounts@construflow.co.uk</p>
          <p>VAT Reg: GB 123 456 789</p>
        </div>
      </div>

      {/* Document Info */}
      <div className="flex justify-between items-end mb-12">
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Bill To:</p>
          <h3 className="font-bold text-lg">{data.client.name}</h3>
          {data.client.address.map((line, i) => (
            <p key={i} className="text-gray-600">{line}</p>
          ))}
        </div>
        <div className="text-right">
          <h2 className="text-xl font-bold text-[#2B3467] mb-2 uppercase border-b border-gray-300 pb-1">
            {data.type} Application
          </h2>
          <table className="text-right ml-auto">
            <tbody>
              <tr>
                <td className="pr-4 text-gray-500 font-medium">Application No:</td>
                <td className="font-bold">{data.applicationNo}</td>
              </tr>
              <tr>
                <td className="pr-4 text-gray-500 font-medium">Date:</td>
                <td className="font-bold">{data.date}</td>
              </tr>
              <tr>
                <td className="pr-4 text-gray-500 font-medium">Project Ref:</td>
                <td className="font-bold">{data.project.code}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Project Title */}
      <div className="bg-gray-50 border border-gray-200 p-4 mb-8 rounded">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Project</p>
        <p className="font-bold text-lg">{data.project.name}</p>
      </div>

      {/* Financial Table */}
      <div className="mb-12">
        <table className="w-full border-collapse">
          <thead className="bg-[#2B3467] text-white">
            <tr>
              <th className="py-3 px-4 text-left font-sans font-semibold uppercase text-xs">Description</th>
              <th className="py-3 px-4 text-right font-sans font-semibold uppercase text-xs">Amount (£)</th>
            </tr>
          </thead>
          <tbody className="border border-gray-200">
            <tr>
              <td className="py-4 px-4 border-b border-gray-100 font-medium">Gross Valuation of Works Executed to Date</td>
              <td className="py-4 px-4 border-b border-gray-100 text-right font-medium">{FORMAT_CURRENCY(data.financials.grossValuation)}</td>
            </tr>
            <tr className="text-red-600">
              <td className="py-3 px-4 border-b border-gray-100 pl-8">Less Retention</td>
              <td className="py-3 px-4 border-b border-gray-100 text-right">({FORMAT_CURRENCY(data.financials.lessRetention)})</td>
            </tr>
            <tr className="bg-gray-50 font-bold">
              <td className="py-3 px-4 border-b border-gray-200">Net Valuation</td>
              <td className="py-3 px-4 border-b border-gray-200 text-right">{FORMAT_CURRENCY(data.financials.netValuation)}</td>
            </tr>
            <tr className="text-gray-600">
              <td className="py-3 px-4 border-b border-gray-100 pl-8">Less Previous Payments Certified</td>
              <td className="py-3 px-4 border-b border-gray-100 text-right">({FORMAT_CURRENCY(data.financials.lessPrevious)})</td>
            </tr>
            <tr className="bg-[#2B3467] text-white text-lg">
              <td className="py-4 px-4 font-bold uppercase">Total Amount Due</td>
              <td className="py-4 px-4 text-right font-bold">{FORMAT_CURRENCY(data.financials.amountDue)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Footer / Bank Details */}
      <div className="grid grid-cols-2 gap-12 border-t-2 border-gray-800 pt-8 absolute bottom-12 left-12 right-12">
        <div>
          <h4 className="font-bold text-[#2B3467] uppercase tracking-wide mb-3 text-xs">Payment Details</h4>
          <table className="text-xs w-full">
            <tbody>
              <tr>
                <td className="py-1 text-gray-500">Bank Name:</td>
                <td className="font-bold">Barclays Bank PLC</td>
              </tr>
              <tr>
                <td className="py-1 text-gray-500">Account Name:</td>
                <td className="font-bold">ConstruFlow Construction Ltd</td>
              </tr>
              <tr>
                <td className="py-1 text-gray-500">Sort Code:</td>
                <td className="font-bold">20-00-00</td>
              </tr>
              <tr>
                <td className="py-1 text-gray-500">Account No:</td>
                <td className="font-bold">12345678</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="text-right flex flex-col justify-end">
            <div className="mb-8">
                <div className="h-16 border-b border-gray-400 mb-2 w-48 ml-auto"></div>
                <p className="text-xs text-gray-500">Authorised Signature</p>
            </div>
            <p className="text-[10px] text-gray-400 italic">
                This is a payment application issued under the terms of the contract. 
                Payment is due within the agreed terms from the date of receipt.
            </p>
        </div>
      </div>

    </div>
  );
};