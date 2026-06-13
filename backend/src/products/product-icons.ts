export const PRODUCT_ICONS = [
  'package',
  'coffee',
  'laptop',
  'shirt',
  'shopping-bag',
  'book-open',
  'utensils',
  'sparkles',
] as const;

export type ProductIcon = typeof PRODUCT_ICONS[number];
