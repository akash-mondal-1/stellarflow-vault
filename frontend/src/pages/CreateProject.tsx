import React, { useState, useEffect } from 'react';
import { FolderPlus, ArrowLeft, Loader2 } from 'lucide-react';
import stellarFlowService from '../services/stellar';

interface CreateProjectProps {
  navigateToDashboard: () => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export default function CreateProject({ navigateToDashboard, showToast }: CreateProjectProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [freelancer, setFreelancer] = useState('');
  const [client, setClient] = useState('');
  const [budget, setBudget] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Prefill client address with connected wallet key if available
    const connectedWallet = stellarFlowService.getUserWallet();
    if (connectedWallet) {
      setClient(connectedWallet);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !description || !freelancer || !budget || !client) {
      showToast('Please fill out all fields', 'error');
      return;
    }

    if (isNaN(Number(budget)) || Number(budget) <= 0) {
      showToast('Budget must be a positive number', 'error');
      return;
    }

    // Validate Stellar addresses roughly
    if (!client.startsWith('G') || client.length !== 56) {
      showToast('Invalid Client Stellar public key', 'error');
      return;
    }
    if (!freelancer.startsWith('G') || freelancer.length !== 56) {
      showToast('Invalid Freelancer Stellar public key', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const projectAddress = await stellarFlowService.createProject(
        name,
        description,
        freelancer,
        budget
      );
      showToast(`Escrow contract deployed successfully: ${projectAddress.substring(0, 10)}...`, 'success');
      navigateToDashboard();
    } catch (err) {
      showToast('Deployment transaction failed.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back link */}
      <button
        onClick={navigateToDashboard}
        className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white mb-6 transition-all"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </button>

      {/* Main card */}
      <div className="bg-[#121930] rounded-3xl border border-[#1f293d] p-6 sm:p-8">
        <div className="flex items-center gap-3.5 mb-6">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-400">
            <FolderPlus className="w-5.5 h-5.5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">New Escrow Project</h3>
            <p className="text-xs text-gray-400 mt-0.5">Deploy a milestone contract templates template on Soroban.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5.5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Project Name</label>
            <input
              type="text"
              placeholder="e.g. Website Redesign"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-[#0b0f19] border border-[#1f293d] focus:border-brand-500/40 rounded-2xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition-all"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Description</label>
            <textarea
              placeholder="Detail the scope of work and conditions for payment releases."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="bg-[#0b0f19] border border-[#1f293d] focus:border-brand-500/40 rounded-2xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition-all resize-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Client Public Address</label>
              <input
                type="text"
                placeholder="G..."
                value={client}
                onChange={(e) => setClient(e.target.value)}
                className="bg-[#0b0f19] border border-[#1f293d] focus:border-brand-500/40 rounded-2xl px-4 py-3 text-xs font-mono text-gray-300 placeholder-gray-500 outline-none transition-all"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Freelancer Public Address</label>
              <input
                type="text"
                placeholder="G..."
                value={freelancer}
                onChange={(e) => setFreelancer(e.target.value)}
                className="bg-[#0b0f19] border border-[#1f293d] focus:border-brand-500/40 rounded-2xl px-4 py-3 text-xs font-mono text-gray-300 placeholder-gray-500 outline-none transition-all"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Total Project Budget (XLM)</label>
            <input
              type="text"
              placeholder="e.g. 500"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="bg-[#0b0f19] border border-[#1f293d] focus:border-brand-500/40 rounded-2xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition-all"
              required
            />
          </div>

          <div className="pt-4 border-t border-[#1f293d] flex gap-3 justify-end">
            <button
              type="button"
              onClick={navigateToDashboard}
              className="px-5 py-3 rounded-2xl border border-[#1f293d] text-gray-300 text-sm font-semibold hover:bg-gray-800/30 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-500 text-white font-semibold text-sm hover:from-brand-500 hover:to-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Deploying contract...
                </>
              ) : (
                'Deploy Escrow Contract'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
