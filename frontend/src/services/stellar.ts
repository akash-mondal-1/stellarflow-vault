import { StellarWalletsKit, Networks } from '@creit.tech/stellar-wallets-kit';
import { defaultModules } from '@creit.tech/stellar-wallets-kit/modules/utils';
import * as StellarSdk from '@stellar/stellar-sdk';

// Default Testnet Configurations
export const NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015';
export const RPC_URL = 'https://soroban-testnet.stellar.org';

// Default Contract Addresses (to be updated on deployment)
export const DEFAULT_FACTORY_ADDRESS = 'CATSAMXGYG55ZGYBAEFBQYFL6SSTGU2AZ4M7UXGB4SGWN4CSE24VRRHA';
export const DEFAULT_REPUTATION_ADDRESS = 'CD3GUCIRBR3QB4HWFJR6R5FJDZBVZWDW2ZJMRRY5HYY4YV2PYPYAHRT4';
export const DEFAULT_TOKEN_ADDRESS = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC'; // XLM SAC on Testnet

// Initializing Wallet Kit
StellarWalletsKit.init({
  network: Networks.TESTNET,
  modules: defaultModules(),
});

// RPC Server Client
export const rpcServer = new StellarSdk.rpc.Server(RPC_URL);

export interface Milestone {
  description: string;
  amount: string; // in XLM/Tokens
  approved: boolean;
  released: boolean;
  disputed: boolean;
}

export interface ProjectDetails {
  address: string;
  name: string;
  description: string;
  client: string;
  freelancer: string;
  token: string;
  totalBudget: string;
  balance: string;
  isDeposited: boolean;
  isCompleted: boolean;
  milestones: Milestone[];
}

export interface UserReputation {
  address: string;
  completedProjects: number;
  ratingCount: number;
  score: number; // out of 500
}

export interface ContractEvent {
  id: string;
  type: string;
  contractAddress: string;
  timestamp: string;
  data: string;
}

// ---------------------------------------------------------
// LOCAL STORAGE MOCK DATA STORE (For local demo fallback)
// ---------------------------------------------------------

const MOCK_STORAGE_KEY = 'stellarflow_vault_mock_store_v1';

interface MockStore {
  projects: ProjectDetails[];
  reputations: Record<string, UserReputation>;
  events: ContractEvent[];
}

