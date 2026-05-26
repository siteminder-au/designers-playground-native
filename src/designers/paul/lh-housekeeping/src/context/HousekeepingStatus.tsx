import React, { createContext, useContext, useState } from 'react';
import { useMutation } from '@apollo/client';
import { UPDATE_ROOM_STATUS } from '../apollo/queries';

export type RoomStatus = 'CLEANED' | 'UNCLEANED' | 'DEEP_CLEAN' | 'SKIP_CLEANING' | 'AWAITING_INSPECTION';

interface HousekeepingStatusContextValue {
  statusOverrides: Record<string, RoomStatus>;
  setStatusOverride: (roomId: string, status: RoomStatus) => void;
  housekeeperMode: boolean;
  setHousekeeperMode: (value: boolean) => void;
  // Cross-screen demo flag: when true, cleaning status is shown as a coloured
  // text label (Calendar room column + Housekeeping status pills) instead of
  // the circular icon. Set from either screen's demo flags sheet.
  cleaningStatusAsLabel: boolean;
  setCleaningStatusAsLabel: (value: boolean) => void;
}

const HousekeepingStatusContext = createContext<HousekeepingStatusContextValue>({
  statusOverrides: {},
  setStatusOverride: () => {},
  housekeeperMode: false,
  setHousekeeperMode: () => {},
  cleaningStatusAsLabel: false,
  setCleaningStatusAsLabel: () => {},
});

export function HousekeepingStatusProvider({ children }: { children: React.ReactNode }) {
  const [statusOverrides, setStatusOverrides] = useState<Record<string, RoomStatus>>({});
  const [housekeeperMode, setHousekeeperMode] = useState(false);
  const [cleaningStatusAsLabel, setCleaningStatusAsLabel] = useState(false);
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
    <HousekeepingStatusContext.Provider value={{ statusOverrides, setStatusOverride, housekeeperMode, setHousekeeperMode, cleaningStatusAsLabel, setCleaningStatusAsLabel }}>
      {children}
    </HousekeepingStatusContext.Provider>
  );
}

export function useHousekeepingStatus() {
  return useContext(HousekeepingStatusContext);
}
