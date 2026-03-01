
import { pgTable, text, serial, integer, boolean, real, timestamp, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./models/auth";

export const groups = pgTable("groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location"), // Trip location e.g. "Victorian Alps, Australia"
  latitude: real("latitude"), // Geocoded latitude for weather lookups
  longitude: real("longitude"), // Geocoded longitude for weather lookups
  tripTypes: text("trip_types").array(), // Array of activity types like ['hike', 'kayak']
  icon: text("icon"), // Random adventure icon for the trip card
  shareCode: text("share_code").notNull().unique(),
  adminId: varchar("admin_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  isChecklistEnabled: boolean("is_checklist_enabled").default(true),
  gpxData: text("gpx_data"), // Raw GPX file content for trail map
  notes: text("notes"), // Long form trip notes
});

export const groupMembers = pgTable("group_members", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").references(() => groups.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
});

export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").references(() => groups.id).notNull(),
  userId: varchar("user_id").references(() => users.id), // Who added the item
  carriedByUserId: varchar("carried_by_user_id").references(() => users.id), // For shared items: who is carrying it in their pack
  
  category: text("category").notNull(), // 'gear', 'clothing', 'food'
  type: text("type"), // High-level type: 'Pack', 'Tent', 'Sleep System', etc.
  name: text("name").notNull(),
  brand: text("brand"),
  model: text("model"),
  quantity: integer("quantity").default(1).notNull(),
  weightGrams: integer("weight_grams").default(0).notNull(),
  price: integer("price_cents").default(0).notNull(), // Store in cents
  isShared: boolean("is_shared").default(false), // If true, it appears on group list as shared gear
  isWorn: boolean("is_worn").default(false), // If true, weight doesn't count in pack (e.g., boots, clothes worn while hiking)
  masterItemId: integer("master_item_id").references(() => masterItems.id, { onDelete: 'set null' }), // Link to gear closet item
});

export const itineraryDays = pgTable("itinerary_days", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").references(() => groups.id).notNull(),
  dayNumber: integer("day_number").notNull(),
  date: text("date"), // ISO date string (YYYY-MM-DD)
  startPoint: text("start_point"),
  endPoint: text("end_point"),
  departTime: text("depart_time"), // HH:MM format
  arriveTime: text("arrive_time"), // HH:MM format
  location: text("location").notNull(), // legacy field, now used as general location/campsite name
  description: text("description"),
  distanceKm: real("distance_km"),
  latitude: real("latitude"), // GPS coords
  longitude: real("longitude"), // GPS coords
});

export const masterItems = pgTable("master_items", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  category: text("category").notNull(), // 'gear', 'clothing'
  type: text("type"),
  name: text("name").notNull(),
  brand: text("brand"),
  model: text("model"),
  quantity: integer("quantity").default(1).notNull(),
  weightGrams: integer("weight_grams").default(0).notNull(),
  price: integer("price_cents").default(0).notNull(),
});

export const itineraryStages = pgTable("itinerary_stages", {
  id: serial("id").primaryKey(),
  dayId: integer("day_id").references(() => itineraryDays.id).notNull(),
  stageNumber: integer("stage_number").notNull().default(1),
  mode: text("mode").notNull(), // 'hike', 'drive', 'boat', 'bike', 'bus', 'train', 'other'
  startPoint: text("start_point"),
  endPoint: text("end_point"),
  startLatitude: real("start_latitude"), // GPS coords for start point
  startLongitude: real("start_longitude"),
  endLatitude: real("end_latitude"), // GPS coords for end point
  endLongitude: real("end_longitude"),
  description: text("description"),
  distanceKm: real("distance_km"),
  elevationGain: integer("elevation_gain"), // in meters
  durationMinutes: integer("duration_minutes"),
  departTime: text("depart_time"), // HH:MM format
  arriveTime: text("arrive_time"), // HH:MM format
});

// Master checklist items - user's personal checklist template
export const masterChecklistItems = pgTable("master_checklist_items", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  scope: text("scope").notNull().default("individual"),
  gearCategory: text("gear_category"),
  isEssential: boolean("is_essential").default(true),
  aliases: text("aliases").array(),
});

// Checklist tracking for trip planning
// Tracks status of each checklist item per group (and optionally per user for individual items)
export const checklistStatus = pgTable("checklist_status", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").references(() => groups.id).notNull(),
  userId: varchar("user_id").references(() => users.id), // null for group items, set for individual items
  itemName: text("item_name").notNull(), // References master checklist item name
  status: text("status").notNull().default("pending"), // 'pending', 'packed', 'not_needed'
});

