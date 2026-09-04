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
  // Overarching data-source switch — ON reads every screen's live GraphQL
  // data (Housekeeping schedule, Calendar reservations); OFF shows each
  // screen's static mock dataset instead. One control for all screens,
  // housed only in Housekeeping's Demo Flags sheet.
  liveData: boolean;
  setLiveData: (value: boolean) => void;
  // Dev tool: in-prototype annotation overlay for the current screen.
  reviewOverlayEnabled: boolean;
  setReviewOverlayEnabled: (value: boolean) => void;
}

const HousekeepingStatusContext = createContext<HousekeepingStatusContextValue>({
  statusOverrides: {},
  setStatusOverride: () => {},
  viewMode: 'full',
  setViewMode: () => {},
  housekeeperMode: false,
  cleaningStatusAsLabel: true,
  setCleaningStatusAsLabel: () => {},
  liveData: false,
  setLiveData: () => {},
  reviewOverlayEnabled: false,
  setReviewOverlayEnabled: () => {},
});

export function HousekeepingStatusProvider({ children }: { children: React.ReactNode }) {
  const [statusOverrides, setStatusOverrides] = useState<Record<string, RoomStatus>>({});
  const [viewMode, setViewMode] = useState<ViewMode>('full');
  // Browser view renders the same limited UI as 'limited' — it just sits inside
  // a faux browser window — so both map to housekeeper (limited) mode.
  const housekeeperMode = viewMode === 'limited' || viewMode === 'browser';
  // Calendar's cleaning-status treatment (dot + coloured label, Figma node
  // 796:40656) is on by default; Housekeeping's DemoFlagsSheet still exposes
  // this toggle but doesn't currently read it for its own rendering.
  const [cleaningStatusAsLabel, setCleaningStatusAsLabel] = useState(true);
  const [liveData, setLiveData] = useState(false);
  const [reviewOverlayEnabled, setReviewOverlayEnabled] = useState(false);
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
    <HousekeepingStatusContext.Provider value={{ statusOverrides, setStatusOverride, viewMode, setViewMode, housekeeperMode, cleaningStatusAsLabel, setCleaningStatusAsLabel, liveData, setLiveData, reviewOverlayEnabled, setReviewOverlayEnabled }}>
      {children}
    </HousekeepingStatusContext.Provider>
  );
}

export function useHousekeepingStatus() {
  return useContext(HousekeepingStatusContext);
}
