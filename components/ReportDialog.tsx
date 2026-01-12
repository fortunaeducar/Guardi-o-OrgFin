import React, { useRef, useState } from 'react';
import { FileText, X, Download, Loader2 } from 'lucide-react';
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

interface ReportDialogProps {
  isOpen: boolean;
  content: string;
  onClose: () => void;
  isLoading: boolean;
}

export const ReportDialog: React.FC<ReportDialogProps> = ({ isOpen, content, onClose, isLoading }) => {
  const reportContentRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadPDF = async () => {
    if (!reportContentRef.current) return;
    
    try {
      setIsDownloading(true);
      const element = reportContentRef.current;
      
      // Capture the element as canvas
      const canvas = await html2canvas(element, {
        scale: 2, // Higher scale for better quality
        backgroundColor: '#f8fafc', // match slate-50 or white
        useCORS: true,
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
      const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm
      
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      // Calculate dimensions in mm
      const ratio = pdfWidth / imgWidth;
      const imgHeightMm = imgHeight * ratio;
      
      // If single page
      if (imgHeightMm <= pdfHeight) {
         pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeightMm);
         pdf.save('Relatorio-Guardiao-OrgFin.pdf');
         setIsDownloading(false);
         return;
      }
      
      // Multi-page logic
      let positionMulti = 0;
      let heightLeftMulti = imgHeightMm;
      
      pdf.addImage(imgData, 'PNG', 0, positionMulti, pdfWidth, imgHeightMm);
      heightLeftMulti -= pdfHeight;
      
      while (heightLeftMulti > 0) {
        positionMulti -= pdfHeight; // Move the image up
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, positionMulti, pdfWidth, imgHeightMm);
        heightLeftMulti -= pdfHeight;
      }
      
      pdf.save('Relatorio-Guardiao-OrgFin.pdf');

    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Erro ao gerar PDF. Tente novamente.");
    } finally {
      setIsDownloading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border-t-8 border-indigo-600 animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh]">
        
        <div className="bg-indigo-50 p-6 flex items-center justify-between border-b border-indigo-100">
          <div className="flex items-center gap-4">
            <div className="bg-white p-3 rounded-full shadow-sm">
              <FileText className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Relatório do Guardião</h2>
              <p className="text-sm text-slate-600">Balanço Financeiro Completo</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-0 overflow-y-auto flex-1 bg-slate-50 relative">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-6">
              <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-indigo-800 font-medium animate-pulse">Consultando a sabedoria do Guardião...</p>
            </div>
          ) : (
            <div ref={reportContentRef} className="p-8 min-h-min bg-slate-50">
               <div className="bg-white p-12 shadow-md border border-slate-200 rounded-none mx-auto max-w-2xl min-h-[29.7cm]">
                 {/* Header specifically for PDF context to look nice */}
                 <div className="border-b-2 border-slate-100 pb-6 mb-6 flex justify-between items-end">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 uppercase tracking-wide">Relatório Financeiro</h1>
                        <p className="text-slate-500 text-sm">Guardião OrgFin</p>
                    </div>
                    <div className="text-right">
                        <p className="text-slate-400 text-xs">Data de Emissão</p>
                        <p className="text-slate-700 font-medium">{new Date().toLocaleDateString()}</p>
                    </div>
                 </div>

                 <div className="whitespace-pre-wrap font-sans text-slate-700 leading-relaxed text-base text-justify">
                   {content}
                 </div>
                 
                 <div className="mt-12 pt-6 border-t border-slate-100 text-center text-slate-400 text-xs">
                    <p>Gerado automaticamente pelo sistema Guardião OrgFin</p>
                 </div>
               </div>
            </div>
          )}
        </div>

        <div className="bg-white p-4 border-t border-slate-200 flex justify-end gap-3 z-10">
          {!isLoading && (
            <button 
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Gerando PDF...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Baixar PDF
                </>
              )}
            </button>
          )}
          <button 
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};