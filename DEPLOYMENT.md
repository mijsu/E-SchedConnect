# E-Sched Connect - Deployment Guide

## Overview

E-Sched Connect is a production-ready educational scheduling management system. This guide covers deployment on Replit and configuration of Firebase services.

## Prerequisites

- Firebase project (free tier or paid)
- Replit account with deployment capabilities
- Firebase credentials (API key, App ID, Project ID)

## Step 1: Firebase Setup

### Create Firebase Project

1. Visit [Firebase Console](https://console.firebase.google.com/)
2. Click "Create Project" and fill in the details
3. Enable Google Analytics (optional)
4. Click "Create"

### Enable Authentication

1. In Firebase Console, go to **Authentication**
2. Click **Get Started**
3. Enable **Email/Password** provider
4. Save changes

### Create Firestore Database

1. Go to **Firestore Database**
2. Click **Create Database**
3. Choose **Production mode** (security rules must be configured)
4. Select your preferred location
5. Click **Create**

### Get Project Credentials

1. Go to **Project Settings** (gear icon)
2. Click **Your apps** section
3. Select your web app or create a new one
4. Copy the Firebase config:
   ```javascript
   {
     "apiKey": "YOUR_API_KEY",
     "appId": "YOUR_APP_ID",
     "projectId": "YOUR_PROJECT_ID",
     ...
   }
   ```

## Step 2: Configure Replit Secrets

1. In Replit, open the **Secrets** tab (lock icon)
2. Add the following secrets with values from Firebase:
   - `VITE_FIREBASE_API_KEY` - apiKey from Firebase config
   - `VITE_FIREBASE_APP_ID` - appId from Firebase config
   - `VITE_FIREBASE_PROJECT_ID` - projectId from Firebase config

## Step 3: Deploy Firestore Security Rules

### Option A: Using Firebase CLI (Recommended)

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize Firebase in your project:
   ```bash
   firebase init firestore
   ```

4. Deploy rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

### Option B: Manual Configuration

1. Go to **Firestore Database > Rules** tab
2. Replace the default rules with contents from `firestore.rules`
3. Click **Publish**

## Step 4: Configure Firebase Authorized Domains

1. Go to **Authentication > Settings**
2. Scroll to **Authorized domains**
3. Add your Replit domain:
   - Your Replit deployment URL (e.g., `project-name.replit.dev`)
   - Or your custom domain if using one

## Step 5: Deploy on Replit

1. Click the **Deploy** button in Replit
2. Select **Production**
3. Wait for deployment to complete
4. Your app will be available at the provided URL

## Step 6: Create First Admin Account

### Option A: Via Registration Page

1. Visit the deployed app URL
2. Go to **Create Account**
3. Enter details and select **Administrator** role
4. Click **Create Account**
5. Log in with your credentials

### Option B: Via Firebase Console

If you prefer to set up users first:

1. Go to **Authentication > Users** in Firebase Console
2. Click **Add User** (or they can register through the app)
3. Create a professor record in **Firestore > professors** collection
4. Link it to the Firebase user by setting the `userId` field

## Step 7: Initial Data Setup

### Create Sample Data

Once logged in as Admin:

1. **Professors**: Add faculty members via Admin > Professors
2. **Subjects**: Create course catalog via Admin > Subjects
3. **Rooms**: Add classroom/lab information via Admin > Rooms
4. **Schedules**: Build class schedules via Admin > Schedules

### For Professors

1. Have professors register with **Professor** role
2. Create professor records and link them to Firebase users
3. They can then view their schedules and submit adjustment requests

## Environment Variables

All Firebase credentials are stored as secrets in Replit:

```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_PROJECT_ID=your_project_id
```

These are automatically injected into the frontend and are safe (not exposed in bundle).

## Troubleshooting

### "Firebase is not defined"
- Verify all three Firebase secrets are set in Replit
- Restart the application after adding secrets

### "Permission denied" errors
- Check Firestore security rules are deployed
- Verify user has proper role (admin/professor)
- Check browser console for specific error message

### "Unauthorized domain" error
- Add your Replit/deployment URL to Firebase Authorized domains
- Wait a few minutes for changes to propagate

### Schedules not showing for professors
- Verify professor record is created in Firestore
- Ensure `userId` field is set to Firebase Auth user ID
- Check schedules are assigned to that professor

## Performance Optimization

### Firestore Indexes

For optimal performance with large datasets, Firestore automatically suggests indexes. When prompted in the console, enable suggested indexes.

### Frontend Caching

The app uses React Query with automatic cache invalidation. No additional caching configuration needed.

## Security Best Practices

1. **Firestore Rules**: Current rules restrict access by role. Review before production
2. **Firebase Auth**: Use strong password requirements (enforced by app)
3. **HTTPS**: All connections are encrypted. No additional setup needed.
4. **Secrets**: Never commit Firebase credentials to version control

## Monitoring & Maintenance

### Check Activity

1. **Firestore**: Monitor reads/writes in Firebase Console
2. **Audit Trail**: Admin > Audit Trail shows all system changes
3. **Errors**: Check browser console for client-side issues

### Backups

Firestore provides automatic daily backups. Contact Firebase support for custom backup schedules.

## Scaling Considerations

Current setup supports:
- ~100,000 Firestore documents
- ~1000 concurrent users
- ~100 schedules per professor

For larger deployments, consider:
- Cloud Functions for complex operations
- Cloud Storage for document attachments
- Cloud Tasks for scheduled operations

## Support

For issues:
1. Check Firestore console for data integrity
2. Review browser developer tools for client-side errors
3. Check Firebase Authentication status
4. Review Firestore security rules configuration

---

**Last Updated**: November 2025
**Version**: 1.0.0
