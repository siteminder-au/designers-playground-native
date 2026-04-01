import React, { createContext, useContext, useState } from 'react';

export type RoomStatus = 'CLEANED' | 'UNCLEANED' | 'SKIP_CLEANING';

interface HousekeepingStatusContextValue {
  statusOverrides: Record<string, RoomStatus>;
  setStatusOverride: (roomId: string, status: RoomStatus) => void;
}

const HousekeepingStatusContext = createContext<HousekeepingStatusContextValue>({
  statusOverrides: {},
  setStatusOverride: () => {},
});

export function HousekeepingStatusProvider({ children }: { children: React.ReactNode }) {
  const [statusOverrides, setStatusOverrides] = useState<Record<string, RoomStatus>>({});

  function setStatusOverride(roomId: string, status: RoomStatus) {
    setStatusOverrides(prev => ({ ...prev, [roomId]: status }));
  }

  return (
    <HousekeepingStatusContext.Provider value={{ statusOverrides, setStatusOverride }}>
      {children}
    </HousekeepingStatusContext.Provider>
  );
}

export function useHousekeepingStatus() {
  return useContext(HousekeepingStatusContext);
}
