#!/bin/bash

# 🚀 Smart Attendance System - Quick Deploy Script
# نظام الحضور الذكي - سكريبت النشر السريع

echo "=================================================="
echo "🎓 Smart Attendance System - King Khalid University"
echo "نظام الحضور الذكي - جامعة الملك خالد"
echo "=================================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI is not installed${NC}"
    echo ""
    echo "Install it with:"
    echo "  npm install -g supabase"
    echo "  # or"
    echo "  brew install supabase/tap/supabase"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ Supabase CLI found${NC}"
echo ""

# Project ID
PROJECT_ID="pcymgqdjbdklrikdquih"

echo "=================================================="
echo "📋 Deployment Steps:"
echo "=================================================="
echo ""

# Step 1: Login
echo -e "${YELLOW}Step 1: Login to Supabase${NC}"
echo "If not logged in, this will open a browser..."
supabase login

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Login failed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Login successful${NC}"
echo ""

# Step 2: Link project
echo -e "${YELLOW}Step 2: Link to project${NC}"
supabase link --project-ref $PROJECT_ID

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Project linking failed${NC}"
    echo ""
    echo "Try manually:"
    echo "  supabase link --project-ref $PROJECT_ID"
    exit 1
fi
echo -e "${GREEN}✅ Project linked${NC}"
echo ""

# Step 3: Deploy Edge Function
echo -e "${YELLOW}Step 3: Deploy Edge Function${NC}"
echo "Deploying 'server' function..."
supabase functions deploy server

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Function deployment failed${NC}"
    echo ""
    echo "Possible issues:"
    echo "  1. Check that /supabase/functions/server/index.tsx exists"
    echo "  2. Make sure you have write permissions"
    echo "  3. Try deploying from Supabase Dashboard instead"
    exit 1
fi
echo -e "${GREEN}✅ Function deployed successfully${NC}"
echo ""

# Step 4: Test the function
echo -e "${YELLOW}Step 4: Testing the function${NC}"
echo "Testing health endpoint..."

HEALTH_URL="https://$PROJECT_ID.supabase.co/functions/v1/make-server-90ad488b/health"
echo "URL: $HEALTH_URL"

RESPONSE=$(curl -s -w "\n%{http_code}" "$HEALTH_URL")
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✅ Health check passed!${NC}"
    echo ""
    echo "Response:"
    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
else
    echo -e "${RED}❌ Health check failed (HTTP $HTTP_CODE)${NC}"
    echo ""
    echo "Response:"
    echo "$BODY"
fi
echo ""

# Step 5: Environment Variables Reminder
echo "=================================================="
echo -e "${YELLOW}⚠️  IMPORTANT: Environment Variables${NC}"
echo "=================================================="
echo ""
echo "Make sure to add these in Supabase Dashboard:"
echo ""
echo "1. Go to: https://supabase.com/dashboard/project/$PROJECT_ID/settings/functions"
echo "2. Add these secrets:"
echo ""
echo "   SUPABASE_URL=https://$PROJECT_ID.supabase.co"
echo "   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjeW1ncWRqYmRrbHJpa2RxdWloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4MTU3ODcsImV4cCI6MjA3ODM5MTc4N30.OTHtmMPSb2AAdSBHM19JY20gb4DzLzd8zILCN-zUvoQ"
echo "   SUPABASE_SERVICE_ROLE_KEY=<your-secret-key>"
echo ""
echo "Get SERVICE_ROLE_KEY from: Settings → API → service_role key"
echo ""

# Step 6: Database Schema Reminder
echo "=================================================="
echo -e "${YELLOW}⚠️  IMPORTANT: Database Schema${NC}"
echo "=================================================="
echo ""
echo "If you haven't run the SQL schema yet:"
echo ""
echo "1. Go to: https://supabase.com/dashboard/project/$PROJECT_ID/editor"
echo "2. Click 'SQL Editor'"
echo "3. Copy content from: /DATABASE_READY_TO_EXECUTE.sql"
echo "4. Paste and Run"
echo ""

# Final Summary
echo "=================================================="
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo "=================================================="
echo ""
echo "Next steps:"
echo ""
echo "1. ✅ Edge Function deployed"
echo "2. ⚠️  Add Environment Variables (if not done)"
echo "3. ⚠️  Run SQL Schema (if not done)"
echo "4. ✅ Test your app!"
echo ""
echo "Test URLs:"
echo "  Health: $HEALTH_URL"
echo "  Stats:  https://$PROJECT_ID.supabase.co/functions/v1/make-server-90ad488b/stats/public"
echo ""
echo "Dashboard: https://supabase.com/dashboard/project/$PROJECT_ID"
echo ""
echo "=================================================="
echo -e "${GREEN}✅ Ready to use!${NC}"
echo "=================================================="