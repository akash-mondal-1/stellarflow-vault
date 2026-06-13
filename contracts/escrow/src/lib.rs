#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, token, Address, Env, IntoVal, String, Symbol, Vec,
};

#[contract]
pub struct EscrowContract;

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Factory,
    ReputationContract,
    Client,
    Freelancer,
    TotalBudget,
    Token,
    IsDeposited,
    EscrowBalance,
    Milestones,
    IsCompleted,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Milestone {
    pub description: String,
    pub amount: i128,
    pub approved: bool,
    pub released: bool,
    pub disputed: bool,
}

// Manual cross-contract client for Reputation contract
struct ReputationClient {
    env: Env,
    address: Address,
}

impl ReputationClient {
    fn new(env: &Env, address: &Address) -> Self {
        Self {
            env: env.clone(),
            address: address.clone(),
        }
    }

    fn rate_user(&self, user: &Address, rating: u32, escrow: &Address) {
        self.env.invoke_contract::<()>(
            &self.address,
            &Symbol::new(&self.env, "rate_user"),
            soroban_sdk::vec![
                &self.env,
                user.clone().into_val(&self.env),
                rating.into_val(&self.env),
                escrow.clone().into_val(&self.env),
            ],
        );
    }
}

// Manual cross-contract client for Factory contract
struct FactoryClient {
    env: Env,
    address: Address,
}

impl FactoryClient {
    fn new(env: &Env, address: &Address) -> Self {
        Self {
            env: env.clone(),
            address: address.clone(),
        }
    }

    fn admin(&self) -> Address {
        self.env.invoke_contract::<Address>(
            &self.address,
            &Symbol::new(&self.env, "admin"),
            soroban_sdk::vec![&self.env],
        )
    }
}

#[contractimpl]
impl EscrowContract {
    pub fn initialize(
        env: Env,
        factory: Address,
        reputation_contract: Address,
        client: Address,
        freelancer: Address,
        total_budget: i128,
        token: Address,
    ) {
        if env.storage().instance().has(&DataKey::Factory) {
            panic!("Already initialized");
        }
        if total_budget <= 0 {
            panic!("Total budget must be positive");
        }

        env.storage().instance().set(&DataKey::Factory, &factory);
        env.storage().instance().set(&DataKey::ReputationContract, &reputation_contract);
        env.storage().instance().set(&DataKey::Client, &client);
        env.storage().instance().set(&DataKey::Freelancer, &freelancer);
        env.storage().instance().set(&DataKey::TotalBudget, &total_budget);
        env.storage().instance().set(&DataKey::Token, &token);
        env.storage().instance().set(&DataKey::IsDeposited, &false);
        env.storage().instance().set(&DataKey::EscrowBalance, &0i128);
        env.storage().instance().set(&DataKey::IsCompleted, &false);

        let milestones: Vec<Milestone> = Vec::new(&env);
        env.storage().instance().set(&DataKey::Milestones, &milestones);
    }

    pub fn deposit(env: Env) {
        let is_deposited: bool = env.storage().instance().get(&DataKey::IsDeposited).unwrap_or(false);
        if is_deposited {
            panic!("Funds already deposited");
        }

        let client: Address = env.storage().instance().get(&DataKey::Client).unwrap();
        client.require_auth();

        let total_budget: i128 = env.storage().instance().get(&DataKey::TotalBudget).unwrap();
        let token_address: Address = env.storage().instance().get(&DataKey::Token).unwrap();

        let token_client = token::Client::new(&env, &token_address);
        token_client.transfer(&client, &env.current_contract_address(), &total_budget);

        env.storage().instance().set(&DataKey::IsDeposited, &true);
        env.storage().instance().set(&DataKey::EscrowBalance, &total_budget);

        // Emit event
        env.events().publish(
            (Symbol::new(&env, "FundsDeposited"), env.current_contract_address()),
            total_budget,
        );
    }

