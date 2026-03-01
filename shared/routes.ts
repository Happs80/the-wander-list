
import { z } from 'zod';
import { insertItemSchema, insertItineraryDaySchema, insertMasterItemSchema, insertItineraryStageSchema, insertMasterChecklistItemSchema, insertTripChecklistSchema, items, itineraryDays, itineraryStages, groups, users, masterItems, masterChecklistItems, tripChecklist } from './schema';

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
  auth: {
    me: {
      method: 'GET' as const,
      path: '/api/user',
      responses: {
        200: z.custom<typeof users.$inferSelect>().nullable(),
      }
    },
    updateProfile: {
      method: 'PATCH' as const,
      path: '/api/user/profile',
      input: z.object({
        nickname: z.string().optional(),
        mobileNumber: z.string().optional(),
        unitSystem: z.enum(['metric', 'imperial']).optional(),
        dateFormat: z.enum(['DD-MM-YYYY', 'MM-DD-YYYY']).optional(),
      }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
      }
    },
    deleteAccount: {
      method: 'DELETE' as const,
      path: '/api/user',
      responses: {
        204: z.void(),
      }
    }
  },
  groups: {
    create: {
      method: 'POST' as const,
      path: '/api/groups',
      input: z.object({ 
        name: z.string(),
        location: z.string().optional(),
        tripTypes: z.array(z.string()).optional(),
      }),
      responses: {
        201: z.custom<typeof groups.$inferSelect>(),
        401: errorSchemas.internal, // Not logged in
      },
    },
    join: {
      method: 'POST' as const,
      path: '/api/groups/join',
      input: z.object({ shareCode: z.string() }),
      responses: {
        200: z.custom<typeof groups.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/groups/:id',
      responses: {
        200: z.custom<typeof groups.$inferSelect & { members: (typeof users.$inferSelect)[] }>(),
        404: errorSchemas.notFound,
      },
    },
    list: {
        method: 'GET' as const,
        path: '/api/groups',
        responses: {
            200: z.array(z.custom<typeof groups.$inferSelect & { members: (typeof users.$inferSelect)[] }>()),
        }
    }
  },
  items: {
    list: {
      method: 'GET' as const,
      path: '/api/groups/:groupId/items',
      responses: {
        200: z.array(z.custom<typeof items.$inferSelect & { user: typeof users.$inferSelect | null, carriedByUser: typeof users.$inferSelect | null }>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/groups/:groupId/items',
      input: insertItemSchema.omit({ groupId: true, userId: true }).extend({
        skipClosetSync: z.boolean().optional(),
      }),
      responses: {
        201: z.custom<typeof items.$inferSelect>(),
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/items/:id',
      input: insertItemSchema.partial(),
      responses: {
        200: z.custom<typeof items.$inferSelect>(),
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/items/:id',
      responses: {
        204: z.void(),
      },
    },
  },
  itinerary: {
    list: {
      method: 'GET' as const,
      path: '/api/groups/:groupId/itinerary',
      responses: {
        200: z.array(z.custom<typeof itineraryDays.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/groups/:groupId/itinerary',
      input: insertItineraryDaySchema.omit({ groupId: true }),
      responses: {
        201: z.custom<typeof itineraryDays.$inferSelect>(),
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/itinerary/:id',
      input: insertItineraryDaySchema.partial(),
      responses: {
        200: z.custom<typeof itineraryDays.$inferSelect>(),
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/itinerary/:id',
      responses: {
        204: z.void(),
      },
    },
  },
  masterItems: {
    list: {
      method: 'GET' as const,
      path: '/api/master-items',
      responses: {
        200: z.array(z.custom<typeof masterItems.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/master-items',
      input: insertMasterItemSchema.omit({ userId: true }),
      responses: {
        201: z.custom<typeof masterItems.$inferSelect>(),
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/master-items/:id',
      input: insertMasterItemSchema.partial(),
      responses: {
        200: z.custom<typeof masterItems.$inferSelect>(),
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/master-items/:id',
      responses: {
        204: z.void(),
      },
    },
    syncFromTrip: {
      method: 'POST' as const,
      path: '/api/master-items/sync-from-trip',
      input: z.object({ groupId: z.number() }),
      responses: {
        200: z.object({ added: z.number() }),
      },
    },
    syncToTrip: {
      method: 'POST' as const,
      path: '/api/master-items/sync-to-trip',
      input: z.object({ groupId: z.number(), category: z.enum(['gear', 'clothing']).optional() }),
      responses: {
        200: z.object({ added: z.number() }),
      },
    },
    addToTrip: {
      method: 'POST' as const,
      path: '/api/master-items/add-to-trip',
      input: z.object({ 
        groupId: z.number(), 
        masterItemIds: z.array(z.number()) 
      }),
      responses: {
        200: z.object({ added: z.number() }),
      },
    },
  },
  stages: {
    listByGroup: {
      method: 'GET' as const,
      path: '/api/groups/:groupId/stages',
      responses: {
        200: z.array(z.custom<typeof itineraryStages.$inferSelect>()),
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/itinerary/:dayId/stages',
      responses: {
        200: z.array(z.custom<typeof itineraryStages.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/itinerary/:dayId/stages',
      input: insertItineraryStageSchema.omit({ dayId: true }),
      responses: {
        201: z.custom<typeof itineraryStages.$inferSelect>(),
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/stages/:id',
      input: insertItineraryStageSchema.partial(),
      responses: {
        200: z.custom<typeof itineraryStages.$inferSelect>(),
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/stages/:id',
      responses: {
        204: z.void(),
      },
    },
  },
  masterChecklist: {
    list: {
      method: 'GET' as const,
      path: '/api/master-checklist',
      responses: {
        200: z.array(z.custom<typeof masterChecklistItems.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/master-checklist',
      input: insertMasterChecklistItemSchema.omit({ userId: true }),
      responses: {
        201: z.custom<typeof masterChecklistItems.$inferSelect>(),
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/master-checklist/:id',
      input: insertMasterChecklistItemSchema.partial(),
      responses: {
        200: z.custom<typeof masterChecklistItems.$inferSelect>(),
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/master-checklist/:id',
      responses: {
        204: z.void(),
      },
    },
    seed: {
      method: 'POST' as const,
      path: '/api/master-checklist/seed',
      responses: {
        200: z.object({ added: z.number() }),
      },
    },
  },
  tripChecklist: {
    list: {
      method: 'GET' as const,
      path: '/api/groups/:groupId/trip-checklist',
      responses: {
        200: z.array(z.custom<typeof tripChecklist.$inferSelect & { assignedUser: typeof users.$inferSelect | null; createdByUser: typeof users.$inferSelect | null }>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/groups/:groupId/trip-checklist',
      input: z.object({
        text: z.string().min(1),
        assignedUserId: z.string().nullable().optional(),
      }),
      responses: {
        201: z.custom<typeof tripChecklist.$inferSelect>(),
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/trip-checklist/:id',
      input: z.object({
        text: z.string().min(1).optional(),
        assignedUserId: z.string().nullable().optional(),
        isCompleted: z.boolean().optional(),
      }),
      responses: {
        200: z.custom<typeof tripChecklist.$inferSelect>(),
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/trip-checklist/:id',
      responses: {
        204: z.void(),
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
