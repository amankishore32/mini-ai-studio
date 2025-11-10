#!/bin/bash

echo "🔍 Validating CI/CD Setup..."
echo ""

# Check if workflow file exists
if [ -f ".github/workflows/ci.yml" ]; then
    echo "✅ CI workflow file exists"
else
    echo "❌ CI workflow file missing"
    exit 1
fi

# Check if codecov config exists
if [ -f "codecov.yml" ]; then
    echo "✅ Codecov configuration exists"
else
    echo "⚠️  Codecov configuration missing (optional)"
fi

# Validate workflow syntax (basic check)
if grep -q "name: CI/CD Pipeline" .github/workflows/ci.yml; then
    echo "✅ Workflow name configured"
else
    echo "❌ Workflow name not found"
    exit 1
fi

# Check for required jobs
REQUIRED_JOBS=("install" "lint-and-format" "typecheck" "test-backend" "test-frontend" "build")
for job in "${REQUIRED_JOBS[@]}"; do
    if grep -q "$job:" .github/workflows/ci.yml; then
        echo "✅ Job '$job' configured"
    else
        echo "❌ Job '$job' missing"
        exit 1
    fi
done

echo ""
echo "🎉 CI/CD validation complete!"
echo ""
echo "Next steps:"
echo "1. Commit and push the workflow file"
echo "2. Check GitHub Actions tab"
echo "3. Optionally setup Codecov token"
echo ""
