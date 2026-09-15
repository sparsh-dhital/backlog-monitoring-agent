import { ArrowRight, Briefcase, TrendingUp } from "lucide-react";
import { StatCard, StatusBadge } from "../WorkspacePrimitives";

export default function PlacementDashboard() {
  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-brand-900 tracking-tight">Placement Readiness</h1>
        <p className="text-text-secondary text-base">Understand academic constraints early and track students nearing placement eligibility.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Eligible for Placement" value="342" detail="All criteria met" tone="success" />
        <StatCard label="Blocked by Backlogs" value="56" detail="Strict criteria applied" tone="danger" />
        <StatCard label="Nearing Eligibility" value="28" detail="1 backlog away" tone="warning" />
        <StatCard label="Companies Visiting" value="12" detail="Next 30 days" tone="neutral" />
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-bold text-brand-900 tracking-tight border-b border-border-light pb-2">Students becoming placement-ready</h2>
        <p className="text-sm text-text-secondary mb-2">These students are one successful exam away from unlocking specific placement opportunities.</p>
        <div className="bg-surface border border-border-light rounded-xl shadow-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-brand-50 border-b border-border-light">
                  <th className="px-5 py-3 text-xs font-bold text-text-secondary uppercase tracking-wider">Student Name</th>
                  <th className="px-5 py-3 text-xs font-bold text-text-secondary uppercase tracking-wider">CGPA</th>
                  <th className="px-5 py-3 text-xs font-bold text-text-secondary uppercase tracking-wider">Constraint</th>
                  <th className="px-5 py-3 text-xs font-bold text-text-secondary uppercase tracking-wider">Target Company</th>
                  <th className="px-5 py-3 text-xs font-bold text-text-secondary uppercase tracking-wider">Company Criteria</th>
                  <th className="px-5 py-3 text-xs font-bold text-text-secondary uppercase tracking-wider text-right">Recovery Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                <tr className="hover:bg-brand-50/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-brand-900">Ananya Sharma</span>
                      <span className="text-xs text-text-secondary">CS2021089</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm font-bold text-brand-900">8.2</td>
                  <td className="px-5 py-4">
                    <StatusBadge tone="warning">1 Active Backlog</StatusBadge>
                  </td>
                  <td className="px-5 py-4 text-sm font-bold text-brand-900">TechCorp Inc.</td>
                  <td className="px-5 py-4 text-sm text-text-secondary">0 Active Backlogs, &gt;7.5 CGPA</td>
                  <td className="px-5 py-4 text-right">
                    <span className="text-sm font-medium text-text-secondary bg-border-light/50 px-2.5 py-1 rounded-md">Exam in 12 days</span>
                  </td>
                </tr>
                <tr className="hover:bg-brand-50/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-brand-900">Rohan Das</span>
                      <span className="text-xs text-text-secondary">IT2021023</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm font-bold text-brand-900">7.8</td>
                  <td className="px-5 py-4">
                    <StatusBadge tone="warning">1 Active Backlog</StatusBadge>
                  </td>
                  <td className="px-5 py-4 text-sm font-bold text-brand-900">Global Systems</td>
                  <td className="px-5 py-4 text-sm text-text-secondary">Max 1 Dead Backlog allowed</td>
                  <td className="px-5 py-4 text-right">
                    <span className="text-sm font-medium text-brand-600 bg-brand-50 px-2.5 py-1 rounded-md">Cleared! Eligible</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
         <div className="bg-brand-900 text-white rounded-xl p-8 shadow-lg relative overflow-hidden">
           <div className="relative z-10">
             <h3 className="text-xl font-bold mb-2">Coordinate with Academics</h3>
             <p className="text-brand-200 text-sm mb-6 max-w-sm">
               Alert the department HODs about students who are high-performers but blocked from premium placements due to a single active backlog.
             </p>
             <button className="bg-white text-brand-900 hover:bg-brand-50 px-6 py-2.5 rounded-lg text-sm font-bold shadow-sm transition-colors inline-flex items-center gap-2">
               Flag critical cases <ArrowRight size={16} />
             </button>
           </div>
           <TrendingUp size={120} className="absolute -bottom-6 -right-6 text-brand-800 opacity-50" />
         </div>

         <div className="bg-surface border border-border-light rounded-xl p-6 shadow-subtle">
           <div className="flex items-center justify-between mb-4">
             <h3 className="text-sm font-bold text-brand-900 uppercase tracking-wider">Upcoming Drives</h3>
             <Briefcase size={16} className="text-text-secondary" />
           </div>
           <div className="flex flex-col gap-4">
             <div className="flex items-start justify-between pb-3 border-b border-border-light">
               <div>
                 <strong className="block text-sm text-brand-900">TechCorp Inc. (Software Dev)</strong>
                 <span className="text-xs text-text-secondary">0 backlogs required</span>
               </div>
               <div className="text-right">
                 <span className="block text-sm font-bold text-brand-900">124</span>
                 <span className="text-[10px] uppercase font-bold tracking-wider text-positive">Eligible</span>
               </div>
             </div>
             <div className="flex items-start justify-between">
               <div>
                 <strong className="block text-sm text-brand-900">Innova Analytics (Data Role)</strong>
                 <span className="text-xs text-text-secondary">Max 2 dead backlogs allowed</span>
               </div>
               <div className="text-right">
                 <span className="block text-sm font-bold text-brand-900">215</span>
                 <span className="text-[10px] uppercase font-bold tracking-wider text-positive">Eligible</span>
               </div>
             </div>
           </div>
         </div>
      </div>
    </div>
  );
}
