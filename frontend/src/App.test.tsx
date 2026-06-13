import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import App from './App';

// Mock canvas-confetti to prevent issues in JSDOM
vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

// Mock the stellar service layer to prevent wallets-kit and freighter-api import issues in Node/JSDOM
vi.mock('./services/stellar', () => {
  const mockService = {
    getUserWallet: () => 'GCLIENT4567890123456789012345678901234567890123456789012',
    getMockMode: () => true,
    setMockMode: vi.fn(),
    connectWallet: vi.fn().mockResolvedValue('GCLIENT4567890123456789012345678901234567890123456789012'),
    disconnect: vi.fn(),
    getUserReputation: vi.fn().mockResolvedValue({
      address: 'GCLIENT4567890123456789012345678901234567890123456789012',
      completedProjects: 2,
      ratingCount: 2,
      score: 480,
    }),
    listProjects: vi.fn().mockResolvedValue([
      {
        address: 'CDPROJECT111111111111111111111111111111111111111111111111',
        name: 'Mock Project',
        description: 'Mock Description',
        client: 'GCLIENT4567890123456789012345678901234567890123456789012',
        freelancer: 'GBFREELANCER12345678901234567890123456789012345678901',
        token: 'CDLZFC3SYJADOXCSSO2ZBQXA3CD4CQW4G2L2VGW2T23D6MWOCT7OD6JH',
        totalBudget: '500',
        balance: '500',
        isDeposited: true,
        isCompleted: false,
        milestones: [],
      }
    ]),
    getProjectDetails: vi.fn().mockResolvedValue({
      address: 'CDPROJECT111111111111111111111111111111111111111111111111',
      name: 'Mock Project',
      description: 'Mock Description',
      client: 'GCLIENT4567890123456789012345678901234567890123456789012',
      freelancer: 'GBFREELANCER12345678901234567890123456789012345678901',
      token: 'CDLZFC3SYJADOXCSSO2ZBQXA3CD4CQW4G2L2VGW2T23D6MWOCT7OD6JH',
      totalBudget: '500',
      balance: '500',
      isDeposited: true,
      isCompleted: false,
      milestones: [],
    }),
    getEvents: vi.fn().mockResolvedValue([]),
  };

  return {
    default: mockService,
    stellarFlowService: mockService,
    DEFAULT_TOKEN_ADDRESS: 'CDLZFC3SYJADOXCSSO2ZBQXA3CD4CQW4G2L2VGW2T23D6MWOCT7OD6JH',
    DEFAULT_FACTORY_ADDRESS: 'CDFACTORY123456789012345678901234567890123456789012345678',
    DEFAULT_REPUTATION_ADDRESS: 'CDREPUTATION12345678901234567890123456789012345678901234',
    NETWORK_PASSPHRASE: 'Test SDF Network ; September 2015',
    RPC_URL: 'https://soroban-testnet.stellar.org',
  };
});

describe('StellarFlow Vault Frontend Tests', () => {
  test('renders Dashboard by default and displays metrics', async () => {
    render(<App />);
    
    // Check main title / branding is visible
    expect(screen.getAllByText(/StellarFlow/i)[0]).toBeInTheDocument();
    
    // Check side navigation dashboard active state
    expect(screen.getByRole('button', { name: /Dashboard/i })).toBeInTheDocument();

    // Check dashboard metric labels are rendered
    await waitFor(() => {
      expect(screen.getByText(/Total Projects/i)).toBeInTheDocument();
      expect(screen.getByText(/Active Escrows/i)).toBeInTheDocument();
      expect(screen.getByText(/Completed Paid/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Reputation Score/i)[0]).toBeInTheDocument();
    });
  });

  test('wallet connection modal triggers on clicking connect button', async () => {
    render(<App />);
    
    // Find the connect button in topbar
    // It should render "Connected" since the mock returns GCLIENT... for userAddress
    const connectedLabel = screen.getByText(/Connected/i);
    expect(connectedLabel).toBeInTheDocument();
  });

  test('renders Create Project page and inputs', async () => {
    render(<App />);
    
    // Click "Create Project" sidebar nav
    const createProjectBtn = screen.getByRole('button', { name: /Create Project/i });
    fireEvent.click(createProjectBtn);

    // Check page heading
    expect(screen.getByText(/New Escrow Project/i)).toBeInTheDocument();
    
    // Check form labels are present
    expect(screen.getByText(/Project Name/i)).toBeInTheDocument();
    expect(screen.getByText(/Description/i)).toBeInTheDocument();
    expect(screen.getByText(/Client Public Address/i)).toBeInTheDocument();
    expect(screen.getByText(/Freelancer Public Address/i)).toBeInTheDocument();
    expect(screen.getByText(/Total Project Budget/i)).toBeInTheDocument();
  });
});
