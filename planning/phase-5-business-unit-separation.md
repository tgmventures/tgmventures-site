# Phase 5: Business Unit Separation - Technical Planning

## Overview
This phase involves splitting the dashboard into two distinct business units:
1. **Asset Management** - Real estate, property management, bookkeeping
2. **Ventures** - Startups, technology projects, innovation

## Architecture Changes

### Firestore Schema Updates

#### User Document Enhancement
```typescript
interface UserData {
  // Existing fields...
  businessUnit: 'asset-management' | 'ventures';
  lastViewedUnit: Date;
  permissions?: {
    canViewAssetManagement: boolean;
    canViewVentures: boolean;
    isSuperAdmin: boolean;
  };
}
```

#### Ventures-Specific Collections
```typescript
// ventures-objectives collection
interface VenturesObjectiveCard {
  id: string;
  userId: string;
  title: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  order: number;
  objectives: {
    id: string;
    text: string;
    isChecked: boolean;
    order: number;
  }[];
}
```

### UI Components

#### Business Unit Toggle
- Located in profile dropdown menu
- Smooth transition between views
- Remembers user preference
- Visual indicator of current view

#### Asset Management View (Current Dashboard Refined)
- Apps: Gmail, Asana, Perplexity, ChatGPT
- Columns: Asset Management, Real Estate, Tax Filings
- No ventures-related content visible

#### Ventures View (New Dashboard)
- Apps: Firebase, GitHub, Google Cloud, Gmail
- Dynamic objective cards with full CRUD operations
- Drag-and-drop between and within cards
- Clean, tech-focused aesthetic

### State Management
- Use React Context for business unit state
- Persist selection to Firestore
- Preload data for smooth transitions
- Handle edge cases (new users, permission changes)

### Migration Strategy
1. Deploy database changes first
2. Add business unit field to existing users (default: asset-management)
3. Implement toggle without breaking existing functionality
4. Roll out ventures view incrementally
5. Monitor for issues and gather feedback

## Implementation Priorities
1. Database schema and migration scripts
2. Profile dropdown toggle UI
3. View routing and state management
4. Asset Management view refinements
5. Ventures view new features
6. Testing and edge case handling

## Testing Checklist
- [ ] User can toggle between views
- [ ] Preference persists across sessions
- [ ] Data isolation between views
- [ ] Smooth transitions
- [ ] Mobile responsiveness
- [ ] Performance under load
- [ ] Edge cases (new users, permission changes)