    pub fn create_milestone(env: Env, description: String, amount: i128) {
        let client: Address = env.storage().instance().get(&DataKey::Client).unwrap();
        client.require_auth();

        if amount <= 0 {
            panic!("Milestone amount must be positive");
        }

        let mut milestones: Vec<Milestone> = env.storage().instance().get(&DataKey::Milestones).unwrap();
        let total_budget: i128 = env.storage().instance().get(&DataKey::TotalBudget).unwrap();

        let mut current_sum: i128 = 0;
        for m in milestones.iter() {
            current_sum += m.amount;
        }

        if current_sum + amount > total_budget {
            panic!("Milestone sum exceeds total project budget");
        }

        let milestone = Milestone {
            description: description.clone(),
            amount,
            approved: false,
            released: false,
            disputed: false,
        };

        milestones.push_back(milestone);
        env.storage().instance().set(&DataKey::Milestones, &milestones);

        let index = milestones.len() - 1;

        // Emit event
        env.events().publish(
            (Symbol::new(&env, "MilestoneCreated"), env.current_contract_address()),
            (index, description, amount),
        );
    }

    pub fn approve_milestone(env: Env, milestone_index: u32) {
        let client: Address = env.storage().instance().get(&DataKey::Client).unwrap();
        client.require_auth();

        let mut milestones: Vec<Milestone> = env.storage().instance().get(&DataKey::Milestones).unwrap();
        if milestone_index >= milestones.len() {
            panic!("Invalid milestone index");
        }

        let mut milestone = milestones.get(milestone_index).unwrap();
        if milestone.released {
            panic!("Milestone already released");
        }
        if milestone.approved {
            panic!("Milestone already approved");
        }

        milestone.approved = true;
        milestones.set(milestone_index, milestone);
        env.storage().instance().set(&DataKey::Milestones, &milestones);

        // Emit event
        env.events().publish(
            (Symbol::new(&env, "MilestoneApproved"), env.current_contract_address()),
            milestone_index,
        );
    }

    pub fn release_payment(env: Env, milestone_index: u32, caller: Address) {
        caller.require_auth();

        let mut milestones: Vec<Milestone> = env.storage().instance().get(&DataKey::Milestones).unwrap();
        if milestone_index >= milestones.len() {
            panic!("Invalid milestone index");
        }

        let mut milestone = milestones.get(milestone_index).unwrap();
        if milestone.released {
            panic!("Milestone already released");
        }

        let client: Address = env.storage().instance().get(&DataKey::Client).unwrap();
        let freelancer: Address = env.storage().instance().get(&DataKey::Freelancer).unwrap();

        if caller == client {
            // Client can release anytime
        } else if caller == freelancer {
            // Freelancer can only release if approved and not disputed
            if !milestone.approved {
                panic!("Milestone is not approved by client");
            }
            if milestone.disputed {
                panic!("Milestone is disputed");
            }
        } else {
            panic!("Not authorized to release payment");
        }

        let token_address: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let token_client = token::Client::new(&env, &token_address);
        token_client.transfer(&env.current_contract_address(), &freelancer, &milestone.amount);

        milestone.released = true;
        milestones.set(milestone_index, milestone.clone());
        env.storage().instance().set(&DataKey::Milestones, &milestones);

        let mut balance: i128 = env.storage().instance().get(&DataKey::EscrowBalance).unwrap_or(0);
        balance -= milestone.amount;
        env.storage().instance().set(&DataKey::EscrowBalance, &balance);

        // Emit event
        env.events().publish(
            (Symbol::new(&env, "PaymentReleased"), env.current_contract_address()),
            (milestone_index, milestone.amount),
        );

        // Check if all milestones are released and match budget
        Self::check_completion(&env);
    }

    pub fn raise_dispute(env: Env, milestone_index: u32, caller: Address) {
        caller.require_auth();

        let client: Address = env.storage().instance().get(&DataKey::Client).unwrap();
        let freelancer: Address = env.storage().instance().get(&DataKey::Freelancer).unwrap();

        if caller != client && caller != freelancer {
            panic!("Not authorized to raise dispute");
        }

        let mut milestones: Vec<Milestone> = env.storage().instance().get(&DataKey::Milestones).unwrap();
        if milestone_index >= milestones.len() {
            panic!("Invalid milestone index");
        }

        let mut milestone = milestones.get(milestone_index).unwrap();
        if milestone.released {
            panic!("Cannot dispute a released milestone");
        }
        if milestone.disputed {
            panic!("Milestone is already disputed");
        }

        milestone.disputed = true;
        milestones.set(milestone_index, milestone);
        env.storage().instance().set(&DataKey::Milestones, &milestones);

        // Emit event
        env.events().publish(
            (Symbol::new(&env, "DisputeRaised"), env.current_contract_address()),
            milestone_index,
        );
    }

