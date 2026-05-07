import React, { createContext, useContext, useState } from 'react';

export type RoomStatus = 'CLEANED' | 'UNCLEANED' | 'DEEP_CLEAN' | 'SKIP_CLEANING' | 'AWAITING_INSPECTION';

interface HousekeepingStatusContextValue {
  statusOverrides: Record<string, RoomStatus>;
  setStatusOverride: (roomId: string, status: RoomStatus) => void;
  housekeeperMode: boolean;
  setHousekeeperMode: (value: boolean) => void;
}

const HousekeepingStatusContext = createContext<HousekeepingStatusContextValue>({
  statusOverrides: {},
  setStatusOverride: () => {},
  housekeeperMode: false,
  setHousekeeperMode: () => {},
});

export function HousekeepingStatusProvider({ children }: { children: React.ReactNode }) {
  const [statusOverrides, setStatusOverrides] = useState<Record<string, RoomStatus>>({});
  const [housekeeperMode, setHousekeeperMode] = useState(false);

  function setStatusOverride(roomId: string, status: RoomStatus) {
    setStatusOverrides(prev => ({ ...prev, [roomId]: status }));
  }

  return (
    <HousekeepingStatusContext.Provider value={{ statusOverrides, setStatusOverride, housekeeperMode, setHousekeeperMode }}>
      {children}
    </HousekeepingStatusContext.Provider>
  );
}

export function useHousekeepingStatus() {
  return useContext(HousekeepingStatusContext);
}