const INITIAL_MOCK_STORE: MockStore = {
  projects: [
    {
      address: 'CDPROJECT111111111111111111111111111111111111111111111111',
      name: 'Soroban Smart Contract Audit',
      description: 'Perform a comprehensive security audit on StellarFlow Vault contracts.',
      client: 'GCLIENT4567890123456789012345678901234567890123456789012',
      freelancer: 'GBFREELANCER12345678901234567890123456789012345678901',
      token: DEFAULT_TOKEN_ADDRESS,
      totalBudget: '500',
      balance: '500',
      isDeposited: true,
      isCompleted: false,
      milestones: [
        { description: 'Initial Draft & Vulnerability Scan', amount: '200', approved: true, released: true, disputed: false },
        { description: 'Exploitation Analysis & Mitigation Review', amount: '150', approved: true, released: false, disputed: false },
        { description: 'Final Report & Retest Signoff', amount: '150', approved: false, released: false, disputed: false },
      ],
    },
    {
      address: 'CDPROJECT222222222222222222222222222222222222222222222222',
      name: 'Stellar dApp UI Dashboard Development',
      description: 'Build premium React dashboard components and integrate Freighter wallet.',
      client: 'GCLIENT4567890123456789012345678901234567890123456789012',
      freelancer: 'GBFREELANCER12345678901234567890123456789012345678901',
      token: DEFAULT_TOKEN_ADDRESS,
      totalBudget: '300',
      balance: '0',
      isDeposited: true,
      isCompleted: true,
      milestones: [
        { description: 'Figma Mockup Signoff', amount: '100', approved: true, released: true, disputed: false },
        { description: 'Vite React Scaffolding & Setup', amount: '100', approved: true, released: true, disputed: false },
        { description: 'Wallet Integration & Event Streaming Feed', amount: '100', approved: true, released: true, disputed: false },
      ],
    },
  ],
  reputations: {
    'GBFREELANCER12345678901234567890123456789012345678901': {
      address: 'GBFREELANCER12345678901234567890123456789012345678901',
      completedProjects: 4,
      ratingCount: 4,
      score: 480, // 4.8 stars
    },
  },
  events: [
    {
      id: 'e1',
      type: 'ProjectCreated',
      contractAddress: DEFAULT_FACTORY_ADDRESS,
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
      data: 'Project: Stellar dApp UI Dashboard Development | Budget: 300 XLM | Freelancer: GBFREELANCER1234...',
    },
    {
      id: 'e2',
      type: 'FundsDeposited',
      contractAddress: 'CDPROJECT222222222222222222222222222222222222222222222222',
      timestamp: new Date(Date.now() - 3600000 * 1.9).toISOString(),
      data: 'Amount locked: 300 XLM by Client',
    },
    {
      id: 'e3',
      type: 'MilestoneCreated',
      contractAddress: 'CDPROJECT222222222222222222222222222222222222222222222222',
      timestamp: new Date(Date.now() - 3600000 * 1.8).toISOString(),
      data: 'Milestone: Figma Mockup Signoff created | Value: 100 XLM',
    },
    {
      id: 'e4',
      type: 'MilestoneApproved',
      contractAddress: 'CDPROJECT222222222222222222222222222222222222222222222222',
      timestamp: new Date(Date.now() - 3600000 * 1.5).toISOString(),
      data: 'Milestone #0 approved by Client',
    },
    {
      id: 'e5',
      type: 'PaymentReleased',
      contractAddress: 'CDPROJECT222222222222222222222222222222222222222222222222',
      timestamp: new Date(Date.now() - 3600000 * 1.4).toISOString(),
      data: 'Milestone #0 payment: 100 XLM released to Freelancer',
    },
    {
      id: 'e6',
      type: 'ReputationUpdated',
      contractAddress: DEFAULT_REPUTATION_ADDRESS,
      timestamp: new Date(Date.now() - 300000).toISOString(),
      data: 'User reputation score updated for GBFREELANCER1234... New score: 4.80 stars',
    },
  ],
};

function getMockStore(): MockStore {
  const data = localStorage.getItem(MOCK_STORAGE_KEY);
  if (!data) {
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(INITIAL_MOCK_STORE));
    return INITIAL_MOCK_STORE;
  }
  return JSON.parse(data);
}

function saveMockStore(store: MockStore) {
  localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(store));
}

// ---------------------------------------------------------
// STELLARFLOW SERVICE LAYER (Bridges Mock & Real RPC modes)
// ---------------------------------------------------------

export class StellarFlowService {
  private isMockMode: boolean = true;
  private userPublicKey: string | null = null;

  constructor() {
    this.isMockMode = localStorage.getItem('stellarflow_mock_mode') !== 'false';
  }

  setMockMode(enable: boolean) {
    this.isMockMode = enable;
    localStorage.setItem('stellarflow_mock_mode', enable.toString());
  }

  getMockMode(): boolean {
    return this.isMockMode;
  }

  async connectWallet(walletName?: string): Promise<string> {
    if (this.isMockMode) {
      // Return a simulated developer wallet address
      this.userPublicKey = 'GCLIENT4567890123456789012345678901234567890123456789012';
      return this.userPublicKey;
    }

    try {
      if (walletName) {
        // Change selection
        StellarWalletsKit.setWallet(walletName);
      }
      const { address } = await StellarWalletsKit.getAddress();
      this.userPublicKey = address;
      return address;
    } catch (error) {
      console.error('Wallet connection error:', error);
      throw error;
    }
  }

  getUserWallet(): string | null {
    return this.userPublicKey;
  }

  disconnect() {
    this.userPublicKey = null;
  }

  // --- Contract Read APIs ---

