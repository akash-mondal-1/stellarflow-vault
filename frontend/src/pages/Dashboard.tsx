import { useState, useEffect } from 'react';
import { 
  Folder, 
  Layers, 
  CheckCircle, 
  Star, 
  ArrowUpRight
} from 'lucide-react';
import stellarFlowService from '../services/stellar';
import type { ProjectDetails, UserReputation } from '../services/stellar';

interface DashboardProps {
  navigateToProject: (address: string) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export default function Dashboard({ navigateToProject, showToast }: DashboardProps) {
  const [projects, setProjects] = useState<ProjectDetails[]>([]);
  const [reputation, setReputation] = useState<UserReputation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const list = await stellarFlowService.listProjects();
        setProjects(list);

        // Fetch reputation for a sample/connected user
        const activeWallet = stellarFlowService.getUserWallet() || 'GBFREELANCER12345678901234567890123456789012345678901';
        const rep = await stellarFlowService.getUserReputation(activeWallet);
        setReputation(rep);
      } catch (e) {
        console.error('Dashboard load error:', e);
        showToast('Error loading dashboard data', 'error');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const totalProjects = projects.length;
  const activeEscrows = projects.filter((p) => p.isDeposited && !p.isCompleted).length;
  const completedEscrows = projects.filter((p) => p.isCompleted).length;
  const ratingStars = reputation ? (reputation.score / 100).toFixed(1) : '5.0';

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        {/* Skeleton Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-[#121930] rounded-3xl border border-[#1f293d]" />
          ))}
        </div>
        <div className="h-96 bg-[#121930] rounded-3xl border border-[#1f293d] mt-4" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#121930] p-6 rounded-3xl border border-[#1f293d] flex items-center gap-5 hover:border-brand-500/20 transition-all">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400">
            <Folder className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-gray-400 font-semibold tracking-wider uppercase">Total Projects</span>
            <h3 className="text-2xl font-bold text-white mt-1">{totalProjects}</h3>
          </div>
        </div>

        <div className="bg-[#121930] p-6 rounded-3xl border border-[#1f293d] flex items-center gap-5 hover:border-brand-500/20 transition-all">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-gray-400 font-semibold tracking-wider uppercase">Active Escrows</span>
            <h3 className="text-2xl font-bold text-white mt-1">{activeEscrows}</h3>
          </div>
        </div>

        <div className="bg-[#121930] p-6 rounded-3xl border border-[#1f293d] flex items-center gap-5 hover:border-brand-500/20 transition-all">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-gray-400 font-semibold tracking-wider uppercase">Completed Paid</span>
            <h3 className="text-2xl font-bold text-white mt-1">{completedEscrows}</h3>
          </div>
        </div>

        <div className="bg-[#121930] p-6 rounded-3xl border border-[#1f293d] flex items-center gap-5 hover:border-brand-500/20 transition-all">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
            <Star className="w-6 h-6 fill-indigo-400/10" />
          </div>
          <div>
            <span className="text-xs text-gray-400 font-semibold tracking-wider uppercase">Reputation Score</span>
            <h3 className="text-2xl font-bold text-white mt-1">{ratingStars} <span className="text-xs text-gray-500 font-normal">/ 5.0</span></h3>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-[#0f152b] rounded-3xl border border-[#1f293d] overflow-hidden">
        <div className="p-6 border-b border-[#1f293d] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-white text-base">Escrow Projects</h3>
            <p className="text-xs text-gray-400 mt-1">Milestone-based escrow contracts deployed in the workspace.</p>
          </div>
        </div>

        {projects.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#121930] flex items-center justify-center border border-[#1f293d]">
              <Folder className="w-8 h-8 text-gray-500" />
            </div>
            <div>
              <h4 className="font-bold text-white text-base">No projects created yet</h4>
              <p className="text-xs text-gray-400 max-w-sm mt-1 mx-auto">
                Get started by creating a new contract, setting up milestones, and funding the project budget.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0c1122] text-xs text-gray-400 font-semibold uppercase tracking-wider border-b border-[#1f293d]">
                  <th className="py-4 px-6">Project Name</th>
                  <th className="py-4 px-6">Freelancer</th>
                  <th className="py-4 px-6">Total Budget</th>
                  <th className="py-4 px-6">Escrow Bal</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f293d]/50 text-sm">
                {projects.map((project) => {
                  let statusText = 'Pending Deposit';
                  let statusClass = 'bg-gray-500/10 text-gray-400 border-gray-500/20';

                  if (project.isCompleted) {
                    statusText = 'Completed';
                    statusClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                  } else if (project.isDeposited) {
                    const hasDispute = project.milestones.some((m) => m.disputed);
                    if (hasDispute) {
                      statusText = 'Disputed';
                      statusClass = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
                    } else {
                      statusText = 'Active';
                      statusClass = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
                    }
                  }

                  return (
                    <tr key={project.address} className="hover:bg-[#121930]/30 transition-all">
                      <td className="py-4.5 px-6">
                        <div className="font-semibold text-white">{project.name}</div>
                        <div className="text-[11px] text-gray-500 font-mono mt-0.5">
                          {project.address.substring(0, 10)}...{project.address.substring(project.address.length - 8)}
                        </div>
                      </td>
                      <td className="py-4.5 px-6 font-mono text-xs text-gray-400">
                        {project.freelancer.substring(0, 6)}...{project.freelancer.substring(project.freelancer.length - 4)}
                      </td>
                      <td className="py-4.5 px-6 font-semibold text-white">
                        {project.totalBudget} <span className="text-[10px] text-brand-400">XLM</span>
                      </td>
                      <td className="py-4.5 px-6 font-semibold text-white">
                        {project.balance} <span className="text-[10px] text-brand-400">XLM</span>
                      </td>
                      <td className="py-4.5 px-6">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${statusClass}`}>
                          {statusText}
                        </span>
                      </td>
                      <td className="py-4.5 px-6 text-right">
                        <button
                          onClick={() => navigateToProject(project.address)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#171f3a] hover:bg-brand-500 hover:text-white border border-[#1f293d] text-xs font-semibold text-gray-300 transition-all hover:scale-105"
                        >
                          Details
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
