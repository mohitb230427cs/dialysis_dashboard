import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  Clock,
  ChevronRight,
  FileText,
  Calendar,
  Building,
  X,
  ArrowRight,
  Info,
  ChevronDown,
  Scale
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api, cn } from './lib/utils';
import { ScheduleItem, PatientRegistration } from './types';
import { format } from 'date-fns';
import { Badge, Button, Card, Modal, Toast } from './components/UI';
import { PatientRegistrationForm } from './components/PatientRegistrationForm';

const formatTime = (timeStr: string, placeholder = 'Not set') => {
  if (!timeStr) return placeholder;
  try {
    let date: Date;

    if (timeStr.includes('T')) {
      date = new Date(timeStr);
    } else if (timeStr.includes(':')) {
      const [hours, minutes] = timeStr.split(':');
      date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    } else {
      return timeStr;
    }

    return format(date, 'hh:mm a').toUpperCase();
  } catch (e) {
    return timeStr;
  }
};

const formatDuration = (minutes: number) => {
  if (minutes === 0) return 'Pending end time';
  if (minutes < 0) return 'Invalid time range';

  const h = Math.floor(minutes / 60);
  const m = minutes % 60;

  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

const toTimeLocal = (isoString: string) => {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  } catch (e) {
    if (isoString.match(/^\d{2}:\d{2}$/)) return isoString;
    return '';
  }
};

const fromTimeLocal = (timeStr: string) => {
  if (!timeStr) return '';
  try {
    const [hours, minutes] = timeStr.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return date.toISOString();
  } catch (e) {
    return '';
  }
};

const Input = ({ label, icon: Icon, error, type, value, placeholder, ...props }: any) => {
  const [isFocused, setIsFocused] = useState(false);
  const isTime = type === 'time';

  const displayValue = isTime && !isFocused && value ? formatTime(value, '') : value;
  const inputType = isTime ? (isFocused ? 'time' : 'text') : type;

  return (
    <div className="space-y-2">
      {label && (
        <label
          className={cn(
            'text-[10px] font-bold uppercase tracking-widest ml-1 transition-colors',
            error ? 'text-rose-500' : 'text-slate-400'
          )}
        >
          {label}
        </label>
      )}

      <div className="relative group">
        {Icon && (
          <Icon
            className={cn(
              'absolute left-3 top-2.5 w-4 h-4 transition-colors',
              error ? 'text-rose-400' : 'text-slate-400 group-focus-within:text-teal-500'
            )}
          />
        )}

        <input
          type={inputType}
          value={displayValue}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          placeholder={placeholder}
          className={cn(
            'w-full pr-3 py-2.5 border rounded-xl text-sm transition-all focus:outline-none focus:ring-4 placeholder:text-slate-400',
            error
              ? 'bg-rose-50/50 border-rose-200 focus:ring-rose-500/10 focus:bg-white focus:border-rose-500'
              : 'bg-slate-50/50 border-slate-200 focus:ring-teal-500/10 focus:bg-white focus:border-teal-500',
            Icon ? 'pl-10' : 'px-4'
          )}
          {...props}
        />
      </div>
    </div>
  );
};

const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn('animate-pulse bg-slate-200 rounded', className)} />
);

