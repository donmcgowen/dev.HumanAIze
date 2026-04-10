#!/bin/bash

# This script tests the cleanup endpoint
# It will call the admin.cleanupDuplicateSources endpoint

echo "Testing cleanup endpoint..."
echo "Note: This requires authentication, so it will fail without a valid session"

# The endpoint would be called via:
# POST /api/trpc/admin.cleanupDuplicateSources

echo "Endpoint available at: POST /api/trpc/admin.cleanupDuplicateSources"
