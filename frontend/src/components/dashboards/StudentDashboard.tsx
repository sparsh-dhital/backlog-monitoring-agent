import { ArrowRight, CheckCircle2, Clock, CalendarDays, Sparkles } from "lucide-react";
import { StatCard, StatusBadge } from "../WorkspacePrimitives";

export default function StudentDashboard() {
  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto w-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-brand-900 tracking-tight">Good morning, Rahul.</h1>
        <p className="text-text-secondary text-base">Here's your academic recovery at a glance.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Active Backlogs" value="3" detail="Needs attention" tone="warning" />
        <StatCard label="Attempts Remaining" value="2" detail="Under current regulation" tone="neutral" />
        <StatCard label="Recovery Progress" value="40%" detail="On track this semester" tone="success" />
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-bold text-brand-900 tracking-tight border-b border-border-light pb-2">Your active backlogs</h2>
        <div className="bg-surface border border-border-light rounded-xl shadow-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-brand-50 border-b border-border-light">
                  <th className="px-5 py-3 text-xs font-bold text-text-secondary uppercase tracking-wider">Course</th>
                  <th className="px-5 py-3 text-xs font-bold text-text-secondary uppercase tracking-wider">Origin Semester</th>
                  <th className="px-5 py-3 text-xs font-bold text-text-secondary uppercase tracking-wider">Attempts Used</th>
                  <th className="px-5 py-3 text-xs font-bold text-text-secondary uppercase tracking-wider">Attempts Remaining</th>
                  <th className="px-5 py-3 text-xs font-bold text-text-secondary uppercase tracking-wider text-right">Current Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                <tr className="hover:bg-brand-50/50 transition-colors">
                  <td className="px-5 py-4 text-sm font-bold text-brand-900">Data Structures</td>
                  <td className="px-5 py-4 text-sm text-text-secondary">Semester 3</td>
                  <td className="px-5 py-4 text-sm text-text-secondary">2</td>
                  <td className="px-5 py-4 text-sm font-bold text-brand-900">1</td>
                  <td className="px-5 py-4 text-right">
                    <StatusBadge tone="warning">Action Required</StatusBadge>
                  </td>
                </tr>
                <tr className="hover:bg-brand-50/50 transition-colors">
                  <td className="px-5 py-4 text-sm font-bold text-brand-900">Operating Systems</td>
                  <td className="px-5 py-4 text-sm text-text-secondary">Semester 4</td>
                  <td className="px-5 py-4 text-sm text-text-secondary">1</td>
                  <td className="px-5 py-4 text-sm font-bold text-brand-900">2</td>
                  <td className="px-5 py-4 text-right">
                    <StatusBadge tone="neutral">Pending Exam</StatusBadge>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 mt-2">
        <h2 className="text-xl font-bold text-brand-900 tracking-tight border-b border-border-light pb-2">Your recommended next step</h2>
        <div className="bg-brand-600 text-white border border-brand-500 rounded-xl p-6 shadow-lg flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
          <div className="flex items-start gap-4">
            <div className="bg-white/20 p-3 rounded-lg shrink-0">
              <Sparkles size={24} className="text-brand-100" />
            </div>
            <div>
              <h3 className="text-lg font-bold mb-1">Register for supplementary exam</h3>
              <p className="text-brand-100 text-sm max-w-xl leading-relaxed">
                You have one attempt remaining for Data Structures. Registering before Friday ensures you can attend the mandatory remedial sessions designed to help you pass.
              </p>
            </div>
          </div>
          <button className="bg-white text-brand-900 hover:bg-brand-50 px-6 py-2.5 rounded-lg text-sm font-bold shadow-sm shrink-0 transition-colors inline-flex items-center gap-2">
            Register now <ArrowRight size={16} />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4 mt-4">
        <h2 className="text-xl font-bold text-brand-900 tracking-tight border-b border-border-light pb-2">Your recovery timeline</h2>
        <div className="bg-surface border border-border-light rounded-xl p-6 shadow-subtle relative">
          <div className="absolute top-1/2 left-10 right-10 h-1 bg-border-light -translate-y-1/2 z-0 hidden md:block" />
          
          <div className="grid grid-cols-1 md:grid-cols-6 gap-6 relative z-10">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-10 h-10 rounded-full bg-positive text-white flex items-center justify-center shadow-md">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <strong className="block text-sm text-brand-900">Backlog detected</strong>
                <span className="text-xs text-text-secondary">Nov 12</span>
              </div>
            </div>
            
            {/* Step 2 */}
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-10 h-10 rounded-full bg-positive text-white flex items-center justify-center shadow-md">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <strong className="block text-sm text-brand-900">Assessment</strong>
                <span className="text-xs text-text-secondary">Nov 14</span>
              </div>
            </div>
            
            {/* Step 3 */}
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-500 text-white flex items-center justify-center shadow-md ring-4 ring-brand-100">
                <Clock size={20} />
              </div>
              <div>
                <strong className="block text-sm text-brand-900">Mentor review</strong>
                <span className="text-xs text-brand-600 font-semibold">In progress</span>
              </div>
            </div>
            
            {/* Step 4 */}
            <div className="flex flex-col items-center text-center gap-3 opacity-50">
              <div className="w-10 h-10 rounded-full bg-surface border-2 border-border-light text-text-secondary flex items-center justify-center">
                <span className="text-sm font-bold">4</span>
              </div>
              <div>
                <strong className="block text-sm text-brand-900">Intervention</strong>
                <span className="text-xs text-text-secondary">Pending</span>
              </div>
            </div>
            
            {/* Step 5 */}
            <div className="flex flex-col items-center text-center gap-3 opacity-50">
              <div className="w-10 h-10 rounded-full bg-surface border-2 border-border-light text-text-secondary flex items-center justify-center">
                <CalendarDays size={18} />
              </div>
              <div>
                <strong className="block text-sm text-brand-900">Next attempt</strong>
                <span className="text-xs text-text-secondary">Dec 05</span>
              </div>
            </div>
            
            {/* Step 6 */}
            <div className="flex flex-col items-center text-center gap-3 opacity-50">
              <div className="w-10 h-10 rounded-full bg-surface border-2 border-border-light text-text-secondary flex items-center justify-center">
                <span className="text-sm font-bold">6</span>
              </div>
              <div>
                <strong className="block text-sm text-brand-900">Recovery</strong>
                <span className="text-xs text-text-secondary">Goal</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
