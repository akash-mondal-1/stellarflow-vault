#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, Address, BytesN, Env, String, Symbol, Vec, IntoVal,
};

#[contract]
pub struct EscrowFactoryContract;

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    ReputationContract,
    EscrowWasmHash,
    Projects,
}

#[contractimpl]
impl EscrowFactoryContract {
    pub fn initialize(
        env: Env,
        admin: Address,
        reputation_contract: Address,
        escrow_wasm_hash: BytesN<32>,
    ) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::ReputationContract, &reputation_contract);
        env.storage().instance().set(&DataKey::EscrowWasmHash, &escrow_wasm_hash);

        let projects: Vec<Address> = Vec::new(&env);
        env.storage().instance().set(&DataKey::Projects, &projects);
    }

    pub fn admin(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Admin).unwrap()
    }

    pub fn update_wasm_hash(env: Env, wasm_hash: BytesN<32>) {
        let admin = Self::admin(env.clone());
        admin.require_auth();
        env.storage().instance().set(&DataKey::EscrowWasmHash, &wasm_hash);
    }

    pub fn create_project(
        env: Env,
        name: String,
        description: String,
        client: Address,
        freelancer: Address,
        total_budget: i128,
        token: Address,
    ) -> Address {
        // Anyone can call create_project, but the client must sign to authorize funding/creation
        client.require_auth();

        let reputation_contract: Address = env
            .storage()
            .instance()
            .get(&DataKey::ReputationContract)
            .unwrap();
        let wasm_hash: BytesN<32> = env
            .storage()
            .instance()
            .get(&DataKey::EscrowWasmHash)
            .unwrap();

        let mut projects: Vec<Address> = env
            .storage()
            .instance()
            .get(&DataKey::Projects)
            .unwrap();

        // Create salt for deterministic deployment
        let mut salt_bytes = [0u8; 32];
        let count_bytes = (projects.len() as u64).to_be_bytes();
        for i in 0..8 {
            salt_bytes[i] = count_bytes[i];
        }
        let salt = BytesN::from_array(&env, &salt_bytes);

        // Deploy Escrow Contract
        let escrow_address = env
            .deployer()
            .with_current_contract(salt)
            .deploy(wasm_hash);

        // Initialize Escrow Contract
        env.invoke_contract::<()>(
            &escrow_address,
            &Symbol::new(&env, "initialize"),
            soroban_sdk::vec![
                &env,
                env.current_contract_address().into_val(&env),
                reputation_contract.clone().into_val(&env),
                client.clone().into_val(&env),
                freelancer.clone().into_val(&env),
                total_budget.into_val(&env),
                token.into_val(&env),
            ],
        );

        // Register the new Escrow contract in the Reputation Contract
        env.invoke_contract::<()>(
            &reputation_contract,
            &Symbol::new(&env, "register_escrow"),
            soroban_sdk::vec![
                &env,
                escrow_address.clone().into_val(&env),
                env.current_contract_address().into_val(&env),
            ],
        );

        // Add to project list
        projects.push_back(escrow_address.clone());
        env.storage().instance().set(&DataKey::Projects, &projects);

        let project_id = projects.len() - 1;

        // Emit ProjectCreated event
        let topic = (Symbol::new(&env, "ProjectCreated"), escrow_address.clone());
        env.events().publish(
            topic,
            (project_id, name, description, client, freelancer, total_budget),
        );

        escrow_address
    }

    pub fn get_project(env: Env, index: u32) -> Address {
        let projects: Vec<Address> = env
            .storage()
            .instance()
            .get(&DataKey::Projects)
            .unwrap();
        if index >= projects.len() {
            panic!("Invalid project index");
        }
        projects.get(index).unwrap()
    }

    pub fn list_projects(env: Env) -> Vec<Address> {
        env.storage().instance().get(&DataKey::Projects).unwrap_or(Vec::new(&env))
    }
}
