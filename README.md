# E-Sched Connect

A comprehensive class scheduling management system for educational institutions with real-time conflict detection, role-based access control, and schedule adjustment workflows.

## Quick Start

### Local Development

```bash
npm install
npm run dev
```

The app will start on `http://localhost:5000`

### Create Test Account

1. Click "Create Account" on the login page
2. Enter details and select your role (Admin/Professor)
3. Sign in with your credentials

## Features

### For Administrators
- **Dashboard**: Overview of system status and recent activities
- **Professor Management**: Add, edit, delete faculty members
- **Subject Management**: Maintain course catalog with codes and units
- **Room Management**: Track classroom inventory and capacity
- **Schedule Builder**: Create schedules with real-time conflict detection
- **Adjustment Requests**: Review and approve/deny schedule change requests
- **Reports**: Generate workload and utilization reports (PDF export)
- **Audit Trail**: Track all system changes with timestamps and user info

### For Professors
- **Dashboard**: Overview of teaching schedule and workload
- **My Schedule**: View weekly class schedule by day
- **Adjustment Requests**: Submit schedule change requests with reasoning
- **Request Tracking**: Monitor status of submitted requests

## Technology Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: Firebase Firestore (real-time cloud database)
- **Authentication**: Firebase Auth (email/password)
- **Components**: Shadcn UI (Radix primitives + Tailwind)
- **State**: React Query v5 + React Hook Form
- **Routing**: Wouter (lightweight router)

## Project Structure

```
client/src/
├── pages/              # Page components by role
│   ├── admin/         # Admin interface
│   ├── professor/     # Professor interface
│   ├── login.tsx
│   ├── register.tsx
│   └── not-found.tsx
├── components/        # Reusable components
│   └── ui/           # Shadcn UI components
├── lib/              # Utilities and contexts
│   ├── firebase.ts   # Firebase config
│   ├── auth-context.tsx
│   └── queryClient.ts
└── App.tsx          # Main routing component

shared/schema.ts      # Zod schemas for type safety
server/               # Minimal Express backend
firestore.rules       # Firestore security rules
```

## Data Model

### Collections

- **users**: User profiles with roles
- **professors**: Faculty member records
- **subjects**: Course catalog
- **rooms**: Classroom inventory
- **schedules**: Class schedule entries
- **adjustmentRequests**: Schedule change requests
- **auditLogs**: System activity log
- **notifications**: User notifications

## Key Workflows

### Creating a Schedule

1. Admin navigates to Schedules
2. Clicks "Add Schedule"
3. Selects professor, subject, room, time, day
4. System checks for conflicts (professor/room double-booking)
5. If no conflicts, schedule is created
6. All changes logged to audit trail

### Requesting Schedule Changes (Professor)

1. Professor views their schedule
2. Clicks "Request Change" on a class
3. Provides new day/time/room and reason
4. Request submitted with "pending" status
5. Admin reviews in Adjustment Requests
6. Admin approves/denies with notes
7. If approved, schedule auto-updates

## Testing Accounts

For initial testing, create accounts with these details:

### Admin Account
- Email: `admin@test.edu`
- Password: `password123`
- Role: Administrator

### Professor Account
- Email: `prof@test.edu`
- Password: `password123`
- Role: Professor

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete Firebase setup and Replit deployment instructions.

### Quick Deployment Steps

1. Create Firebase project at console.firebase.google.com
2. Enable Authentication (Email/Password) and Firestore
3. Get project credentials (API key, App ID, Project ID)
4. Add to Replit Secrets (lock icon):
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_FIREBASE_PROJECT_ID`
5. Deploy Firestore security rules from `firestore.rules`
6. Click Deploy on Replit

## Design System

- **Font**: Inter (system font)
- **Colors**: Blue primary (#2563eb), professional grays
- **Spacing**: 4px grid system
- **Components**: Shadcn UI (Tailwind + Radix primitives)
- **Interactions**: Hover elevations, smooth transitions

## Security

- Firebase Authentication with secure password hashing
- Role-based access control (RBAC)
- Protected routes enforce role authorization
- Firestore security rules restrict unauthorized access
- No sensitive data exposed in client code
- All timestamps server-controlled

## Performance

- React Query caching for optimal data fetching
- Firestore real-time updates for synchronization
- Code splitting via Vite bundler
- Lazy loading of images and components
- Optimized re-renders with memoization

## Testing

All interactive elements have `data-testid` attributes for easy testing:
- Buttons: `button-[action]-[target]` (e.g., `button-add-professor`)
- Inputs: `input-[field-name]` (e.g., `input-email`)
- Display: `text-[description]-[id]` (e.g., `text-username`)

## Common Issues

### "No professor profile found"
- Admin must create a professor record
- Set the `userId` field to the professor's Firebase Auth ID
- Professor can then view their schedule

### Schedules not saving
- Check browser console for validation errors
- Verify conflict detection isn't blocking the schedule
- Ensure all required fields are filled

### Real-time updates not working
- Check Firestore security rules are deployed
- Verify browser has active internet connection
- Check Firestore quota usage in Firebase Console

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Future Enhancements

- Email notifications for schedule changes
- Advanced search and filtering
- Batch schedule operations
- Schedule templates
- Data import/export (CSV)
- Mobile app version

## Support & Troubleshooting

1. Check the [DEPLOYMENT.md](./DEPLOYMENT.md) guide
2. Review browser console for errors
3. Check Firebase Console for data issues
4. Verify Firestore security rules are correctly deployed

## License

This project is provided as-is for educational use.

---

**Version**: 1.0.0
**Last Updated**: November 2025
**Maintainer**: Your Institution Name
