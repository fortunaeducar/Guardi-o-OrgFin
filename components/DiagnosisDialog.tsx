import React from 'react';
import { AlertTriangle, X, ShieldCheck } from 'lucide-react';

interface DiagnosisDialogProps {
  isOpen: boolean;
  advice: string;
  onClose: () => void;
  isLoading: boolean;
}

export const DiagnosisDialog: React.FC<DiagnosisDialogProps> = ({ isOpen, advice, onClose, isLoading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border-t-8 border-survival animate-in fade-in zoom-in duration-300">
        
        <div className="bg-red-50 p-6 flex items-start gap-4">
          <div className="bg-white p-3 rounded-full shadow-sm">
            <AlertTriangle className="w-8 h-8 text-survival" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Alerta do Guardião!</h2>
            <p className="text-sm text-slate-600 mt-1">
              A categoria <span className="font-bold text-survival">Sobrevivência</span> ultrapassou 60% da sua receita.
              O Lobo está rondando perigosamente!
            </p>
          </div>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="w-8 h-8 border-4 border-survival border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-500 text-sm animate-pulse">Analisando seus gastos com a sabedoria do Guardião...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                {advice}
              </div>
              
              <div className="flex justify-end pt-2">
                <button 
                  onClick={onClose}
                  className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Entendido, vou agir!
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};