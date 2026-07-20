# Manual Render Deployment Guide - Incident Management System

## Complete Step-by-Step Deployment Process

This guide provides detailed steps for manually deploying the Incident Management System on Render without using Blueprints.

---

## Prerequisites

- Render account (free tier available)
- GitHub account with your code pushed
- Payment method added to Render (required even for free tier)

---

## Step 1: Prepare Your Code

Ensure your code is pushed to GitHub with the latest changes:

```bash
cd E:\Incident-Management-System-main
git status
git add .
git commit -m "Ready for Render deployment"
git push origin main
```

Verify your repository structure:
```
Incident-Management-System-main/
├── IMS-Backend/
│   ├── src/
│   ├── pom.xml
│   └── target/ (will be created during build)
├── IMS-Frontend/
│   ├── src/
│   ├── package.json
│   └── public/
└── render.yaml (ignore this - using manual deployment)
```

---

## Step 2: Create PostgreSQL Database

### 2.1 Navigate to Render Dashboard
1. Go to https://dashboard.render.com
2. Log in to your account

### 2.2 Create New Database
1. Click the **"New +"** button (top right)
2. Select **"PostgreSQL"** from the options

### 2.3 Configure Database
Fill in the following details:
- **Name**: `ims-database`
- **Database**: `imsdb`
- **User**: `ims_user`
- **Region**: Select the region closest to your users
- **PostgreSQL Version**: Use the default (latest)
- **Plan**: Select **Free** (recommended for development)

### 2.4 Create Database
1. Click **"Create Database"**
2. Wait for the database to be provisioned (1-2 minutes)
3. **IMPORTANT**: Copy the **Internal Database URL** from the database details page
   - It will look like: `postgresql://ims_user:password@host:port/imsdb`
   - Save this URL - you'll need it for the backend

---

## Step 3: Deploy Backend Service

### 3.1 Create New Web Service
1. In Render Dashboard, click **"New +"**
2. Select **"Web Service"**

### 3.2 Connect GitHub Repository
1. Click **"Connect GitHub"** (if not already connected)
2. Authorize Render to access your GitHub account
3. Select your repository: `kashif97/Incident-Management-System`
4. Select branch: `main`

### 3.3 Configure Basic Settings
Fill in the following:

**Name & Region:**
- **Name**: `ims-backend`
- **Region**: Same as your database region

**Build & Deploy:**
- **Runtime**: `Docker` (Java is not available, use Docker instead)
- **Root Directory**: `IMS-Backend`
- **Build Command**: (leave blank - Dockerfile handles this)
- **Start Command**: (leave blank - Dockerfile handles this)

**Instance:**
- **Instance Type**: `Free`

### 3.4 Add Environment Variables
Scroll down to "Environment Variables" section and add:

1. **DATABASE_URL**
   - Key: `DATABASE_URL`
   - Value: (paste the Internal Database URL from Step 2.4)

3. **JWT_SECRET**
   - Key: `JWT_SECRET`
   - Value: Click "Generate" to create a secure secret
   - OR use: `Qok7QmQ56WMVcfGsu4zdK91Huvjx7M1OajxtMSRDEBY=`

4. **JWT_EXPIRATION**
   - Key: `JWT_EXPIRATION`
   - Value: `86400000`

5. **JWT_HEADER**
   - Key: `JWT_HEADER`
   - Value: `Authorization`

6. **JWT_PREFIX**
   - Key: `JWT_PREFIX`
   - Value: `Bearer`

### 3.5 Create Web Service
1. Click **"Create Web Service"** button
2. Render will start building and deploying your backend
3. Click on the service to view deployment logs

### 3.6 Monitor Deployment
- The build process will take 5-10 minutes
- Watch the logs for:
  - Maven dependencies download
  - Compilation
  - JAR file creation
  - Server startup
- Wait until you see "Service is live" or similar success message

### 3.7 Note Your Backend URL
- Once deployed, you'll get a URL like: `https://ims-backend.onrender.com`
- Copy this URL - you'll need it for the frontend

---

## Step 4: Test Backend Deployment

### 4.1 Check Service Status
1. Go to your `ims-backend` service in Render Dashboard
2. Verify it shows "Live" status

### 4.2 Test API Endpoint
Open your browser and try:
```
https://ims-backend.onrender.com/api/auth/login
```

