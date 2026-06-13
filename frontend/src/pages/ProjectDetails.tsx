import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Wallet, 
  Coins, 
  Plus, 
  Check, 
  Lock, 
  AlertTriangle,
  FileCheck,
  Scale,
  Users,
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';
import stellarFlowService from '../services/stellar';
import type { ProjectDetails as ProjectType } from '../services/stellar';

interface ProjectDetailsProps {
  projectAddress: string;
  userAddress: string | null;
  navigateToDashboard: () => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export default function ProjectDetails({ 
  projectAddress, 
  userAddress, 
  navigateToDashboard, 
  showToast 
}: ProjectDetailsProps) {
  const [project, setProject] = useState<ProjectType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDepositing, setIsDepositing] = useState(false);
  const [isAddingMilestone, setIsAddingMilestone] = useState(false);
  
  // Milestone Form States
  const [mDesc, setMDesc] = useState('');
  const [mAmount, setMAmount] = useState('');
  const [isSubmittingMilestone, setIsSubmittingMilestone] = useState(false);

  // Load project details
  async function loadProject() {
    try {
      const data = await stellarFlowService.getProjectDetails(projectAddress);
      setProject(data);
    } catch (e) {
      showToast('Error loading project details', 'error');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadProject();
  }, [projectAddress]);

  const handleDeposit = async () => {
    if (!project) return;
    setIsDepositing(true);
    try {
      const success = await stellarFlowService.depositFunds(projectAddress, project.totalBudget);
      if (success) {
        showToast('Funds locked in escrow successfully!', 'success');
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
        await loadProject();
      } else {
        showToast('Deposit failed', 'error');
      }
    } catch (e) {
      showToast('Deposit failed', 'error');
    } finally {
      setIsDepositing(false);
    }
  };

