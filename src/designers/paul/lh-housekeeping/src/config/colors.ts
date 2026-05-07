/**
 * Colour tokens from mSUI design system.
 * Source: Figma → mSUI (Outdated) → Colours frame (node 16:4208)
 * Naming mirrors Figma: COLORS.Category[level]
 */
export const COLORS = {
  Primary: {
    100: '#FF6842',
    200: '#F87850',
    300: '#FFA078',
    400: '#FFCCB7',
    500: '#FFE2D7',
    600: '#FFF5EE',
  },

  Black: {
    100: '#212323',
    200: '#333333',
    300: '#484B4B',
    400: '#6D7272',
    500: '#9BA0A0',
    600: '#CCD1D1',
  },

  Background: {
    Brown:  '#F4F4F4',
    Light:  '#F2F3F3',
    Stroke: '#E5E8E8',
    Grey:   '#F5F7FA',
  },

  Brown: {
    100: '#473F38',
    200: '#5E5B58',
    300: '#7C7166',
    400: '#BCA89B',
    500: '#E0D8D4',
    600: '#F5EEE8',
  },

  Green: {
    100: '#1E2600',
    200: '#0A2B19',
    300: '#37420C',
    400: '#6E7B35',
    500: '#4B8151',
    700: '#D6FFDC',
  },

  Purple: {
    100: '#261D32',
    200: '#4F445B',
    300: '#7B6F88',
    400: '#AB95AA',
    500: '#D7CBE4',
    600: '#FFECFF',
  },

  Red: {
    100: '#941E00',
    200: '#C43100',
    300: '#C55000',
    400: '#FDF1ED',
  },

  Maroon: {
    100: '#591A30',
    200: '#914A56',
    300: '#A5626C',
    400: '#C26778',
    500: '#F797A7',
    600: '#FFC9D8',
  },

  Magenta: {
    100: '#891066',
    200: '#9E4472',
    300: '#BC4994',
    400: '#F17AC5',
    500: '#CB7BC5',
    600: '#FFD3FF',
  },

  Earth: {
    100: '#704C00',
    200: '#886900',
    300: '#847509',
  },

  Blue: {
    100: '#004399',
    200: '#006DCB',
    300: '#006DFF',
    400: '#429BFF',
    500: '#23C8F5',
    600: '#D7E8EF',
  },

  Orange: {
    400: '#FF8C00',
    500: '#FFA078',
    600: '#FFB972',
  },

  Yellow: {
    400: '#FFD12B',
    500: '#FFF650',
    600: '#FFFEB3',
  },
} as const;

/** Drop shadow used on inputs */
export const SHADOWS = {
  InputShadow: {
    color: '#E5E8E88A',
    offsetX: 0,
    offsetY: 2,
    radius: 4,
    spread: 0,
  },
} as const;
