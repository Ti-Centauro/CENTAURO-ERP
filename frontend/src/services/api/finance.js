/**
 * Finance API Module
 * Billings, Tax Import, and Payroll functions
 */
import api from './core';

// Project Billings
export const createProjectBilling = (projectId, data) => api.post(`/commercial/projects/${projectId}/billings`, data);
export const deleteProjectBilling = (id) => api.delete(`/commercial/projects/billings/${id}`);
export const getAllBillings = () => api.get('/commercial/billings');
export const updateProjectBilling = (id, data) => api.put(`/commercial/billings/${id}`, data);

// Tax Import
export const previewTaxesImport = (formData) => api.post('/commercial/billings/import-taxes/preview', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const confirmTaxesImport = (data) => api.post('/commercial/billings/import-taxes/confirm', data);

// Finance Payroll
export const uploadPayroll = (formData) => api.post('/finance/payroll/upload', formData, {
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});
export const getPayrollPeriods = () => api.get('/finance/payroll/periods');
export const getPayrollDetails = (month, year) => api.get('/finance/payroll/details', { params: { month, year } });
