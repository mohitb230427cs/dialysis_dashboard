import React, { useEffect } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export const Badge = ({ children, variant = "default", className, ...props }: { children: React.ReactNode, variant?: "default" | "success" | "warning" | "danger" | "info", className?: string, [key: string]: any }) => {
  const variants = {
    default: "bg-slate-100 text-slate-600 border-slate-200",
    success: "bg-emerald-50 text-emerald-700 border-emerald-100",
    warning: "bg-amber-50 text-amber-700 border-amber-100",
    danger: "bg-rose-50 text-rose-700 border-rose-100",
    info: "bg-indigo-50 text-indigo-700 border-indigo-100",
  };
  return (
    <span className={cn("px-2 py-0.5 rounded-md text-[9px] uppercase tracking-widest font-bold border inline-flex items-center justify-center", variants[variant], className)} {...props}>
      {children}
    </span>
  );
};

export const Button = ({ children, onClick, variant = "primary", className, type = "button", disabled }: any) => {
  const variants = {
    primary: "bg-teal-600 text-white hover:bg-teal-700 shadow-lg shadow-teal-600/20 disabled:bg-slate-300",
    secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm disabled:text-slate-400",
    ghost: "text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:text-slate-300",
    danger: "bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-100 shadow-sm",
  };
  return (
    <button 
      type={type}
      onClick={onClick} 
      disabled={disabled}
      className={cn("px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 active:scale-95 disabled:pointer-events-none", variants[variant as keyof typeof variants], className)}
    >
      {children}
    </button>
  );
};

export const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn("bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden", className)}>
    {children}
  </div>
);

export const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-6">
          {children}
          <div className="mt-6">
            <Button onClick={onClose} className="w-full">Acknowledge</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Toast = ({ message, isVisible, onClose, type = 'success', duration = 3000 }: { message: string, isVisible: boolean, onClose: () => void, type?: 'success' | 'error', duration?: number }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  const variants = {
    success: "bg-emerald-600 shadow-emerald-600/20 border-emerald-500/20",
    error: "bg-rose-600 shadow-rose-600/20 border-rose-500/20",
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, x: 20 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className={cn(
            "fixed top-6 right-6 z-[200] flex items-center gap-3 text-white px-5 py-3.5 rounded-2xl shadow-xl border",
            variants[type]
          )}
        >
          <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
            {type === 'success' ? <CheckCircle2 size={16} className="text-white" /> : <X size={16} className="text-white" />}
          </div>
          <p className="text-sm font-bold tracking-tight">{message}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
