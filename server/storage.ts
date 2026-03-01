
import { db } from "./db";
import {
  users, groups, groupMembers, items, itineraryDays, masterItems, itineraryStages, checklistStatus, masterChecklistItems, tripChecklist,
  type User, type Group, type Item, type ItineraryDay, type MasterItem, type ItineraryStage, type ChecklistStatus, type MasterChecklistItem, type TripChecklistItem,
  type CreateGroupRequest, type CreateItemRequest, type UpdateItemRequest,
  type CreateItineraryDayRequest, type UpdateItineraryDayRequest,
  type CreateMasterItemRequest, type UpdateMasterItemRequest,
  type CreateItineraryStageRequest, type UpdateItineraryStageRequest,
  type CreateMasterChecklistItemRequest, type UpdateMasterChecklistItemRequest
} from "@shared/schema";
import { ADVENTURE_ICONS } from "@shared/constants";
import { eq, and, or, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: typeof users.$inferInsert): Promise<User>;
  updateUserProfile(id: string, updates: { nickname?: string; mobileNumber?: string; unitSystem?: string; dateFormat?: string }): Promise<User>;
  deleteUser(id: string): Promise<void>;
  
  // Groups
  createGroup(name: string, adminId: string, tripTypes?: string[], location?: string): Promise<Group>;
  getGroup(id: number): Promise<Group | undefined>;
  getGroupByShareCode(code: string): Promise<Group | undefined>;
  getUserGroups(userId: string): Promise<Group[]>;
  joinGroup(userId: string, groupId: number): Promise<void>;
  getGroupMembers(groupId: number): Promise<User[]>;
  
  // Items
  getGroupItems(groupId: number): Promise<(Item & { user: User | null; carriedByUser: User | null })[]>;
  createItem(item: CreateItemRequest & { userId: string; groupId: number }, skipClosetSync?: boolean): Promise<Item>;
  updateItem(id: number, updates: UpdateItemRequest): Promise<Item>;
  deleteItem(id: number): Promise<void>;
  getItem(id: number): Promise<Item | undefined>;
  upsertToCloset(userId: string, item: { category: string; type?: string; name: string; brand?: string; model?: string; quantity: number; weightGrams: number; price: number }): Promise<number | null>;

  // Itinerary
  getGroupItinerary(groupId: number): Promise<ItineraryDay[]>;
  getGroupStages(groupId: number): Promise<ItineraryStage[]>;
  getItineraryDay(id: number): Promise<ItineraryDay | undefined>;
  createItineraryDay(day: CreateItineraryDayRequest & { groupId: number }): Promise<ItineraryDay>;
  updateItineraryDay(id: number, updates: UpdateItineraryDayRequest): Promise<ItineraryDay>;
  deleteItineraryDay(id: number): Promise<void>;
  
  // Master Items
  getMasterItems(userId: string): Promise<MasterItem[]>;
  createMasterItem(item: CreateMasterItemRequest & { userId: string }): Promise<MasterItem>;
  updateMasterItem(id: number, updates: UpdateMasterItemRequest): Promise<MasterItem>;
  deleteMasterItem(id: number): Promise<void>;
  syncFromTrip(userId: string, groupId: number): Promise<number>;
  syncToTrip(userId: string, groupId: number, category?: 'gear' | 'clothing'): Promise<number>;
  addFromCloset(userId: string, groupId: number, masterItemIds: number[]): Promise<number>;
  
  // Itinerary Stages
  getDayStages(dayId: number): Promise<ItineraryStage[]>;
  getStage(id: number): Promise<ItineraryStage | undefined>;
  createStage(stage: CreateItineraryStageRequest & { dayId: number }): Promise<ItineraryStage>;
  updateStage(id: number, updates: UpdateItineraryStageRequest): Promise<ItineraryStage>;
  deleteStage(id: number): Promise<void>;
  
  // Checklist
  getGroupChecklist(groupId: number, userId?: string): Promise<ChecklistStatus[]>;
  upsertChecklistStatus(groupId: number, itemName: string, status: string, userId?: string): Promise<ChecklistStatus>;
  deleteChecklistStatus(groupId: number, itemName: string, userId?: string): Promise<void>;
  
  // Master Checklist Items
  getMasterChecklistItems(userId: string): Promise<MasterChecklistItem[]>;
  createMasterChecklistItem(item: CreateMasterChecklistItemRequest & { userId: string }): Promise<MasterChecklistItem>;
  updateMasterChecklistItem(id: number, updates: UpdateMasterChecklistItemRequest): Promise<MasterChecklistItem>;
  deleteMasterChecklistItem(id: number): Promise<void>;
  seedMasterChecklistItems(userId: string): Promise<number>;
  
  // Trip Checklist
  getTripChecklist(groupId: number): Promise<(TripChecklistItem & { assignedUser: User | null; createdByUser: User | null })[]>;
  getTripChecklistItem(id: number): Promise<TripChecklistItem | undefined>;
  createTripChecklistItem(groupId: number, text: string, createdByUserId: string, assignedUserId?: string | null): Promise<TripChecklistItem>;
  updateTripChecklistItem(id: number, updates: { text?: string; assignedUserId?: string | null; isCompleted?: boolean }): Promise<TripChecklistItem>;
  deleteTripChecklistItem(id: number): Promise<void>;

  // Group Settings
  updateGroupSettings(groupId: number, updates: { isChecklistEnabled?: boolean; gpxData?: string | null; notes?: string | null; name?: string; location?: string | null; tripTypes?: string[] | null; latitude?: number | null; longitude?: number | null }): Promise<Group>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return undefined; 
  }

  async updateUserProfile(id: string, updates: { nickname?: string; mobileNumber?: string; unitSystem?: string; dateFormat?: string }): Promise<User> {
    const [updated] = await db.update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async deleteUser(id: string): Promise<void> {
    // Delete user's master items
    await db.delete(masterItems).where(eq(masterItems.userId, id));
    // Remove from group memberships
    await db.delete(groupMembers).where(eq(groupMembers.userId, id));
    // Delete the user
    await db.delete(users).where(eq(users.id, id));
  }

  async createUser(user: typeof users.$inferInsert): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async createGroup(name: string, adminId: string, tripTypes?: string[], location?: string): Promise<Group> {
    const shareCode = nanoid(8);
    const randomIcon = ADVENTURE_ICONS[Math.floor(Math.random() * ADVENTURE_ICONS.length)];
    const [group] = await db.insert(groups).values({
      name,
      adminId,
      shareCode,
      tripTypes: tripTypes || null,
      icon: randomIcon,
      location: location || null,
    }).returning();
    
    // Add admin as member
    await this.joinGroup(adminId, group.id);
    
    return group;
  }

  async getGroup(id: number): Promise<Group | undefined> {
    const [group] = await db.select().from(groups).where(eq(groups.id, id));
    return group;
  }

  async getGroupByShareCode(code: string): Promise<Group | undefined> {
    const [group] = await db.select().from(groups).where(eq(groups.shareCode, code));
    return group;
  }

  async getUserGroups(userId: string): Promise<Group[]> {
    const memberships = await db.select({
      group: groups
    })
    .from(groupMembers)
    .innerJoin(groups, eq(groups.id, groupMembers.groupId))
    .where(eq(groupMembers.userId, userId));
    
    return memberships.map(m => m.group);
  }

  async joinGroup(userId: string, groupId: number): Promise<void> {
    // Check if already member
    const [existing] = await db.select()
      .from(groupMembers)
      .where(and(eq(groupMembers.userId, userId), eq(groupMembers.groupId, groupId)));
      
    if (!existing) {
      await db.insert(groupMembers).values({ userId, groupId });
    }
  }

  async getGroupMembers(groupId: number): Promise<User[]> {
    const members = await db.select({
      user: users
    })
    .from(groupMembers)
    .innerJoin(users, eq(users.id, groupMembers.userId))
    .where(eq(groupMembers.groupId, groupId));
    
    return members.map(m => m.user);
  }

  async getGroupItems(groupId: number): Promise<(Item & { user: User | null; carriedByUser: User | null })[]> {
    // Get items with owner info
    const result = await db.select({
      item: items,
      user: users
    })
    .from(items)
    .leftJoin(users, eq(items.userId, users.id))
    .where(eq(items.groupId, groupId));
    
    // Get all users for carriedBy lookup
    const allUsers = await db.select().from(users);
    const usersMap = new Map(allUsers.map(u => [u.id, u]));
    
    return result.map(r => ({ 
      ...r.item, 
      user: r.user, 
      carriedByUser: r.item.carriedByUserId ? usersMap.get(r.item.carriedByUserId) || null : null 
    }));
  }

  async createItem(item: CreateItemRequest & { userId: string; groupId: number }, skipClosetSync?: boolean): Promise<Item> {
    const [newItem] = await db.insert(items).values(item).returning();
    
    // Auto-save to closet for gear and clothing (unless skipped)
    if (!skipClosetSync && (item.category === 'gear' || item.category === 'clothing')) {
      const masterItemId = await this.upsertToCloset(item.userId, {
        category: item.category,
        type: item.type || undefined,
        name: item.name,
        brand: item.brand || undefined,
        model: item.model || undefined,
        quantity: item.quantity ?? 1,
        weightGrams: item.weightGrams ?? 0,
        price: item.price ?? 0
      });
      
      // Link the new trip item to the closet item
      if (masterItemId) {
        const [linked] = await db.update(items)
          .set({ masterItemId })
          .where(eq(items.id, newItem.id))
          .returning();
        return linked;
      }
    }
    
    return newItem;
  }
  
  async upsertToCloset(userId: string, item: { category: string; type?: string; name: string; brand?: string; model?: string; quantity: number; weightGrams: number; price: number }): Promise<number | null> {
    // Check for existing item with same name+category+brand+model
    const allUserItems = await db.select()
      .from(masterItems)
      .where(
        and(
          eq(masterItems.userId, userId),
          eq(masterItems.category, item.category)
        )
      );
    
    // Check if an item with matching name, brand, and model already exists
    const existing = allUserItems.find(existing => 
      existing.name === item.name && 
      (existing.brand || null) === (item.brand || null) && 
      (existing.model || null) === (item.model || null)
    );
    
    if (existing) {
      return existing.id;
    }
    
    // Insert new master item
    const [inserted] = await db.insert(masterItems).values({
      userId,
      category: item.category as 'gear' | 'clothing',
      type: item.type,
      name: item.name,
      brand: item.brand,
      model: item.model,
      quantity: item.quantity,
      weightGrams: item.weightGrams,
      price: item.price
    }).returning();
    
    return inserted.id;
  }

  async updateItem(id: number, updates: UpdateItemRequest): Promise<Item> {
    const [updated] = await db.update(items)
      .set(updates)
      .where(eq(items.id, id))
      .returning();
    
    // If this item is linked to a closet item and is gear/clothing, sync the changes back
    if (updated.masterItemId && (updated.category === 'gear' || updated.category === 'clothing')) {
      const masterUpdates: Record<string, any> = {};
      if (updates.name !== undefined) masterUpdates.name = updates.name;
      if (updates.type !== undefined) masterUpdates.type = updates.type || null;
      if (updates.brand !== undefined) masterUpdates.brand = updates.brand || null;
      if (updates.model !== undefined) masterUpdates.model = updates.model || null;
      if (updates.quantity !== undefined) masterUpdates.quantity = updates.quantity;
      if (updates.weightGrams !== undefined) masterUpdates.weightGrams = updates.weightGrams;
      if (updates.price !== undefined) masterUpdates.price = updates.price;
      
      if (Object.keys(masterUpdates).length > 0) {
        await db.update(masterItems)
          .set(masterUpdates)
          .where(eq(masterItems.id, updated.masterItemId));
      }
    }
    
    return updated;
  }

  async deleteItem(id: number): Promise<void> {
    await db.delete(items).where(eq(items.id, id));
  }

  async getItem(id: number): Promise<Item | undefined> {
    const [item] = await db.select().from(items).where(eq(items.id, id));
    return item;
  }

  async getGroupItinerary(groupId: number): Promise<ItineraryDay[]> {
    return await db.select()
      .from(itineraryDays)
      .where(eq(itineraryDays.groupId, groupId))
      .orderBy(itineraryDays.dayNumber);
  }

  async getGroupStages(groupId: number): Promise<ItineraryStage[]> {
    const days = await db.select({ id: itineraryDays.id })
      .from(itineraryDays)
      .where(eq(itineraryDays.groupId, groupId));
    if (days.length === 0) return [];
    const dayIds = days.map(d => d.id);
    return await db.select()
      .from(itineraryStages)
      .where(inArray(itineraryStages.dayId, dayIds))
      .orderBy(itineraryStages.stageNumber);
  }

  async getItineraryDay(id: number): Promise<ItineraryDay | undefined> {
    const [day] = await db.select().from(itineraryDays).where(eq(itineraryDays.id, id));
    return day;
  }

  async createItineraryDay(day: CreateItineraryDayRequest & { groupId: number }): Promise<ItineraryDay> {
    const [newDay] = await db.insert(itineraryDays).values(day).returning();
    return newDay;
  }

  async updateItineraryDay(id: number, updates: UpdateItineraryDayRequest): Promise<ItineraryDay> {
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );
    const [updated] = await db.update(itineraryDays)
      .set(cleanUpdates)
      .where(eq(itineraryDays.id, id))
      .returning();
    return updated;
  }

  async deleteItineraryDay(id: number): Promise<void> {
    // Delete associated stages first
    await db.delete(itineraryStages).where(eq(itineraryStages.dayId, id));
    await db.delete(itineraryDays).where(eq(itineraryDays.id, id));
  }
  
  // Master Items
  async getMasterItems(userId: string): Promise<MasterItem[]> {
    return await db.select()
      .from(masterItems)
      .where(eq(masterItems.userId, userId))
      .orderBy(masterItems.category, masterItems.type, masterItems.name);
  }

  async createMasterItem(item: CreateMasterItemRequest & { userId: string }): Promise<MasterItem> {
    const [newItem] = await db.insert(masterItems).values(item).returning();
    return newItem;
  }

  async updateMasterItem(id: number, updates: UpdateMasterItemRequest): Promise<MasterItem> {
    const [updated] = await db.update(masterItems)
      .set(updates)
      .where(eq(masterItems.id, id))
      .returning();
    return updated;
  }

  async deleteMasterItem(id: number): Promise<void> {
    // Delete all linked trip items first
    await db.delete(items).where(eq(items.masterItemId, id));
    // Then delete the master item itself
    await db.delete(masterItems).where(eq(masterItems.id, id));
  }

  async syncFromTrip(userId: string, groupId: number): Promise<number> {
    // Verify user is a member of the group first
    const members = await this.getGroupMembers(groupId);
    const isMember = members.some(m => m.id === userId);
    if (!isMember) {
      throw new Error("Not a member of this group");
    }
    
    // Get user's items from the trip (gear and clothing only)
    const tripItems = await db.select()
      .from(items)
      .where(
        and(
          eq(items.groupId, groupId),
          eq(items.userId, userId),
          or(eq(items.category, 'gear'), eq(items.category, 'clothing'))
        )
      );
    
    // Get existing master items to avoid duplicates (check name+brand+model)
    const existing = await this.getMasterItems(userId);
    const existingKeys = new Set(existing.map(i => 
      `${i.category}-${i.name}-${i.brand || ''}-${i.model || ''}`
    ));
    
    let added = 0;
    for (const item of tripItems) {
      const key = `${item.category}-${item.name}-${item.brand || ''}-${item.model || ''}`;
      if (!existingKeys.has(key)) {
        await this.createMasterItem({
          userId,
          category: item.category,
          type: item.type || undefined,
          name: item.name,
          brand: item.brand || undefined,
          model: item.model || undefined,
          quantity: item.quantity,
          weightGrams: item.weightGrams,
          price: item.price
        });
        existingKeys.add(key); // Track newly inserted to prevent duplicates in same sync
        added++;
      }
    }
    return added;
  }

  async syncToTrip(userId: string, groupId: number, category?: 'gear' | 'clothing'): Promise<number> {
    // Verify user is a member of the group first
    const members = await this.getGroupMembers(groupId);
    const isMember = members.some(m => m.id === userId);
    if (!isMember) {
      throw new Error("Not a member of this group");
    }
    
    // Get master items
    let masterItemsList = await this.getMasterItems(userId);
    if (category) {
      masterItemsList = masterItemsList.filter(i => i.category === category);
    } else {
      // Only gear and clothing by default
      masterItemsList = masterItemsList.filter(i => i.category === 'gear' || i.category === 'clothing');
    }
    
    // Get existing trip items for THIS USER to avoid duplicates (check name+brand+model)
    const tripItems = await db.select()
      .from(items)
      .where(and(eq(items.groupId, groupId), eq(items.userId, userId)));
    const existingKeys = new Set(tripItems.map(i => 
      `${i.category}-${i.name}-${i.brand || ''}-${i.model || ''}`
    ));
    
    let added = 0;
    for (const item of masterItemsList) {
      const key = `${item.category}-${item.name}-${item.brand || ''}-${item.model || ''}`;
      if (!existingKeys.has(key)) {
        // Use skipClosetSync=true since these items already came from the closet
        await this.createItem({
          groupId,
          userId,
          category: item.category,
          type: item.type || undefined,
          name: item.name,
          brand: item.brand || undefined,
          model: item.model || undefined,
          quantity: item.quantity,
          weightGrams: item.weightGrams,
          price: item.price,
          isShared: false
        }, true);
        added++;
      }
    }
    return added;
  }
  
  async addFromCloset(userId: string, groupId: number, masterItemIds: number[]): Promise<number> {
    // Verify user is a member of the group first
    const members = await this.getGroupMembers(groupId);
    const isMember = members.some(m => m.id === userId);
    if (!isMember) {
      throw new Error("Not a member of this group");
    }
    
    // Get selected master items (only user's own)
    const selectedItems = await db.select()
      .from(masterItems)
      .where(
        and(
          eq(masterItems.userId, userId),
          inArray(masterItems.id, masterItemIds)
        )
      );
    
    // Get existing trip items for THIS USER to avoid duplicates
    const tripItems = await db.select()
      .from(items)
      .where(and(eq(items.groupId, groupId), eq(items.userId, userId)));
    
    // Check by masterItemId link first, then fallback to name+brand+model
    const existingMasterIds = new Set(
      tripItems.filter(i => i.masterItemId != null).map(i => i.masterItemId!)
    );
    const existingKeys = new Set(tripItems.map(i => 
      `${i.category}-${i.name}-${i.brand || ''}-${i.model || ''}`
    ));
    
    let added = 0;
    for (const item of selectedItems) {
      const key = `${item.category}-${item.name}-${item.brand || ''}-${item.model || ''}`;
      if (!existingMasterIds.has(item.id) && !existingKeys.has(key)) {
        // Insert directly with masterItemId link, skip closet sync
        const [newItem] = await db.insert(items).values({
          groupId,
          userId,
          category: item.category,
          type: item.type,
          name: item.name,
          brand: item.brand,
          model: item.model,
          quantity: item.quantity,
          weightGrams: item.weightGrams,
          price: item.price,
          isShared: false,
          masterItemId: item.id,
        }).returning();
        existingMasterIds.add(item.id);
        added++;
      }
    }
    return added;
  }

  // Itinerary Stages
  async getDayStages(dayId: number): Promise<ItineraryStage[]> {
    return await db.select()
      .from(itineraryStages)
      .where(eq(itineraryStages.dayId, dayId))
      .orderBy(itineraryStages.stageNumber);
  }

  async getStage(id: number): Promise<ItineraryStage | undefined> {
    const [stage] = await db.select().from(itineraryStages).where(eq(itineraryStages.id, id));
    return stage;
  }

  async createStage(stage: CreateItineraryStageRequest & { dayId: number }): Promise<ItineraryStage> {
    const [newStage] = await db.insert(itineraryStages).values(stage).returning();
    return newStage;
  }

  async updateStage(id: number, updates: UpdateItineraryStageRequest): Promise<ItineraryStage> {
    const [updated] = await db.update(itineraryStages)
      .set(updates)
      .where(eq(itineraryStages.id, id))
      .returning();
    return updated;
  }

  async deleteStage(id: number): Promise<void> {
    await db.delete(itineraryStages).where(eq(itineraryStages.id, id));
  }

  // Checklist methods
  async getGroupChecklist(groupId: number, userId?: string): Promise<ChecklistStatus[]> {
    if (userId) {
      // Get both group items (userId = null) and user's individual items
      return await db.select()
        .from(checklistStatus)
        .where(
          and(
            eq(checklistStatus.groupId, groupId),
            or(eq(checklistStatus.userId, userId), eq(checklistStatus.userId, null as any))
          )
        );
    }
    // Get all checklist statuses for the group
    return await db.select()
      .from(checklistStatus)
      .where(eq(checklistStatus.groupId, groupId));
  }

  async upsertChecklistStatus(groupId: number, itemName: string, status: string, userId?: string): Promise<ChecklistStatus> {
    // Check if exists
    const conditions = [
      eq(checklistStatus.groupId, groupId),
      eq(checklistStatus.itemName, itemName)
    ];
    
    if (userId) {
      conditions.push(eq(checklistStatus.userId, userId));
    } else {
      conditions.push(eq(checklistStatus.userId, null as any));
    }
    
    const [existing] = await db.select()
      .from(checklistStatus)
      .where(and(...conditions));
    
    if (existing) {
      // Update
      const [updated] = await db.update(checklistStatus)
        .set({ status })
        .where(eq(checklistStatus.id, existing.id))
        .returning();
      return updated;
    } else {
      // Insert
      const [newStatus] = await db.insert(checklistStatus)
        .values({
          groupId,
          itemName,
          status,
          userId: userId || null
        })
        .returning();
      return newStatus;
    }
  }

  async deleteChecklistStatus(groupId: number, itemName: string, userId?: string): Promise<void> {
    const conditions = [
      eq(checklistStatus.groupId, groupId),
      eq(checklistStatus.itemName, itemName)
    ];
    
    if (userId) {
      conditions.push(eq(checklistStatus.userId, userId));
    } else {
      conditions.push(eq(checklistStatus.userId, null as any));
    }
    
    await db.delete(checklistStatus).where(and(...conditions));
  }

  // Master Checklist Items
  async getMasterChecklistItems(userId: string): Promise<MasterChecklistItem[]> {
    return db.select().from(masterChecklistItems).where(eq(masterChecklistItems.userId, userId));
  }

  async createMasterChecklistItem(item: CreateMasterChecklistItemRequest & { userId: string }): Promise<MasterChecklistItem> {
    const [newItem] = await db.insert(masterChecklistItems).values(item).returning();
    return newItem;
  }

  async updateMasterChecklistItem(id: number, updates: UpdateMasterChecklistItemRequest): Promise<MasterChecklistItem> {
    const [updated] = await db.update(masterChecklistItems)
      .set(updates)
      .where(eq(masterChecklistItems.id, id))
      .returning();
    return updated;
  }

  async deleteMasterChecklistItem(id: number): Promise<void> {
    await db.delete(masterChecklistItems).where(eq(masterChecklistItems.id, id));
  }

  async seedMasterChecklistItems(userId: string): Promise<number> {
    const { CHECKLIST_ITEMS } = await import("@shared/constants");
    
    const existing = await this.getMasterChecklistItems(userId);
    const existingKeys = new Set(existing.map(i => `${i.name}|${i.scope}|${i.gearCategory}`));
    
    // Backfill aliases on existing items that have none
    for (const existingItem of existing) {
      if (!existingItem.aliases || existingItem.aliases.length === 0) {
        const seedMatch = CHECKLIST_ITEMS.find(s => 
          s.name === existingItem.name && s.scope === existingItem.scope && s.gearCategory === existingItem.gearCategory
        );
        if (seedMatch && seedMatch.aliases.length > 0) {
          await db.update(masterChecklistItems)
            .set({ aliases: seedMatch.aliases })
            .where(eq(masterChecklistItems.id, existingItem.id));
        }
      }
    }
    
    const newItems = CHECKLIST_ITEMS.filter(item => 
      !existingKeys.has(`${item.name}|${item.scope}|${item.gearCategory}`)
    );
    
    if (newItems.length === 0) return 0;
    
    await db.insert(masterChecklistItems).values(
      newItems.map(item => ({
        userId,
        name: item.name,
        category: item.gearCategory || 'gear',
        scope: item.scope,
        gearCategory: item.gearCategory,
        isEssential: item.category === 'essential',
        aliases: item.aliases || [],
      }))
    );
    
    return newItems.length;
  }

  // Group Settings
  async getTripChecklist(groupId: number): Promise<(TripChecklistItem & { assignedUser: User | null; createdByUser: User | null })[]> {
    const result = await db.select({
      item: tripChecklist,
      assignedUser: users,
    })
    .from(tripChecklist)
    .leftJoin(users, eq(tripChecklist.assignedUserId, users.id))
    .where(eq(tripChecklist.groupId, groupId))
    .orderBy(tripChecklist.createdAt);

    const allUsers = await db.select().from(users);
    const usersMap = new Map(allUsers.map(u => [u.id, u]));

    return result.map(r => ({
      ...r.item,
      assignedUser: r.assignedUser,
      createdByUser: usersMap.get(r.item.createdByUserId) || null,
    }));
  }

  async getTripChecklistItem(id: number): Promise<TripChecklistItem | undefined> {
    const [item] = await db.select().from(tripChecklist).where(eq(tripChecklist.id, id));
    return item;
  }

  async createTripChecklistItem(groupId: number, text: string, createdByUserId: string, assignedUserId?: string | null): Promise<TripChecklistItem> {
    const [item] = await db.insert(tripChecklist).values({
      groupId,
      text,
      createdByUserId,
      assignedUserId: assignedUserId || null,
    }).returning();
    return item;
  }

  async updateTripChecklistItem(id: number, updates: { text?: string; assignedUserId?: string | null; isCompleted?: boolean }): Promise<TripChecklistItem> {
    const [updated] = await db.update(tripChecklist)
      .set(updates)
      .where(eq(tripChecklist.id, id))
      .returning();
    return updated;
  }

  async deleteTripChecklistItem(id: number): Promise<void> {
    await db.delete(tripChecklist).where(eq(tripChecklist.id, id));
  }

  async updateGroupSettings(groupId: number, updates: { isChecklistEnabled?: boolean; gpxData?: string | null; notes?: string | null; name?: string; location?: string | null; tripTypes?: string[] | null; latitude?: number | null; longitude?: number | null }): Promise<Group> {
    const [updated] = await db.update(groups)
      .set(updates)
      .where(eq(groups.id, groupId))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
