import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  amount: number;
  icon: LucideIcon;
  colorClass: string;
  bgClass: string;
  description?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({ title, amount, icon: Icon, colorClass, bgClass, description }) => {
  return (
    <div className={`p-6 rounded-xl shadow-sm border border-slate-100 ${bgClass} transition-all duration-300 hover:shadow-md`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className={`font-semibold text-sm uppercase tracking-wider ${colorClass}`}>{title}</h3>
        <Icon className={`w-6 h-6 ${colorClass}`} />
      </div>
      <p className="text-2xl font-bold text-slate-800">
        R$ {amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>
      {description && <p className="text-xs text-slate-500 mt-1">{description}</p>}
    </div>
  );
};