#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Symbol};

#[contract]
pub struct ReputationContract;

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Factory,
    RegisteredEscrows(Address),
    CompletedProjects(Address),
    TotalRatingScore(Address),
    RatingCount(Address),
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ReputationInfo {
    pub completed_projects: u32,
    pub rating_count: u32,
    pub reputation_score: u32, // Out of 500 (e.g. 450 = 4.5 stars)
}

#[contractimpl]
impl ReputationContract {
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
    }

    pub fn set_factory(env: Env, factory: Address) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();
        env.storage().instance().set(&DataKey::Factory, &factory);
    }

    pub fn register_escrow(env: Env, escrow: Address, authority: Address) {
        authority.require_auth();
        let mut authorized = false;
        
        // Allowed if authority is the registered factory
        if let Some(factory) = env.storage().instance().get::<_, Address>(&DataKey::Factory) {
            if authority == factory {
                authorized = true;
            }
        }
        
        // Or if authority is the admin
        if !authorized {
            let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
            if authority == admin {
                authorized = true;
            }
        }

        if !authorized {
            panic!("Not authorized to register escrow");
        }

        env.storage().instance().set(&DataKey::RegisteredEscrows(escrow), &true);
    }

    pub fn rate_user(env: Env, user: Address, rating: u32, escrow: Address) {
        escrow.require_auth();
        
        // Only registered escrows can rate users
        let is_registered = env.storage().instance().get(&DataKey::RegisteredEscrows(escrow)).unwrap_or(false);
        if !is_registered {
            panic!("Caller is not a registered escrow contract");
        }

        if rating < 1 || rating > 5 {
            panic!("Rating must be between 1 and 5");
        }

        let mut completed: u32 = env.storage().instance().get(&DataKey::CompletedProjects(user.clone())).unwrap_or(0);
        completed += 1;
        env.storage().instance().set(&DataKey::CompletedProjects(user.clone()), &completed);

        let mut total_score: u32 = env.storage().instance().get(&DataKey::TotalRatingScore(user.clone())).unwrap_or(0);
        let mut count: u32 = env.storage().instance().get(&DataKey::RatingCount(user.clone())).unwrap_or(0);

        total_score += rating;
        count += 1;

        env.storage().instance().set(&DataKey::TotalRatingScore(user.clone()), &total_score);
        env.storage().instance().set(&DataKey::RatingCount(user.clone()), &count);

        let score = (total_score * 100) / count; // e.g. (5 * 100) / 1 = 500

        // Emit ReputationUpdated event
        let topic = (Symbol::new(&env, "ReputationUpdated"), user.clone());
        env.events().publish(topic, (completed, count, score));
    }

    pub fn get_reputation(env: Env, user: Address) -> ReputationInfo {
        let completed: u32 = env.storage().instance().get(&DataKey::CompletedProjects(user.clone())).unwrap_or(0);
        let total_score: u32 = env.storage().instance().get(&DataKey::TotalRatingScore(user.clone())).unwrap_or(0);
        let count: u32 = env.storage().instance().get(&DataKey::RatingCount(user.clone())).unwrap_or(0);

        let reputation_score = if count == 0 {
            500 // Default to 5.0 stars for new users
        } else {
            (total_score * 100) / count
        };

        ReputationInfo {
            completed_projects: completed,
            rating_count: count,
            reputation_score,
        }
    }

    pub fn get_completed_projects(env: Env, user: Address) -> u32 {
        env.storage().instance().get(&DataKey::CompletedProjects(user)).unwrap_or(0)
    }
}
