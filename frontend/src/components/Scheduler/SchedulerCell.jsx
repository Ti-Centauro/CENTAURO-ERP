import React, { useState } from 'react';
import { X } from 'lucide-react';
import ProjectPopover from './ProjectPopover';

/**
 * SchedulerCell - Renders a single cell in the scheduler grid
 * 
 * Features:
 * - Click empty cell: Opens Quick Allocation Popover
 * - Click allocation bar: Opens edit modal
 * - Drag-to-Fill: Grab handle to extend allocation to adjacent days
 * - Quick Delete: X button on hover to delete allocation
 */
const SchedulerCell = ({
  date,
  dayIndex,
  resourceId,
  resourceType,
  allocations = [],
  isWeekend = false,
  isHoliday = false,
  isHighlighted = false,
  isDragging = false,
  projects = [],
  clients = [],
  onCellClick,
  onAllocationClick,
  onQuickAllocate,
  onDelete,
  onDragStart,
  onDragEnter,
  canEdit = true,
  isSelectionMode,
  selectedAllocationIds,
  onSelectAllocation
}) => {
  const [showPopover, setShowPopover] = useState(false);

  // ... (getProjectInfo)

  const hasAllocations = allocations.length > 0;

  const handleCellClick = (e) => {
    e.stopPropagation();

    if (!canEdit) return;

    // If cell is empty, show popover for quick allocation
    if (!hasAllocations && onQuickAllocate && !isSelectionMode) {
      setShowPopover(true);
    } else if (onCellClick && !isSelectionMode) {
      // Fallback to original behavior (open modal)
      onCellClick({ date, resourceId, resourceType });
    }
  };

  // Get project and client info for an allocation
  const getProjectInfo = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return { tag: `Proj #${projectId}`, clientName: '-' };

    const client = clients.find(c => c.id === project.client_id);
    const clientName = client?.name?.split(' ')[0] || '-';

    return {
      tag: project.tag || project.name,
      clientName,
      fullName: `${client?.name || 'Cliente'} | ${project.tag}`
    };
  };

  const handleProjectSelect = (project) => {
    setShowPopover(false);
    if (onQuickAllocate) {
      onQuickAllocate(project.id, date, resourceId, resourceType);
    }
  };

  const handleDragHandleMouseDown = (e, alloc) => {
    e.stopPropagation();
    e.preventDefault();
    if (onDragStart) {
      onDragStart(alloc, dayIndex, date);
    }
  };

  const handleCellMouseEnter = () => {
    if (isDragging && onDragEnter) {
      onDragEnter(dayIndex, date);
    }
  };

  const handleDeleteClick = (e, allocId) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(allocId);
    }
  };

  const cellClasses = [
    'allocation-cell',
    isWeekend ? 'weekend' : '',
    isHoliday ? 'holiday' : '',
    isHighlighted ? 'cell-drag-highlight' : ''
  ].filter(Boolean).join(' ');

  return (
    <div
      className={cellClasses}
      onClick={handleCellClick}
      onMouseEnter={handleCellMouseEnter}
      style={{
        cursor: canEdit && !isSelectionMode ? 'pointer' : 'default',
        position: 'relative' // For popover positioning
      }}
    >
      {/* Allocation Bars */}
      {allocations.map((alloc) => {
        const projectInfo = getProjectInfo(alloc.project_id);
        const isSelected = selectedAllocationIds?.has(alloc.id);

        return (
          <div
            key={alloc.id}
            className={`allocation-bar ${isSelected ? 'selected' : ''} ${isSelectionMode ? 'selection-mode' : ''}`}
            style={{
              left: '0%',
              width: '100%',
              backgroundColor: alloc.status === 'CONFIRMED' ? '#3b82f6' : '#f59e0b'
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (isSelectionMode && onSelectAllocation) {
                onSelectAllocation(alloc.id);
              } else if (canEdit && onAllocationClick) {
                onAllocationClick(alloc);
              }
            }}
            title={projectInfo.fullName}
          >
            <span className="allocation-tag">{projectInfo.tag}</span>
            <span className="allocation-client">{projectInfo.clientName}</span>

            {/* Selection Checkbox Overlay (Optional, visually helpful) */}
            {isSelectionMode && (
              <div style={{
                position: 'absolute',
                right: '4px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '14px',
                height: '14px',
                borderRadius: '3px',
                border: '1px solid white',
                background: isSelected ? '#ef4444' : 'rgba(255,255,255,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {isSelected && <span style={{ color: 'white', fontSize: '10px', fontWeight: 'bold' }}>✓</span>}
              </div>
            )}

            {/* Delete Button - Hide in selection mode */}
            {canEdit && !isSelectionMode && (
              <button
                className="allocation-delete-btn"
                onClick={(e) => handleDeleteClick(e, alloc.id)}
                title="Excluir alocação"
              >
                <X size={10} />
              </button>
            )}

            {/* Drag Handle - Hide in selection mode */}
            {canEdit && !isSelectionMode && (
              <div
                className="drag-handle"
                onMouseDown={(e) => handleDragHandleMouseDown(e, alloc)}
                title="Arraste para estender"
              />
            )}
          </div>
        );
      })}

      {/* Quick Allocation Popover */}
      {showPopover && !isSelectionMode && (
        <ProjectPopover
          projects={projects}
          clients={clients}
          onSelect={handleProjectSelect}
          onClose={() => setShowPopover(false)}
        />
      )}
    </div>
  );
};

export default SchedulerCell;
