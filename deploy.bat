@echo off
REM Reflexia App - Quick Deployment Script for Windows
REM This script will build and deploy your app to Netlify

echo.
echo ========================================
echo    Reflexia Deployment Script
echo ========================================
echo.

REM Step 1: Build the app
echo Step 1/2: Building production app...
echo.
call npm run build

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Build failed! Please fix errors and try again.
    pause
    exit /b 1
)

echo.
echo Build successful!
echo.

REM Step 2: Deploy to Netlify
echo Step 2/2: Deploying to Netlify...
echo.
echo Running: netlify deploy --prod
echo.
echo You'll be prompted to:
echo 1. Create a new site (choose this option^)
echo 2. Enter site name (e.g., reflexia-app^)
echo 3. Confirm publish directory (should be 'dist'^)
echo.

call netlify deploy --prod

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ======================================
    echo   Alternative: Use Netlify Drop
    echo ======================================
    echo.
    echo 1. Visit: https://app.netlify.com/drop
    echo 2. Drag the 'dist' folder onto the page
    echo 3. Get instant deployment URL!
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Deployment complete!
echo   Your app is now live on Netlify!
echo ========================================
echo.
pause
