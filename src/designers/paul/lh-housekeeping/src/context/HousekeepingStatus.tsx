import React, { createContext, useContext, useState } from 'react';
import { useMutation } from '@apollo/client';
import { UPDATE_ROOM_STATUS } from '../apollo/queries';

export type RoomStatus = 'CLEANED' | 'UNCLEANED' | 'DEEP_CLEAN' | 'SKIP_CLEANING' | 'AWAITING_INSPECTION';

// Access level the prototype is presenting as:
//  - 'full'    : full access (default; the complete manager view)
//  - 'limited' : limited access (the housekeeper view)
//  - 'browser' : browser view (placeholder — not built yet)
export type ViewMode = 'full' | 'limited' | 'browser';

interface HousekeepingStatusContextValue {
  statusOverrides: Record<string, RoomStatus>;
  setStatusOverride: (roomId: string, status: RoomStatus) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  /** Derived convenience: true in the limited (housekeeper) UI — i.e. for both
   *  the 'limited' and 'browser' view modes. */
  housekeeperMode: boolean;
  // Cross-screen demo flag: when true, cleaning status is shown as a coloured
  // text label (Calendar room column + Housekeeping status pills) instead of
  // the circular icon. Set from either screen's demo flags sheet.
  cleaningStatusAsLabel: boolean;
  setCleaningStatusAsLabel: (value: boolean) => void;
  // Dev tool: floating "capture screenshot for design review" button. When
  // true, a small FAB sits in the bottom-right of every screen.
  reviewCaptureFabEnabled: boolean;
  setReviewCaptureFabEnabled: (value: boolean) => void;
}

const HousekeepingStatusContext = createContext<HousekeepingStatusContextValue>({
  statusOverrides: {},
  setStatusOverride: () => {},
  viewMode: 'full',
  setViewMode: () => {},
  housekeeperMode: false,
  cleaningStatusAsLabel: false,
  setCleaningStatusAsLabel: () => {},
  reviewCaptureFabEnabled: false,
  setReviewCaptureFabEnabled: () => {},
});

export function HousekeepingStatusProvider({ children }: { children: React.ReactNode }) {
  const [statusOverrides, setStatusOverrides] = useState<Record<string, RoomStatus>>({});
  const [viewMode, setViewMode] = useState<ViewMode>('full');
  // Browser view renders the same limited UI as 'limited' — it just sits inside
  // a faux browser window — so both map to housekeeper (limited) mode.
  const housekeeperMode = viewMode === 'limited' || viewMode === 'browser';
  const [cleaningStatusAsLabel, setCleaningStatusAsLabel] = useState(false);
  const [reviewCaptureFabEnabled, setReviewCaptureFabEnabled] = useState(false);
  const [updateRoomStatusMutation] = useMutation(UPDATE_ROOM_STATUS);

  function setStatusOverride(roomId: string, status: RoomStatus) {
    setStatusOverrides(prev => ({ ...prev, [roomId]: status }));
    updateRoomStatusMutation({ variables: { roomId, status } })
      .catch(err => { console.warn('[paul] updateRoomStatus failed', err); })
      .finally(() => {
        // Clear the local override once the mutation settles so polled updates
        // from the DB (e.g. Si's changes) are no longer shadowed.
        setStatusOverrides(prev => {
          const next = { ...prev };
          delete next[roomId];
          return next;
        });
      });
  }

  return (
    <HousekeepingStatusContext.Provider value={{ statusOverrides, setStatusOverride, viewMode, setViewMode, housekeeperMode, cleaningStatusAsLabel, setCleaningStatusAsLabel, reviewCaptureFabEnabled, setReviewCaptureFabEnabled }}>
      {children}
    </HousekeepingStatusContext.Provider>
  );
}

export function useHousekeepingStatus() {
  return useContext(HousekeepingStatusContext);
}
