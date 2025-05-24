#!/bin/bash

# Test Database Connection Script
echo "Testing database connection..."

# Database connection details from application.properties
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="ehs_elearning_test_v2"
DB_USER="postgres"
DB_PASS="root"

# Test if PostgreSQL is running
echo "1. Checking if PostgreSQL service is running..."
if command -v systemctl &> /dev/null; then
    sudo systemctl status postgresql || echo "PostgreSQL service status unknown"
elif command -v service &> /dev/null; then
    sudo service postgresql status || echo "PostgreSQL service status unknown"
else
    echo "Cannot check PostgreSQL service status"
fi

# Test database connection
echo "2. Testing database connection..."
if command -v psql &> /dev/null; then
    echo "Attempting to connect to database..."
    PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT version();" 2>&1
    
    if [ $? -eq 0 ]; then
        echo "✅ Database connection successful!"
        
        echo "3. Checking if assessment_attempts table exists..."
        PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'assessment_attempts');" 2>&1
        
        echo "4. Listing all tables in the database..."
        PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "\dt" 2>&1
        
    else
        echo "❌ Database connection failed!"
        echo "Please check:"
        echo "  - PostgreSQL is running"
        echo "  - Database '$DB_NAME' exists"
        echo "  - User '$DB_USER' has access"
        echo "  - Password is correct"
    fi
else
    echo "psql command not found. Please install PostgreSQL client."
fi

echo ""
echo "If the assessment_attempts table doesn't exist, run the database_setup.sql script:"
echo "PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f database_setup.sql"