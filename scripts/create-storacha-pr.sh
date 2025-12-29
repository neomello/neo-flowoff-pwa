#!/bin/bash

# Script to create a PR for Storacha bug report
# Usage: ./scripts/create-storacha-pr.sh

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO_URL="https://github.com/storacha/js-indexing-service-client.git"
FORK_URL="git@github.com-neomello:neomello/js-indexing-service-client.git"
BRANCH_NAME="bugfix/proof-parse-car-format-issue"
TEMP_DIR="/tmp/storacha-pr-$$"

echo "🚀 Creating PR for Storacha Bug Report"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if GitHub CLI is installed
if command -v gh &> /dev/null; then
    echo -e "${GREEN}✅ GitHub CLI found${NC}"
    USE_GH_CLI=true
else
    echo -e "${YELLOW}⚠️  GitHub CLI not found. Will use manual PR creation.${NC}"
    USE_GH_CLI=false
fi

# Step 1: Check if fork exists locally
if [ -d "$TEMP_DIR" ]; then
    echo -e "${YELLOW}⚠️  Temporary directory exists, cleaning up...${NC}"
    rm -rf "$TEMP_DIR"
fi

echo ""
echo "📋 Step 1: Cloning repository..."
echo "---------------------------------"

# Check if fork already exists
if git ls-remote --exit-code "$FORK_URL" &> /dev/null; then
    echo -e "${GREEN}✅ Fork exists, cloning...${NC}"
    git clone "$FORK_URL" "$TEMP_DIR"
else
    echo -e "${RED}❌ Fork not found!${NC}"
    echo ""
    echo "Please fork the repository first:"
    echo "1. Go to: $REPO_URL"
    echo "2. Click 'Fork' button"
    echo "3. Run this script again"
    exit 1
fi

cd "$TEMP_DIR"

# Step 2: Add upstream
echo ""
echo "📋 Step 2: Adding upstream remote..."
echo "------------------------------------"
if git remote | grep -q upstream; then
    echo -e "${YELLOW}⚠️  Upstream already exists${NC}"
else
    git remote add upstream "$REPO_URL"
    echo -e "${GREEN}✅ Upstream added${NC}"
fi

# Step 3: Fetch latest
echo ""
echo "📋 Step 3: Fetching latest changes..."
echo "--------------------------------------"
git fetch upstream
git checkout main
git pull upstream main || git pull origin main
echo -e "${GREEN}✅ Repository updated${NC}"

# Step 4: Create branch
echo ""
echo "📋 Step 4: Creating branch..."
echo "-----------------------------"
if git show-ref --verify --quiet refs/heads/"$BRANCH_NAME"; then
    echo -e "${YELLOW}⚠️  Branch already exists, checking out...${NC}"
    git checkout "$BRANCH_NAME"
    git pull origin "$BRANCH_NAME" 2>/dev/null || true
else
    git checkout -b "$BRANCH_NAME"
    echo -e "${GREEN}✅ Branch created: $BRANCH_NAME${NC}"
fi

# Step 5: Create documentation directory
echo ""
echo "📋 Step 5: Adding bug report documentation..."
echo "---------------------------------------------"
mkdir -p docs/bug-reports

# Copy bug report
cp "$PROJECT_ROOT/docs/BUG_REPORT_STORACHA_EN.md" \
   "docs/bug-reports/bug-report-proof-parse-car-format.md"

echo -e "${GREEN}✅ Bug report copied${NC}"

# Step 6: Commit
echo ""
echo "📋 Step 6: Committing changes..."
echo "--------------------------------"
git add docs/bug-reports/bug-report-proof-parse-car-format.md

if git diff --staged --quiet; then
    echo -e "${YELLOW}⚠️  No changes to commit${NC}"
else
    git commit -m "docs: Add bug report for Proof.parse() CAR format issue

- Proof.parse() successfully parses CAR format UCANs
- client.addSpace() fails because importSpaceFromDelegation() 
  tries to parse already-parsed delegation object as JWT
- Issue affects @storacha/client@1.8.23

Reported by: neomello"
    echo -e "${GREEN}✅ Changes committed${NC}"
fi

# Step 7: Push
echo ""
echo "📋 Step 7: Pushing to fork..."
echo "------------------------------"
git push origin "$BRANCH_NAME" || git push -u origin "$BRANCH_NAME"
echo -e "${GREEN}✅ Pushed to fork${NC}"

# Step 8: Create PR
echo ""
echo "📋 Step 8: Creating Pull Request..."
echo "-----------------------------------"

if [ "$USE_GH_CLI" = true ]; then
    echo "Using GitHub CLI to create PR..."
    gh pr create \
        --repo storacha/js-indexing-service-client \
        --base main \
        --head "neomello:$BRANCH_NAME" \
        --title "Bug: Proof.parse() works but client.addSpace() fails with CAR format UCAN" \
        --body-file "$PROJECT_ROOT/docs/BUG_REPORT_STORACHA_EN.md" \
        --label "bug,documentation" 2>/dev/null || \
    gh pr create \
        --repo storacha/js-indexing-service-client \
        --base main \
        --head "neomello:$BRANCH_NAME" \
        --title "Bug: Proof.parse() works but client.addSpace() fails with CAR format UCAN" \
        --body-file "$PROJECT_ROOT/docs/BUG_REPORT_STORACHA_EN.md"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Pull Request created!${NC}"
    else
        echo -e "${YELLOW}⚠️  Could not create PR via CLI. Please create manually:${NC}"
        echo ""
        echo "Go to: https://github.com/neomello/js-indexing-service-client"
        echo "Click 'Compare & pull request' for branch: $BRANCH_NAME"
    fi
else
    echo -e "${YELLOW}⚠️  GitHub CLI not available. Please create PR manually:${NC}"
    echo ""
    echo "1. Go to: https://github.com/neomello/js-indexing-service-client"
    echo "2. Click 'Compare & pull request' for branch: $BRANCH_NAME"
    echo "3. Use the content from: $PROJECT_ROOT/docs/BUG_REPORT_STORACHA_EN.md"
fi

echo ""
echo "========================================"
echo -e "${GREEN}✅ Process completed!${NC}"
echo ""
echo "Repository location: $TEMP_DIR"
echo "Branch: $BRANCH_NAME"
echo ""
echo "To clean up temporary directory:"
echo "  rm -rf $TEMP_DIR"