    pub fn resolve_dispute(env: Env, milestone_index: u32, release_to_freelancer: bool) {
        // Only factory admin can resolve disputes
        let factory_address: Address = env.storage().instance().get(&DataKey::Factory).unwrap();
        let factory_client = FactoryClient::new(&env, &factory_address);
        let admin = factory_client.admin();
        admin.require_auth();

        let mut milestones: Vec<Milestone> = env.storage().instance().get(&DataKey::Milestones).unwrap();
        if milestone_index >= milestones.len() {
            panic!("Invalid milestone index");
        }

        let mut milestone = milestones.get(milestone_index).unwrap();
        if !milestone.disputed {
            panic!("Milestone is not disputed");
        }
        if milestone.released {
            panic!("Milestone is already released");
        }

        let token_address: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let token_client = token::Client::new(&env, &token_address);

        if release_to_freelancer {
            let freelancer: Address = env.storage().instance().get(&DataKey::Freelancer).unwrap();
            token_client.transfer(&env.current_contract_address(), &freelancer, &milestone.amount);
        } else {
            let client: Address = env.storage().instance().get(&DataKey::Client).unwrap();
            token_client.transfer(&env.current_contract_address(), &client, &milestone.amount);
        }

        milestone.released = true;
        milestone.disputed = false;
        milestones.set(milestone_index, milestone.clone());
        env.storage().instance().set(&DataKey::Milestones, &milestones);

        let mut balance: i128 = env.storage().instance().get(&DataKey::EscrowBalance).unwrap_or(0);
        balance -= milestone.amount;
        env.storage().instance().set(&DataKey::EscrowBalance, &balance);

        // Emit event
        env.events().publish(
            (Symbol::new(&env, "DisputeResolved"), env.current_contract_address()),
            (milestone_index, release_to_freelancer),
        );

        Self::check_completion(&env);
    }

    fn check_completion(env: &Env) {
        let is_completed: bool = env.storage().instance().get(&DataKey::IsCompleted).unwrap_or(false);
        if is_completed {
            return;
        }

        let total_budget: i128 = env.storage().instance().get(&DataKey::TotalBudget).unwrap();
        let milestones: Vec<Milestone> = env.storage().instance().get(&DataKey::Milestones).unwrap();

        let mut released_sum: i128 = 0;
        let mut all_released = true;

        for m in milestones.iter() {
            if m.released {
                released_sum += m.amount;
            } else {
                all_released = false;
            }
        }

        // If all created milestones are released and they sum to total budget, complete the project
        if all_released && released_sum == total_budget && milestones.len() > 0 {
            env.storage().instance().set(&DataKey::IsCompleted, &true);

            // Trigger cross-contract call to Reputation Contract to update freelancer's reputation
            let reputation_address: Address = env.storage().instance().get(&DataKey::ReputationContract).unwrap();
            let freelancer: Address = env.storage().instance().get(&DataKey::Freelancer).unwrap();

            let reputation_client = ReputationClient::new(env, &reputation_address);
            reputation_client.rate_user(&freelancer, 5, &env.current_contract_address()); // Automatically rate 5 stars for completing a project
        }
    }

    // Read-only functions
    pub fn get_milestones(env: Env) -> Vec<Milestone> {
        env.storage().instance().get(&DataKey::Milestones).unwrap_or(Vec::new(&env))
    }

    pub fn get_details(env: Env) -> (Address, Address, Address, i128, i128, bool, bool) {
        let client = env.storage().instance().get(&DataKey::Client).unwrap();
        let freelancer = env.storage().instance().get(&DataKey::Freelancer).unwrap();
        let token = env.storage().instance().get(&DataKey::Token).unwrap();
        let total_budget = env.storage().instance().get(&DataKey::TotalBudget).unwrap();
        let balance = env.storage().instance().get(&DataKey::EscrowBalance).unwrap_or(0);
        let is_deposited = env.storage().instance().get(&DataKey::IsDeposited).unwrap_or(false);
        let is_completed = env.storage().instance().get(&DataKey::IsCompleted).unwrap_or(false);

        (client, freelancer, token, total_budget, balance, is_deposited, is_completed)
    }
}

#[cfg(test)]
mod test;

