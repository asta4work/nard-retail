import { BadRequestException } from '@nestjs/common';
import { ApiExceptionFilter } from './api-exception.filter';

describe('ApiExceptionFilter', () => {
  function setup() {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const host = {
      switchToHttp: () => ({
        getResponse: () => ({ status }),
        getRequest: () => ({ url: '/api/products' }),
      }),
    };
    return { host, status, json };
  }

  it('returns details from HTTP exceptions', () => {
    const { host, status, json } = setup();

    new ApiExceptionFilter().catch(new BadRequestException('Invalid product'), host as never);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 400,
      path: '/api/products',
      message: 'Invalid product',
    }));
  });

  it('hides unexpected internal error details', () => {
    const { host, status, json } = setup();

    new ApiExceptionFilter().catch(new Error('database credentials'), host as never);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 500,
      message: 'An unexpected error occurred',
    }));
  });
});
