import { useState, useEffect } from 'react';
import { Star, Award, Layers, Zap } from 'lucide-react';
import stellarFlowService from '../services/stellar';
import type { UserReputation } from '../services/stellar';

interface ReputationProps {
  userAddress: string | null;
}

export default function ReputationPage({ userAddress }: ReputationProps) {
  const [reputation, setReputation] = useState<UserReputation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadReputation() {
      setIsLoading(true);
      try {
        // Query reputation for connected wallet, or fallback to mock freelancer
        const activeWallet = userAddress || 'GBFREELANCER12345678901234567890123456789012345678901';
        const data = await stellarFlowService.getUserReputation(activeWallet);
        setReputation(data);
      } catch (e) {
        console.error('Error fetching reputation:', e);
      } finally {
        setIsLoading(false);
      }
    }
    loadReputation();
  }, [userAddress]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-6 w-32 bg-gray-700 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 h-80 bg-[#121930] rounded-3xl" />
          <div className="md:col-span-2 h-80 bg-[#121930] rounded-3xl" />
        </div>
      </div>
    );
  }

  const score = reputation ? reputation.score : 500;
  const stars = (score / 100).toFixed(1);
  const completed = reputation ? reputation.completedProjects : 0;
  const ratingCount = reputation ? reputation.ratingCount : 0;

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      {/* Header Summary */}
      <div className="bg-[#121930] border border-[#1f293d] rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center gap-8">
        {/* Score Ring / Graphic */}
        <div className="relative flex items-center justify-center w-36 h-36 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-500 shadow-xl shadow-brand-500/10 flex-shrink-0">
          <div className="absolute inset-1.5 bg-[#0e1428] rounded-full flex flex-col items-center justify-center">
            <span className="text-3xl font-extrabold text-white font-mono">{stars}</span>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Stars</span>
          </div>
        </div>

        {/* Text summaries */}
        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center gap-2 mb-2 justify-center md:justify-start">
            <h3 className="font-bold text-white text-xl">Decentralized Profile</h3>
            <span className="text-[10px] text-emerald-400 font-bold tracking-wider uppercase bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              Verified Soroban Score
            </span>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed max-w-lg">
            This reputation profile is securely stored on the Stellar blockchain. Reputation increases automatically 
            when escrow milestones are paid out upon successful project completion.
          </p>
          
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 mt-5">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-brand-400" />
              <div>
                <span className="text-[10px] text-gray-500 font-semibold block uppercase">Completed Projects</span>
                <span className="text-sm font-bold text-white font-mono">{completed}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              <div>
                <span className="text-[10px] text-gray-500 font-semibold block uppercase">Rating Count</span>
                <span className="text-sm font-bold text-white font-mono">{ratingCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid split details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Rating Breakdown card */}
        <div className="bg-[#121930] border border-[#1f293d] rounded-3xl p-6 md:col-span-1 flex flex-col gap-5">
          <h4 className="font-bold text-white text-sm">Rating Details</h4>

          <div className="flex flex-col gap-3">
            {/* Visual breakdown lines */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-xs font-semibold text-gray-400">
                <span>5 stars</span>
                <span className="font-mono">{ratingCount}</span>
              </div>
              <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-2 rounded-full" style={{ width: ratingCount > 0 ? '100%' : '0%' }} />
              </div>
            </div>
            
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-xs font-semibold text-gray-450">
                <span>4 stars</span>
                <span className="font-mono">0</span>
              </div>
              <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-2 rounded-full" style={{ width: '0%' }} />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-xs font-semibold text-gray-450">
                <span>3 stars</span>
                <span className="font-mono">0</span>
              </div>
              <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-2 rounded-full" style={{ width: '0%' }} />
              </div>
            </div>
          </div>

          <div className="bg-[#0b0f19] p-4 rounded-2xl border border-[#1f293d] mt-2 flex flex-col gap-1 items-center justify-center text-center">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Average Rating</span>
            <div className="flex items-center gap-1.5 mt-1">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              <span className="text-lg font-bold text-white font-mono">{stars}</span>
            </div>
          </div>
        </div>

        {/* Explain cross-contract card */}
        <div className="bg-[#121930] border border-[#1f293d] rounded-3xl p-6 md:col-span-2 flex flex-col gap-4">
          <h4 className="font-bold text-white text-sm flex items-center gap-2">
            <Zap className="w-4.5 h-4.5 text-brand-400" />
            Soroban Cross-Contract Architecture
          </h4>

          <div className="flex flex-col gap-3.5 text-xs leading-relaxed text-gray-400">
            <p>
              StellarFlow Vault leverages a decentralized Reputation system designed on-chain. This avoids rating 
              manipulation by establishing explicit inter-contract communication rules:
            </p>

            <div className="flex flex-col gap-2.5">
              <div className="flex items-start gap-3 p-3 bg-[#0b0f19] border border-[#1f293d] rounded-2xl">
                <div className="w-6 h-6 rounded-lg bg-brand-500/10 flex items-center justify-center text-brand-400 text-xs font-bold font-mono">1</div>
                <div>
                  <h5 className="font-bold text-white mb-0.5">Dynamic Whitelisting</h5>
                  <p className="text-[11px] text-gray-400">
                    When the **Factory Contract** deploys an Escrow contract, it automatically calls the **Reputation Contract** to whitelist the new project address.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-[#0b0f19] border border-[#1f293d] rounded-2xl">
                <div className="w-6 h-6 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 text-xs font-bold font-mono">2</div>
                <div>
                  <h5 className="font-bold text-white mb-0.5">Automatic Progression Updates</h5>
                  <p className="text-[11px] text-gray-400">
                    When the final milestone in the **Escrow Contract** is released, it triggers an on-chain invocation directly to the **Reputation Contract** to update the freelancer's stats.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-[#0b0f19] border border-[#1f293d] rounded-2xl">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 text-xs font-bold font-mono">3</div>
                <div>
                  <h5 className="font-bold text-white mb-0.5">Secure Caller Verification</h5>
                  <p className="text-[11px] text-gray-400">
                    The Reputation contract verifies that the calling address is indeed a whitelisted escrow contract, preventing unauthorized score updates.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
