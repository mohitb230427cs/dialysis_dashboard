import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PatientRegistrationSchema, PatientRegistration } from '../types';
import { Loader2, User, Clock, Building, Monitor, Hash, ChevronDown, Scale, Activity } from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './UI';

interface PatientRegistrationFormProps {
  onSubmit: (data: PatientRegistration) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

export const PatientRegistrationForm: React.FC<PatientRegistrationFormProps> = ({
  onSubmit,
  onCancel,
  isSubmitting,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PatientRegistration>({
    resolver: zodResolver(PatientRegistrationSchema),
    defaultValues: {
      scheduledTime: "08:00",
      gender: "Male",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Patient Details Section */}
      <div className="space-y-5">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="p-2 bg-teal-50 rounded-lg">
            <User className="w-4 h-4 text-teal-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Patient Profile</h3>
            <p className="text-[11px] text-slate-500 font-medium">Basic identification and physical details</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative group">
              <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
              <input
                disabled={isSubmitting}
                {...register("fullName")}
                placeholder="Enter full name"
                className={cn(
                  "w-full pl-10 pr-3 py-2.5 bg-slate-50/50 border rounded-xl text-sm transition-all focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:bg-white",
                  errors.fullName ? "border-rose-500 focus:border-rose-500" : "border-slate-200 focus:border-teal-500"
                )}
              />
            </div>
            {errors.fullName && (
              <p className="text-[10px] text-rose-500 font-medium ml-1">{errors.fullName.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                Age <span className="text-rose-500">*</span>
              </label>
              <div className="relative group">
                <Hash className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
                <input
                  type="number"
                  disabled={isSubmitting}
                  {...register("age", { 
                    valueAsNumber: true,
                    setValueAs: (v) => v === "" ? undefined : parseInt(v, 10)
                  })}
                  placeholder="e.g. 25"
                  className={cn(
                    "w-full pl-10 pr-3 py-2.5 bg-slate-50/50 border rounded-xl text-sm transition-all focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:bg-white",
                    errors.age ? "border-rose-500 focus:border-rose-500" : "border-slate-200 focus:border-teal-500"
                  )}
                />
              </div>
              {errors.age && (
                <p className="text-[10px] text-rose-500 font-medium ml-1">{errors.age.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                Gender <span className="text-rose-500">*</span>
              </label>
              <div className="relative group">
                <Activity className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 group-focus-within:text-teal-500 transition-colors pointer-events-none" />
                <select
                  disabled={isSubmitting}
                  {...register("gender")}
                  className={cn(
                    "w-full pl-9 pr-8 py-2.5 bg-slate-50/50 border rounded-xl text-sm appearance-none transition-all focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:bg-white",
                    errors.gender ? "border-rose-500 focus:border-rose-500" : "border-slate-200 focus:border-teal-500"
                  )}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-3 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              </div>
              {errors.gender && (
                <p className="text-[10px] text-rose-500 font-medium ml-1">{errors.gender.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
              Dry Weight (kg) <span className="text-rose-500">*</span>
            </label>
            <div className="relative group">
              <Scale className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
              <input
                type="number"
                step="0.1"
                disabled={isSubmitting}
                {...register("dryWeight", { 
                  valueAsNumber: true,
                  setValueAs: (v) => v === "" ? undefined : parseFloat(v)
                })}
                placeholder="e.g. 70.5"
                className={cn(
                  "w-full pl-10 pr-3 py-2.5 bg-slate-50/50 border rounded-xl text-sm transition-all focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:bg-white",
                  errors.dryWeight ? "border-rose-500 focus:border-rose-500" : "border-slate-200 focus:border-teal-500"
                )}
              />
            </div>
            {errors.dryWeight && (
              <p className="text-[10px] text-rose-500 font-medium ml-1">{errors.dryWeight.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Session Details Section */}
      <div className="space-y-5">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="p-2 bg-indigo-50 rounded-lg">
            <Clock className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Session Assignment</h3>
            <p className="text-[11px] text-slate-500 font-medium">Unit and timing for the dialysis session</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
              Unit <span className="text-rose-500">*</span>
            </label>
            <div className="relative group">
              <Building className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                disabled={isSubmitting}
                {...register("unit")}
                placeholder="e.g. Unit A"
                className={cn(
                  "w-full pl-10 pr-3 py-2.5 bg-slate-50/50 border rounded-xl text-sm transition-all focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white",
                  errors.unit ? "border-rose-500 focus:border-rose-500" : "border-slate-200 focus:border-indigo-500"
                )}
              />
            </div>
            {errors.unit && (
              <p className="text-[10px] text-rose-500 font-medium ml-1">{errors.unit.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
              Machine ID <span className="text-rose-500">*</span>
            </label>
            <div className="relative group">
              <Monitor className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                disabled={isSubmitting}
                {...register("machineId")}
                placeholder="e.g. M-101"
                className={cn(
                  "w-full pl-10 pr-3 py-2.5 bg-slate-50/50 border rounded-xl text-sm transition-all focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white",
                  errors.machineId ? "border-rose-500 focus:border-rose-500" : "border-slate-200 focus:border-indigo-500"
                )}
              />
            </div>
            {errors.machineId && (
              <p className="text-[10px] text-rose-500 font-medium ml-1">{errors.machineId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
              Scheduled Time <span className="text-rose-500">*</span>
            </label>
            <div className="relative group">
              <Clock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" />
              <input
                type="time"
                disabled={isSubmitting}
                {...register("scheduledTime")}
                className={cn(
                  "w-full pl-10 pr-10 py-2.5 bg-slate-50/50 border rounded-xl text-sm transition-all focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white",
                  errors.scheduledTime ? "border-rose-500 focus:border-rose-500" : "border-slate-200 focus:border-indigo-500"
                )}
              />
            </div>
            {errors.scheduledTime && (
              <p className="text-[10px] text-rose-500 font-medium ml-1">{errors.scheduledTime.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-4 pt-8 border-t border-slate-100">
        <Button
          variant="secondary"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-8"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="px-10 min-w-[180px]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Registering...</span>
            </>
          ) : (
            <>
              <span>Register Patient</span>
              <ChevronDown className="w-4 h-4 -rotate-90" />
            </>
          )}
        </Button>
      </div>
    </form>
  );
};
