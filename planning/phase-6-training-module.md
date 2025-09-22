# Phase 6: Training & SOPs Module - Technical Planning

## Overview
A comprehensive training and standard operating procedures (SOPs) platform integrated into the Asset Management dashboard. This module will enable team members to create, view, and track training materials using Loom videos.

## Key Features

### 1. Training App Integration
- 5th app tile in Asset Management view only
- Icon suggestions: Book, Graduation cap, or Video play button
- Consistent styling with existing app tiles
- Routes to `/training` page

### 2. Module Creation System

#### Firestore Schema
```typescript
// training-modules collection
interface TrainingModule {
  id: string;
  title: string;
  description: string;
  category: string;
  loomUrl: string;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  viewCount: number;
  checklist: ChecklistItem[];
  isArchived: boolean;
}

interface ChecklistItem {
  id: string;
  text: string;
  order: number;
}

// training-categories collection
interface TrainingCategory {
  name: string;
  usageCount: number;
  lastUsed: Timestamp;
}

// user-module-progress collection
interface UserModuleProgress {
  userId: string;
  moduleId: string;
  completedChecklist: string[]; // checklist item IDs
  lastViewed: Timestamp;
  isCompleted: boolean;
  notes: string;
}
```

### 3. UI/UX Design

#### Module List Page (`/training`)
- Grid or list view toggle
- Category filtering sidebar
- Search functionality
- Sort by: Recent, Popular, Category
- "Add New Module" button (prominent)
- Module cards showing:
  - Title
  - Category badge
  - Preview thumbnail from Loom
  - View count
  - Created date
  - Creator name

#### Module Creation Modal
- Clean form design
- Fields:
  - Title (required)
  - Description (textarea)
  - Category (auto-complete from existing)
  - Loom URL (with validation)
  - Checklist items (dynamic add/remove)
- Save/Cancel buttons
- Loading states

#### Module View Page (`/training/[moduleId]`)
- Layout:
  ```
  +------------------+------------+
  |                  |            |
  |   Loom Video     | Checklist  |
  |   (16:9 ratio)   | (scrollable)|
  |                  |            |
  +------------------+------------+
  |          Comments Section      |
  |        (with Asana links)      |
  +--------------------------------+
  ```
- Progress tracking
- Mark complete functionality
- Bookmark option

### 4. Category Management
- Auto-complete implementation
- Popular categories bubble to top
- Default categories:
  - Real Estate
  - Bookkeeping
  - Property Management
  - Software Training
  - Compliance
  - Administrative

### 5. Admin Features
- Super admin detection (your email)
- Delete module capability
- Edit module metadata
- Archive/unarchive modules
- View analytics

### 6. User Experience Enhancements
- Recently viewed modules
- Progress indicators
- Module completion certificates
- Search with filters
- Mobile responsive design

## Technical Implementation

### Loom Integration
```typescript
// Loom URL validation
const isValidLoomUrl = (url: string): boolean => {
  return url.match(/^https:\/\/(www\.)?loom\.com\/share\/[a-zA-Z0-9]+$/);
};

// Extract video ID for embedding
const getLoomVideoId = (url: string): string => {
  return url.split('/').pop() || '';
};

// Embed component
<iframe
  src={`https://www.loom.com/embed/${videoId}`}
  frameBorder="0"
  allowFullScreen
  className="w-full aspect-video"
/>
```

### Performance Considerations
- Lazy load video embeds
- Paginate module lists
- Cache category data
- Optimize Firestore queries
- Implement search indexing

## Security Rules
```javascript
// Firestore rules for training modules
match /training-modules/{moduleId} {
  allow read: if request.auth != null && 
    request.auth.token.email.matches('.*@tgmventures.com');
  allow create: if request.auth != null && 
    request.auth.token.email.matches('.*@tgmventures.com');
  allow update: if request.auth != null && 
    request.auth.token.email.matches('.*@tgmventures.com') &&
    (request.auth.token.email == resource.data.createdBy ||
     request.auth.token.email == 'YOUR_ADMIN_EMAIL@tgmventures.com');
  allow delete: if request.auth != null && 
    request.auth.token.email == 'YOUR_ADMIN_EMAIL@tgmventures.com';
}
```

## MVP Scope
1. Basic module creation and viewing
2. Category system with auto-complete
3. Loom video embedding
4. Simple checklist (no progress tracking initially)
5. Admin delete capability
6. Basic search functionality

## Future Enhancements
- Module versioning
- Quizzes and assessments
- Completion certificates
- Advanced analytics
- Module prerequisites
- Team assignments
- Notification system
