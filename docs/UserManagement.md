# User Management Module Documentation

## Overview

The User Management module in the EHS E-Learning Platform provides comprehensive functionality for administrators to manage users within the system. The module supports creating, editing, and deleting users, as well as bulk importing users from CSV/Excel files and assigning them to specific domains.

## Features

### User Listing and Management
- View all users with search and filtering capabilities
- Pagination for efficient navigation through large user lists
- Sorting by username, email, role, etc.
- View user details including assigned domains and training progress

### Adding Users
- Add individual users with automatic password generation
- Set user roles (Admin, Employee)
- Assign users to specific domains
- Send welcome emails with login credentials

### Bulk User Import
- Import multiple users at once from CSV or Excel files
- Validate user data before import
- Preview import results with warnings and errors
- Set default role and domains for all imported users
- Generate random passwords for new users
- Send welcome emails to newly created users
- Options to handle existing users (skip or update)

### User Editing
- Update user information (email, role)
- Reset user passwords
- Assign or remove domains
- View user training progress

### User Deletion
- Delete individual users
- Bulk delete multiple users
- Confirmation dialog to prevent accidental deletion

## How to Use

### View Users
1. Navigate to the Admin Dashboard
2. Click on "Users" in the navigation menu
3. Use search and filters to find specific users
4. Click on a user's action buttons to edit or delete

### Add a User
1. Click the "+ Add User" button
2. Fill in the required fields (username, email)
3. Generate a random password or enter a specific one
4. Select the appropriate role
5. Assign domains if needed
6. Click "Save" to create the user

### Import Users in Bulk
1. Click the "Bulk Import" button
2. Download the template if needed
3. Prepare your CSV or Excel file with user data (username, email)
4. Upload the file
5. Configure import settings:
   - Default role for new users
   - Default domains to assign
   - Password generation options
   - Email notification options
   - Handling of existing users
6. Preview the import results
7. Click "Import" to create/update users

### Edit a User
1. Find the user in the list
2. Click the edit icon
3. Update user information as needed
4. Modify domain assignments
5. Click "Save" to apply changes

### Reset a User's Password
1. Edit the user
2. Click "Reset Password"
3. Choose to set a specific password or generate a random one
4. Optionally send the password to the user via email
5. Click "Reset Password" to confirm

### Delete Users
1. Select one or more users using the checkboxes
2. Click "Delete Selected"
3. Confirm the deletion in the prompt

## CSV/Excel Import Format

The bulk import functionality accepts CSV or Excel files with the following format:

```
username,email
jsmith,jsmith@example.com
agarcia,agarcia@example.com
twilson,twilson@example.com
```

Requirements:
- The file must have a header row
- The username column must contain valid usernames (alphanumeric characters, underscores, and hyphens only)
- The email column must contain valid email addresses
- Both fields are required for each user

## Best Practices

1. **Use Descriptive Usernames**: Choose usernames that identify the user, such as a combination of first and last name.

2. **Domain Assignment**: Assign users to appropriate domains immediately to ensure they have access to relevant training modules.

3. **Bulk Import for Efficiency**: When adding many users, use the bulk import feature rather than adding them individually.

4. **Regular Audits**: Periodically review the user list to ensure all accounts are still needed and properly configured.

5. **Password Security**: When manually setting passwords, ensure they meet security requirements and encourage users to change them after first login.

## Troubleshooting

### Import Issues
- Ensure your CSV or Excel file follows the required format
- Check for duplicate usernames or emails in your import file
- Verify the file is not corrupted and uses proper encoding (UTF-8 recommended)

### User Access Problems
- Confirm the user has been assigned to the appropriate domains
- Check that the user's account is active
- Verify the user has received their login credentials

### Email Notifications
- Check spam/junk folders if emails are not received
- Verify the email service configuration in the application settings
- Ensure the email addresses are valid

## Technical Notes

- User passwords are securely hashed in the database
- Random password generation follows security best practices
- The bulk import process validates data before creating accounts
- Domain assignments are managed through a many-to-many relationship
