# KnovaTwin — Client-side routes

All sidebar modules and sub-screens are reachable via URL. The app uses **React Router** and keeps the URL in sync with the current view.

## Route list

| Path | Screen | Auth |
|------|--------|------|
| `/` | Landing (login/register) | Public |
| `/login` | Same as `/` | Public |
| `/about` | About Us | Public |
| `/dashboard` | Dashboard | Required |
| `/courses` | My Courses (list) | Required |
| `/courses/:courseId` | Course detail (first or no module) | Required |
| `/courses/:courseId/modules/:moduleId` | Course module view | Required |
| `/knowledge-graph` | Knowledge Graph | Required |
| `/live-tutor` | Live Tutor | Required |
| `/scenario-lab` | Scenario Lab | Required |
| `/pathfinder` | Career Pathfinder | Required |
| `/meeting-prep` | Meeting Prep | Required |
| `/course-builder` | Course Builder (Creator Studio) | Creator |
| `/twin-lab` | Twin Lab | Creator |
| `/impact` | BICE Impact | Manage |
| `/workforce` | Workforce (team list) | Manage |
| `/workforce/teams/:teamId` | Workforce with team selected | Manage |
| `/cohorts` | Cohorts | Manage |
| `/assessments` | Assessments (list) | Manage |
| `/assessments/:assessmentId` | Assessment detail | Manage |
| `/rewards` | Rewards / Affiliate | Required |
| `/admin` | Admin Console | Super Admin |
| `/settings` | Settings | Required |
| `/subscription` | Subscription | Required |
| `/embed/:twinId` | Public agent embed | Public |

## Behaviour

- **Auth:** If the user is not logged in and visits a non-public path, they are redirected to `/`. If they are logged in and visit `/` or `/login`, they are redirected to `/dashboard`.
- **Deep links:** Sharing `/courses/abc-123/modules/def-456` opens that course and module. Sharing `/assessments/xyz` opens that assessment (for users with access).
- **Legacy embed:** `?view=public_agent&twinId=xyz` is redirected to `/embed/xyz`.
- **Browser back/forward** updates the view and any IDs (course, module, assessment, team) from the URL.

## Implementation

- **`routes.ts`** — Path helpers (`paths.*`), `parsePathname()`, `pathFor()`, `isPublicPath()`.
- **`App.tsx`** — `useLocation()` / `useNavigate()`; one effect syncs `location.pathname` → view and params; all navigation uses `navigateToView(view, params)` (i.e. `navigate(pathFor(...))`).
