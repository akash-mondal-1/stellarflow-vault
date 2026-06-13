import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  FolderPlus, 
  ShieldCheck, 
  Activity, 
  Wallet, 
  LogOut, 
  AlertCircle, 
  CheckCircle2, 
  Menu, 
  X,
  Sparkles
} from 'lucide-react';
import stellarFlowService from './services/stellar';
import Dashboard from './pages/Dashboard';
import CreateProject from './pages/CreateProject';
import ProjectDetails from './pages/ProjectDetails';
import ReputationPage from './pages/Reputation';
import ActivityFeed from './pages/ActivityFeed';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'create-project' | 'project-details' | 'reputation' | 'activity-feed'>('dashboard');
  const [selectedProjectAddress, setSelectedProjectAddress] = useState<string | null>(null);
  const [userAddress, setUserAddress] = useState<string | null>(stellarFlowService.getUserWallet());
  const [isMockMode, setIsMockMode] = useState<boolean>(stellarFlowService.getMockMode());
  const [isConnecting, setIsConnecting] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Initial load
    setUserAddress(stellarFlowService.getUserWallet());
  }, []);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  const handleConnectWallet = async (walletName: string) => {
    setIsConnecting(true);
    setShowWalletModal(false);
    try {
      const address = await stellarFlowService.connectWallet(walletName);
      setUserAddress(address);
      showToast(`Wallet connected successfully: ${address.substring(0, 8)}...`, 'success');
    } catch (e) {
      showToast('Failed to connect wallet. Using Mock Mode fallback.', 'error');
      // Fallback
      stellarFlowService.setMockMode(true);
      setIsMockMode(true);
      const address = await stellarFlowService.connectWallet();
      setUserAddress(address);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    stellarFlowService.disconnect();
    setUserAddress(null);
    showToast('Wallet disconnected', 'info');
  };

  const handleToggleMockMode = (checked: boolean) => {
    stellarFlowService.setMockMode(checked);
    setIsMockMode(checked);
    showToast(
      checked 
        ? 'Switched to Sandbox (Local Storage Mock)' 
        : 'Switched to Stellar Testnet (Requires Freighter/Albedo)', 
      'info'
    );
    // Refresh connection address
    if (checked) {
      stellarFlowService.connectWallet().then(setUserAddress);
    } else {
      setUserAddress(stellarFlowService.getUserWallet());
    }
  };

  const navigateToProject = (address: string) => {
    setSelectedProjectAddress(address);
    setCurrentPage('project-details');
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-[#f3f4f6] flex flex-col md:flex-row font-sans">
      {/* Toast Notifications */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`p-4 rounded-xl shadow-2xl flex items-start gap-3 border backdrop-blur-xl transition-all duration-300 animate-slide-in ${
              toast.type === 'success'
                ? 'bg-[#10b98115] border-[#10b98140] text-emerald-400'
                : toast.type === 'error'
                ? 'bg-[#ef444415] border-[#ef444440] text-rose-400'
                : 'bg-[#3b82f615] border-[#3b82f640] text-blue-400'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            )}
            <div className="text-sm font-medium">{toast.message}</div>
          </div>
        ))}
      </div>

      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-[#0d1326] border-r border-[#1f293d] p-6 flex-shrink-0">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-brand-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-white leading-tight">StellarFlow</h1>
            <span className="text-xs text-brand-400 font-semibold tracking-wider uppercase">Vault</span>
          </div>
        </div>

        <nav className="flex-1 flex flex-col gap-1.5">
          <button
            onClick={() => { setCurrentPage('dashboard'); setSelectedProjectAddress(null); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              currentPage === 'dashboard'
                ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/20'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </button>
          <button
            onClick={() => setCurrentPage('create-project')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              currentPage === 'create-project'
                ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/20'
            }`}
          >
            <FolderPlus className="w-5 h-5" />
            Create Project
          </button>
          <button
            onClick={() => setCurrentPage('reputation')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              currentPage === 'reputation'
                ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/20'
            }`}
          >
            <ShieldCheck className="w-5 h-5" />
            Reputation Score
          </button>
          <button
            onClick={() => setCurrentPage('activity-feed')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              currentPage === 'activity-feed'
                ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/20'
            }`}
          >
            <Activity className="w-5 h-5" />
            Activity Feed
          </button>
        </nav>

        {/* Mock Mode Settings in Sidebar */}
        <div className="mt-auto border-t border-[#1f293d] pt-6 flex flex-col gap-4">
          <div className="bg-[#121930] rounded-2xl p-4 border border-[#1f293d]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Sandbox Mode</span>
              <span className={`w-2.5 h-2.5 rounded-full ${isMockMode ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'}`} />
            </div>
            <p className="text-[11px] text-gray-500 mb-3 leading-relaxed">
              {isMockMode ? 'Simulating transactions via Local Storage.' : 'Interacting with Stellar Testnet blockchain.'}
            </p>
            <label className="relative flex items-center justify-between cursor-pointer">
              <input
                type="checkbox"
                checked={isMockMode}
                onChange={(e) => handleToggleMockMode(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              <span className="text-xs font-medium text-gray-300">Active</span>
            </label>
          </div>
        </div>
      </aside>

      {/* Header - Mobile */}
      <header className="md:hidden bg-[#0d1326] border-b border-[#1f293d] p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <h1 className="font-bold text-white leading-tight">StellarFlow</h1>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-gray-400 hover:text-white"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#0d1326] border-b border-[#1f293d] p-4 flex flex-col gap-2 transition-all">
          <button
            onClick={() => { setCurrentPage('dashboard'); setSelectedProjectAddress(null); setIsMobileMenuOpen(false); }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-300 hover:bg-gray-800/30"
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </button>
          <button
            onClick={() => { setCurrentPage('create-project'); setIsMobileMenuOpen(false); }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-300 hover:bg-gray-800/30"
          >
            <FolderPlus className="w-5 h-5" />
            Create Project
          </button>
          <button
            onClick={() => { setCurrentPage('reputation'); setIsMobileMenuOpen(false); }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-300 hover:bg-gray-800/30"
          >
            <ShieldCheck className="w-5 h-5" />
            Reputation Score
          </button>
          <button
            onClick={() => { setCurrentPage('activity-feed'); setIsMobileMenuOpen(false); }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-300 hover:bg-gray-800/30"
          >
            <Activity className="w-5 h-5" />
            Activity Feed
          </button>
          <div className="border-t border-[#1f293d] pt-4 mt-2">
            <div className="flex items-center justify-between px-4">
              <span className="text-xs text-gray-400">Sandbox Mode</span>
              <label className="relative flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isMockMode}
                  onChange={(e) => { handleToggleMockMode(e.target.checked); setIsMobileMenuOpen(false); }}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#0b0f19]">
        {/* Top Navbar */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 bg-[#0b0f19] border-b border-[#1f293d] sticky top-0 z-10 backdrop-blur-xl bg-opacity-70">
          <div>
            <h2 className="font-semibold text-white capitalize text-lg">
              {currentPage.replace('-', ' ')}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {userAddress ? (
              <div className="flex items-center gap-3 bg-[#11172a] border border-[#1f293d] pl-4 pr-1 py-1 rounded-2xl">
                <div className="flex flex-col pr-1">
                  <span className="text-xs font-semibold text-gray-300">Connected</span>
                  <span className="text-[10px] text-gray-500 font-mono">
                    {userAddress.substring(0, 6)}...{userAddress.substring(userAddress.length - 4)}
                  </span>
                </div>
                <button
                  onClick={handleDisconnect}
                  className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/30 transition-all"
                  title="Disconnect wallet"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowWalletModal(true)}
                disabled={isConnecting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-500 text-white font-semibold text-sm hover:from-brand-500 hover:to-indigo-400 shadow-md shadow-brand-500/10 transition-all hover:scale-[1.02]"
              >
                <Wallet className="w-4 h-4" />
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </button>
            )}
          </div>
        </header>

        {/* Mobile Top Navbar Header elements */}
        <div className="md:hidden flex items-center justify-between p-4 bg-[#0f152b] border-b border-[#1f293d]">
          <span className="text-sm font-semibold capitalize text-gray-300">
            {currentPage.replace('-', ' ')}
          </span>
          {userAddress ? (
            <div className="text-xs font-mono bg-[#1b233d] px-3 py-1.5 rounded-xl text-brand-400">
              {userAddress.substring(0, 6)}...{userAddress.substring(userAddress.length - 4)}
            </div>
          ) : (
            <button
              onClick={() => setShowWalletModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600 text-white font-semibold text-xs"
            >
              <Wallet className="w-3.5 h-3.5" />
              Connect
            </button>
          )}
        </div>

        {/* Page Render Controller */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto">
          {currentPage === 'dashboard' && (
            <Dashboard navigateToProject={navigateToProject} showToast={showToast} />
          )}
          {currentPage === 'create-project' && (
            <CreateProject navigateToDashboard={() => setCurrentPage('dashboard')} showToast={showToast} />
          )}
          {currentPage === 'project-details' && selectedProjectAddress && (
            <ProjectDetails 
              projectAddress={selectedProjectAddress} 
              userAddress={userAddress}
              navigateToDashboard={() => { setCurrentPage('dashboard'); setSelectedProjectAddress(null); }} 
              showToast={showToast}
            />
          )}
          {currentPage === 'reputation' && (
            <ReputationPage userAddress={userAddress} />
          )}
          {currentPage === 'activity-feed' && (
            <ActivityFeed />
          )}
        </div>
      </main>

      {/* Wallet Selector Modal */}
      {showWalletModal && (
        <div className="fixed inset-0 bg-[#000000bd] backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#0e1428] border border-[#1f293d] w-full max-w-md rounded-3xl p-6 relative animate-scale-up">
            <button
              onClick={() => setShowWalletModal(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-xl hover:bg-gray-800/30"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-bold text-lg text-white mb-1">Select Stellar Wallet</h3>
            <p className="text-xs text-gray-400 mb-6">Choose your wallet module to interface with Soroban contracts.</p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => handleConnectWallet('Freighter')}
                className="flex items-center justify-between p-4 rounded-2xl bg-[#141b35] hover:bg-[#1a2345] border border-[#1f293d] hover:border-brand-500/30 text-left transition-all"
              >
                <div>
                  <h4 className="font-semibold text-white text-sm">Freighter Wallet</h4>
                  <p className="text-xs text-gray-400 mt-0.5">Stellar official browser extension wallet.</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-brand-500/10 flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-brand-400" />
                </div>
              </button>

              <button
                onClick={() => handleConnectWallet('Albedo')}
                className="flex items-center justify-between p-4 rounded-2xl bg-[#141b35] hover:bg-[#1a2345] border border-[#1f293d] hover:border-brand-500/30 text-left transition-all"
              >
                <div>
                  <h4 className="font-semibold text-white text-sm">Albedo Link</h4>
                  <p className="text-xs text-gray-400 mt-0.5">Secure web-based Stellar client wallet.</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-brand-500/10 flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-brand-400" />
                </div>
              </button>

              <button
                onClick={() => handleConnectWallet('xBull')}
                className="flex items-center justify-between p-4 rounded-2xl bg-[#141b35] hover:bg-[#1a2345] border border-[#1f293d] hover:border-brand-500/30 text-left transition-all"
              >
                <div>
                  <h4 className="font-semibold text-white text-sm">xBull Wallet</h4>
                  <p className="text-xs text-gray-400 mt-0.5">Advanced developer-focused wallet.</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-brand-500/10 flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-brand-400" />
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
