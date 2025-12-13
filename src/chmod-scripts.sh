#!/bin/bash

# Script to set executable permissions on all deployment scripts

echo "Setting executable permissions on scripts..."
echo ""

chmod +x deploy-complete.sh
echo "✅ deploy-complete.sh"

chmod +x verify-setup.sh
echo "✅ verify-setup.sh"

chmod +x check-files.sh
echo "✅ check-files.sh"

chmod +x chmod-scripts.sh
echo "✅ chmod-scripts.sh (this file)"

echo ""
echo "✅ All scripts are now executable!"
echo ""
echo "You can now run:"
echo "  ./deploy-complete.sh"
echo "  ./verify-setup.sh"
echo "  ./check-files.sh"
echo ""
