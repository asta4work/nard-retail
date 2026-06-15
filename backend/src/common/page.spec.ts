import { pageResult } from './page';

describe('pageResult', () => {
  it('builds consistent pagination metadata', () => {
    expect(pageResult(['item'], 21, 2, 10)).toEqual({
      data: ['item'],
      meta: { total: 21, page: 2, limit: 10, pages: 3 },
    });
  });
});
