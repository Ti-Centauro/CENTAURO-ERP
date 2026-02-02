/**
 * API Service - Backward Compatibility Redirect
 * 
 * This file now redirects all imports to the new modular structure.
 * All functions are re-exported from services/api/index.js
 * 
 * New structure:
 * - services/api/core.js       - Axios config
 * - services/api/crm.js        - Proposals, Tasks
 * - services/api/commercial.js - Clients, Contracts, Projects
 * - services/api/finance.js    - Billings, Tax Import, Payroll
 * - services/api/operational.js - Collaborators, Assets, Purchases, etc.
 * - services/api/index.js      - Aggregator (this import)
 */

// Re-export everything from the modular api folder
export * from './api/index';

// Default export for api instance
export { default } from './api/index';
