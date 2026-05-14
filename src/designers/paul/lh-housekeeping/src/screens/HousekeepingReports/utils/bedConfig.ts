export const BED_CONFIG_KEYWORDS = ['extra bed', 'rollaway', 'king bed'];

export function shouldShowBedConfig(config: string): boolean {
  const lower = config.toLowerCase();
  return BED_CONFIG_KEYWORDS.some(k => lower.includes(k));
}
