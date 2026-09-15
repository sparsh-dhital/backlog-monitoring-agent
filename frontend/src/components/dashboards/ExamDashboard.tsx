import { ArrowRight, AlertCircle, FileCheck2 } from "lucide-react";
import { StatCard, StatusBadge } from "../WorkspacePrimitives";

export default function ExamDashboard() {
  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-brand-900 tracking-tight">Exam Cell Operations</h1>
        <p className="text-text-secondary text-base">Keep eligibility, fee clearance, and attempts compliant before the exam window opens.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Upcoming Exams" value="12" detail="Next 30 days" tone="neutral" />
        <StatCard label="Eligibility Pending" value="45" detail="Action required" tone="warning" />
        <StatCard label="Fee Clearance Pending" value="28" detail="Blocking registration" tone="danger" />
        <StatCard label="N+2 Rule Violations" value="2" detail="Critical review" tone="danger" />
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-bold text-brand-900 tracking-tight border-b border-border-light pb-2">Students at risk of being debarred</h2>
        <div className="bg-surface border border-border-light rounded-xl shadow-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-brand-50 border-b border-border-light">
                  <th className="px-5 py-3 text-xs font-bold text-text-secondary uppercase tracking-wider">Student Name</th>
                  <th className="px-5 py-3 text-xs font-bold text-text-secondary uppercase tracking-wider">Course</th>
                  <th className="px-5 py-3 text-xs font-bold text-text-secondary uppercase tracking-wider">Attempt #</th>
                  <th className="px-5 py-3 text-xs font-bold text-text-secondary uppercase tracking-wider">Fee Status</th>
                  <th className="px-5 py-3 text-xs font-bold text-text-secondary uppercase tracking-wider">Attendance Status</th>
                  <th className="px-5 py-3 text-xs font-bold text-text-secondary uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                <tr className="hover:bg-brand-50/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-brand-900">Arjun Nair</span>
                      <span className="text-xs text-text-secondary">CS2021045</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm font-bold text-brand-900">Data Structures</td>
                  <td className="px-5 py-4 text-sm text-text-secondary">Attempt 3 of 3</td>
                  <td className="px-5 py-4">
                    <StatusBadge tone="danger">Pending</StatusBadge>
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge tone="success">Eligible</StatusBadge>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button className="text-sm font-bold text-brand-600 hover:text-brand-800 transition-colors inline-flex items-center gap-1">
                      Notify student <ArrowRight size={14} />
                    </button>
                  </td>
                </tr>
                <tr className="hover:bg-brand-50/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-brand-900">Meera Reddy</span>
                      <span className="text-xs text-text-secondary">EC2022102</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm font-bold text-brand-900">Microprocessors</td>
                  <td className="px-5 py-4 text-sm text-text-secondary">Attempt 2 of 4</td>
                  <td className="px-5 py-4">
                    <StatusBadge tone="success">Cleared</StatusBadge>
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge tone="danger">Deficit (62%)</StatusBadge>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button className="text-sm font-bold text-brand-600 hover:text-brand-800 transition-colors inline-flex items-center gap-1">
                      Review condo <ArrowRight size={14} />
                    </button>
                  </td>
                </tr>
                <tr className="hover:bg-brand-50/50 transition-colors bg-critical/5">
                  <td className="px-5 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-brand-900">Vikram Singh</span>
                      <span className="text-xs text-text-secondary">ME2020015</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm font-bold text-brand-900">Thermodynamics</td>
                  <td className="px-5 py-4 text-sm font-bold text-critical flex items-center gap-1.5">
                    <AlertCircle size={14} /> N+2 Violation
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge tone="neutral">N/A</StatusBadge>
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge tone="neutral">N/A</StatusBadge>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button className="text-sm font-bold text-critical hover:text-critical/80 transition-colors inline-flex items-center gap-1">
                      Open case file <ArrowRight size={14} />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
         <div className="bg-surface border border-border-light rounded-xl p-6 shadow-subtle">
           <div className="flex items-center justify-between mb-4">
             <h3 className="text-sm font-bold text-brand-900 uppercase tracking-wider">Automated eligibility runs</h3>
             <FileCheck2 size={16} className="text-text-secondary" />
           </div>
           <p className="text-sm text-text-secondary mb-6">
             The orchestration engine validates attendance and fee data against exam regulations nightly.
           </p>
           <div className="space-y-3">
             <div className="flex items-center justify-between">
               <span className="text-sm font-medium text-brand-900">B.Tech Semester 4</span>
               <span className="text-xs font-bold text-positive bg-positive/10 px-2 py-1 rounded">100% Validated</span>
             </div>
             <div className="flex items-center justify-between">
               <span className="text-sm font-medium text-brand-900">B.Tech Semester 6</span>
               <span className="text-xs font-bold text-warning bg-warning/10 px-2 py-1 rounded">Validating...</span>
             </div>
           </div>
         </div>
         
         <div className="bg-brand-50 border border-brand-200 rounded-xl p-6 shadow-subtle flex flex-col justify-center">
            <h3 className="text-lg font-bold text-brand-900 mb-2">Prepare exam registry</h3>
            <p className="text-brand-700 text-sm mb-6">
              Export the finalized, validated list of eligible students for the upcoming supplementary exams to the university portal.
            </p>
            <button className="bg-brand-900 text-white hover:bg-brand-800 w-fit px-6 py-2.5 rounded-lg text-sm font-bold shadow-sm transition-colors">
              Generate Export File
            </button>
         </div>
      </div>
    </div>
  );
}
