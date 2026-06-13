#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::Address as _,
    Address, Env,
};

// Import other contracts for testing
use reputation::{ReputationContract, ReputationContractClient};
use escrow_factory::{EscrowFactoryContract, EscrowFactoryContractClient};

// Import compiled escrow WASM for programmatic deployment testing.
// In Cargo, paths are resolved relative to the crate's Cargo.toml directory.
mod escrow_wasm {
    soroban_sdk::contractimport!(
        file = "../../target/wasm32v1-none/release/escrow.wasm"
    );
}

#[test]
fn test_escrow_milestone_reputation_flow() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);

    // 1. Deploy Reputation contract
    let reputation_address = env.register(ReputationContract, ());
    let reputation_client = ReputationContractClient::new(&env, &reputation_address);
    reputation_client.initialize(&admin);

    // 2. Deploy Escrow Factory contract
    let factory_address = env.register(EscrowFactoryContract, ());
    let factory_client = EscrowFactoryContractClient::new(&env, &factory_address);

    // Upload Escrow WASM to factory
    let escrow_wasm_hash = env.deployer().upload_contract_wasm(escrow_wasm::WASM);
    factory_client.initialize(&admin, &reputation_address, &escrow_wasm_hash);

    // Whitelist Factory in Reputation contract
    reputation_client.set_factory(&factory_address);

    // 3. Setup Token (SAC)
    let token_admin = Address::generate(&env);
    let token_address = env.register_stellar_asset_contract(token_admin.clone());
    let token_client = token::Client::new(&env, &token_address);
    let token_admin_client = token::StellarAssetClient::new(&env, &token_address);

    // Setup client and freelancer addresses
    let client = Address::generate(&env);
    let freelancer = Address::generate(&env);

    // Mint tokens to client
    token_admin_client.mint(&client, &1000);
    assert_eq!(token_client.balance(&client), 1000);

    // 4. Create Project via Factory (programmatically deploys Escrow)
    let name = String::from_str(&env, "Website Design");
    let desc = String::from_str(&env, "Build custom landing page");
    let total_budget = 600i128;

    let project_address = factory_client.create_project(
        &name,
        &desc,
        &client,
        &freelancer,
        &total_budget,
        &token_address,
    );

    // Verify it is stored in the list of projects
    let projects = factory_client.list_projects();
    assert_eq!(projects.len(), 1);
    assert_eq!(projects.get(0).unwrap(), project_address);
    assert_eq!(factory_client.get_project(&0), project_address);

    // Verify project info from Escrow Contract
    let escrow_client = EscrowContractClient::new(&env, &project_address);
    let (c, f, t, budget, balance, is_deposited, is_completed) = escrow_client.get_details();
    assert_eq!(c, client);
    assert_eq!(f, freelancer);
    assert_eq!(t, token_address);
    assert_eq!(budget, total_budget);
    assert_eq!(balance, 0i128);
    assert_eq!(is_deposited, false);
    assert_eq!(is_completed, false);

    // 5. Deposit funds
    escrow_client.deposit();
    let (_, _, _, _, balance, is_deposited, _) = escrow_client.get_details();
    assert_eq!(balance, total_budget);
    assert_eq!(is_deposited, true);
    assert_eq!(token_client.balance(&project_address), total_budget);
    assert_eq!(token_client.balance(&client), 400i128);

    // 6. Create Milestones
    let m1_desc = String::from_str(&env, "UI Design");
    let m2_desc = String::from_str(&env, "Frontend Code");

    escrow_client.create_milestone(&m1_desc, &200i128);
    escrow_client.create_milestone(&m2_desc, &400i128);

    let milestones = escrow_client.get_milestones();
    assert_eq!(milestones.len(), 2);
    
    let m1 = milestones.get(0).unwrap();
    assert_eq!(m1.description, m1_desc);
    assert_eq!(m1.amount, 200i128);
    assert_eq!(m1.approved, false);
    assert_eq!(m1.released, false);
    assert_eq!(m1.disputed, false);

    // 7. Approve and Release Milestone 1
    escrow_client.approve_milestone(&0);
    assert_eq!(escrow_client.get_milestones().get(0).unwrap().approved, true);

    escrow_client.release_payment(&0, &freelancer);
    assert_eq!(escrow_client.get_milestones().get(0).unwrap().released, true);
    assert_eq!(token_client.balance(&freelancer), 200i128);
    assert_eq!(token_client.balance(&project_address), 400i128);

    // Reputation shouldn't be completed/updated yet since Milestone 2 is remaining
    let rep_info = reputation_client.get_reputation(&freelancer);
    assert_eq!(rep_info.completed_projects, 0);

    // 8. Approve and Release Milestone 2 (completes escrow and updates reputation)
    escrow_client.approve_milestone(&1);
    escrow_client.release_payment(&1, &freelancer);

    let (_, _, _, _, final_balance, _, is_completed) = escrow_client.get_details();
    assert_eq!(final_balance, 0i128);
    assert_eq!(is_completed, true);
    assert_eq!(token_client.balance(&freelancer), 600i128);
    assert_eq!(token_client.balance(&project_address), 0i128);

    // Reputation MUST update automatically
    let final_rep_info = reputation_client.get_reputation(&freelancer);
    assert_eq!(final_rep_info.completed_projects, 1);
    assert_eq!(final_rep_info.rating_count, 1);
    assert_eq!(final_rep_info.reputation_score, 500); // Default 5.0 stars
}

