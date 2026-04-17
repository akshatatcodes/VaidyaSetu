# Google Fit Integration Setup Guide

This guide explains how to configure Google Fit for your VaidyaSetu instance to track steps, heart rate, weight, and sleep across all your devices.

## 1. Google Cloud Console Configuration

### Create/Select Project
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Select your project (or create a new one).

### Enable APIs
1. Navigate to **APIs & Services > Library**.
2. Search for **"Fitness API"** and click **Enable**.

### OAuth Consent Screen
1. Go to **APIs & Services > OAuth consent screen**.
2. Select **External** (unless you have a Google Workspace).
3. Fill in the required fields (App name, Email).
4. **Scopes**: Add the following scopes:
   - `.../auth/fitness.activity.read`
   - `.../auth/fitness.body.read`
   - `.../auth/fitness.heart_rate.read`
   - `.../auth/fitness.sleep.read`

### Credentials (Client ID & Secret)
1. Go to **APIs & Services > Credentials**.
2. Click **Create Credentials > OAuth client ID**.
3. Select **Web application**.
4. **Authorized JavaScript origins**: `http://localhost:5173` (and your production URL).
5. **Authorized redirect URIs**: `http://localhost:5173` (and your production URL).
6. Click **Create** and copy your **Client ID** and **Client Secret**.

## 2. Environment Variables

### Frontend (`frontend/.env.local`)
Add your Web Client ID here:
```env
VITE_GOOGLE_CLIENT_ID=46689999387-am55kib2evd6kfts24uonks1ia06j8cq.apps.googleusercontent.com
```

### Backend (`backend/.env`)
Add both the Client ID and Secret here:
```env
GOOGLE_CLIENT_ID=46689999387-am55kib2evd6kfts24uonks1ia06j8cq.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET_HERE
```

## 3. Cross-Device Tracking (Android & iOS)

VaidyaSetu is a **Web Application**. To track data from an Android or iOS device:
1. Ensure your fitness band/watch is connected to the **Google Fit** app on your phone.
2. In the VaidyaSetu web app, click **"Sync Google Fit"**.
3. Sign in with the **same Google account** used on your phone.
4. The web app will pull your data directly from Google's cloud servers, regardless of which device originally recorded it.

## 4. Troubleshooting
- **invalid_client**: Usually means the Client ID is wrong or the Javascript Origin (localhost) doesn't match exactly.
- **Access Blocked**: Ensure you have added the correct Scopes in the OAuth Consent Screen.
- **No Data**: Ensure your fitness device has synced with the Google Fit app on your phone recently.