  const handleCreateMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !mDesc || !mAmount) return;
    
    if (isNaN(Number(mAmount)) || Number(mAmount) <= 0) {
      showToast('Milestone amount must be positive', 'error');
      return;
    }

    setIsSubmittingMilestone(true);
    try {
      const success = await stellarFlowService.createMilestone(projectAddress, mDesc, mAmount);
      if (success) {
        showToast('Milestone created successfully!', 'success');
        setMDesc('');
        setMAmount('');
        setIsAddingMilestone(false);
        await loadProject();
      } else {
        showToast('Milestone creation failed', 'error');
      }
    } catch (e) {
      showToast('Milestone creation failed', 'error');
    } finally {
      setIsSubmittingMilestone(false);
    }
  };

  const handleApproveMilestone = async (index: number) => {
    try {
      const success = await stellarFlowService.approveMilestone(projectAddress, index);
      if (success) {
        showToast('Milestone approved successfully!', 'success');
        await loadProject();
      } else {
        showToast('Approval failed', 'error');
      }
    } catch (e) {
      showToast('Approval failed', 'error');
    }
  };

  const handleReleasePayment = async (index: number) => {
    try {
      const success = await stellarFlowService.releasePayment(projectAddress, index);
      if (success) {
        showToast('Payment released successfully!', 'success');
        confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
        await loadProject();
      } else {
        showToast('Release failed', 'error');
      }
    } catch (e) {
      showToast('Release failed', 'error');
    }
  };

  const handleRaiseDispute = async (index: number) => {
    try {
      const success = await stellarFlowService.raiseDispute(projectAddress, index);
      if (success) {
        showToast('Dispute raised successfully on this milestone.', 'info');
        await loadProject();
      } else {
        showToast('Dispute raising failed', 'error');
      }
    } catch (e) {
      showToast('Dispute raising failed', 'error');
    }
  };

  const handleResolveDispute = async (index: number, releaseToFreelancer: boolean) => {
    try {
      const success = await stellarFlowService.resolveDispute(projectAddress, index, releaseToFreelancer);
      if (success) {
        showToast(
          `Dispute resolved successfully: ${releaseToFreelancer ? 'Paid to freelancer' : 'Refunded to client'}`,
          'success'
        );
        confetti({ particleCount: 60, spread: 50, origin: { y: 0.6 } });
        await loadProject();
      } else {
        showToast('Dispute resolution failed', 'error');
      }
    } catch (e) {
      showToast('Dispute resolution failed', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-6 w-32 bg-gray-700 rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-[#121930] rounded-3xl" />
          <div className="h-96 bg-[#121930] rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!project) return null;

  // Calculate milestone stats
  const totalMilestonesBudget = project.milestones.reduce((acc, m) => acc + Number(m.amount), 0);
  const releasedMilestonesBudget = project.milestones
    .filter((m) => m.released)
    .reduce((acc, m) => acc + Number(m.amount), 0);
  
  const releasedPercent = totalMilestonesBudget > 0 
    ? Math.round((releasedMilestonesBudget / Number(project.totalBudget)) * 100)
    : 0;

  // Role Checks
  const isClient = userAddress === project.client;
  const isFreelancer = userAddress === project.freelancer;

  return (
    <div className="flex flex-col gap-6">
      {/* Back navigation */}
      <button
        onClick={navigateToDashboard}
        className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white mb-2 transition-all w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </button>

      {/* Main Grid split: Left metadata & Right Milestones */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Project Info */}
        <div className="flex flex-col gap-6 lg:col-span-1">
          {/* Card: Project Metadata */}
          <div className="bg-[#121930] border border-[#1f293d] rounded-3xl p-6 flex flex-col gap-4">
            <div>
              <span className="text-[10px] text-brand-400 font-bold tracking-wider uppercase bg-brand-500/10 px-2.5 py-1 rounded-full border border-brand-500/20">
                {project.isCompleted ? 'Project Completed' : project.isDeposited ? 'Escrow Active' : 'Pending Funding'}
              </span>
              <h3 className="font-bold text-white text-lg mt-3">{project.name}</h3>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">{project.description}</p>
            </div>

            <div className="border-t border-[#1f293d] pt-4 flex flex-col gap-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400 font-medium">Total Budget:</span>
                <span className="font-bold text-white font-mono">{project.totalBudget} XLM</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400 font-medium">Escrow Balance:</span>
                <span className="font-bold text-white font-mono">{project.balance} XLM</span>
              </div>
            </div>

            {/* Deposit CTA */}
            {!project.isDeposited && (
              <div className="border-t border-[#1f293d] pt-4 mt-1 flex flex-col gap-3">
                <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 p-3 rounded-2xl text-amber-400 text-[11px] leading-relaxed">
                  <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    This contract must be funded before milestones can be paid out. The client must deposit the total budget.
                  </div>
                </div>
                {isClient ? (
                  <button
                    onClick={handleDeposit}
                    disabled={isDepositing}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-500 hover:from-brand-500 hover:to-indigo-400 text-white text-xs font-bold shadow-md shadow-brand-500/10 transition-all disabled:opacity-50"
                  >
                    <Wallet className="w-4 h-4" />
                    {isDepositing ? 'Depositing...' : 'Deposit Funds (XLM)'}
                  </button>
                ) : (
                  <div className="text-center text-xs text-gray-500 italic">
                    Waiting for client to lock funds...
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Card: Parties */}
          <div className="bg-[#121930] border border-[#1f293d] rounded-3xl p-6 flex flex-col gap-4">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <Users className="w-4.5 h-4.5 text-gray-400" />
              Involved Parties
            </h4>

            <div className="flex flex-col gap-3">
              <div className="p-3 bg-[#0b0f19] rounded-2xl border border-[#1f293d]">
                <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider block">Client {isClient && '(You)'}</span>
                <span className="text-xs text-gray-300 font-mono break-all block mt-1">{project.client}</span>
              </div>

              <div className="p-3 bg-[#0b0f19] rounded-2xl border border-[#1f293d]">
                <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider block">Freelancer {isFreelancer && '(You)'}</span>
                <span className="text-xs text-gray-300 font-mono break-all block mt-1">{project.freelancer}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Milestones Progress & List */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Card: Milestones Header */}
          <div className="bg-[#121930] border border-[#1f293d] rounded-3xl p-6">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <h3 className="font-bold text-white text-base">Project Milestones</h3>
                <p className="text-xs text-gray-400 mt-1">Funds are released progressively as milestones are completed.</p>
              </div>

              {project.isDeposited && isClient && !project.isCompleted && (
                <button
                  onClick={() => setIsAddingMilestone(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-brand-500 hover:bg-brand-400 text-white rounded-xl text-xs font-semibold shadow-md shadow-brand-500/10 transition-all hover:scale-105"
                >
                  <Plus className="w-4 h-4" />
                  Add Milestone
                </button>
              )}
            </div>

            {/* Progress Bar */}
            {project.milestones.length > 0 && (
              <div className="bg-[#0b0f19] p-4 rounded-2xl border border-[#1f293d] mb-6">
                <div className="flex justify-between items-center text-xs font-semibold text-gray-300 mb-2">
                  <span>Progress Released</span>
                  <span>{releasedPercent}% ({releasedMilestonesBudget} / {project.totalBudget} XLM)</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-brand-600 to-indigo-500 h-3 rounded-full transition-all duration-500" 
                    style={{ width: `${releasedPercent}%` }}
                  />
                </div>
              </div>
            )}

            {/* List */}
            {project.milestones.length === 0 ? (
              <div className="p-12 flex flex-col items-center justify-center text-center gap-3 bg-[#0b0f19]/30 rounded-2xl border border-[#1f293d] border-dashed">
                <Coins className="w-8 h-8 text-gray-600" />
                <div>
                  <h4 className="font-bold text-white text-sm">No Milestones Declared</h4>
                  <p className="text-xs text-gray-400 max-w-sm mt-1 mx-auto">
                    {isClient 
                      ? 'Create milestones to distribute the project budget among distinct deliverable phases.' 
                      : 'Waiting for client to create milestones for the contract.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {project.milestones.map((milestone, idx) => {
                  let badgeText = 'Awaiting Approval';
                  let badgeClass = 'bg-gray-500/10 text-gray-400 border-gray-500/20';

                  if (milestone.released) {
                    badgeText = 'Paid Out';
                    badgeClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                  } else if (milestone.disputed) {
                    badgeText = 'In Dispute';
                    badgeClass = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
                  } else if (milestone.approved) {
                    badgeText = 'Approved';
                    badgeClass = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
                  }

                  return (
                    <div 
                      key={idx} 
                      className={`p-4 bg-[#0c1122] rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        milestone.disputed 
                          ? 'border-rose-500/30 shadow-lg shadow-rose-500/5 animate-pulse-slow' 
                          : milestone.released 
                          ? 'border-emerald-500/20' 
                          : 'border-[#1f293d]'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-500 font-bold">Phase {idx + 1}</span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badgeClass}`}>
                            {badgeText}
                          </span>
                        </div>
                        <h4 className="font-semibold text-white text-sm mt-1">{milestone.description}</h4>
                        <span className="text-[11px] font-semibold text-brand-400 block mt-1.5 font-mono">{milestone.amount} XLM</span>
                      </div>

                      {/* Action Triggers */}
                      <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                        {/* Milestone: Dispute Trigger */}
                        {project.isDeposited && !milestone.released && !milestone.disputed && (isClient || isFreelancer) && (
                          <button
                            onClick={() => handleRaiseDispute(idx)}
                            className="p-2 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-400 hover:bg-rose-500/20 text-xs font-semibold transition-all"
                            title="Raise dispute on this phase"
                          >
                            <AlertTriangle className="w-4.5 h-4.5" />
                          </button>
                        )}

                        {/* Dispute Resolutions (Admin) */}
                        {milestone.disputed && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleResolveDispute(idx, true)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white text-xs font-semibold transition-all"
                              title="Resolve: Release to Freelancer"
                            >
                              <Scale className="w-3.5 h-3.5" />
                              Pay Freelancer
                            </button>
                            <button
                              onClick={() => handleResolveDispute(idx, false)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white text-xs font-semibold transition-all"
                              title="Resolve: Refund to Client"
                            >
                              <ArrowLeft className="w-3.5 h-3.5" />
                              Refund Client
                            </button>
                          </div>
                        )}

                        {/* Client Actions: Approve */}
                        {project.isDeposited && !milestone.approved && !milestone.released && !milestone.disputed && isClient && (
                          <button
                            onClick={() => handleApproveMilestone(idx)}
                            className="inline-flex items-center gap-1.5 px-4.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-white text-xs font-semibold transition-all shadow-md shadow-amber-500/10"
                          >
                            <FileCheck className="w-4 h-4" />
                            Approve
                          </button>
                        )}

                        {/* Release Payment: Active for client, or active for freelancer if approved */}
                        {project.isDeposited && !milestone.released && !milestone.disputed && (
                          // Can be released by client directly, or by freelancer if approved
                          (isClient || (isFreelancer && milestone.approved)) && (
                            <button
                              onClick={() => handleReleasePayment(idx)}
                              className="inline-flex items-center gap-1.5 px-4.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-semibold transition-all shadow-md shadow-emerald-500/10"
                            >
                              <Check className="w-4 h-4" />
                              Release Payout
                            </button>
                          )
                        )}

                        {/* Completed Milestone (Lock Icon) */}
                        {milestone.released && (
                          <div className="w-8 h-8 rounded-full bg-emerald-500/5 flex items-center justify-center border border-emerald-500/10 text-emerald-400">
                            <Lock className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Create Milestone */}
      {isAddingMilestone && (
        <div className="fixed inset-0 bg-[#000000bd] backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#0e1428] border border-[#1f293d] w-full max-w-md rounded-3xl p-6 relative">
            <h3 className="font-bold text-lg text-white mb-1">Create Project Milestone</h3>
            <p className="text-xs text-gray-400 mb-5">Specify the milestone deliverable details and funds allocation.</p>

            <form onSubmit={handleCreateMilestone} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Design homepage layout"
                  value={mDesc}
                  onChange={(e) => setMDesc(e.target.value)}
                  className="bg-[#0b0f19] border border-[#1f293d] focus:border-brand-500/40 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition-all"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Amount (XLM)</label>
                <input
                  type="text"
                  placeholder="e.g. 150"
                  value={mAmount}
                  onChange={(e) => setMAmount(e.target.value)}
                  className="bg-[#0b0f19] border border-[#1f293d] focus:border-brand-500/40 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition-all"
                  required
                />
              </div>

              <div className="pt-4 flex gap-3 justify-end border-t border-[#1f293d]">
                <button
                  type="button"
                  onClick={() => setIsAddingMilestone(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#1f293d] text-gray-300 text-xs font-semibold hover:bg-gray-800/30 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingMilestone}
                  className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-white text-xs font-semibold disabled:opacity-50 transition-all"
                >
                  {isSubmittingMilestone ? 'Creating...' : 'Create Milestone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
