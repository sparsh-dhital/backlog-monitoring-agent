import { ArrowRight, UserPlus, FileText } from "lucide-react";
import type { DashboardData } from "../../types/agent";
import { StatCard, StatusBadge } from "../WorkspacePrimitives";

export default function MentorDashboard({
  dashboard,
  onSelectStudent,
}: {
  dashboard: DashboardData;
  onSelectStudent: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-brand-900 tracking-tight">Good morning, mentor.</h1>
        <p className="text-text-secondary text-base">A focused queue of students who need a conversation, an intervention, or a little more context.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Students" value="42" detail="Your current group" tone="neutral" />
        <StatCard label="Need attention" value="8" detail="Priority queue" tone="warning" />
        <StatCard label="Active interventions" value="5" detail="Under monitoring" tone="neutral" />
        <StatCard label="Recovery progress" value="12" detail="Backlogs cleared this term" tone="success" />
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-bold text-brand-900 tracking-tight border-b border-border-light pb-2">Students requiring attention</h2>
        <div className="bg-surface border border-border-light rounded-xl shadow-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-brand-50 border-b border-border-light">
                  <th className="px-5 py-3 text-xs font-bold text-text-secondary uppercase tracking-wider">Student Name</th>
                  <th className="px-5 py-3 text-xs font-bold text-text-secondary uppercase tracking-wider">Backlog</th>
                  <th className="px-5 py-3 text-xs font-bold text-text-secondary uppercase tracking-wider">Pattern</th>
                  <th className="px-5 py-3 text-xs font-bold text-text-secondary uppercase tracking-wider">Current Intervention</th>
                  <th className="px-5 py-3 text-xs font-bold text-text-secondary uppercase tracking-wider">Next Action</th>
                  <th className="px-5 py-3 text-xs font-bold text-text-secondary uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {dashboard.students?.slice(0, 5).map((student: any) => (
                  <tr key={student.student_id} className="hover:bg-brand-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-brand-900">Rahul Kumar</span>
                        <span className="text-xs text-text-secondary">{student.student_id}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-brand-900 font-medium">{student.active_backlog_count} courses</td>
                    <td className="px-5 py-4 text-sm text-text-secondary">Prerequisite failure chain</td>
                    <td className="px-5 py-4">
                      <StatusBadge tone="neutral">None active</StatusBadge>
                    </td>
                    <td className="px-5 py-4 text-sm font-bold text-brand-900">Approve recovery plan</td>
                    <td className="px-5 py-4 text-right">
                      <button 
                        onClick={() => onSelectStudent(student.student_id)}
                        className="bg-brand-50 text-brand-700 hover:bg-brand-100 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors inline-flex items-center gap-1.5 border border-brand-200"
                      >
                        <FileText size={14} /> Open mentoring brief
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
        <div className="bg-surface border border-border-light rounded-xl p-6 shadow-subtle">
          <h3 className="text-sm font-bold text-brand-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <UserPlus size={16} className="text-brand-500" /> Upcoming mentor meetings
          </h3>
          <div className="flex flex-col gap-3">
             <div className="flex items-center justify-between p-3 rounded-lg border border-border-light bg-brand-50/50">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-brand-900">Priya Singh</span>
                  <span className="text-xs text-text-secondary">Recovery plan check-in</span>
                </div>
                <div className="text-right">
                  <span className="block text-sm font-bold text-brand-900">Today</span>
                  <span className="block text-xs text-text-secondary">2:30 PM</span>
                </div>
             </div>
             <div className="flex items-center justify-between p-3 rounded-lg border border-border-light bg-brand-50/50">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-brand-900">Amit Patel</span>
                  <span className="text-xs text-text-secondary">Supplementary exam review</span>
                </div>
                <div className="text-right">
                  <span className="block text-sm font-bold text-brand-900">Tomorrow</span>
                  <span className="block text-xs text-text-secondary">10:00 AM</span>
                </div>
             </div>
          </div>
        </div>
        
        <div className="bg-brand-600 text-white rounded-xl p-6 shadow-lg border border-brand-500 flex flex-col justify-center">
           <h3 className="text-lg font-bold mb-2">Needs your approval</h3>
           <p className="text-brand-100 text-sm mb-6">
             There are 3 new AI-recommended intervention plans waiting for your review. Please evaluate the evidence and approve them so students can begin their recovery.
           </p>
           <button className="bg-white text-brand-900 hover:bg-brand-50 w-fit px-6 py-2.5 rounded-lg text-sm font-bold shadow-sm transition-colors inline-flex items-center gap-2">
             Review pending plans <ArrowRight size={16} />
           </button>
        </div>
      </div>
    </div>
  );
}