You should get a JSON response (even if it's an error, it means the backend is running).

### 4.3 Check Logs
1. Click on "Logs" in your backend service
2. Look for any errors or warnings
3. Verify database connection is successful

---

## Step 5: Update Frontend Configuration

### 5.1 Find API Configuration
1. Navigate to `IMS-Frontend/src/api/`
2. Look for files like `api.js`, `axios.js`, or similar
3. Find the base URL configuration

### 5.2 Update Backend URL
Replace `http://localhost:8080` with your Render backend URL:
```javascript
// Before
const API_BASE_URL = 'http://localhost:8080';

// After
const API_BASE_URL = 'https://ims-backend.onrender.com';
```

### 5.3 Commit and Push Changes
```bash
cd E:\Incident-Management-System-main
git add IMS-Frontend/src/api/
git commit -m "Update API URL for production"
git push origin main
```

---

## Step 6: Deploy Frontend Service

### 6.1 Create New Web Service
1. In Render Dashboard, click **"New +"**
2. Select **"Web Service"**

### 6.2 Connect GitHub Repository
1. Select the same repository: `kashif97/Incident-Management-System`
2. Select branch: `main`

### 6.3 Configure Basic Settings
Fill in the following:

**Name & Region:**
- **Name**: `ims-frontend`
- **Region**: Same as your backend region

**Build & Deploy:**
- **Runtime**: `Static Site`
- **Build Command**: `cd IMS-Frontend && npm install && npm run build`
- **Publish Directory**: `IMS-Frontend/build`

**Instance:**
- **Instance Type**: `Free`

### 6.4 Add Environment Variables (Optional)
If your frontend uses environment variables:
1. **REACT_APP_API_URL**
   - Key: `REACT_APP_API_URL`
   - Value: `https://ims-backend.onrender.com`

### 6.5 Create Web Service
1. Click **"Create Web Service"**
2. Render will build and deploy your React app
3. This typically takes 2-5 minutes

### 6.6 Monitor Deployment
- Watch the logs for:
  - npm install completion
  - React build completion
  - Static site deployment
- Wait until you see "Service is live"

### 6.7 Note Your Frontend URL
- Once deployed, you'll get a URL like: `https://ims-frontend.onrender.com`
- This is your application's public URL

---

## Step 7: Configure CORS (If Needed)

### 7.1 Check for CORS Errors
1. Open your frontend URL in a browser
2. Open browser Developer Tools (F12)
3. Check Console for CORS errors

### 7.2 Update Backend CORS Configuration
If you see CORS errors, update the backend SecurityConfig:

1. Open `IMS-Backend/src/main/java/com/example/IMS_Backend/config/SecurityConfig.java`
2. Find the CORS configuration
3. Add your frontend URL:
```java
.allowedOrigins("https://ims-frontend.onrender.com")
```

4. Commit and push changes:
```bash
git add IMS-Backend/src/main/java/com/example/IMS_Backend/config/SecurityConfig.java
git commit -m "Add frontend URL to CORS configuration"
git push origin main
```

5. Render will automatically redeploy the backend

---

## Step 8: Test Complete Application

### 8.1 Access Application
1. Open your frontend URL: `https://ims-frontend.onrender.com`
2. The application should load in your browser

### 8.2 Test User Registration
1. Click on "Register" or "Sign Up"
2. Fill in user details
3. Submit the form
4. Verify successful registration

### 8.3 Test User Login
1. Login with the registered user
2. Verify authentication works
3. Check that you're redirected to the dashboard

### 8.4 Test Incident Management
1. Create a new incident
2. View incident list
3. Update incident status
4. Verify all CRUD operations work

### 8.5 Check Database Persistence
1. Create some test data
2. Refresh the page
3. Verify data is still there (persisted in PostgreSQL)

---

## Step 9: Monitor and Maintain

### 9.1 Monitor Services
- Regularly check Render Dashboard for service status
- Monitor logs for errors or warnings
- Set up alerts for critical failures

### 9.2 Database Backups
- Free tier databases have limited backup options
- Consider upgrading to paid plan for automated backups
- Export data periodically using pg_dump if needed

### 9.3 Update Deployments
- When you push code changes to GitHub
- Render automatically detects and redeploys
- Monitor deployment logs for each update

---

## Troubleshooting Common Issues

### Backend Build Fails

**Issue**: Maven build fails
- **Solution**: Check logs for specific error
- Common causes: dependency issues, Java version mismatch

**Issue**: Database connection fails
- **Solution**: Verify DATABASE_URL is correct
- Ensure database is in the same region as backend

**Issue**: Port binding errors
- **Solution**: Spring Boot automatically uses port 8080
- Render handles port mapping automatically

### Frontend Build Fails

**Issue**: npm install fails
- **Solution**: Check package.json for correct dependencies
- Verify build command is correct

**Issue**: Build succeeds but app doesn't load
- **Solution**: Check publish directory path
- Verify build output directory structure

### Runtime Issues

**Issue**: API calls fail
- **Solution**: Check CORS configuration
- Verify backend URL is correct
- Check backend service is running

**Issue**: Authentication fails
- **Solution**: Verify JWT_SECRET is set
- Check JWT configuration matches between frontend/backend

---

## Important Notes

### Free Tier Limitations
- Services spin down after 15 minutes of inactivity
- Cold starts may take 1-2 minutes
- Database has 90-day limit on free tier
- Consider upgrading for production use

### Security Best Practices
- Never commit sensitive data to GitHub
- Use Render environment variables for secrets
- Regularly update dependencies
- Monitor for security vulnerabilities

### Performance Considerations
- Free tier has limited resources
- Consider upgrading for better performance
- Optimize database queries for production
- Implement caching where appropriate

---

## Post-Deployment Checklist

- [ ] Backend service is running and accessible
- [ ] Frontend service is running and accessible
- [ ] Database connection is working
- [ ] User registration works
- [ ] User login works
- [ ] Incident creation works
- [ ] Incident listing works
- [ ] Incident updates work
- [ ] Data persists in database
- [ ] No CORS errors in browser console
- [ ] No errors in Render logs

---

## Next Steps

Once deployed successfully:
1. Share the frontend URL with users
2. Monitor application performance
3. Gather user feedback
4. Plan for future enhancements
5. Consider upgrading to paid tier for production

---

## Support Resources

- Render Documentation: https://render.com/docs
- Spring Boot Documentation: https://spring.io/projects/spring-boot
- React Documentation: https://react.dev
- PostgreSQL Documentation: https://www.postgresql.org/docs
