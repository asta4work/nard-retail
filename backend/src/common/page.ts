export interface PageMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface PageResult<T> {
  data: T[];
  meta: PageMeta;
}

export function pageResult<T>(data: T[], total: number, page: number, limit: number): PageResult<T> {
  return {
    data,
    meta: { total, page, limit, pages: Math.ceil(total / limit) },
  };
}
