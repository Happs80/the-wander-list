
import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import analyzeImageRouter from "./routes/analyze-image";
import { geocodeLocationName } from "./geocode";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Set up authentication
  await setupAuth(app);
  registerAuthRoutes(app);
  
  // Image analysis route
  app.use(analyzeImageRouter);

  // Auth Middleware
  const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  // Auth route (me) - return sanitized database user, not raw session
  app.get(api.auth.me.path, async (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.json(null);
    }
    const userId = (req.user as any).claims?.sub;
    if (!userId) {
      return res.json(null);
    }
    const user = await storage.getUser(userId);
    res.json(user || null);
  });

  // Update user profile
  app.patch(api.auth.updateProfile.path, requireAuth, async (req, res) => {
    const userId = (req.user as any).claims?.sub;
    const input = api.auth.updateProfile.input.parse(req.body);
    
    // Require nickname to be provided
    if (!input.nickname) {
      return res.status(400).json({ message: "Nickname is required" });
    }
    
    const updated = await storage.updateUserProfile(userId, input);
    res.json(updated);
  });

  // Delete user account
  app.delete(api.auth.deleteAccount.path, requireAuth, async (req, res) => {
    const userId = (req.user as any).claims?.sub;
    await storage.deleteUser(userId);
    req.logout(() => {
      res.status(204).send();
    });
  });

  // Groups
  app.post(api.groups.create.path, requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Invalid user session" });
      }
      const input = api.groups.create.input.parse(req.body);
      const group = await storage.createGroup(input.name, userId, input.tripTypes, input.location);
      
      if (input.location) {
        geocodeLocationName(input.location).then(coords => {
          if (coords) {
            storage.updateGroupSettings(group.id, { latitude: coords.lat, longitude: coords.lng }).catch(() => {});
          }
        });
      }
      
      res.status(201).json(group);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.post(api.groups.join.path, requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Invalid user session" });
      }
      const input = api.groups.join.input.parse(req.body);
      const group = await storage.getGroupByShareCode(input.shareCode);
      if (!group) {
        return res.status(404).json({ message: "Group not found" });
      }
      await storage.joinGroup(userId, group.id);
      res.json(group);
    } catch (err) {
       if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });
  
  app.get(api.groups.list.path, requireAuth, async (req, res) => {
      const userId = (req.user as any).claims?.sub;
      const groupsList = await storage.getUserGroups(userId);
      
      // Add members to each group
      const groupsWithMembers = await Promise.all(
        groupsList.map(async (group) => {
          const members = await storage.getGroupMembers(group.id);
          return { ...group, members };
        })
      );
      
      res.json(groupsWithMembers);
  });

  app.get(api.groups.get.path, requireAuth, async (req, res) => {
    const userId = (req.user as any).claims?.sub;
    const groupId = parseInt(req.params.id);
    const group = await storage.getGroup(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }
    
    // Security: Check if user is member
    const members = await storage.getGroupMembers(groupId);
    const isMember = members.some(m => m.id === userId);
    if (!isMember) {
      return res.status(403).json({ message: "Not a member of this group" });
    }

    res.json({ ...group, members });
  });

  // Items
  app.get(api.items.list.path, requireAuth, async (req, res) => {
    const groupId = parseInt(req.params.groupId);
    const items = await storage.getGroupItems(groupId);
    res.json(items);
  });

  app.post(api.items.create.path, requireAuth, async (req, res) => {
    const userId = (req.user as any).claims?.sub;
    const groupId = parseInt(req.params.groupId);
    const input = api.items.create.input.parse(req.body);
    const { skipClosetSync, ...itemData } = input;
    const item = await storage.createItem({
      ...itemData,
      groupId,
      userId: userId
    }, skipClosetSync);
    res.status(201).json(item);
  });

  app.patch(api.items.update.path, requireAuth, async (req, res) => {
    const id = parseInt(req.params.id);
    const input = api.items.update.input.parse(req.body);
    
    // TODO: Permission check (is owner or admin?)
    const item = await storage.updateItem(id, input);
    res.json(item);
  });

  app.delete(api.items.delete.path, requireAuth, async (req, res) => {
    const id = parseInt(req.params.id);
    await storage.deleteItem(id);
    res.status(204).send();
  });

  // Itinerary
  app.get(api.itinerary.list.path, requireAuth, async (req, res) => {
    const groupId = parseInt(req.params.groupId);
    const days = await storage.getGroupItinerary(groupId);
    res.json(days);
  });

  app.post(api.itinerary.create.path, requireAuth, async (req, res) => {
    const groupId = parseInt(req.params.groupId);
    const input = api.itinerary.create.input.parse(req.body);
    const day = await storage.createItineraryDay({
      ...input,
      groupId
    });
    res.status(201).json(day);
  });
  
  app.patch(api.itinerary.update.path, requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const input = api.itinerary.update.input.parse(req.body);
      const day = await storage.updateItineraryDay(id, input);
      res.json(day);
    } catch (err) {
      console.error("Failed to update itinerary day:", err);
      res.status(500).json({ message: "Failed to update day" });
    }
  });

  app.delete(api.itinerary.delete.path, requireAuth, async (req, res) => {
    const id = parseInt(req.params.id);
    await storage.deleteItineraryDay(id);
    res.status(204).send();
  });

  // Master Items
  app.get(api.masterItems.list.path, requireAuth, async (req, res) => {
    const userId = (req.user as any).claims?.sub;
    const items = await storage.getMasterItems(userId);
    res.json(items);
  });

  app.post(api.masterItems.create.path, requireAuth, async (req, res) => {
    const userId = (req.user as any).claims?.sub;
    const input = api.masterItems.create.input.parse(req.body);
    const item = await storage.createMasterItem({ ...input, userId });
    res.status(201).json(item);
  });

  app.patch(api.masterItems.update.path, requireAuth, async (req, res) => {
    const id = parseInt(req.params.id);
    const input = api.masterItems.update.input.parse(req.body);
    const item = await storage.updateMasterItem(id, input);
    res.json(item);
  });

  app.delete(api.masterItems.delete.path, requireAuth, async (req, res) => {
    const id = parseInt(req.params.id);
    await storage.deleteMasterItem(id);
    res.status(204).send();
  });

  app.post(api.masterItems.syncFromTrip.path, requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).claims?.sub;
      const input = api.masterItems.syncFromTrip.input.parse(req.body);
      const added = await storage.syncFromTrip(userId, input.groupId);
      res.json({ added });
    } catch (err: any) {
      if (err.message === "Not a member of this group") {
        return res.status(403).json({ message: err.message });
      }
      throw err;
    }
  });

  app.post(api.masterItems.syncToTrip.path, requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).claims?.sub;
      const input = api.masterItems.syncToTrip.input.parse(req.body);
      const added = await storage.syncToTrip(userId, input.groupId, input.category);
      res.json({ added });
    } catch (err: any) {
      if (err.message === "Not a member of this group") {
        return res.status(403).json({ message: err.message });
      }
      throw err;
    }
  });

  app.post(api.masterItems.addToTrip.path, requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).claims?.sub;
      const input = api.masterItems.addToTrip.input.parse(req.body);
      const added = await storage.addFromCloset(userId, input.groupId, input.masterItemIds);
      res.json({ added });
    } catch (err: any) {
      if (err.message === "Not a member of this group") {
        return res.status(403).json({ message: err.message });
      }
      throw err;
    }
  });

  // Itinerary Stages
  app.get(api.stages.list.path, requireAuth, async (req, res) => {
    const userId = (req.user as any).claims?.sub;
    const dayId = parseInt(req.params.dayId);
    
    // Verify user has access to this day's group
    const day = await storage.getItineraryDay(dayId);
    if (!day) {
      return res.status(404).json({ message: "Day not found" });
    }
    const members = await storage.getGroupMembers(day.groupId);
    if (!members.some(m => m.id === userId)) {
      return res.status(403).json({ message: "Not a member of this group" });
    }
    
    const stages = await storage.getDayStages(dayId);
    res.json(stages);
  });

  app.get(api.stages.listByGroup.path, requireAuth, async (req, res) => {
    const userId = (req.user as any).claims?.sub;
    const groupId = parseInt(req.params.groupId);
    const members = await storage.getGroupMembers(groupId);
    if (!members.some(m => m.id === userId)) {
      return res.status(403).json({ message: "Not a member of this group" });
    }
    const stages = await storage.getGroupStages(groupId);
    res.json(stages);
  });

  app.post(api.stages.create.path, requireAuth, async (req, res) => {
    const userId = (req.user as any).claims?.sub;
    const dayId = parseInt(req.params.dayId);
    
    // Verify user has access to this day's group
    const day = await storage.getItineraryDay(dayId);
    if (!day) {
      return res.status(404).json({ message: "Day not found" });
    }
    const members = await storage.getGroupMembers(day.groupId);
    if (!members.some(m => m.id === userId)) {
      return res.status(403).json({ message: "Not a member of this group" });
    }
    
    const input = api.stages.create.input.parse(req.body);
    const stage = await storage.createStage({ ...input, dayId });
    
    if (stage.endPoint && !stage.endLatitude && !stage.endLongitude) {
      geocodeLocationName(stage.endPoint).then(coords => {
        if (coords) {
          storage.updateStage(stage.id, { endLatitude: coords.lat, endLongitude: coords.lng }).catch(() => {});
        }
      });
    }
    if (stage.startPoint && !stage.startLatitude && !stage.startLongitude) {
      geocodeLocationName(stage.startPoint).then(coords => {
        if (coords) {
          storage.updateStage(stage.id, { startLatitude: coords.lat, startLongitude: coords.lng }).catch(() => {});
        }
      });
    }
    
    res.status(201).json(stage);
  });

  app.patch(api.stages.update.path, requireAuth, async (req, res) => {
    const userId = (req.user as any).claims?.sub;
    const id = parseInt(req.params.id);
    
    // Verify user has access to this stage's group
    const stage = await storage.getStage(id);
    if (!stage) {
      return res.status(404).json({ message: "Stage not found" });
    }
    const day = await storage.getItineraryDay(stage.dayId);
    if (!day) {
      return res.status(404).json({ message: "Day not found" });
    }
    const members = await storage.getGroupMembers(day.groupId);
    if (!members.some(m => m.id === userId)) {
      return res.status(403).json({ message: "Not a member of this group" });
    }
    
    const input = api.stages.update.input.parse(req.body);
    
    if (input.endPoint && !input.endLatitude && !input.endLongitude) {
      const coords = await geocodeLocationName(input.endPoint);
      if (coords) {
        input.endLatitude = coords.lat;
        input.endLongitude = coords.lng;
      }
    }
    if (input.startPoint && !input.startLatitude && !input.startLongitude) {
      const coords = await geocodeLocationName(input.startPoint);
      if (coords) {
        input.startLatitude = coords.lat;
        input.startLongitude = coords.lng;
      }
    }
    
    const updatedStage = await storage.updateStage(id, input);
    res.json(updatedStage);
  });

  app.delete(api.stages.delete.path, requireAuth, async (req, res) => {
    const userId = (req.user as any).claims?.sub;
    const id = parseInt(req.params.id);
    
    // Verify user has access to this stage's group
    const stage = await storage.getStage(id);
    if (!stage) {
      return res.status(404).json({ message: "Stage not found" });
    }
    const day = await storage.getItineraryDay(stage.dayId);
    if (!day) {
      return res.status(404).json({ message: "Day not found" });
    }
    const members = await storage.getGroupMembers(day.groupId);
    if (!members.some(m => m.id === userId)) {
      return res.status(403).json({ message: "Not a member of this group" });
    }
    
    await storage.deleteStage(id);
    res.status(204).send();
  });

  // Checklist routes
  app.get('/api/groups/:groupId/checklist', requireAuth, async (req, res) => {
    const userId = (req.user as any).claims?.sub;
    const groupId = parseInt(req.params.groupId);
    
    // Verify user is member
    const members = await storage.getGroupMembers(groupId);
    if (!members.some(m => m.id === userId)) {
      return res.status(403).json({ message: "Not a member of this group" });
    }
    
    const statuses = await storage.getGroupChecklist(groupId, userId);
    res.json(statuses);
  });

  app.post('/api/groups/:groupId/checklist', requireAuth, async (req, res) => {
    const userId = (req.user as any).claims?.sub;
    const groupId = parseInt(req.params.groupId);
    const { itemName, status, scope } = req.body;
    
    // Verify user is member
    const members = await storage.getGroupMembers(groupId);
    if (!members.some(m => m.id === userId)) {
      return res.status(403).json({ message: "Not a member of this group" });
    }
    
    // For individual items, store with userId; for group items, store without userId
    const result = await storage.upsertChecklistStatus(
      groupId, 
      itemName, 
      status, 
      scope === 'individual' ? userId : undefined
    );
    res.json(result);
  });

  app.delete('/api/groups/:groupId/checklist/:itemName', requireAuth, async (req, res) => {
    const userId = (req.user as any).claims?.sub;
    const groupId = parseInt(req.params.groupId);
    const itemName = decodeURIComponent(req.params.itemName);
    const scope = req.query.scope as string;
    
    // Verify user is member
    const members = await storage.getGroupMembers(groupId);
    if (!members.some(m => m.id === userId)) {
      return res.status(403).json({ message: "Not a member of this group" });
    }
    
    await storage.deleteChecklistStatus(
      groupId, 
      itemName, 
      scope === 'individual' ? userId : undefined
    );
    res.status(204).send();
  });

  // Master Checklist Items
  app.get(api.masterChecklist.list.path, requireAuth, async (req, res) => {
    const userId = (req.user as any).claims?.sub;
    const items = await storage.getMasterChecklistItems(userId);
    res.json(items);
  });

  app.post(api.masterChecklist.create.path, requireAuth, async (req, res) => {
    const userId = (req.user as any).claims?.sub;
    const input = api.masterChecklist.create.input.parse(req.body);
    const item = await storage.createMasterChecklistItem({ ...input, userId });
    res.status(201).json(item);
  });

  app.patch(api.masterChecklist.update.path, requireAuth, async (req, res) => {
    const id = parseInt(req.params.id);
    const input = api.masterChecklist.update.input.parse(req.body);
    const item = await storage.updateMasterChecklistItem(id, input);
    res.json(item);
  });

  app.delete(api.masterChecklist.delete.path, requireAuth, async (req, res) => {
    const id = parseInt(req.params.id);
    await storage.deleteMasterChecklistItem(id);
    res.status(204).send();
  });

  app.post(api.masterChecklist.seed.path, requireAuth, async (req, res) => {
    const userId = (req.user as any).claims?.sub;
    const added = await storage.seedMasterChecklistItems(userId);
    res.json({ added });
  });

  // Trip Checklist
  app.get(api.tripChecklist.list.path, requireAuth, async (req, res) => {
    const userId = (req.user as any).claims?.sub;
    const groupId = parseInt(req.params.groupId);
    const members = await storage.getGroupMembers(groupId);
    if (!members.some(m => m.id === userId)) {
      return res.status(403).json({ message: "Not a member of this group" });
    }
    const items = await storage.getTripChecklist(groupId);
    res.json(items);
  });

  app.post(api.tripChecklist.create.path, requireAuth, async (req, res) => {
    const userId = (req.user as any).claims?.sub;
    const groupId = parseInt(req.params.groupId);
    const members = await storage.getGroupMembers(groupId);
    if (!members.some(m => m.id === userId)) {
      return res.status(403).json({ message: "Not a member of this group" });
    }
    const input = api.tripChecklist.create.input.parse(req.body);
    const item = await storage.createTripChecklistItem(groupId, input.text, userId, input.assignedUserId);
    res.status(201).json(item);
  });

  app.patch(api.tripChecklist.update.path, requireAuth, async (req, res) => {
    const userId = (req.user as any).claims?.sub;
    const id = parseInt(req.params.id);
    const item = await storage.getTripChecklistItem(id);
    if (!item) return res.status(404).json({ message: "Item not found" });
    const members = await storage.getGroupMembers(item.groupId);
    if (!members.some(m => m.id === userId)) {
      return res.status(403).json({ message: "Not a member of this group" });
    }
    const input = api.tripChecklist.update.input.parse(req.body);
    const updated = await storage.updateTripChecklistItem(id, input);
    res.json(updated);
  });

  app.delete(api.tripChecklist.delete.path, requireAuth, async (req, res) => {
    const userId = (req.user as any).claims?.sub;
    const id = parseInt(req.params.id);
    const item = await storage.getTripChecklistItem(id);
    if (!item) return res.status(404).json({ message: "Item not found" });
    const members = await storage.getGroupMembers(item.groupId);
    if (!members.some(m => m.id === userId)) {
      return res.status(403).json({ message: "Not a member of this group" });
    }
    await storage.deleteTripChecklistItem(id);
    res.status(204).send();
  });

  // Group Settings Update
  app.patch('/api/groups/:id/settings', requireAuth, async (req, res) => {
    const userId = (req.user as any).claims?.sub;
    const groupId = parseInt(req.params.id);
    
    // Verify user is a member
    const members = await storage.getGroupMembers(groupId);
    if (!members.some(m => m.id === userId)) {
      return res.status(403).json({ message: "Not a member of this group" });
    }
    
    const { isChecklistEnabled, gpxData, notes, name, location, tripTypes } = req.body;
    const updates: { isChecklistEnabled?: boolean; gpxData?: string | null; notes?: string | null; name?: string; location?: string | null; tripTypes?: string[] | null; latitude?: number | null; longitude?: number | null } = {};
    if (isChecklistEnabled !== undefined) updates.isChecklistEnabled = isChecklistEnabled;
    if (gpxData !== undefined) updates.gpxData = gpxData;
    if (notes !== undefined) updates.notes = notes;
    if (name !== undefined) updates.name = name;
    if (location !== undefined) updates.location = location;
    if (tripTypes !== undefined) updates.tripTypes = tripTypes;
    
    if (location) {
      const coords = await geocodeLocationName(location);
      if (coords) {
        updates.latitude = coords.lat;
        updates.longitude = coords.lng;
      }
    } else if (location === null || location === '') {
      updates.latitude = null;
      updates.longitude = null;
    }
    
    const updated = await storage.updateGroupSettings(groupId, updates);
    res.json(updated);
  });

  return httpServer;
}
