import { z } from 'zod';
import { createRoomSchema, joinRoomSchema, rooms, players } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  rooms: {
    create: {
      method: 'POST' as const,
      path: '/api/rooms',
      input: createRoomSchema,
      responses: {
        201: z.object({ code: z.string(), playerId: z.string() }),
        400: errorSchemas.validation,
      },
    },
    join: {
      method: 'POST' as const,
      path: '/api/rooms/join',
      input: joinRoomSchema,
      responses: {
        200: z.object({ code: z.string(), playerId: z.string() }),
        404: errorSchemas.notFound,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/rooms/:code',
      responses: {
        200: z.object({
          room: z.custom<typeof rooms.$inferSelect>(),
          players: z.array(z.custom<typeof players.$inferSelect>()),
          me: z.custom<typeof players.$inferSelect>().nullable(),
        }),
        404: errorSchemas.notFound,
      },
    },
    start: {
      method: 'POST' as const,
      path: '/api/rooms/:code/start',
      responses: {
        200: z.object({ success: z.boolean() }),
        403: z.object({ message: z.string() }),
      },
    },
    reset: {
      method: 'POST' as const,
      path: '/api/rooms/:code/reset',
      responses: {
        200: z.object({ success: z.boolean() }),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
