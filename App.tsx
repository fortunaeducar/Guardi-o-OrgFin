import React, { useState, useEffect, useMemo } from 'react';
import { 
  PlusCircle, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  PiggyBank, 
  Ghost, // Using Ghost as a stand-in for Wolf/Fear
  Target,
  Save,
  Trash2,
  FileText,
  RefreshCw,
  LogOut
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { Transaction, Category, DiagnosisState, SavingsLog, ReportState } from './types';
import { classifyExpense, getDiagnosisAdvice, generateFinancialReport } from './services/geminiService';
import { StatsCard } from './components/StatsCard';
import { DiagnosisDialog } from './components/DiagnosisDialog';
import { ReportDialog } from './components/ReportDialog';

const App: React.FC = () => {
  // State
  const [revenue, setRevenue] = useState<number>(0);
  const [tempRevenue, setTempRevenue] = useState<string>('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [savingsLog, setSavingsLog] = useState<SavingsLog[]>([]);
  
  // Input State
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Diagnosis State
  const [diagnosis, setDiagnosis] = useState<DiagnosisState>({
    isOpen: false,
    message: '',
    advice: ''
  });
  const [diagnosisLoading, setDiagnosisLoading] = useState(false);

  // Report State
  const [report, setReport] = useState<ReportState>({
    isOpen: false,
    content: '',
    isLoading: false
  });

  // Derived State
  const totalExpenses = useMemo(() => transactions.reduce((acc, t) => acc + t.amount, 0), [transactions]);
  const totalSavings = useMemo(() => savingsLog.reduce((acc, s) => acc + s.amount, 0), [savingsLog]);
  
  const expensesByCategory = useMemo(() => {
    const grouped: Record<string, number> = {};
    Object.values(Category).forEach(c => grouped[c] = 0);
    
    transactions.forEach(t => {
      grouped[t.category] = (grouped[t.category] || 0) + t.amount;
    });
    
    return grouped;
  }, [transactions]);

  const survivalTotal = expensesByCategory[Category.SURVIVAL] || 0;
  const survivalPercentage = revenue > 0 ? (survivalTotal / revenue) * 100 : 0;

  // Chart Data
  const chartData = useMemo(() => {
    return (Object.entries(expensesByCategory) as [string, number][])
      .filter(([_, val]) => val > 0)
      .map(([name, value]) => ({ name, value }));
  }, [expensesByCategory]);

  const COLORS = {
    [Category.SURVIVAL]: '#ef4444',
    [Category.LEISURE]: '#f59e0b',
    [Category.CULTURE]: '#3b82f6',
    [Category.EXTRAS]: '#8b5cf6',
    [Category.UNCATEGORIZED]: '#cbd5e1'
  };

  // Logic: Check for diagnosis trigger
  useEffect(() => {
    if (revenue > 0 && survivalPercentage >= 60 && !diagnosis.isOpen) {
      // Trigger diagnosis if not already open/viewed recently (simple debounce logic implied by isOpen)
      // We only want to trigger this if it JUST crossed the threshold. 
      // For this demo, we check if the LAST transaction was survival.
      const lastTx = transactions[0];
      if (lastTx && lastTx.category === Category.SURVIVAL) {
        handleTriggerDiagnosis();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [survivalTotal, revenue]);

  const handleTriggerDiagnosis = async () => {
    setDiagnosis(prev => ({ ...prev, isOpen: true }));
    setDiagnosisLoading(true);
    
    const survivaltxs = transactions.filter(t => t.category === Category.SURVIVAL);
    const advice = await getDiagnosisAdvice(survivaltxs, revenue);
    
    setDiagnosis(prev => ({
      ...prev,
      advice,
    }));
    setDiagnosisLoading(false);
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;
    
    setIsProcessing(true);
    const numAmount = parseFloat(amount.replace(',', '.'));

    // AI Auto-Classification
    const category = await classifyExpense(description, numAmount);

    const newTransaction: Transaction = {
      id: Date.now().toString(),
      description,
      amount: numAmount,
      category,
      date: new Date(),
      isExpense: true
    };

    setTransactions(prev => [newTransaction, ...prev]);
    setDescription('');
    setAmount('');
    setIsProcessing(false);
  };

  const handleDeleteTransaction = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este lançamento? Essa ação não pode ser desfeita.")) {
      setTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  const handleSetRevenue = () => {
    const val = parseFloat(tempRevenue);
    if (!isNaN(val) && val > 0) {
      setRevenue(val);
    }
  };

  const handleSaveMoney = () => {
    // Manually adding to "Piggy" logic (e.g. user negotiated a bill)
    if (!description || !amount) return;
    const numAmount = parseFloat(amount.replace(',', '.'));
    
    const log: SavingsLog = {
      id: Date.now().toString(),
      amount: numAmount,
      description: `Economia: ${description}`,
      date: new Date()
    };
    
    setSavingsLog(prev => [log, ...prev]);
    setDescription('');
    setAmount('');
  };

  const handleResetData = () => {
    if (window.confirm("ATENÇÃO: Isso apagará TODOS os dados financeiros e reiniciará o aplicativo. Deseja continuar?")) {
      setRevenue(0);
      setTempRevenue('');
      setTransactions([]);
      setSavingsLog([]);
      setDiagnosis({ isOpen: false, message: '', advice: '' });
      setReport({ isOpen: false, content: '', isLoading: false });
    }
  };

  const handleGenerateReport = async () => {
    setReport({ isOpen: true, content: '', isLoading: true });
    const content = await generateFinancialReport(transactions, revenue, savingsLog);
    setReport({ isOpen: true, content, isLoading: false });
  };

  return (
    <div className="min-h-screen pb-20">
      <DiagnosisDialog 
        isOpen={diagnosis.isOpen} 
        advice={diagnosis.advice}
        isLoading={diagnosisLoading}
        onClose={() => setDiagnosis(prev => ({ ...prev, isOpen: false }))} 
      />
      
      <ReportDialog 
        isOpen={report.isOpen}
        content={report.content}
        isLoading={report.isLoading}
        onClose={() => setReport(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-slate-900 p-2 rounded-lg">
              <ShieldCheckIcon className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 hidden sm:block">Guardião OrgFin</h1>
              <h1 className="text-xl font-bold text-slate-900 sm:hidden">OrgFin</h1>
              <p className="text-xs text-slate-500 hidden sm:block">Mentor Financeiro</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             {revenue > 0 && (
               <div className="text-right hidden md:block mr-2">
                 <span className="text-xs text-slate-500 block">Receita Prevista</span>
                 <span className="font-bold text-slate-700">R$ {revenue.toLocaleString('pt-BR')}</span>
               </div>
             )}
             
             {revenue > 0 && (
               <>
                 <button 
                  onClick={handleGenerateReport}
                  className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                  title="Gerar Relatório Completo"
                 >
                   <FileText className="w-4 h-4" />
                   <span className="hidden sm:inline">Relatório</span>
                 </button>
                 
                 <button 
                  onClick={handleResetData}
                  className="flex items-center gap-2 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                  title="Resetar Dados"
                 >
                   <RefreshCw className="w-4 h-4" />
                   <span className="hidden sm:inline">Resetar</span>
                 </button>
               </>
             )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        
        {/* Onboarding / Revenue Set */}
        {revenue === 0 && (
          <div className="bg-indigo-600 rounded-2xl p-8 text-white shadow-xl flex flex-col items-center text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Wallet className="w-16 h-16 opacity-80" />
            <h2 className="text-3xl font-bold">Sejam bem-vindos!</h2>
            <p className="max-w-md text-indigo-100 text-lg">
              Vamos começar organizando sua casa financeira. Para vencer o Lobo e alimentar o Porquinho, preciso saber sua previsão de receita mensal.
            </p>
            <div className="flex w-full max-w-xs gap-2">
              <input 
                type="number" 
                placeholder="Ex: 5000" 
                className="w-full px-4 py-3 rounded-lg text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-400"
                value={tempRevenue}
                onChange={(e) => setTempRevenue(e.target.value)}
              />
              <button 
                onClick={handleSetRevenue}
                className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-bold hover:bg-indigo-50 transition-colors"
              >
                Iniciar
              </button>
            </div>
          </div>
        )}

        {revenue > 0 && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard 
                title="Receita" 
                amount={revenue} 
                icon={TrendingUp} 
                colorClass="text-emerald-600"
                bgClass="bg-emerald-50"
              />
              <StatsCard 
                title="Lobo dos Gastos" 
                amount={totalExpenses} 
                icon={Ghost} 
                colorClass="text-slate-600" 
                bgClass="bg-slate-100"
                description={`${((totalExpenses / revenue) * 100).toFixed(1)}% da receita`}
              />
              <StatsCard 
                title="Porquinho" 
                amount={revenue - totalExpenses + totalSavings} 
                icon={PiggyBank} 
                colorClass="text-pink-600" 
                bgClass="bg-pink-50"
                description="Disponível + Economizado"
              />
              <StatsCard 
                title="Alívio Gerado" 
                amount={totalSavings} 
                icon={Target} 
                colorClass="text-indigo-600" 
                bgClass="bg-indigo-50"
                description="Resgatado do Lobo"
              />
            </div>

            {/* Main Action Area */}
            <div className="grid lg:grid-cols-3 gap-8">
              
              {/* Left Column: Input Form */}
              <div className="lg:col-span-1 space-y-6">
                <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <PlusCircle className="w-5 h-5 text-indigo-600" />
                    Novo Lançamento
                  </h3>
                  <form onSubmit={handleAddTransaction} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
                      <input 
                        type="text" 
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Ex: Internet fibra, Café..."
                        className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Valor (R$)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0,00"
                        className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <button 
                        type="submit"
                        disabled={isProcessing}
                        className="col-span-1 bg-slate-900 text-white py-3 rounded-lg font-medium hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                         {isProcessing ? '...' : (
                           <>
                             <TrendingDown className="w-4 h-4" />
                             Gasto
                           </>
                         )}
                      </button>
                      <button 
                        type="button"
                        onClick={handleSaveMoney}
                        className="col-span-1 bg-pink-500 text-white py-3 rounded-lg font-medium hover:bg-pink-600 transition-colors flex items-center justify-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        Economia
                      </button>
                    </div>
                    <p className="text-xs text-slate-400 text-center">
                      A IA classificará o gasto automaticamente.
                    </p>
                  </form>
                </section>

                {/* Survival Meter */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-bold text-slate-700">Nível de Sobrevivência</h3>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${survivalPercentage >= 60 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                      {survivalPercentage.toFixed(1)}% / 60%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${survivalPercentage >= 60 ? 'bg-red-500' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.min(survivalPercentage, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Se a barra ficar vermelha, o Guardião intervirá.
                  </p>
                </div>
              </div>

              {/* Middle & Right Column: Relief Map & List */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Visuals */}
                <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 min-h-[300px]">
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5 text-indigo-600" />
                    Mapa de Distribuição (Kakebo)
                  </h3>
                  <div className="h-64 w-full">
                    {chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[entry.name as Category]} />
                            ))}
                          </Pie>
                          <RechartsTooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                          <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400">
                        <PiggyBank className="w-12 h-12 mb-2 opacity-50" />
                        <p>Adicione gastos para ver o mapa</p>
                      </div>
                    )}
                  </div>
                </section>

                {/* Transactions List */}
                <section className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                   <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                     <h3 className="text-lg font-bold text-slate-800">Histórico Recente</h3>
                     <span className="text-xs font-medium text-slate-500 uppercase">Últimos Lançamentos</span>
                   </div>
                   <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                     {transactions.length === 0 ? (
                       <div className="p-8 text-center text-slate-500">
                         Nenhum gasto registrado. O Porquinho está feliz!
                       </div>
                     ) : (
                       transactions.map((t) => (
                         <div key={t.id} className="p-4 hover:bg-slate-50 transition-colors flex justify-between items-center group">
                           <div className="flex items-start gap-3">
                             <div className={`mt-1 w-2 h-2 rounded-full ${t.category === Category.SURVIVAL ? 'bg-red-500' : 'bg-slate-400'}`}></div>
                             <div>
                               <p className="font-medium text-slate-800">{t.description}</p>
                               <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
                                 {t.category}
                               </span>
                             </div>
                           </div>
                           <div className="flex items-center gap-3">
                             <div className="text-right">
                               <p className="font-bold text-slate-700">- R$ {t.amount.toFixed(2)}</p>
                               <p className="text-xs text-slate-400">{t.date.toLocaleDateString()}</p>
                             </div>
                             <button
                                onClick={() => handleDeleteTransaction(t.id)}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                                title="Excluir"
                             >
                               <Trash2 className="w-4 h-4" />
                             </button>
                           </div>
                         </div>
                       ))
                     )}
                   </div>
                </section>

              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

// Simple Icon component wrapper for consistent styling if needed
function ShieldCheckIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export default App;