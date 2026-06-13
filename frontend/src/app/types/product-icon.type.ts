export const PRODUCT_ICON_OPTIONS = [
  { value: 'package', label: 'Package' },
  { value: 'coffee', label: 'Coffee' },
  { value: 'laptop', label: 'Electronics' },
  { value: 'shirt', label: 'Clothing' },
  { value: 'shopping-bag', label: 'Shopping bag' },
  { value: 'book-open', label: 'Book' },
  { value: 'utensils', label: 'Food' },
  { value: 'sparkles', label: 'Featured' },
] as const;

export type ProductIcon = typeof PRODUCT_ICON_OPTIONS[number]['value'];
