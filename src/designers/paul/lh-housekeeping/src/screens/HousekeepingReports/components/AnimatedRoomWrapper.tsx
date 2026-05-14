import React, { useRef, useLayoutEffect } from 'react';
import { View, Animated, Platform } from 'react-native';

// FLIP-animated wrapper: after each render, measures each row's screen Y and
// slides it from its previous Y to the new one when the list reorders.
// Uses getBoundingClientRect on web (RN Web's onLayout doesn't fire on flex
// reposition) and measureInWindow on native.

export function AnimatedRoomWrapper({
  id,
  positionsRef,
  shouldAnimate,
  children,
}: {
  id: string;
  positionsRef: React.MutableRefObject<Map<string, number>>;
  shouldAnimate: boolean;
  children: React.ReactNode;
}) {
  const ref = useRef<View>(null);
  const translateY = useRef(new Animated.Value(0)).current;

  function applyDelta(oldY: number, newY: number) {
    if (Math.abs(oldY - newY) > 1) {
      translateY.setValue(oldY - newY);
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: Platform.OS !== 'web',
        damping: 22,
        stiffness: 220,
      }).start();
    }
  }

  useLayoutEffect(() => {
    const node = ref.current as any;
    if (!node) return;
    // Only animate when the sort order changed (shouldAnimate=true). On other
    // re-renders (opening dropdowns, polling, etc.), record positions for the
    // next reorder but skip the animation so layout-shift noise doesn't trigger
    // spurious slides.
    if (typeof node.getBoundingClientRect === 'function') {
      const newY = node.getBoundingClientRect().top;
      const lastY = positionsRef.current.get(id);
      if (shouldAnimate && lastY != null) applyDelta(lastY, newY);
      positionsRef.current.set(id, newY);
    } else if (typeof node.measureInWindow === 'function') {
      node.measureInWindow((_x: number, y: number) => {
        const lastY = positionsRef.current.get(id);
        if (shouldAnimate && lastY != null) applyDelta(lastY, y);
        positionsRef.current.set(id, y);
      });
    }
  });

  return (
    <View ref={ref}>
      <Animated.View style={{ transform: [{ translateY }] }}>
        {children}
      </Animated.View>
    </View>
  );
}