export const tripChecklist = pgTable("trip_checklist", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").references(() => groups.id).notNull(),
  text: text("text").notNull(),
  assignedUserId: varchar("assigned_user_id").references(() => users.id),
  isCompleted: boolean("is_completed").default(false).notNull(),
  createdByUserId: varchar("created_by_user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const groupsRelations = relations(groups, ({ one, many }) => ({
  admin: one(users, { fields: [groups.adminId], references: [users.id] }),
  members: many(groupMembers),
  items: many(items),
  itinerary: many(itineraryDays),
}));

export const groupMembersRelations = relations(groupMembers, ({ one }) => ({
  group: one(groups, { fields: [groupMembers.groupId], references: [groups.id] }),
  user: one(users, { fields: [groupMembers.userId], references: [users.id] }),
}));

export const itemsRelations = relations(items, ({ one }) => ({
  group: one(groups, { fields: [items.groupId], references: [groups.id] }),
  user: one(users, { fields: [items.userId], references: [users.id] }),
  carriedByUser: one(users, { fields: [items.carriedByUserId], references: [users.id] }),
}));

export const itineraryDaysRelations = relations(itineraryDays, ({ one, many }) => ({
  group: one(groups, { fields: [itineraryDays.groupId], references: [groups.id] }),
  stages: many(itineraryStages),
}));

export const itineraryStagesRelations = relations(itineraryStages, ({ one }) => ({
  day: one(itineraryDays, { fields: [itineraryStages.dayId], references: [itineraryDays.id] }),
}));

export const masterItemsRelations = relations(masterItems, ({ one }) => ({
  user: one(users, { fields: [masterItems.userId], references: [users.id] }),
}));

export const masterChecklistItemsRelations = relations(masterChecklistItems, ({ one }) => ({
  user: one(users, { fields: [masterChecklistItems.userId], references: [users.id] }),
}));

export const checklistStatusRelations = relations(checklistStatus, ({ one }) => ({
  group: one(groups, { fields: [checklistStatus.groupId], references: [groups.id] }),
  user: one(users, { fields: [checklistStatus.userId], references: [users.id] }),
}));

export const tripChecklistRelations = relations(tripChecklist, ({ one }) => ({
  group: one(groups, { fields: [tripChecklist.groupId], references: [groups.id] }),
  assignedUser: one(users, { fields: [tripChecklist.assignedUserId], references: [users.id] }),
  createdByUser: one(users, { fields: [tripChecklist.createdByUserId], references: [users.id] }),
}));


// Schemas
export const insertGroupSchema = createInsertSchema(groups).omit({ id: true, createdAt: true, shareCode: true }); // shareCode generated on server
export const insertItemSchema = createInsertSchema(items).omit({ id: true });
export const insertItineraryDaySchema = createInsertSchema(itineraryDays).omit({ id: true });
export const insertMasterItemSchema = createInsertSchema(masterItems).omit({ id: true });
export const insertItineraryStageSchema = createInsertSchema(itineraryStages).omit({ id: true });
export const insertChecklistStatusSchema = createInsertSchema(checklistStatus).omit({ id: true });
export const insertMasterChecklistItemSchema = createInsertSchema(masterChecklistItems).omit({ id: true });
export const insertTripChecklistSchema = createInsertSchema(tripChecklist).omit({ id: true, createdAt: true });

// Types
export type Group = typeof groups.$inferSelect;
export type Item = typeof items.$inferSelect;
export type ItineraryDay = typeof itineraryDays.$inferSelect;
export type ItineraryStage = typeof itineraryStages.$inferSelect;
export type MasterItem = typeof masterItems.$inferSelect;
export type ChecklistStatus = typeof checklistStatus.$inferSelect;
export type MasterChecklistItem = typeof masterChecklistItems.$inferSelect;
export type TripChecklistItem = typeof tripChecklist.$inferSelect;

export type CreateGroupRequest = { name: string; location?: string; tripTypes?: string[] };
export type JoinGroupRequest = { shareCode: string };

export type CreateItemRequest = z.infer<typeof insertItemSchema>;
export type UpdateItemRequest = Partial<CreateItemRequest>;

export type CreateItineraryDayRequest = z.infer<typeof insertItineraryDaySchema>;
export type UpdateItineraryDayRequest = Partial<CreateItineraryDayRequest>;

export type CreateMasterItemRequest = z.infer<typeof insertMasterItemSchema>;
export type UpdateMasterItemRequest = Partial<CreateMasterItemRequest>;

export type CreateItineraryStageRequest = z.infer<typeof insertItineraryStageSchema>;
export type UpdateItineraryStageRequest = Partial<CreateItineraryStageRequest>;

export type CreateMasterChecklistItemRequest = z.infer<typeof insertMasterChecklistItemSchema>;
export type UpdateMasterChecklistItemRequest = Partial<CreateMasterChecklistItemRequest>;

export * from "./models/auth";