  async getUserReputation(userAddress: string): Promise<UserReputation> {
    if (this.isMockMode) {
      const store = getMockStore();
      return store.reputations[userAddress] || {
        address: userAddress,
        completedProjects: 0,
        ratingCount: 0,
        score: 500, // default 5.0 stars
      };
    }

    try {
      // Query the Reputation contract on Testnet
      const contract = new StellarSdk.Contract(DEFAULT_REPUTATION_ADDRESS);
      // Simulate transaction to call read-only function
      const source = new StellarSdk.Account('GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF', '0');
      const tx = new StellarSdk.TransactionBuilder(source, {
        fee: '100',
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(contract.call('get_reputation', new StellarSdk.Address(userAddress).toScVal()))
        .setTimeout(30)
        .build();

      const sim = await rpcServer.simulateTransaction(tx);
      if (StellarSdk.rpc.Api.isSimulationSuccess(sim) && sim.result) {
        const resultVal = sim.result.retval;
        // Parse custom ReputationInfo struct returned by contract
        const scVal = resultVal as any;
        const map = scVal.map();

        let completed = 0;
        let ratingCount = 0;
        let score = 500;

        for (const item of map) {
          const key = item.key().sym();
          const val = item.val();
          if (key === 'completed_projects') completed = Number(val.u32());
          if (key === 'rating_count') ratingCount = Number(val.u32());
          if (key === 'reputation_score') score = Number(val.u32());
        }

        return { address: userAddress, completedProjects: completed, ratingCount, score };
      }
      throw new Error('Simulation failed');
    } catch (e) {
      console.warn('Real contract query failed, using mock fallback. Error:', e);
      // Fallback to mock logic in case of network issue
      const store = getMockStore();
      return store.reputations[userAddress] || {
        address: userAddress,
        completedProjects: 0,
        ratingCount: 0,
        score: 500,
      };
    }
  }

  async listProjects(): Promise<ProjectDetails[]> {
    if (this.isMockMode) {
      const store = getMockStore();
      return store.projects;
    }

    try {
      // Real RPC invocation to factory contract
      const contract = new StellarSdk.Contract(DEFAULT_FACTORY_ADDRESS);
      const source = new StellarSdk.Account('GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF', '0');
      const tx = new StellarSdk.TransactionBuilder(source, {
        fee: '100',
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(contract.call('list_projects'))
        .setTimeout(30)
        .build();

      const sim = await rpcServer.simulateTransaction(tx);
      if (StellarSdk.rpc.Api.isSimulationSuccess(sim) && sim.result) {
        const resultVal = sim.result.retval;
        const addressesVec = (resultVal as any).vec();
        const projects: ProjectDetails[] = [];

        for (const addrVal of addressesVec) {
          const projectAddress = addrVal.address().toString();
          const details = await this.getProjectDetails(projectAddress);
          projects.push(details);
        }

        return projects;
      }
      throw new Error('Simulation failed');
    } catch (e) {
      console.warn('Real listProjects failed, returning mock fallback. Error:', e);
      return getMockStore().projects;
    }
  }

  async getProjectDetails(projectAddress: string): Promise<ProjectDetails> {
    if (this.isMockMode) {
      const store = getMockStore();
      const p = store.projects.find((item) => item.address === projectAddress);
      if (!p) throw new Error('Project not found');
      return p;
    }

    try {
      // Query individual escrow details and milestones
      const contract = new StellarSdk.Contract(projectAddress);
      const source = new StellarSdk.Account('GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF', '0');
      const tx = new StellarSdk.TransactionBuilder(source, {
        fee: '100',
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(contract.call('get_details'))
        .addOperation(contract.call('get_milestones'))
        .setTimeout(30)
        .build();

      const sim = await rpcServer.simulateTransaction(tx);
      if (StellarSdk.rpc.Api.isSimulationSuccess(sim)) {
        // Parse results
        // In simulation, we check results from operations
        const results = (sim as any).results || [];
        const detailsVal = results[0]?.retval;
        const milestonesVal = results[1]?.retval;

        // Details mapping
        const detailsVec = (detailsVal as any).vec();
        const client = detailsVec.get(0).address().toString();
        const freelancer = detailsVec.get(1).address().toString();
        const token = detailsVec.get(2).address().toString();
        const totalBudget = detailsVec.get(3).i128().toString();
        const balance = detailsVec.get(4).i128().toString();
        const isDeposited = detailsVec.get(5).b();
        const isCompleted = detailsVec.get(6).b();

        // Milestones vector
        const mVec = (milestonesVal as any).vec();
        const milestones: Milestone[] = [];
        for (const mVal of mVec) {
          const map = mVal.map();
          let description = '';
          let amount = '0';
          let approved = false;
          let released = false;
          let disputed = false;

          for (const item of map) {
            const key = item.key().sym();
            const val = item.val();
            if (key === 'description') description = val.str().toString();
            if (key === 'amount') amount = val.i128().toString();
            if (key === 'approved') approved = val.b();
            if (key === 'released') released = val.b();
            if (key === 'disputed') disputed = val.b();
          }

          milestones.push({ description, amount, approved, released, disputed });
        }

        return {
          address: projectAddress,
          name: `StellarFlow Escrow #${projectAddress.substring(2, 6)}`,
          description: `Milestone escrow agreement between client and freelancer.`,
          client,
          freelancer,
          token,
          totalBudget,
          balance,
          isDeposited,
          isCompleted,
          milestones,
        };
      }
      throw new Error('Simulation failed');
    } catch (e) {
      console.warn('Real getProjectDetails failed, returning mock. Error:', e);
      const mockProject = getMockStore().projects.find((p) => p.address === projectAddress);
      if (mockProject) return mockProject;
      throw e;
    }
  }

  // --- Contract Write APIs ---

  async createProject(
    name: string,
    description: string,
    freelancer: string,
    totalBudget: string
  ): Promise<string> {
    const client = this.userPublicKey || 'GCLIENT4567890123456789012345678901234567890123456789012';

    if (this.isMockMode) {
      const store = getMockStore();
      const mockAddress = 'CDPROJECT' + Math.random().toString().replace('0.', '').substring(0, 16).padEnd(48, '9');

      const newProject: ProjectDetails = {
        address: mockAddress,
        name,
        description,
        client,
        freelancer,
        token: DEFAULT_TOKEN_ADDRESS,
        totalBudget,
        balance: '0',
        isDeposited: false,
        isCompleted: false,
        milestones: [],
      };

      store.projects.push(newProject);

      // Add project creation event
      store.events.unshift({
        id: 'e' + Date.now(),
        type: 'ProjectCreated',
        contractAddress: DEFAULT_FACTORY_ADDRESS,
        timestamp: new Date().toISOString(),
        data: `Project: ${name} | Budget: ${totalBudget} XLM | Freelancer: ${freelancer.substring(0, 8)}...`,
      });

      saveMockStore(store);
      return mockAddress;
    }

    try {
      // Call factory to create project
      const contract = new StellarSdk.Contract(DEFAULT_FACTORY_ADDRESS);
      const amountVal = StellarSdk.nativeToScVal(BigInt(totalBudget), { type: 'i128' });

      const tx = new StellarSdk.TransactionBuilder(
        new StellarSdk.Account(client, '0'),
        { fee: '1000', networkPassphrase: NETWORK_PASSPHRASE }
      )
        .addOperation(
          contract.call(
            'create_project',
            StellarSdk.xdr.ScVal.scvString(name),
            StellarSdk.xdr.ScVal.scvString(description),
            new StellarSdk.Address(client).toScVal(),
            new StellarSdk.Address(freelancer).toScVal(),
            amountVal,
            new StellarSdk.Address(DEFAULT_TOKEN_ADDRESS).toScVal()
          )
        )
        .setTimeout(30)
        .build();

      const signedTx = await StellarWalletsKit.signTransaction(tx.toXDR());
      const submission = await rpcServer.sendTransaction(new StellarSdk.Transaction(signedTx.signedTxXdr, NETWORK_PASSPHRASE));

      if (submission.status === 'PENDING') {
        let result = await rpcServer.getTransaction(submission.hash);
        while (result.status === 'NOT_FOUND' || (result.status === 'SUCCESS' && !(result as any).resultXdr)) {
          await new Promise((r) => setTimeout(r, 2000));
          result = await rpcServer.getTransaction(submission.hash);
        }

        // Extract project address from return value
        const val = (result as any).returnValue;
        return val ? val.address().toString() : '';
      }
      throw new Error('Submission failed');
    } catch (error) {
      console.error('Real createProject failed, using mock mode. Error:', error);
      this.isMockMode = true; // Automatically shift to mock if transaction fails
      return this.createProject(name, description, freelancer, totalBudget);
    }
  }

  async depositFunds(projectAddress: string, amount: string): Promise<boolean> {
    if (this.isMockMode) {
      const store = getMockStore();
      const project = store.projects.find((p) => p.address === projectAddress);
      if (project) {
        project.isDeposited = true;
        project.balance = amount;

        store.events.unshift({
          id: 'e' + Date.now(),
          type: 'FundsDeposited',
          contractAddress: projectAddress,
          timestamp: new Date().toISOString(),
          data: `Amount locked: ${amount} XLM in escrow contract`,
        });

        saveMockStore(store);
        return true;
      }
      return false;
    }

    try {
      const contract = new StellarSdk.Contract(projectAddress);
      const client = this.userPublicKey!;

      const tx = new StellarSdk.TransactionBuilder(
        new StellarSdk.Account(client, '0'),
        { fee: '1000', networkPassphrase: NETWORK_PASSPHRASE }
      )
        .addOperation(contract.call('deposit'))
        .setTimeout(30)
        .build();

      const signedTx = await StellarWalletsKit.signTransaction(tx.toXDR());
      await rpcServer.sendTransaction(new StellarSdk.Transaction(signedTx.signedTxXdr, NETWORK_PASSPHRASE));
      return true;
    } catch (e) {
      console.error('Real deposit failed:', e);
      return false;
    }
  }

  async createMilestone(projectAddress: string, description: string, amount: string): Promise<boolean> {
    if (this.isMockMode) {
      const store = getMockStore();
      const project = store.projects.find((p) => p.address === projectAddress);
      if (project) {
        // Validate total budget limits
        const currentSum = project.milestones.reduce((acc, m) => acc + Number(m.amount), 0);
        if (currentSum + Number(amount) > Number(project.totalBudget)) {
          alert('Milestone budget exceeds total budget!');
          return false;
        }

        project.milestones.push({
          description,
          amount,
          approved: false,
          released: false,
          disputed: false,
        });

        store.events.unshift({
          id: 'e' + Date.now(),
          type: 'MilestoneCreated',
          contractAddress: projectAddress,
          timestamp: new Date().toISOString(),
          data: `Milestone: "${description}" created | Value: ${amount} XLM`,
        });

        saveMockStore(store);
        return true;
      }
      return false;
    }

    try {
      const contract = new StellarSdk.Contract(projectAddress);
      const client = this.userPublicKey!;
      const amountVal = StellarSdk.nativeToScVal(BigInt(amount), { type: 'i128' });

      const tx = new StellarSdk.TransactionBuilder(
        new StellarSdk.Account(client, '0'),
        { fee: '1000', networkPassphrase: NETWORK_PASSPHRASE }
      )
        .addOperation(
          contract.call(
            'create_milestone',
            StellarSdk.xdr.ScVal.scvString(description),
            amountVal
          )
        )
        .setTimeout(30)
        .build();

      const signedTx = await StellarWalletsKit.signTransaction(tx.toXDR());
      await rpcServer.sendTransaction(new StellarSdk.Transaction(signedTx.signedTxXdr, NETWORK_PASSPHRASE));
      return true;
    } catch (e) {
      console.error('Real milestone creation failed:', e);
      return false;
    }
  }

  async approveMilestone(projectAddress: string, index: number): Promise<boolean> {
    if (this.isMockMode) {
      const store = getMockStore();
      const project = store.projects.find((p) => p.address === projectAddress);
      if (project && project.milestones[index]) {
        project.milestones[index].approved = true;

        store.events.unshift({
          id: 'e' + Date.now(),
          type: 'MilestoneApproved',
          contractAddress: projectAddress,
          timestamp: new Date().toISOString(),
          data: `Milestone #${index} ("${project.milestones[index].description}") approved by client`,
        });

        saveMockStore(store); // save changes
        return true;
      }
      return false;
    }

    try {
      const contract = new StellarSdk.Contract(projectAddress);
      const client = this.userPublicKey!;

      const tx = new StellarSdk.TransactionBuilder(
        new StellarSdk.Account(client, '0'),
        { fee: '1000', networkPassphrase: NETWORK_PASSPHRASE }
      )
        .addOperation(contract.call('approve_milestone', StellarSdk.xdr.ScVal.scvU32(index)))
        .setTimeout(30)
        .build();

      const signedTx = await StellarWalletsKit.signTransaction(tx.toXDR());
      await rpcServer.sendTransaction(new StellarSdk.Transaction(signedTx.signedTxXdr, NETWORK_PASSPHRASE));
      return true;
    } catch (e) {
      console.error('Real approve milestone failed:', e);
      return false;
    }
  }

  async releasePayment(projectAddress: string, index: number): Promise<boolean> {
    const caller = this.userPublicKey || 'GBFREELANCER12345678901234567890123456789012345678901';

    if (this.isMockMode) {
      const store = getMockStore();
      const project = store.projects.find((p) => p.address === projectAddress);
      if (project && project.milestones[index]) {
        const milestone = project.milestones[index];
        milestone.released = true;

        // Subtract from contract balance
        project.balance = (Number(project.balance) - Number(milestone.amount)).toString();

        store.events.unshift({
          id: 'e' + Date.now(),
          type: 'PaymentReleased',
          contractAddress: projectAddress,
          timestamp: new Date().toISOString(),
          data: `Milestone #${index} payment of ${milestone.amount} XLM released to Freelancer`,
        });

        // Check if all milestones are released (completes project)
        const allReleased = project.milestones.every((m) => m.released);
        const sumReleased = project.milestones.reduce((acc, m) => acc + Number(m.amount), 0);

        if (allReleased && sumReleased === Number(project.totalBudget)) {
          project.isCompleted = true;

          // Automatically update reputation of freelancer
          const freelancer = project.freelancer;
          if (!store.reputations[freelancer]) {
            store.reputations[freelancer] = {
              address: freelancer,
              completedProjects: 0,
              ratingCount: 0,
              score: 500,
            };
          }

          const rep = store.reputations[freelancer];
          rep.completedProjects += 1;
          rep.ratingCount += 1;
          // Calculate rating score, default 500 (5.0 stars) for success
          const rating = 5;
          const currentTotal = (rep.score * (rep.ratingCount - 1)) / 100;
          const newTotal = currentTotal + rating;
          rep.score = Math.round((newTotal * 100) / rep.ratingCount);

          store.events.unshift({
            id: 'e' + Date.now() + '_rep',
            type: 'ReputationUpdated',
            contractAddress: DEFAULT_REPUTATION_ADDRESS,
            timestamp: new Date().toISOString(),
            data: `Reputation updated for ${freelancer.substring(0, 8)}... Completed projects: ${rep.completedProjects}`,
          });
        }

        saveMockStore(store);
        return true;
      }
      return false;
    }

    try {
      const contract = new StellarSdk.Contract(projectAddress);

      const tx = new StellarSdk.TransactionBuilder(
        new StellarSdk.Account(caller, '0'),
        { fee: '1000', networkPassphrase: NETWORK_PASSPHRASE }
      )
        .addOperation(
          contract.call(
            'release_payment',
            StellarSdk.xdr.ScVal.scvU32(index),
            new StellarSdk.Address(caller).toScVal()
          )
        )
        .setTimeout(30)
        .build();

      const signedTx = await StellarWalletsKit.signTransaction(tx.toXDR());
      await rpcServer.sendTransaction(new StellarSdk.Transaction(signedTx.signedTxXdr, NETWORK_PASSPHRASE));
      return true;
    } catch (e) {
      console.error('Real release payment failed:', e);
      return false;
    }
  }

  async raiseDispute(projectAddress: string, index: number): Promise<boolean> {
    const caller = this.userPublicKey || 'GCLIENT4567890123456789012345678901234567890123456789012';

    if (this.isMockMode) {
      const store = getMockStore();
      const project = store.projects.find((p) => p.address === projectAddress);
      if (project && project.milestones[index]) {
        project.milestones[index].disputed = true;

        store.events.unshift({
          id: 'e' + Date.now(),
          type: 'DisputeRaised',
          contractAddress: projectAddress,
          timestamp: new Date().toISOString(),
          data: `Dispute raised on Milestone #${index} by ${caller.substring(0, 8)}...`,
        });

        saveMockStore(store);
        return true;
      }
      return false;
    }

    try {
      const contract = new StellarSdk.Contract(projectAddress);

      const tx = new StellarSdk.TransactionBuilder(
        new StellarSdk.Account(caller, '0'),
        { fee: '1000', networkPassphrase: NETWORK_PASSPHRASE }
      )
        .addOperation(
          contract.call(
            'raise_dispute',
            StellarSdk.xdr.ScVal.scvU32(index),
            new StellarSdk.Address(caller).toScVal()
          )
        )
        .setTimeout(30)
        .build();

      const signedTx = await StellarWalletsKit.signTransaction(tx.toXDR());
      await rpcServer.sendTransaction(new StellarSdk.Transaction(signedTx.signedTxXdr, NETWORK_PASSPHRASE));
      return true;
    } catch (e) {
      console.error('Real raise dispute failed:', e);
      return false;
    }
  }

  async resolveDispute(projectAddress: string, index: number, releaseToFreelancer: boolean): Promise<boolean> {
    const admin = this.userPublicKey || 'GCLIENT4567890123456789012345678901234567890123456789012'; // admin simulated as user

    if (this.isMockMode) {
      const store = getMockStore();
      const project = store.projects.find((p) => p.address === projectAddress);
      if (project && project.milestones[index]) {
        const milestone = project.milestones[index];
        milestone.released = true;
        milestone.disputed = false;

        project.balance = (Number(project.balance) - Number(milestone.amount)).toString();

        store.events.unshift({
          id: 'e' + Date.now(),
          type: 'DisputeResolved',
          contractAddress: projectAddress,
          timestamp: new Date().toISOString(),
          data: `Dispute on Milestone #${index} resolved by Admin: ${releaseToFreelancer ? 'Paid to Freelancer' : 'Refunded to Client'
            }`,
        });

        // Check completion
        const allReleased = project.milestones.every((m) => m.released);
        const sumReleased = project.milestones.reduce((acc, m) => acc + Number(m.amount), 0);

        if (allReleased && sumReleased === Number(project.totalBudget)) {
          project.isCompleted = true;
        }

        saveMockStore(store);
        return true;
      }
      return false;
    }

    try {
      const contract = new StellarSdk.Contract(projectAddress);

      const tx = new StellarSdk.TransactionBuilder(
        new StellarSdk.Account(admin, '0'),
        { fee: '1000', networkPassphrase: NETWORK_PASSPHRASE }
      )
        .addOperation(
          contract.call(
            'resolve_dispute',
            StellarSdk.xdr.ScVal.scvU32(index),
            StellarSdk.xdr.ScVal.scvBool(releaseToFreelancer)
          )
        )
        .setTimeout(30)
        .build();

      const signedTx = await StellarWalletsKit.signTransaction(tx.toXDR());
      await rpcServer.sendTransaction(new StellarSdk.Transaction(signedTx.signedTxXdr, NETWORK_PASSPHRASE));
      return true;
    } catch (e) {
      console.error('Real resolve dispute failed:', e);
      return false;
    }
  }

  async getEvents(): Promise<ContractEvent[]> {
    if (this.isMockMode) {
      return getMockStore().events;
    }

    try {
      // In a real network, we query the RPC getEvents API
      // Since it requires a specific ledger range, we poll the recent 1000 ledgers
      const latestLedger = await rpcServer.getLatestLedger();
      const startLedger = Math.max(1, latestLedger.sequence - 1000);

      const response = await rpcServer.getEvents({
        startLedger,
        filters: [
          {
            type: 'contract',
            topics: [
              // Event filters can match topics
            ],
          },
        ],
        limit: 50,
      });

      const events: ContractEvent[] = [];
      for (const ev of response.events || []) {
        let topicStr = '';
        if (ev.topic && ev.topic.length > 0) {
          // Parse topics
          topicStr = ev.topic.map((t: any) => t.sym ? t.sym() : t.str ? t.str() : '').join(':');
        }

        events.push({
          id: ev.id || Math.random().toString(),
          type: topicStr.split(':')[0] || 'Event',
          contractAddress: typeof ev.contractId === 'string' ? ev.contractId : (ev.contractId as any)?.toString() || '',
          timestamp: new Date().toISOString(), // RPC doesn't directly return ISO time, fallback to now
          data: `Event topics: [${topicStr}]`,
        });
      }

      return events.length > 0 ? events : getMockStore().events;
    } catch (e) {
      console.warn('Real getEvents failed, returning mock fallback. Error:', e);
      return getMockStore().events;
    }
  }
}

export const stellarFlowService = new StellarFlowService();
export default stellarFlowService;
