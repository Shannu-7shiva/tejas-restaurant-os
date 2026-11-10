import React from 'react';

export const VegBadge: React.FC<{ isVeg: boolean }> = ({ isVeg }) => {
  if (isVeg) {
    return (
      <span className="inline-flex items-center justify-center w-4 h-4 border border-emerald-600 p-[2px] rounded-[3px] bg-white" title="Vegetarian">
        <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center w-4 h-4 border border-rose-600 p-[2px] rounded-[3px] bg-white" title="Non-Vegetarian">
      <span className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[7px] border-b-rose-600"></span>
    </span>
  );
};

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  let color = 'bg-slate-100 text-slate-800 border-slate-300';
  
  switch (status) {
    case 'NEW':
      color = 'bg-amber-50 text-amber-800 border-amber-300 animate-pulse';
      break;
    case 'ACCEPTED':
      color = 'bg-blue-50 text-blue-800 border-blue-300';
      break;
    case 'PREPARING':
      color = 'bg-purple-50 text-purple-800 border-purple-300';
      break;
    case 'READY':
      color = 'bg-emerald-50 text-emerald-800 border-emerald-400 font-semibold';
      break;
    case 'SERVED':
      color = 'bg-teal-50 text-teal-800 border-teal-300';
      break;
    case 'CANCELLED':
      color = 'bg-rose-50 text-rose-800 border-rose-300';
      break;
    case 'AVAILABLE':
      color = 'bg-emerald-50 text-emerald-800 border-emerald-300';
      break;
    case 'OCCUPIED':
      color = 'bg-amber-50 text-amber-800 border-amber-300';
      break;
    case 'CLEANING':
      color = 'bg-blue-50 text-blue-800 border-blue-300';
      break;
    case 'PAID':
      color = 'bg-emerald-50 text-emerald-800 border-emerald-300';
      break;
    case 'UNPAID':
      color = 'bg-rose-50 text-rose-800 border-rose-300';
      break;
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${color}`}>
      {status}
    </span>
  );
};