#[test]
fn test_escrow_dispute_resolution() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);

    let reputation_address = env.register(ReputationContract, ());
    let reputation_client = ReputationContractClient::new(&env, &reputation_address);
    reputation_client.initialize(&admin);

    let factory_address = env.register(EscrowFactoryContract, ());
    let factory_client = EscrowFactoryContractClient::new(&env, &factory_address);

    let escrow_wasm_hash = env.deployer().upload_contract_wasm(escrow_wasm::WASM);
    factory_client.initialize(&admin, &reputation_address, &escrow_wasm_hash);
    reputation_client.set_factory(&factory_address);

    let token_admin = Address::generate(&env);
    let token_address = env.register_stellar_asset_contract(token_admin.clone());
    let token_client = token::Client::new(&env, &token_address);
    let token_admin_client = token::StellarAssetClient::new(&env, &token_address);

    let client = Address::generate(&env);
    let freelancer = Address::generate(&env);

    token_admin_client.mint(&client, &1000);

    let project_address = factory_client.create_project(
        &String::from_str(&env, "Disputed Project"),
        &String::from_str(&env, "Dispute testing"),
        &client,
        &freelancer,
        &500i128,
        &token_address,
    );

    let escrow_client = EscrowContractClient::new(&env, &project_address);
    escrow_client.deposit();
    escrow_client.create_milestone(&String::from_str(&env, "Deliverable"), &500i128);

    // 1. Raise Dispute
    escrow_client.raise_dispute(&0, &client);
    assert_eq!(escrow_client.get_milestones().get(0).unwrap().disputed, true);

    // 2. Resolve Dispute - Refund to Client
    escrow_client.resolve_dispute(&0, &false); // false = refund client
    
    let m = escrow_client.get_milestones().get(0).unwrap();
    assert_eq!(m.released, true);
    assert_eq!(m.disputed, false);
    assert_eq!(token_client.balance(&project_address), 0i128);
}

#[test]
#[should_panic]
fn test_escrow_unauthorized_milestone_release() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);

    let reputation_address = env.register(ReputationContract, ());
    let reputation_client = ReputationContractClient::new(&env, &reputation_address);
    reputation_client.initialize(&admin);

    let factory_address = env.register(EscrowFactoryContract, ());
    let factory_client = EscrowFactoryContractClient::new(&env, &factory_address);

    let escrow_wasm_hash = env.deployer().upload_contract_wasm(escrow_wasm::WASM);
    factory_client.initialize(&admin, &reputation_address, &escrow_wasm_hash);
    reputation_client.set_factory(&factory_address);

    let token_admin = Address::generate(&env);
    let token_address = env.register_stellar_asset_contract(token_admin.clone());
    let token_admin_client = token::StellarAssetClient::new(&env, &token_address);

    let client = Address::generate(&env);
    let freelancer = Address::generate(&env);

    token_admin_client.mint(&client, &1000);

    let project_address = factory_client.create_project(
        &String::from_str(&env, "Test Project"),
        &String::from_str(&env, "Testing errors"),
        &client,
        &freelancer,
        &500i128,
        &token_address,
    );

    let escrow_client = EscrowContractClient::new(&env, &project_address);
    escrow_client.deposit();
    escrow_client.create_milestone(&String::from_str(&env, "M1"), &500i128);

    // Freelancer tries to release milestone without client's approval first
    // This should panic
    escrow_client.release_payment(&0, &freelancer);
}
