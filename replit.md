# The Wander List - Your Adventure Planner

## Overview

The Long Walk is a collaborative packing and trip planning tool for hiking groups. Users can create or join groups via share codes, manage personal and shared gear lists, track weight and costs, and plan multi-day itineraries together. The application uses Replit Auth for authentication and provides a modern, outdoor-themed UI.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state caching and synchronization
- **Styling**: Tailwind CSS with shadcn/ui component library (New York style)
- **Build Tool**: Vite with path aliases (`@/` for client, `@shared/` for shared code)

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript (ESM modules)
- **API Design**: RESTful endpoints defined in `shared/routes.ts` with Zod validation schemas
- **Authentication**: Replit Auth (OpenID Connect) with Passport.js, session-based with PostgreSQL session store

### Data Storage
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with Zod schema generation via drizzle-zod
- **Schema Location**: `shared/schema.ts` and `shared/models/auth.ts`
- **Migrations**: Drizzle Kit with `db:push` command

### Key Data Models
- **Users**: Managed by Replit Auth (id, email, firstName, lastName, profileImageUrl, unitSystem, dateFormat)
- **Groups**: Trip planning groups with share codes for joining, location field, editable after creation (name, location, tripTypes via PATCH /api/groups/:id/settings)
- **GroupMembers**: Many-to-many relationship between users and groups
- **Items**: Gear, clothing, and food items with weight/price tracking, can be personal or shared
- **MasterItems**: User's personal gear closet - gear and clothing stored against their profile
- **ItineraryDays**: Day-by-day trip planning with location and distance
- **ItineraryStages**: Individual stage/leg within a day with mode, start/end points, GPS coordinates, distance, elevation, duration
- **TripChecklist**: Per-trip task checklist items with text, assignee (trip member), completion status, created by user

### Smart Weather Badge Feature
- Displays weather forecast on itinerary Day cards next to the date
- **Within 10 days**: Fetches from Open-Meteo Forecast API (`api.open-meteo.com/v1/forecast`)
- **Beyond 10 days**: Fetches from Open-Meteo Archive API using previous year's same date
- **Real Geocoding**: Uses Open-Meteo Geocoding API (`geocoding-api.open-meteo.com/v1/search`) to convert location names to coordinates, with in-memory cache
- **Location Fallback**: If an itinerary day has no specific location, falls back to the group/trip location
- **Waterfall Coordinate Strategy** (`getWeatherCoordinates`):
  1. **Priority 1 (Exact GPS)**: Last stage's `endLatitude`/`endLongitude` from DB
  2. **Priority 2 (Stage Name)**: Last stage's `endPoint` geocoded via Open-Meteo
  3. **Priority 3 (Trip Location)**: Trip's stored `latitude`/`longitude` or geocoded `location`
  4. **Priority 4 (Day Location)**: Day's location name geocoded
  5. **Priority 5 (Fallback)**: Browser geolocation or Melbourne default
- **Server-side Geocoding on Save**: When stages or trips are created/updated with location names, server geocodes and stores lat/lng in background
- **Bulk Stage Fetch**: `GET /api/groups/:groupId/stages` endpoint returns all stages for a group in one call (avoids N+1)
- **WMO Code to Icon Mapping**: Clear (Sun), Partly Cloudy (CloudSun), Fog (CloudFog), Rain (CloudRain), Snow (Snowflake), Thunderstorm (CloudLightning)
- Display format: `[Icon] MaxTemp°C`

### Master List / Gear Closet Feature
- Users can store gear and clothing items in a personal "My Gear" closet at `/my-gear`
- Items have category (gear/clothing), type (e.g., Sleep System, Footwear), name, brand, model, weight, price
- **Add from Closet**: Multi-select modal allows users to pick specific items from their closet to add to a trip
- **Auto-save to Closet**: When gear/clothing items are added to a trip, they are automatically saved to the user's closet
  - Opt-out checkbox "Don't save to my gear closet" available in the Add Item form
- Duplicate detection uses name+brand+model to allow similar items with different brands/models
- Sync operations are scoped to the current user and enforce group membership

### User Preferences (Metric/Imperial & Date Format)
- Users can toggle between metric (kg, km, °C) and imperial (lb, mi, °F) units
- Users can toggle between DD-MM-YYYY and MM-DD-YYYY date formats
- Preferences stored in `users` table columns: `unitSystem` (default: "metric"), `dateFormat` (default: "DD-MM-YYYY")
- **Formatting Hook**: `usePreferences()` in `client/src/hooks/use-preferences.ts` provides:
  - `formatWeight(grams)` - displays in kg/g or lb/oz
  - `formatWeightTotal(grams)` - total weights in kg or lb
  - `formatWeightUnit(grams)` - returns `{value, unit}` for inline display
  - `formatDistance(km)` - displays in km or mi
  - `formatElevation(meters)` - displays in m or ft
  - `formatDate(dateStr)` - formats YYYY-MM-DD to user's preferred format
  - `formatTemperature(celsius)` - displays in °C or °F
- Applied in: ItemList, PackWeightSummary, StageList, GroupView dates, WeatherBadge, MyGear, AddFromClosetDialog

### Authentication Flow
- Replit Auth handles login/logout via `/api/login` and `/api/logout`
- Sessions stored in PostgreSQL `sessions` table
- User data upserted on login via `authStorage.upsertUser()`
- Protected routes use `requireAuth` middleware checking `req.isAuthenticated()`

### Project Structure
```
client/           # React frontend
  src/
    components/   # UI components including shadcn/ui
    hooks/        # React Query hooks for data fetching
    pages/        # Route components (Home, Dashboard, GroupView, MyGear)
    lib/          # Utilities (queryClient, auth-utils)
server/           # Express backend
  replit_integrations/auth/  # Replit Auth setup
shared/           # Shared types, schemas, and routes
  models/auth.ts  # User and session schemas
  schema.ts       # All other database schemas
  routes.ts       # API route definitions with Zod validation
  constants.ts    # Gear catalog data
```

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable
- **connect-pg-simple**: Session storage in PostgreSQL

### Authentication
- **Replit Auth**: OpenID Connect provider via `ISSUER_URL`
- **Required Environment Variables**: `DATABASE_URL`, `SESSION_SECRET`, `REPL_ID`

### Key NPM Packages
- **drizzle-orm** / **drizzle-kit**: Database ORM and migrations
- **@tanstack/react-query**: Client-side data fetching and caching
- **zod**: Runtime validation for API inputs/outputs
- **passport** / **openid-client**: Authentication handling
- **nanoid**: Generating unique share codes for groups

### UI Libraries
- **shadcn/ui**: Component library built on Radix UI primitives
- **lucide-react**: Icon library
- **tailwind-merge** / **clsx**: CSS class utilities