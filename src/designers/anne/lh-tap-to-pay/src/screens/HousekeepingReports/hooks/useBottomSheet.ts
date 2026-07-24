import { useEffect, useRef, useState } from 'react';
import { Animated, PanResponder } from 'react-native';

// Shared bottom-sheet pattern: tracks visibility, slides up on open, slides
// down on close, and supports drag-to-dismiss. `hiddenOffset` is how far below
// the screen the sheet starts (and where it returns to when closing).
export function useBottomSheet(hiddenOffset: number = 400) {
  const [visible, setVisible] = useState(false);
  const sheetAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(hiddenOffset)).current;

  useEffect(() => {
    if (visible) {
      translateY.setValue(hiddenOffset);
      sheetAnim.setValue(0);
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 220 }),
        Animated.spring(sheetAnim,  { toValue: 1, useNativeDriver: true, damping: 22, stiffness: 220 }),
      ]).start();
    }
  }, [visible]);

  const close = useRef(() => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: hiddenOffset, duration: 200, useNativeDriver: true }),
      Animated.timing(sheetAnim,  { toValue: 0,            duration: 200, useNativeDriver: true }),
    ]).start(() => setVisible(false));
  }).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,
      onPanResponderMove: (_, g) => { if (g.dy > 0) translateY.setValue(g.dy); },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 80) close();
        else Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
      },
    })
  ).current;

  return { visible, setVisible, close, sheetAnim, translateY, panResponder };
}
