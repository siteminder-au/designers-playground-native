import React, { createContext, useContext, useState } from 'react';
import type { ReviewAnnotations } from '../components/ReviewOverlay';

interface ReviewContextValue {
  annotations: ReviewAnnotations | null;
  setAnnotations: (a: ReviewAnnotations | null) => void;
  scrollY: number;
  setScrollY: (y: number) => void;
}

const ReviewContext = createContext<ReviewContextValue>({
  annotations: null,
  setAnnotations: () => {},
  scrollY: 0,
  setScrollY: () => {},
});

export function ReviewProvider({ children }: { children: React.ReactNode }) {
  const [annotations, setAnnotations] = useState<ReviewAnnotations | null>(null);
  const [scrollY, setScrollY] = useState(0);
  return (
    <ReviewContext.Provider value={{ annotations, setAnnotations, scrollY, setScrollY }}>
      {children}
    </ReviewContext.Provider>
  );
}

export function useReviewContext() {
  return useContext(ReviewContext);
}
