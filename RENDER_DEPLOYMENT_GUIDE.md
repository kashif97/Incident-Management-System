# Render Deployment Guide for Incident Management System

This guide provides step-by-step instructions for deploying the Incident Management System on Render.

## Prerequisites

- Render account (free tier available)
- GitHub account
- Git installed locally
- Project code pushed to GitHub repository

## Architecture Overview

The system consists of:
- **Backend**: Spring Boot 3.3.0 with Java 21, PostgreSQL database
- **Frontend**: React 18 application
- **Database**: PostgreSQL (managed by Render)

---

## Step 1: Prepare Your GitHub Repository

1. **Push your code to GitHub** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/your-username/your-repo.git
   git push -u origin main
   ```

2. **Ensure your repository structure is correct**:
   ```
   your-repo/
   ├── IMS-Backend/
   │   ├── src/
   │   ├── pom.xml
   │   └── render.yaml
   ├── IMS-Frontend/
   │   ├── src/
   │   ├── package.json
   │   └── render.yaml
   └── README.md
   ```

---

## Step 2: Deploy Backend on Render

### 2.1 Create PostgreSQL Database

1. Log in to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** button
3. Select **"PostgreSQL"**
4. Configure database:
   - **Name**: `ims-database`
   - **Database**: `imsdb`
   - **User**: `ims_user`
   - **Region**: Choose nearest region
   - **Plan**: Free (available for development)
5. Click **"Create Database"**
6. **Important**: Copy the **Internal Database URL** from the database details page (you'll need this for the backend)

### 2.2 Deploy Backend Service

1. In Render Dashboard, click **"New +"**
2. Select **"Web Service"**
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `ims-backend`
   - **Branch**: `main`
   - **Runtime**: Java
   - **Build Command**: `./mvnw clean package -DskipTests`
   - **Start Command**: `java -jar target/IMS-Backend-0.0.1-SNAPSHOT.jar`
   - **Instance Type**: Free

5. **Add Environment Variables**:
   - `JAVA_VERSION`: `21`
   - `DATABASE_URL`: (paste the Internal Database URL from step 2.1)
   - `JWT_SECRET`: (click "Generate" to create a secure secret)
   - `JWT_EXPIRATION`: `86400000`
   - `JWT_HEADER`: `Authorization`
   - `JWT_PREFIX`: `Bearer`

6. Click **"Create Web Service"**

7. **Monitor deployment**:
   - Render will automatically build and deploy your backend
   - Click on the service to view logs
   - Wait for deployment to complete (may take 5-10 minutes)

8. **Note your backend URL**:
   - Once deployed, you'll get a URL like: `https://ims-backend.onrender.com`
   - Copy this URL for frontend configuration

---

## Step 3: Deploy Frontend on Render

### 3.1 Update Frontend API Configuration

Before deploying, update the frontend to use the production backend URL:

1. Open `IMS-Frontend/src/api/` directory
2. Find the API configuration file (likely `api.js` or similar)
3. Replace `http://localhost:8080` with your backend URL: `https://ims-backend.onrender.com`

### 3.2 Deploy Frontend Service

1. In Render Dashboard, click **"New +"**
2. Select **"Web Service"**
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `ims-frontend`
   - **Branch**: `main`
   - **Runtime**: Static Site
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `build`
   - **Instance Type**: Free

5. **Add Environment Variables** (if needed):
   - `REACT_APP_API_URL`: `https://ims-backend.onrender.com`

6. Click **"Create Web Service"**

7. **Monitor deployment**:
   - Render will build the React app
   - Wait for deployment to complete

8. **Access your application**:
   - Once deployed, you'll get a URL like: `https://ims-frontend.onrender.com`
   - Open this URL in your browser to access the application

---

## Step 4: Configure CORS (if needed)

If you encounter CORS errors, update the backend SecurityConfig:

1. Open `IMS-Backend/src/main/java/com/example/IMS_Backend/config/SecurityConfig.java`
2. Add your frontend URL to the CORS configuration:
   ```java
   .allowedOrigins("https://ims-frontend.onrender.com")
   ```
3. Commit and push changes to trigger redeployment

---

## Step 5: Test the Deployment

1. **Access the frontend**: Open your frontend URL
2. **Test authentication**:
   - Try to register a new user
   - Login with the registered user
3. **Test incident management**:
   - Create a new incident
   - View incident list
   - Update incident status
4. **Check database**: Verify data is persisted in the PostgreSQL database

---

## Alternative: Using render.yaml (Blueprints)

I've created `render.yaml` files for both backend and frontend. You can use Render Blueprints for automated deployment:

### Option A: Deploy Backend via Blueprint

1. In Render Dashboard, click **"New +"**
2. Select **"Blueprint"**
3. Connect your GitHub repository
4. Render will detect the `IMS-Backend/render.yaml` file
5. Review the configuration and click **"Apply Blueprint"**

### Option B: Deploy Frontend via Blueprint

1. Repeat the process for `IMS-Frontend/render.yaml`
2. This will deploy the frontend as a static site

---

## Important Notes

### Free Tier Limitations
- Free services spin down after 15 minutes of inactivity
- Cold starts may take 1-2 minutes
- Database has 90-day limit on free tier (remember to backup)

### Environment Variables
- Never commit sensitive data to GitHub
- Always use Render's environment variables for secrets
- The JWT_SECRET is automatically generated in the configuration

### Database Backups
- Regular backups are recommended
- Render provides automated backups on paid plans
- For free tier, export data periodically using pg_dump

### Monitoring
- Use Render's dashboard to monitor service health
- Check logs for errors and warnings
- Set up alerts for critical failures

---

## Troubleshooting

### Backend Deployment Issues

**Issue**: Build fails with Java version error
- **Solution**: Ensure `JAVA_VERSION=21` is set in environment variables

**Issue**: Database connection fails
- **Solution**: Verify DATABASE_URL matches the Internal Database URL from Render

**Issue**: JWT authentication fails
- **Solution**: Ensure JWT_SECRET is set and consistent across deployments

### Frontend Deployment Issues

**Issue**: Build fails with npm errors
- **Solution**: Check package.json for correct dependencies and scripts

**Issue**: API calls fail
- **Solution**: Verify REACT_APP_API_URL points to correct backend URL

**Issue**: CORS errors
- **Solution**: Update backend SecurityConfig to allow frontend origin

---

## Post-Deployment Checklist

- [ ] Backend service is running and accessible
- [ ] Frontend service is running and accessible
- [ ] Database connection is working
- [ ] User registration and login works
- [ ] Incident creation and management works
- [ ] All API endpoints are accessible
- [ ] No CORS errors in browser console
- [ ] Logs show no critical errors

---

## Scaling Considerations

For production use, consider upgrading to paid plans:
- **Backend**: Upgrade to prevent spin-down delays
- **Database**: Upgrade for automated backups and better performance
- **Frontend**: Static sites remain fast on free tier

---

## Support

- Render Documentation: https://render.com/docs
- Spring Boot Documentation: https://spring.io/projects/spring-boot
- React Documentation: https://react.dev
