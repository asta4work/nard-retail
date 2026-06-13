export interface Page<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; pages: number };
}

export const emptyPage = <T>(limit = 20): Page<T> => ({
  data: [],
  meta: { total: 0, page: 1, limit, pages: 0 },
});
