#!/bin/bash

# Reflexia App - Quick Deployment Script
# This script will build and deploy your app to Netlify

echo "🚀 Reflexia Deployment Script"
echo "=============================="
echo ""

# Step 1: Build the app
echo "📦 Step 1/2: Building production app..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Please fix errors and try again."
    exit 1
fi

echo "✅ Build successful!"
echo ""

# Step 2: Deploy to Netlify
echo "🌐 Step 2/2: Deploying to Netlify..."
echo ""
echo "Running: netlify deploy --prod"
echo ""
echo "You'll be prompted to:"
echo "1. Create a new site (choose this option)"
echo "2. Enter site name (e.g., reflexia-app)"
echo "3. Confirm publish directory (should be 'dist')"
echo ""

netlify deploy --prod

if [ $? -ne 0 ]; then
    echo ""
    echo "⚠️  Automated deployment needs manual input."
    echo ""
    echo "Alternative: Use Netlify Drop"
    echo "1. Visit: https://app.netlify.com/drop"
    echo "2. Drag the 'dist' folder onto the page"
    echo "3. Get instant deployment URL!"
    exit 1
fi

echo ""
echo "🎉 Deployment complete!"
echo "Your app is now live on Netlify!"
