import React from 'react';
import { View, StyleSheet } from 'react-native';
import CardMastercardSvg from '../../../../assets/CardMastercard.svg';
import CardVisaSvg from '../../../../assets/CardVisa.svg';
import CardAmexSvg from '../../../../assets/CardAmex.svg';

export type CardBrand = 'mastercard' | 'visa' | 'amex';

const BRAND_SVGS: Record<CardBrand, React.FC<{ width?: number; height?: number }>> = {
  mastercard: CardMastercardSvg,
  visa: CardVisaSvg,
  amex: CardAmexSvg,
};

export function CardBrandIcon({ brand }: { brand: CardBrand }) {
  const Svg = BRAND_SVGS[brand];
  return (
    <View style={styles.box}>
      <Svg width={20} height={14} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
});
