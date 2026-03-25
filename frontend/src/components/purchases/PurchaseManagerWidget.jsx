import { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
  Package,
  Truck,
  Target
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getPurchases, getProjects } from '../../services/api';
import RequestDetailsModal from './RequestDetailsModal';
import './PurchaseManagerWidget.css';

const PurchaseManagerWidget = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('approvals');
  const [purchases, setPurchases] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);

  // Get user permissions
  const approvalPermissions = user?.permissions?.approvals || {};
  const isSuperuser = user?.is_superuser || false;

  // Get user's name (from collaborator or email)
  const userName = user?.collaborator_name || user?.email?.split('@')[0] || '';

  const canApproveTech = isSuperuser || approvalPermissions.approve_technical || false;
  const canApproveControl = isSuperuser || approvalPermissions.approve_budget || false;
  const canApproveFinance = isSuperuser || approvalPermissions.approve_finance || false;
  const hasAnyApprovalPermission = canApproveTech || canApproveControl || canApproveFinance;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [purchasesRes, projectsRes] = await Promise.all([
        getPurchases(),
        getProjects()
      ]);
      setPurchases(purchasesRes.data);
      setProjects(projectsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get project coordinator by project_id
  const getProjectCoordinator = (projectId) => {
    if (!projectId) return null;
    const project = projects.find(p => p.id === projectId);
    return project?.coordinator || null;
  };

  // Filter pending approvals - only projects where user is coordinator
  const getPendingApprovals = () => {
    return purchases.filter(p => {
      if (p.status === 'rejected' || p.status === 'approved') return false;

      // First check if user is coordinator of this project (unless superuser)
      if (!isSuperuser) {
        const projectCoordinator = getProjectCoordinator(p.project_id);
        if (!projectCoordinator) return false;
        const isCoordinator = projectCoordinator.toLowerCase() === userName.toLowerCase();
        if (!isCoordinator) return false;
      }

      // Check which approval is needed and if user can approve it
      if (!p.tech_approval_at && canApproveTech) return true;
      if (p.tech_approval_at && !p.control_approval_at && canApproveControl) return true;
      if (p.tech_approval_at && p.control_approval_at && !p.finance_approval_at && canApproveFinance) return true;

      return false;
    });
  };

  // Get tracking items - only where user is project coordinator
  const getTrackingItems = () => {
    return purchases.filter(p => {
      if (p.status === 'cancelled') return false;

      // Check if ALL items are delivered (completed) - hide from tracking
      const items = p.items || [];
      if (items.length > 0) {
        const allDelivered = items.every(item => item.status === 'delivered');
        if (allDelivered) return false; // Hide completed purchases
      }

      // Check if user is the coordinator of the project
      const projectCoordinator = getProjectCoordinator(p.project_id);
      if (!projectCoordinator) return false;

      // Compare coordinator name with user name (case insensitive)
      const isCoordinator = projectCoordinator.toLowerCase() === userName.toLowerCase();

      // Superuser sees all
      return isCoordinator || isSuperuser;
    }).slice(0, 10); // Limit to 10 items
  };

  const getApprovalStage = (purchase) => {
    if (purchase.status === 'approved') return { stage: 4, label: 'Aprovado', color: '#22c55e' };
    if (purchase.status === 'rejected') return { stage: 0, label: 'Rejeitado', color: '#ef4444' };
    if (!purchase.tech_approval_at) return { stage: 1, label: 'Aguardando Técnica', color: '#f59e0b' };
    if (!purchase.control_approval_at) return { stage: 2, label: 'Aguardando Controle', color: '#f59e0b' };
    if (!purchase.finance_approval_at) return { stage: 3, label: 'Aguardando Financeiro', color: '#f59e0b' };
    return { stage: 4, label: 'Aprovado', color: '#22c55e' };
  };

  const getItemStatus = (purchase) => {
    const items = purchase.items || [];
    if (items.length === 0) return { status: 'pending', label: 'Sem itens', item: null };

    // Find non-delivered items and sort by expected_date (earliest first)
    const pendingItems = items.filter(item => item.status !== 'delivered');

    // Sort by expected_date (earliest first), items without date go to end
    pendingItems.sort((a, b) => {
      if (!a.expected_date && !b.expected_date) return 0;
      if (!a.expected_date) return 1;
      if (!b.expected_date) return -1;
      return new Date(a.expected_date) - new Date(b.expected_date);
    });

    const targetItem = pendingItems[0] || items[0]; // Fallback to first if all delivered

    const statusMap = {
      'pending': { label: 'Pendente', color: '#94a3b8', icon: Clock },
      'quoted': { label: 'Cotado', color: '#f59e0b', icon: Package },
      'bought': { label: 'Comprado', color: '#3b82f6', icon: ShoppingCart },
      'in_stock': { label: 'Em Estoque', color: '#8b5cf6', icon: Package },
      'delivered': { label: 'Entregue', color: '#22c55e', icon: CheckCircle },
      'cancelled': { label: 'Cancelado', color: '#ef4444', icon: AlertCircle }
    };

    return { ...statusMap[targetItem.status] || statusMap['pending'], item: targetItem };
  };

  const getDeliveryInfo = (purchase) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Engineer's Expectation Date (Left Side)
    let engineerDateStr = null;
    if (purchase.category === 'SERVICE') {
      engineerDateStr = purchase.service_start_date;
    } else {
      engineerDateStr = purchase.arrival_forecast;
    }

    const engineerDateFormatted = engineerDateStr
      ? (() => {
        const [y, m, d] = engineerDateStr.split('-').map(Number);
        return new Date(y, m - 1, d).toLocaleDateString('pt-BR');
      })()
      : null;

    // 2. Purchasing's Forecast Date (Right Side - Timer)
    // Find earliest expected date from NON-DELIVERED items only
    const items = purchase.items || [];
    let purchasingDateStr = null;
    let earliestDate = null;

    for (const item of items) {
      if (item.status === 'delivered') continue;
      if (item.expected_date) {
        const [y, m, d] = item.expected_date.split('-').map(Number);
        const date = new Date(y, m - 1, d);
        if (!earliestDate || date < earliestDate) {
          earliestDate = date;
        }
      }
    }

    // Timer Logic
    // Default style to match engineer date
    // We will render this in the JSX, but here we just flag properties
    let timerInfo = null;

    if (earliestDate) {
      const diffTime = earliestDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        timerInfo = {
          text: `Atrasado (${Math.abs(diffDays)} dias)`,
          isLate: true,
          isSoon: false,
          showTruck: false // Late shows AlertCircle
        };
      } else if (diffDays === 0) {
        timerInfo = { text: 'Hoje', isLate: false, isSoon: true, showTruck: true };
      } else if (diffDays === 1) {
        timerInfo = { text: 'Amanhã', isLate: false, isSoon: true, showTruck: true };
      } else if (diffDays <= 7) {
        timerInfo = { text: `Faltam ${diffDays} dias`, isLate: false, isSoon: true, showTruck: true };
      } else {
        // More than 7 days
        timerInfo = {
          text: earliestDate.toLocaleDateString('pt-BR'),
          isLate: false,
          isSoon: false,
          showTruck: true
        };
      }
    } else {
      timerInfo = {
        text: 'Sem previsão',
        isLate: false,
        isSoon: false,
        showTruck: true
      };
    }

    return {
      engineerDate: engineerDateFormatted,
      timer: timerInfo
    };
  };

  const pendingApprovals = getPendingApprovals();
  const trackingItems = getTrackingItems();

  if (loading) {
    return (
      <div className="dashboard-widget purchase-manager-widget full-width">
        <div className="purchase-header">
          <h4><ShoppingCart size={18} /> Minhas Compras e Aprovações</h4>
        </div>
        <div className="widget-loading">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-widget purchase-manager-widget full-width">
      <div className="purchase-header">
        <h4><ShoppingCart size={18} /> Minhas Compras e Aprovações</h4>
      </div>

      {/* Tabs */}
      <div className="purchase-tabs">
        {hasAnyApprovalPermission && (
          <button
            className={`tab ${activeTab === 'approvals' ? 'active' : ''}`}
            onClick={() => setActiveTab('approvals')}
          >
            Minhas Aprovações
            {pendingApprovals.length > 0 && (
              <span className="tab-badge">{pendingApprovals.length}</span>
            )}
          </button>
        )}
        <button
          className={`tab ${activeTab === 'tracking' ? 'active' : ''}`}
          onClick={() => setActiveTab('tracking')}
        >
          Rastreio de Entregas
        </button>
      </div>

      {/* Tab Content */}
      <div className="purchase-tab-content">
        {/* Approvals Tab */}
        {activeTab === 'approvals' && hasAnyApprovalPermission && (
          <div className="approvals-list">
            {pendingApprovals.length === 0 ? (
              <div className="empty-state-inline">
                <CheckCircle size={24} className="success-icon" />
                <span>Nada pendente 🎉</span>
              </div>
            ) : (
              pendingApprovals.map(purchase => {
                const stage = getApprovalStage(purchase);
                return (
                  <div
                    key={purchase.id}
                    className="approval-item"
                    onClick={() => setSelectedRequest(purchase)}
                  >
                    <div className="approval-item-info">
                      <span className="approval-item-name">
                        {purchase.description || `Solicitação #${purchase.id}`}
                      </span>
                      <span className="approval-item-stage" style={{ color: stage.color }}>
                        {stage.label}
                      </span>
                    </div>
                    <ChevronRight size={18} className="chevron" />
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tracking Tab */}
        {activeTab === 'tracking' && (
          <div className="tracking-list">
            {trackingItems.length === 0 ? (
              <div className="empty-state-inline">
                <Package size={24} />
                <span>Nenhuma compra para rastrear</span>
              </div>
            ) : (
              trackingItems.map(purchase => {
                const itemStatus = getItemStatus(purchase);
                const deliveryInfo = getDeliveryInfo(purchase);

                return (
                  <div
                    key={purchase.id}
                    className="flex justify-between items-center py-4 border-b border-slate-100 last:border-0 hover:bg-slate-50/80 cursor-pointer px-2 transition-all duration-200 group"
                    onClick={() => setSelectedRequest(purchase)}
                  >
                    {/* Lado Esquerdo (flex-1 min-w-0 pr-4) */}
                    <div className="flex-1 min-w-0 pr-4">
                      {/* Linha 1: Título real do pedido + Nome do Item */}
                      <span className="text-sm font-semibold text-gray-900 truncate block">
                        {purchase.description || `Solicitação #${purchase.id}`}
                        {itemStatus.item?.description && itemStatus.item.description !== purchase.description && (
                          <span className="text-gray-500 font-medium whitespace-pre"> — {itemStatus.item.description}</span>
                        )}
                      </span>
                      {/* Linha 2: Contexto (TAG, Projeto e Cliente) */}
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500 truncate">
                        <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-tight whitespace-nowrap">
                          {purchase.project_tag || '-'}
                        </span>
                        <span className="truncate">
                          {purchase.project_name} &bull; {purchase.client_name}
                        </span>
                      </div>
                    </div>

                    {/* Lado Direito (flex items-center gap-4 shrink-0) */}
                    <div className="flex items-center gap-4 shrink-0">
                      {/* Previsão / Timer (Opcional, discreto) */}
                      {deliveryInfo.timer && (
                        <div className="hidden lg:flex flex-col items-end text-right mr-2">
                          <span className={`text-[10px] font-bold ${deliveryInfo.timer.isLate ? 'text-rose-600' : deliveryInfo.timer.isSoon ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {deliveryInfo.timer.text}
                          </span>
                        </div>
                      )}

                      {/* Status: Badge com LARGURA FIXA para alinhamento perfeito */}
                      <div className={`
                        w-[140px] flex justify-center text-center px-2 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider border whitespace-nowrap
                        ${itemStatus.item?.status === 'pending' ? 'bg-slate-50 text-slate-600 border-slate-200' : ''}
                        ${itemStatus.item?.status === 'quoted' ? 'bg-amber-50 text-amber-600 border-amber-200' : ''}
                        ${itemStatus.item?.status === 'bought' ? 'bg-blue-50 text-blue-600 border-blue-200' : ''}
                        ${itemStatus.item?.status === 'in_stock' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : ''}
                        ${itemStatus.item?.status === 'delivered' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : ''}
                        ${itemStatus.item?.status === 'cancelled' ? 'bg-rose-50 text-rose-600 border-rose-200' : ''}
                        ${!['pending','quoted','bought','in_stock','delivered','cancelled'].includes(itemStatus.item?.status) ? 'bg-gray-50 text-gray-600 border-gray-200' : ''}
                      `}>
                        {itemStatus.label}
                      </div>
                      
                      <ChevronRight size={14} className="text-gray-300 group-hover:text-slate-400 group-hover:translate-x-1 transition-all duration-200" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Request Details Modal - Read Only from Dashboard */}
      {selectedRequest && (
        <RequestDetailsModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onUpdate={() => {
            loadData();
            // Refresh the selected request with new data
            getPurchases().then(res => {
              const updated = res.data.find(p => p.id === selectedRequest.id);
              if (updated) setSelectedRequest(updated);
            });
          }}
          context="purchases"
          readOnly={true}
        />
      )}
    </div>
  );
};

export default PurchaseManagerWidget;
