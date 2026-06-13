import { useState, useEffect } from 'react';
import { Activity, Clock, Database, RefreshCw, Copy, Check } from 'lucide-react';
import stellarFlowService from '../services/stellar';
import type { ContractEvent } from '../services/stellar';

export default function ActivityFeed() {
  const [events, setEvents] = useState<ContractEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function loadEvents() {
    setIsRefreshing(true);
    try {
      const data = await stellarFlowService.getEvents();
      setEvents(data);
    } catch (e) {
      console.error('Error fetching events:', e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    loadEvents();
    // Poll every 8 seconds for new events
    const interval = setInterval(loadEvents, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getEventBadgeColor = (type: string) => {
    switch (type) {
      case 'ProjectCreated':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'FundsDeposited':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'MilestoneCreated':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'MilestoneApproved':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'PaymentReleased':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'DisputeRaised':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'DisputeResolved':
        return 'bg-teal-500/10 text-teal-400 border-teal-500/20';
      case 'ReputationUpdated':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-6 w-32 bg-gray-700 rounded-lg" />
        <div className="flex flex-col gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-[#121930] rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      {/* Header and refresh CTA */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-white text-base">On-Chain Events</h3>
          <p className="text-xs text-gray-400 mt-1">Real-time Soroban event log from StellarFlow Vault smart contracts.</p>
        </div>

        <button
          onClick={loadEvents}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#1f293d] hover:bg-gray-800/30 text-gray-450 hover:text-white text-xs font-semibold transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Events Stream List */}
      {events.length === 0 ? (
        <div className="p-16 flex flex-col items-center justify-center text-center gap-4 bg-[#121930] rounded-3xl border border-[#1f293d]">
          <div className="w-14 h-14 rounded-full bg-[#0b0f19] flex items-center justify-center border border-[#1f293d]">
            <Activity className="w-7 h-7 text-gray-600" />
          </div>
          <div>
            <h4 className="font-bold text-white text-sm">No Events Recorded</h4>
            <p className="text-xs text-gray-400 max-w-xs mt-1 mx-auto">
              Event triggers will stream dynamically once transactions start completing on-chain.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {events.map((event) => (
            <div
              key={event.id}
              className="bg-[#121930] p-4.5 rounded-2xl border border-[#1f293d] flex flex-col sm:flex-row sm:items-start justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#0b0f19] border border-[#1f293d] flex items-center justify-center flex-shrink-0 text-gray-400">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getEventBadgeColor(event.type)}`}>
                      {event.type}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] text-gray-500">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 font-medium mt-2 leading-relaxed">
                    {event.data}
                  </p>
                </div>
              </div>

              {/* Source Contract copy trigger */}
              <div className="flex items-center gap-2 self-end sm:self-start bg-[#0b0f19] pl-3 pr-1 py-1 rounded-xl border border-[#1f293d]">
                <span className="text-[10px] text-gray-500 font-mono">
                  {event.contractAddress.substring(0, 8)}...{event.contractAddress.substring(event.contractAddress.length - 6)}
                </span>
                <button
                  onClick={() => handleCopy(event.contractAddress, event.id)}
                  className="p-1.5 text-gray-500 hover:text-white rounded-lg hover:bg-gray-800/40"
                  title="Copy contract address"
                >
                  {copiedId === event.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
