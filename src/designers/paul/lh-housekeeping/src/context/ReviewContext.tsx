import React, { createContext, useContext, useState } from 'react';
import type { ReviewAnnotations } from '../components/ReviewOverlay';

interface ReviewContextValue {
  annotations: ReviewAnnotations | null;
  setAnnotations: (a: ReviewAnnotations | null) => void;
  scrollY: number;
  setScrollY: (y: number) => void;
  statusBarColor: string;
  setStatusBarColor: (color: string) => void;
}

const ReviewContext = createContext<ReviewContextValue>({
  annotations: null,
  setAnnotations: () => {},
  scrollY: 0,
  setScrollY: () => {},
  statusBarColor: '#fff',
  setStatusBarColor: () => {},
});

export function ReviewProvider({ children }: { children: React.ReactNode }) {
  const [annotations, setAnnotations] = useState<ReviewAnnotations | null>(null);
  const [scrollY, setScrollY] = useState(0);
  const [statusBarColor, setStatusBarColor] = useState('#fff');
  return (
    <ReviewContext.Provider
      value={{ annotations, setAnnotations, scrollY, setScrollY, statusBarColor, setStatusBarColor }}
    >
      {children}
    </ReviewContext.Provider>
  );
}

export function useReviewContext() {
  return useContext(ReviewContext);
}
