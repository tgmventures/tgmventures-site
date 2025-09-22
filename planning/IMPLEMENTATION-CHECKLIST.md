# 📋 TGM Ventures Implementation Checklist

## 📱 Phase 7: Mobile Training UX (Current Sprint)
- [ ] **Collapsible Sidebar**: Training module sidebar takes too much space on mobile
  - [ ] Hamburger menu for mobile (<768px)
  - [ ] Auto-collapse on mobile load
  - [ ] Slide-out animation with backdrop
  - [ ] Swipe left to open, swipe right to close
  - [ ] Persist state in localStorage
- [ ] **Responsive Video Layout**: 
  - [ ] Stack video above checklist on mobile
  - [ ] Full-width Loom player
  - [ ] Maintain 16:12 aspect ratio
- [ ] **Touch-Optimized Controls**:
  - [ ] 44px minimum touch targets
  - [ ] Proper spacing between interactive elements
  - [ ] Test on iPhone and Android devices

## 🌙 Phase 8: Daily Task Reset System
- [ ] **Midnight Vanishing**: Completed tasks disappear at midnight same day (UI only)
  - [ ] Add `completedAt: Timestamp` to all task interfaces
  - [ ] Create `shouldShowTask(task)` filter: hide if completed before today
  - [ ] Keep all data in Firestore (no deletion)
  - [ ] Apply to Asset Management monthly recurring tasks
  - [ ] Apply to Tax Filing annual tasks
  - [ ] Apply to Real Estate persistent tasks  
  - [ ] Apply to Venture objective cards
- [ ] **User Experience**: Help users feel accomplished with clean dashboard
  - [ ] Fade-out animation on task completion (2s)
  - [ ] Success toast: "Great job! This will clear at midnight"
  - [ ] Show completion count in header: "3 tasks completed today"
- [ ] **History Tracking**: Enable viewing past completions
  - [ ] "View History" link for admins
  - [ ] Calendar view of completed tasks
  - [ ] Export completion data for payroll/reviews

## 📊 Phase 9: Weekly Reporting Module
- [ ] **Architecture**: Standalone module at `/reports` with plugin system
  - [ ] Reports app tile on dashboard (position 7)
  - [ ] Plugin interface: `IReportPlugin { getDataForRange(start, end), getMetrics(), renderSection() }`
  - [ ] Core engine handles date ranges, aggregation, formatting
- [ ] **User Attribution**: Track WHO completes WHAT
  - [ ] Add `completedBy: { uid, email, name }` to all completable entities
  - [ ] Retrofit existing completed items with system user
  - [ ] Real-time tracking going forward
- [ ] **Weekly Summary Contents**:
  - [ ] Objectives by person: newly added vs completed
  - [ ] Task completion rates by division
  - [ ] Training modules: created, completed, comments
  - [ ] Team activity heatmap
- [ ] **External Integrations** (via plugins):
  - [ ] Asana: Pull completed tasks via API (filter by @tgmventures.com assignees)
  - [ ] Rent Manager: Financial metrics via API (rent collected, expenses, NOI)
  - [ ] Future: QuickBooks, Google Analytics, etc.
- [ ] **Report Distribution**:
  - [ ] Interactive web dashboard with charts (Chart.js)
  - [ ] PDF generation with company branding
  - [ ] Weekly email to leadership (Mondays 8am)
  - [ ] Slack integration for key metrics

## 💼 Phase 10: Video-First Careers Platform
- [ ] **Public Jobs Portal** `/careers`:
  - [ ] Modern job board with category filters
  - [ ] Individual job pages with Loom video + description
  - [ ] "Apply Now" prominent CTA
  - [ ] SEO: meta tags, structured data, sitemap
- [ ] **Application Builder** (Admin):
  - [ ] Drag-drop questionnaire designer
  - [ ] Question types: Yes/No, Multiple Choice, Checkboxes, Short Text (255 char), Long Text, Rating Scale
  - [ ] Conditional logic: show/hide based on answers
  - [ ] Required/optional flags
  - [ ] Preview mode for testing
  - [ ] Save as templates for reuse
- [ ] **Video Interview System**: Core differentiator
  - [ ] WebRTC in-browser recording (no downloads)
  - [ ] Configurable prompts: "Tell us about yourself" (2 min limit)
  - [ ] Single take only - no retries (builds authenticity)
  - [ ] Auto-upload to Firebase Storage/Google Cloud
  - [ ] Fallback for older browsers
  - [ ] Mobile-first design
- [ ] **Candidate Experience**:
  - [ ] Step indicator: Job Info → Questions → Video → Submit
  - [ ] Auto-save progress (can return later)
  - [ ] Email confirmation with application ID
  - [ ] Status page to check progress
- [ ] **Review Pipeline** (Admin):
  - [ ] Kanban board: New → Shortlist → Interview → Offer → Rejected
  - [ ] Quick video preview on hover
  - [ ] Full video player with speed controls
  - [ ] Scoring: 1-5 stars + notes
  - [ ] Team comments thread per candidate
  - [ ] Bulk actions: reject multiple, export to CSV
  - [ ] Email templates for each stage
- [ ] **Integrations**:
  - [ ] Export candidate to Asana as task
  - [ ] Calendar links for interview scheduling
  - [ ] Analytics: funnel conversion, time-to-hire
  - [ ] EEOC compliance reporting

## 🔧 Maintenance Tasks
- [ ] **Weekly**: Security scan, backup verification
- [ ] **Monthly**: Update dependencies, review error logs
- [ ] **Quarterly**: Code quality audit, performance review
- [ ] **Annually**: Penetration testing, compliance audit

---

**Last Updated**: December 22, 2024
**Next Review**: Start of each phase

**Note**: Each item must be tested on staging before marking complete. Include test results in commit message.