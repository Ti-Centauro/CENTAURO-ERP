import React, { useState, useEffect } from 'react';
import SchedulerCell from './SchedulerCell';

/**
 * ResourceRow - Renders a single row in the scheduler grid
 * 
 * CRITICAL: Uses React.Fragment (<>) to preserve CSS Grid layout.
 * The parent grid in Scheduler.jsx expects flat cell elements.
 * 
 * Also manages drag-to-fill state for this row.
 */
const ResourceRow = ({
  resource,
  days,
  allocations,
  projects,
  clients,
  getHolidayInfo,
  onCellClick,
  onAllocationClick,
  onQuickAllocate,
  onBatchAllocate,
  onDelete,
  canEdit = true,
  isSelectionMode,
  selectedAllocationIds,
  onSelectAllocation
}) => {
  // Drag-to-Fill State
  const [isDragging, setIsDragging] = useState(false);
  const [dragSource, setDragSource] = useState(null); // The allocation being dragged
  const [dragStartIndex, setDragStartIndex] = useState(null);
  const [dragCurrentIndex, setDragCurrentIndex] = useState(null);

  // Get allocations for a specific resource and day
  const getAllocationsForCell = (day) => {
    const dayStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;

    return allocations.filter(alloc => {
      if (!alloc.date) return false;
      return alloc.date === dayStr &&
        alloc.resource_type === resource.type &&
        alloc.resource_id === resource.originalId;
    });
  };

  // Handle drag start from allocation bar
  const handleDragStart = (alloc, dayIndex, date) => {
    setIsDragging(true);
    setDragSource(alloc);
    setDragStartIndex(dayIndex);
    setDragCurrentIndex(dayIndex);
  };

  // Handle mouse entering a cell during drag
  const handleDragEnter = (dayIndex, date) => {
    if (isDragging && dayIndex > dragStartIndex) {
      setDragCurrentIndex(dayIndex);
    }
  };

  // Handle drag end (mouse up anywhere)
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseUp = () => {
      if (isDragging && dragSource && dragStartIndex !== null && dragCurrentIndex !== null) {
        // Calculate the date range to fill
        const startIdx = dragStartIndex + 1; // Start from next day
        const endIdx = dragCurrentIndex;

        if (endIdx > dragStartIndex && onBatchAllocate) {
          const datesToFill = [];
          for (let i = startIdx; i <= endIdx; i++) {
            if (days[i]) {
              datesToFill.push(days[i]);
            }
          }

          if (datesToFill.length > 0) {
            onBatchAllocate(
              dragSource,
              datesToFill,
              resource.originalId,
              resource.type
            );
          }
        }
      }

      // Reset drag state
      setIsDragging(false);
      setDragSource(null);
      setDragStartIndex(null);
      setDragCurrentIndex(null);
    };

    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, [isDragging, dragSource, dragStartIndex, dragCurrentIndex, days, onBatchAllocate, resource]);

  // Calculate which cells should be highlighted
  const isHighlighted = (dayIndex) => {
    if (!isDragging || dragStartIndex === null || dragCurrentIndex === null) return false;
    // Highlight cells between start (exclusive) and current (inclusive)
    return dayIndex > dragStartIndex && dayIndex <= dragCurrentIndex;
  };

  return (
    <>
      {/* Resource Info Cell (Left Column) */}
      <div className="resource-cell">
        <span className={`resource-badge ${resource.type.toLowerCase()}`}>
          {resource.type === 'PERSON' ? '👤' : (resource.type === 'CAR' ? '🚗' : '🔧')}
        </span>
        <span className="resource-name">{resource.name}</span>
      </div>

      {/* Day Cells */}
      {days.map((day, dayIndex) => {
        const cellAllocations = getAllocationsForCell(day);
        const isWeekend = day.getDay() === 0 || day.getDay() === 6;
        const holidayInfo = getHolidayInfo ? getHolidayInfo(day) : null;

        return (
          <SchedulerCell
            key={`${resource.id}-${dayIndex}`}
            date={day}
            dayIndex={dayIndex}
            resourceId={resource.originalId}
            resourceType={resource.type}
            allocations={cellAllocations}
            isWeekend={isWeekend}
            isHoliday={!!holidayInfo}
            isHighlighted={isHighlighted(dayIndex)}
            isDragging={isDragging}
            projects={projects}
            clients={clients}
            onCellClick={onCellClick}
            onAllocationClick={onAllocationClick}
            onQuickAllocate={onQuickAllocate}
            onDelete={onDelete}
            onDragStart={handleDragStart}
            onDragEnter={handleDragEnter}
            canEdit={canEdit}

            isSelectionMode={isSelectionMode}
            selectedAllocationIds={selectedAllocationIds}
            onSelectAllocation={onSelectAllocation}
          />
        );
      })}
    </>
  );
};

export default ResourceRow;
