import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { validate } from './validate.js';

describe('validate middleware', () => {
  it('parses request sections and strips unknown body fields', async () => {
    const request = {
      body: { email: 'DEMO@WORKROOM.IO', ignored: true },
      query: {},
      params: {},
    } as any;
    const next = vi.fn();
    const schema = z.object({
      body: z.object({ email: z.string().email().transform((value) => value.toLowerCase()) }),
    });

    await validate(schema)(request, {} as any, next);

    expect(request.body).toEqual({ email: 'demo@workroom.io' });
    expect(next).toHaveBeenCalledWith();
  });

  it('forwards validation errors to the centralized error handler', async () => {
    const request = { body: { email: 'invalid' }, query: {}, params: {} } as any;
    const next = vi.fn();
    const schema = z.object({ body: z.object({ email: z.string().email() }) });

    await validate(schema)(request, {} as any, next);

    expect(next).toHaveBeenCalledOnce();
    expect(next.mock.calls[0][0]).toBeInstanceOf(z.ZodError);
  });
});