export default function App() {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUnit, setSelectedUnit] = useState<string>('All Units');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAnomaliesOnly, setShowAnomaliesOnly] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [selectedItem, setSelectedItem] = useState<ScheduleItem | null>(null);
  const [isRecording, setIsRecording] = useState<ScheduleItem | null>(null);
  const [isWarmingUp, setIsWarmingUp] = useState(false);

  const fetchSchedule = async (retryCount = 0) => {
    try {
      setLoading(true);
      const unitParam = selectedUnit === 'All Units' ? undefined : selectedUnit;
      const data = await api.getSchedule(unitParam);

      console.log('API Response for schedule:', data);
      setIsWarmingUp(false);

      let scheduleArray: ScheduleItem[] = [];

      if (Array.isArray(data)) {
        scheduleArray = data;
      } else if (data && typeof data === 'object') {
        scheduleArray = data.data || data.schedule || data.schedules || [];
        if (!Array.isArray(scheduleArray)) {
          scheduleArray = [];
        }
      }

      setSchedule(scheduleArray);

      if (!Array.isArray(data) && scheduleArray.length === 0) {
        console.warn('Received non-array or empty data for schedule:', data);
      }
    } catch (err: any) {
      console.error('Error fetching schedule:', err);

      if (err.message?.includes('Backend is not ready yet') && retryCount < 15) {
        setIsWarmingUp(true);
        console.log(`Backend not ready, retrying... (${retryCount + 1}/15)`);
        setTimeout(() => fetchSchedule(retryCount + 1), 2000);
        return;
      }

      setIsWarmingUp(false);
      setToast({ message: err.message || 'Failed to fetch schedule', type: 'error' });
      setSchedule([]);
    } finally {
      if (retryCount === 0 || !loading) {
        setLoading(false);
      }
    }
  };

  const waitForBackend = async () => {
    let ready = false;
    let attempts = 0;

    while (!ready && attempts < 10) {
      ready = await api.checkHealth();
      if (!ready) {
        attempts++;
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    return ready;
  };

  const handleSeed = async () => {
    try {
      setIsSubmitting(true);
      const isReady = await waitForBackend();

      if (!isReady) {
        setToast({ message: 'Backend is still warming up. Please try again in a moment.', type: 'error' });
        return;
      }

      await api.seed();
      setToast({ message: 'Database seeded successfully', type: 'success' });
      fetchSchedule();
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to seed database', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (data: PatientRegistration) => {
    try {
      setIsSubmitting(true);
      const isReady = await waitForBackend();

      if (!isReady) {
        setToast({ message: 'Backend is still warming up. Please try again in a moment.', type: 'error' });
        return;
      }

      await api.registerPatient(data);
      setToast({ message: 'Patient registered successfully', type: 'success' });
      setIsRegistering(false);
      fetchSchedule();
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to register patient', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, [selectedUnit]);

  const stats = useMemo(() => {
    const safeSchedule = Array.isArray(schedule) ? schedule : [];
    return {
      total: safeSchedule.length,
      inProgress: safeSchedule.filter((s) => s.status === 'in progress').length,
      completed: safeSchedule.filter((s) => s.status === 'completed').length,
      anomalies: safeSchedule.filter((s) => s.anomalies.length > 0).length,
    };
  }, [schedule]);

  const filteredSchedule = (Array.isArray(schedule) ? schedule : []).filter((item) => {
    const matchesSearch =
      item.patient.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(item.machineId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(item.patient.unit || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAnomaly = showAnomaliesOnly ? item.anomalies.length > 0 : true;

    return matchesSearch && matchesAnomaly;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-teal-100 selection:text-teal-900">
      <Toast
        isVisible={!!toast}
        message={toast?.message || ''}
        type={toast?.type}
        onClose={() => setToast(null)}
      />

      {isWarmingUp && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-teal-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-pulse">
            <div className="w-2 h-2 bg-white rounded-full animate-ping" />
            <p className="text-sm font-bold tracking-wide uppercase">Backend Warming Up...</p>
          </div>
        </div>
      )}

      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-[1440px] mx-auto px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-teal-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-teal-600/20">
                  <Activity size={20} strokeWidth={2.5} />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-black tracking-tight text-slate-900">JANO</span>
                  <span className="text-sm font-medium tracking-tight text-teal-600">HEALTH</span>
                </div>
              </div>

              <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block" />

              <div>
                <h1 className="text-sm font-bold tracking-tight text-slate-900 leading-none mb-1">Dialysis Intake</h1>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                  Clinical Monitoring System
                </p>
              </div>
            </div>

            <div className="h-8 w-px bg-slate-200 hidden sm:block" />

            <div className="hidden lg:flex items-center gap-5">
              <div className="flex items-center gap-2 text-slate-400">
                <Calendar size={14} className="text-slate-300" />
                <span className="text-xs font-bold text-slate-600">{format(new Date(), 'EEEE, MMMM do')}</span>
              </div>

              <div className="flex items-center gap-2 text-slate-400">
                <Building size={14} className="text-slate-300" />
                <div className="relative">
                  <select
                    className="text-xs font-bold bg-transparent border-none focus:ring-0 cursor-pointer text-slate-900 pr-6 appearance-none"
                    value={selectedUnit}
                    onChange={(e) => setSelectedUnit(e.target.value)}
                  >
                    <option>All Units</option>
                    <option>A</option>
                    <option>B</option>
                    <option>C</option>
                  </select>
                  <ChevronDown className="absolute right-0 top-0.5 w-3 h-3 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={handleSeed} className="hidden sm:flex" disabled={isSubmitting}>
              Seed Data
            </Button>
            <Button onClick={() => setIsRegistering(true)} className="h-9" disabled={isSubmitting}>
              <Plus size={16} />
              <span className="hidden sm:inline">Register Patient</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-[1440px] mx-auto px-8 py-8 space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard label="Scheduled" value={stats.total} icon={<Users size={18} className="text-blue-500" />} color="blue" />
          <StatCard label="In Progress" value={stats.inProgress} icon={<Activity size={18} className="text-teal-500" />} color="teal" />
          <StatCard label="Completed" value={stats.completed} icon={<CheckCircle2 size={18} className="text-emerald-500" />} color="emerald" />
          <StatCard
            label="Anomalies"
            value={stats.anomalies}
            icon={<AlertTriangle size={18} className="text-rose-500" />}
            color="rose"
            highlight={stats.anomalies > 0}
          />
        </div>

        <Card className="border-slate-200/60 shadow-xl shadow-slate-200/20">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-white">
            <div className="relative flex-1 max-w-md group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-500 transition-colors" size={16} />
              <input
                type="text"
                placeholder="Search patient, machine, or unit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-teal-500/5 focus:border-teal-500 focus:bg-white transition-all placeholder:text-slate-400"
              />
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant={showAnomaliesOnly ? 'danger' : 'secondary'}
                onClick={() => setShowAnomaliesOnly(!showAnomaliesOnly)}
                className="h-11 px-6"
              >
                <Filter size={16} />
                <span className="font-bold">{showAnomaliesOnly ? 'Showing Anomalies' : 'Filter Anomalies'}</span>
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Patient</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Machine</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Weight (Δ)</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Systolic BP</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Anomalies</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest"></th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                ) : filteredSchedule.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-3 max-w-xs mx-auto">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                          <Search size={32} />
                        </div>
                        <p className="text-slate-900 font-bold">No results found</p>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Try adjusting your filters or search query to find what you&apos;re looking for.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredSchedule.map((item) => (
                    <motion.tr
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      key={item.patient.id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => setSelectedItem(item)}
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center text-slate-600 font-bold text-xs border border-white shadow-sm">
                            {item.patient.fullName.split(' ').map((n) => n[0]).join('')}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm">{item.patient.fullName}</div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider whitespace-nowrap overflow-hidden text-ellipsis max-w-[140px]">
                              Age {item.patient.age} • {item.patient.gender}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <div className="space-y-1">
                          <div className="text-xs font-bold text-slate-700">{item.machineId}</div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest whitespace-nowrap">
                            Unit {item.patient.unit} • {formatTime(item.patient.scheduledTime)}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <StatusBadge status={item.status} />
                      </td>

                      <td className="px-6 py-5">
                        {item.session ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-700">{item.session.preWeight}</span>
                            <ChevronRight size={10} className="text-slate-300" />
                            <span
                              className={cn(
                                'text-xs font-bold',
                                item.session.postWeight ? 'text-teal-600' : 'text-slate-400'
                              )}
                            >
                              {item.session.postWeight || '--'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium ml-1">kg</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">Pending</span>
                        )}
                      </td>

                      <td className="px-6 py-5">
                        {item.session ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-700">{item.session.preSystolicBP}</span>
                            <ChevronRight size={10} className="text-slate-300" />
                            <span
                              className={cn(
                                'text-xs font-bold',
                                item.session.postSystolicBP ? 'text-teal-600' : 'text-slate-400'
                              )}
                            >
                              {item.session.postSystolicBP || '--'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">Pending</span>
                        )}
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex flex-wrap gap-1.5 items-center">
                          {item.anomalies.length > 0 ? (
                            <>
                              {item.anomalies.slice(0, 1).map((a, i) => (
                                <Badge key={i} variant="danger">
                                  {a}
                                </Badge>
                              ))}
                              {item.anomalies.length > 1 && (
                                <Badge variant="danger" className="bg-rose-100 border-rose-200">
                                  +{item.anomalies.length - 1}
                                </Badge>
                              )}
                            </>
                          ) : item.status === 'completed' ? (
                            <Badge variant="success">Normal</Badge>
                          ) : (
                            <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">--</span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            className="h-8 w-8 p-0 rounded-full"
                            onClick={(e: any) => {
                              e.stopPropagation();
                              setIsRecording(item);
                            }}
                          >
                            <FileText size={16} />
                          </Button>
                          <ChevronRight size={16} className="text-slate-300" />
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </main>

      <AnimatePresence>
        {selectedItem && (
          <DetailsDrawer
            item={selectedItem}
            onClose={() => setSelectedItem(null)}
            onRecord={() => {
              setIsRecording(selectedItem);
              setSelectedItem(null);
            }}
          />
        )}

        {isRegistering && (
          <ClinicalModal title="Register New Patient" onClose={() => setIsRegistering(false)}>
            <PatientRegistrationForm
              onSubmit={handleRegisterSubmit}
              onCancel={() => setIsRegistering(false)}
              isSubmitting={isSubmitting}
            />
          </ClinicalModal>
        )}

        {isRecording && (
          <ClinicalModal title={`Session Intake: ${isRecording.patient.fullName}`} onClose={() => setIsRecording(null)}>
            <SessionForm
              item={isRecording}
              onSuccess={() => {
                setIsRecording(null);
                fetchSchedule();
                setToast({ message: 'Session saved successfully', type: 'success' });
              }}
            />
          </ClinicalModal>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ label, value, icon, color, highlight = false }: any) {
  const colors = {
    blue: 'text-blue-600 bg-blue-50',
    teal: 'text-teal-600 bg-teal-50',
    emerald: 'text-emerald-600 bg-emerald-50',
    rose: 'text-rose-600 bg-rose-50',
  };

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 300 }}>
      <Card className={cn('p-6 transition-all', highlight && 'ring-2 ring-rose-500 ring-offset-4 shadow-lg shadow-rose-500/10')}>
        <div className="flex items-center justify-between mb-4">
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', colors[color as keyof typeof colors])}>
            {icon}
          </div>
          {highlight && <Badge variant="danger">Action Required</Badge>}
        </div>
        <div className="text-3xl font-black text-slate-900 tracking-tight">{value}</div>
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{label}</div>
      </Card>
    </motion.div>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'completed':
      return <Badge variant="success">Completed</Badge>;
    case 'in progress':
      return <Badge variant="info">In Progress</Badge>;
    default:
      return <Badge variant="default">Not Started</Badge>;
  }
}

function SkeletonRow() {
  return (
    <tr>
      <td className="px-6 py-5">
        <div className="flex items-center gap-3">
          <Skeleton className="w-9 h-9 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="w-24 h-4" />
            <Skeleton className="w-16 h-3" />
          </div>
        </div>
      </td>
      <td className="px-6 py-5">
        <div className="space-y-2">
          <Skeleton className="w-16 h-4" />
          <Skeleton className="w-20 h-3" />
        </div>
      </td>
      <td className="px-6 py-5">
        <Skeleton className="w-20 h-6 rounded-full" />
      </td>
      <td className="px-6 py-5">
        <Skeleton className="w-16 h-4" />
      </td>
      <td className="px-6 py-5">
        <Skeleton className="w-12 h-4" />
      </td>
      <td className="px-6 py-5">
        <Skeleton className="w-24 h-6 rounded-full" />
      </td>
      <td className="px-6 py-5">
        <Skeleton className="w-8 h-8 rounded-full ml-auto" />
      </td>
    </tr>
  );
}

function DetailsDrawer({
  item,
  onClose,
  onRecord,
}: {
  item: ScheduleItem;
  onClose: () => void;
  onRecord: () => void;
}) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/20 backdrop-blur-[2px] z-40"
      />

      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="font-bold text-slate-900">Patient Details</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Clinical Overview</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center transition-colors">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          <section className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600 font-black text-xl border border-teal-100">
                {item.patient.fullName.split(' ').map((n) => n[0]).join('')}
              </div>
              <div>
                <h4 className="text-xl font-black text-slate-900 tracking-tight">{item.patient.fullName}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="info">Unit {item.patient.unit}</Badge>
                  <Badge variant="default">{item.machineId}</Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Dry Weight</div>
                <div className="text-lg font-bold text-slate-900">
                  {item.patient.dryWeight} <span className="text-xs font-medium text-slate-500">kg</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Schedule</div>
                <div className="text-lg font-bold text-slate-900">{formatTime(item.patient.scheduledTime)}</div>
              </div>

              {item.session?.startTime && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 col-span-2">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Session Duration</div>
                  <div className="text-lg font-bold text-slate-900">
                    {item.session.endTime ? (
                      <>
                        {Math.round(
                          (new Date(item.session.endTime).getTime() - new Date(item.session.startTime).getTime()) /
                            (1000 * 60)
                        )}
                        <span className="text-xs font-medium text-slate-500 ml-1">minutes</span>
                        <span className="text-xs text-slate-400 font-normal ml-2">
                          ({formatTime(item.session.startTime)} - {formatTime(item.session.endTime)})
                        </span>
                      </>
                    ) : (
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-400">Pending end time</span>
                        <span className="text-xs text-slate-400 font-normal mt-1">
                          (Started at {formatTime(item.session.startTime)})
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Session</h5>
              <StatusBadge status={item.status} />
            </div>

            {item.session ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-3">
                  <MetricDisplay label="Pre-Weight" value={item.session.preWeight} unit="kg" icon={Scale} />
                  <MetricDisplay label="Post-Weight" value={item.session.postWeight || 'Not set'} unit="kg" icon={Scale} />
                  <MetricDisplay label="Pre-BP" value={item.session.preSystolicBP} icon={Activity} />
                  <MetricDisplay label="Post-BP" value={item.session.postSystolicBP || 'Not set'} icon={Activity} />
                </div>

                {item.anomalies.length > 0 && (
                  <div className="p-4 bg-rose-50 rounded-xl border border-rose-100 space-y-2">
                    <div className="flex items-center gap-2 text-rose-600">
                      <AlertTriangle size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Anomalies Detected</span>
                    </div>
                    <ul className="space-y-1">
                      {item.anomalies.map((a, i) => (
                        <li key={i} className="text-xs font-semibold text-rose-700 flex items-center gap-2">
                          <div className="w-1 h-1 bg-rose-400 rounded-full" />
                          {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nurse Notes</div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-600 leading-relaxed italic">
                    "{item.session.nurseNotes || 'No notes recorded for this session.'}"
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 border-2 border-dashed border-slate-100 rounded-2xl text-center space-y-4">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mx-auto">
                  <FileText size={24} />
                </div>
                <p className="text-xs text-slate-400 font-medium">No session data has been recorded for today yet.</p>
                <Button variant="secondary" className="mx-auto" onClick={onRecord}>
                  Start Session Intake
                </Button>
              </div>
            )}
          </section>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50/50">
          <Button className="w-full h-12" onClick={onRecord}>
            {item.session ? 'Edit Session Data' : 'Record Session Intake'}
            <ArrowRight size={16} />
          </Button>
        </div>
      </motion.div>
    </>
  );
}

function MetricDisplay({ label, value, unit, icon: Icon }: any) {
  return (
    <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50 group hover:bg-white hover:shadow-md transition-all">
      <div className="flex items-center gap-2 mb-2">
        {Icon && <Icon size={12} className="text-slate-400 group-hover:text-teal-500 transition-colors" />}
        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{label}</div>
      </div>
      <div className="text-xl font-black text-slate-900 tracking-tight">
        {value} {unit && <span className="text-xs font-medium text-slate-400">{unit}</span>}
      </div>
    </div>
  );
}

function ClinicalModal({ title, children, onClose }: any) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-lg relative z-10"
      >
        <Card className="shadow-2xl border-none overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600">
                <FileText size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">{title}</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Clinical Data Entry</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors">
              <X size={18} className="text-slate-400" />
            </button>
          </div>
          <div className="p-8 bg-white max-h-[80vh] overflow-y-auto">{children}</div>
        </Card>
      </motion.div>
    </div>
  );
}

function SessionForm({ item, onSuccess }: { item: ScheduleItem; onSuccess: () => void }) {
  const patientId = item.patient.id || (item.patient as any)._id;
  const machineId = item.machineId || (item.patient as any).machineId || '';
  const unit = item.patient.unit || '';

  const [formData, setFormData] = useState({
    preWeight: item.session?.preWeight || '',
    postWeight: item.session?.postWeight || '',
    preSystolicBP: item.session?.preSystolicBP || '',
    postSystolicBP: item.session?.postSystolicBP || '',
    nurseNotes: item.session?.nurseNotes || '',
    status: item.session?.status || 'not started',
    startTime: item.session?.startTime || new Date().toISOString(),
    endTime: item.session?.endTime || '',
  });

  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [invalidFields, setInvalidFields] = useState<string[]>([]);

  const duration = useMemo(() => {
    if (formData.startTime && formData.endTime) {
      const start = new Date(formData.startTime).getTime();
      const end = new Date(formData.endTime).getTime();
      const diff = (end - start) / (1000 * 60);
      return Math.round(diff);
    }
    return 0;
  }, [formData.startTime, formData.endTime]);

  const updateField = (field: string, value: any) => {
    setError(null);
    setInvalidFields((prev) => prev.filter((f) => f !== field));
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInvalidFields([]);

    const preWeightVal = parseFloat(formData.preWeight.toString());
    const postWeightVal = formData.postWeight !== '' ? parseFloat(formData.postWeight.toString()) : null;
    const preBPVal = parseInt(formData.preSystolicBP.toString());
    const postBPVal = formData.postSystolicBP !== '' ? parseInt(formData.postSystolicBP.toString()) : null;

    const errors: string[] = [];
    const fields: string[] = [];

    if (!patientId) {
      errors.push('Patient ID is missing');
    }

    if (!machineId || !unit) {
      errors.push('Patient clinical data (Machine/Unit) is missing');
    }

    if (isNaN(preWeightVal) || preWeightVal < 30 || preWeightVal > 200) {
      errors.push('Pre-Weight must be between 30 and 200 kg');
      fields.push('preWeight');
    }

    if (postWeightVal !== null) {
      if (isNaN(postWeightVal) || postWeightVal < 30 || postWeightVal > 200) {
        errors.push('Post-Weight must be between 30 and 200 kg');
        fields.push('postWeight');
      } else if (postWeightVal > preWeightVal) {
        errors.push('Post-weight cannot exceed pre-weight');
        fields.push('postWeight');
      } else if (preWeightVal - postWeightVal > 5) {
        errors.push('Maximum fluid removal allowed is 5 kg');
        fields.push('postWeight');
      }
    }

    if (isNaN(preBPVal) || preBPVal < 80 || preBPVal > 200) {
      errors.push('Pre Systolic BP must be between 80 and 200 mmHg');
      fields.push('preSystolicBP');
    }

    if (postBPVal !== null) {
      if (isNaN(postBPVal) || postBPVal < 80 || postBPVal > 200) {
        errors.push('Post Systolic BP must be between 80 and 200 mmHg');
        fields.push('postSystolicBP');
      }
    }

    if (!formData.startTime) {
      errors.push('Start time is required');
      fields.push('startTime');
    }

    if (formData.endTime) {
      const start = new Date(formData.startTime).getTime();
      const end = new Date(formData.endTime).getTime();
      const diffMinutes = (end - start) / (1000 * 60);

      if (end <= start) {
        errors.push('End time must be after start time');
        fields.push('endTime');
      } else if (diffMinutes < 30 || diffMinutes > 360) {
        errors.push('Session duration must be between 30 minutes and 6 hours');
        fields.push('endTime');
      }
    }

    if (errors.length > 0) {
      setError(errors[0]);
      setInvalidFields(fields);
      setIsModalOpen(true);
      return;
    }

    const payload = {
      ...formData,
      preWeight: preWeightVal,
      postWeight: postWeightVal ?? undefined,
      preSystolicBP: preBPVal,
      postSystolicBP: postBPVal ?? undefined,
    };

    try {
      const isReady = await api.checkHealth();

      if (!isReady) {
        setError('Backend is still warming up. Please wait a moment.');
        setIsModalOpen(true);
        return;
      }

      if (item.session) {
        const res = await api.updateSession(item.session.id!, payload);
        if (res?.error) {
          setError(res.error);
          setIsModalOpen(true);
          return;
        }
      } else {
        const res = await api.createSession({
          ...payload,
          patientId,
        });
        if (res?.error) {
          setError(res.error);
          setIsModalOpen(true);
          return;
        }
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to save session record. Please check your connection.');
      setIsModalOpen(true);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Validation Error">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center text-rose-500">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-600 leading-relaxed">{error}</p>
          </div>
        </div>
      </Modal>

      <div className="p-4 bg-teal-50/50 rounded-2xl border border-teal-100/50 flex items-center gap-4">
        <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center text-teal-600">
          <Info size={20} />
        </div>
        <div>
          <p className="text-[10px] font-bold text-teal-700 uppercase tracking-widest">Active Patient</p>
          <p className="text-sm font-bold text-slate-800">{item.patient.fullName}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            Unit {unit} • {machineId}
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3 text-rose-600">
          <AlertTriangle size={18} />
          <p className="text-sm font-bold">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <Input
            label="Start Time"
            icon={Clock}
            type="time"
            value={toTimeLocal(formData.startTime)}
            onChange={(e: any) => updateField('startTime', fromTimeLocal(e.target.value))}
            required
            placeholder="Select start time"
            error={invalidFields.includes('startTime')}
          />
          <Input
            label="End Time"
            icon={Clock}
            type="time"
            value={toTimeLocal(formData.endTime)}
            onChange={(e: any) => updateField('endTime', fromTimeLocal(e.target.value))}
            placeholder="Select end time"
            error={invalidFields.includes('endTime')}
          />
        </div>

        <div className="px-4 py-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-slate-400" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Session Duration</span>
          </div>
          <span
            className={cn(
              'text-sm font-bold',
              duration > 0 ? 'text-slate-700' : duration < 0 ? 'text-rose-500' : 'text-slate-400'
            )}
          >
            {formatDuration(duration)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <Input
            label="Pre-Weight (kg)"
            icon={Scale}
            type="number"
            step="0.1"
            value={formData.preWeight}
            onChange={(e: any) => updateField('preWeight', e.target.value)}
            required
            placeholder="e.g. 70.5"
            error={invalidFields.includes('preWeight')}
          />
          <Input
            label="Post-Weight (kg)"
            icon={Scale}
            type="number"
            step="0.1"
            value={formData.postWeight}
            onChange={(e: any) => updateField('postWeight', e.target.value)}
            placeholder="e.g. 68.2"
            error={invalidFields.includes('postWeight')}
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <Input
            label="Pre Systolic BP"
            icon={Activity}
            type="number"
            value={formData.preSystolicBP}
            onChange={(e: any) => updateField('preSystolicBP', e.target.value)}
            required
            placeholder="e.g. 140"
            error={invalidFields.includes('preSystolicBP')}
          />
          <Input
            label="Post Systolic BP"
            icon={Activity}
            type="number"
            value={formData.postSystolicBP}
            onChange={(e: any) => updateField('postSystolicBP', e.target.value)}
            placeholder="e.g. 130"
            error={invalidFields.includes('postSystolicBP')}
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Current Status</label>
          <div className="relative group">
            <Clock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 group-focus-within:text-teal-500 transition-colors pointer-events-none" />
            <select
              className="w-full pl-10 pr-10 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm appearance-none transition-all focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:bg-white focus:border-teal-500"
              value={formData.status}
              onChange={(e: any) => updateField('status', e.target.value)}
            >
              <option value="not started">Not Started</option>
              <option value="in progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
            <ChevronDown className="absolute right-3 top-3 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nurse Observations</label>
          <textarea
            placeholder="Enter any clinical observations..."
            className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm transition-all focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:bg-white focus:border-teal-500 min-h-[120px] resize-none placeholder:text-slate-400"
            value={formData.nurseNotes}
            onChange={(e: any) => updateField('nurseNotes', e.target.value)}
          />
        </div>
      </div>

      <Button type="submit" className="w-full h-12 shadow-lg shadow-teal-500/20 font-bold text-sm rounded-xl">
        Save Clinical Record
      </Button>
    </form>
  );
}