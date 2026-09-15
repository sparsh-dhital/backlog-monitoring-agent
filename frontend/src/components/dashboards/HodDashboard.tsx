import { AlertTriangle, ArrowRight,  } from "lucide-react";
import type { DashboardData } from "../../types/agent";
import { StatCard, StatusBadge } from "../WorkspacePrimitives";

export default function HodDashboard({
  dashboard,
  onSelectStudent,
}: {
  dashboard: DashboardData;
  onSelectStudent: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-brand-900 tracking-tight">Academic Command Center</h1>
        <p className="text-text-secondary text-base">See the department-wide picture, then open the cases behind the signal.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Backlogs" value="214" detail="-12% from last term" tone="neutral" />
        <StatCard label="Students Affected" value="87" detail="-8% from last term" tone="neutral" />
        <StatCard label="Critical Cases" value="9" detail="Review required" tone="danger" />
        <StatCard label="Interventions" value="34" detail="Active this term" tone="success" />
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-bold text-brand-900 tracking-tight border-b border-border-light pb-2">What needs attention now</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-surface border border-border-light rounded-xl p-6 shadow-subtle">
            <h3 className="text-sm font-bold text-brand-900 uppercase tracking-wider mb-4">Backlogs by Course</h3>
            <div className="flex flex-col gap-4">
              {dashboard.course_patterns.slice(0, 5).map((pattern) => (
                <div key={pattern.course_code} className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-text-secondary w-16">{pattern.course_code}</span>
                  <div className="flex-1 h-2 bg-brand-50 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-400 rounded-full" style={{ width: `${Math.min(100, pattern.count * 10)}%` }} />
                  </div>
                  <span className="text-sm font-bold text-brand-900">{pattern.count}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-surface border border-border-light rounded-xl p-6 shadow-subtle">
            <h3 className="text-sm font-bold text-brand-900 uppercase tracking-wider mb-4">Failure Patterns</h3>
            <div className="flex flex-col gap-4">
              {dashboard.course_patterns.slice(0, 3).map((pattern, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <AlertTriangle className="text-warning shrink-0 mt-0.5" size={16} />
                  <div>
                    <p className="text-sm font-bold text-brand-900">{pattern.course_code} clustering</p>
                    <p className="text-xs text-text-secondary mt-0.5">{pattern.count} students failing alongside prerequisite.</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-surface border border-border-light rounded-xl p-6 shadow-subtle">
            <h3 className="text-sm font-bold text-brand-900 uppercase tracking-wider mb-4">Recoverability</h3>
            <div className="space-y-4">
               <div className="flex justify-between items-center">
                 <span className="text-sm text-text-secondary font-medium">Standard recovery</span>
                 <span className="text-sm font-bold text-positive">65%</span>
               </div>
               <div className="flex justify-between items-center">
                 <span className="text-sm text-text-secondary font-medium">At risk of extension</span>
                 <span className="text-sm font-bold text-warning">20%</span>
               </div>
               <div className="flex justify-between items-center">
                 <span className="text-sm text-text-secondary font-medium">Critical intervention needed</span>
                 <span className="text-sm font-bold text-critical">15%</span>
               </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-bold text-brand-900 tracking-tight border-b border-border-light pb-2">Priority Queue</h2>
        <div className="bg-surface border border-border-light rounded-xl shadow-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-brand-50 border-b border-border-light">
                  <th className="px-5 py-3 text-xs font-bold text-text-secondary uppercase tracking-wider">Student ID</th>
                  <th className="px-5 py-3 text-xs font-bold text-text-secondary uppercase tracking-wider">Backlogs</th>
                  <th className="px-5 py-3 text-xs font-bold text-text-secondary uppercase tracking-wider">Primary Signal</th>
                  <th className="px-5 py-3 text-xs font-bold text-text-secondary uppercase tracking-wider">Severity</th>
                  <th className="px-5 py-3 text-xs font-bold text-text-secondary uppercase tracking-wider">Recommended Action</th>
                  <th className="px-5 py-3 text-xs font-bold text-text-secondary uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 text-xs font-bold text-text-secondary uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {dashboard.students.map((student: any) => (
                  <tr key={student.student_id} className="hover:bg-brand-50/50 transition-colors">
                    <td className="px-5 py-4 text-sm font-bold text-brand-900">{student.student_id}</td>
                    <td className="px-5 py-4 text-sm text-text-secondary">{student.active_backlog_count}</td>
                    <td className="px-5 py-4 text-sm text-brand-900 font-medium">Repeated failure ({student.risk_level})</td>
                    <td className="px-5 py-4">
                      <StatusBadge tone={student.risk_level === "CRITICAL" ? "danger" : "warning"}>
                        {student.risk_level}
                      </StatusBadge>
                    </td>
                    <td className="px-5 py-4 text-sm text-text-secondary">Structured Mentoring</td>
                    <td className="px-5 py-4">
                      <span className="text-xs font-medium text-text-secondary bg-border-light/50 px-2.5 py-1 rounded-md">Pending Review</span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button 
                        onClick={() => onSelectStudent(student.student_id)}
                        className="text-sm font-bold text-brand-600 hover:text-brand-800 transition-colors inline-flex items-center gap-1"
                      >
                        View case <ArrowRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 mt-4">
        <h2 className="text-xl font-bold text-brand-900 tracking-tight border-b border-border-light pb-2">Connected Case Journey</h2>
        <div className="bg-surface border border-border-light rounded-xl p-6 shadow-subtle flex flex-col md:flex-row items-center gap-4 text-center md:text-left justify-between">
          <div className="flex flex-col items-center md:items-start flex-1">
            <span className="text-xs font-bold text-brand-500 uppercase tracking-widest mb-1">Step 1</span>
            <strong className="text-sm text-brand-900">HOD identifies</strong>
          </div>
          <ArrowRight className="text-border-light hidden md:block" />
          <div className="flex flex-col items-center md:items-start flex-1">
            <span className="text-xs font-bold text-brand-500 uppercase tracking-widest mb-1">Step 2</span>
            <strong className="text-sm text-brand-900">Mentor supports</strong>
          </div>
          <ArrowRight className="text-border-light hidden md:block" />
          <div className="flex flex-col items-center md:items-start flex-1">
            <span className="text-xs font-bold text-brand-500 uppercase tracking-widest mb-1">Step 3</span>
            <strong className="text-sm text-brand-900">Exam validates</strong>
          </div>
          <ArrowRight className="text-border-light hidden md:block" />
          <div className="flex flex-col items-center md:items-start flex-1">
            <span className="text-xs font-bold text-brand-500 uppercase tracking-widest mb-1">Step 4</span>
            <strong className="text-sm text-brand-900">Placement monitors</strong>
          </div>
          <ArrowRight className="text-border-light hidden md:block" />
          <div className="flex flex-col items-center md:items-start flex-1">
            <span className="text-xs font-bold text-positive uppercase tracking-widest mb-1">Step 5</span>
            <strong className="text-sm text-positive">Student recovers</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
