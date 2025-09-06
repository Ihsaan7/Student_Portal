# Admin Impersonation Feature Guide

## Overview
The admin impersonation feature allows administrators to "Test as User" by accessing the user panel while maintaining their admin privileges. This enables admins to see the user interface from a student's perspective while having access to admin-only features that are hidden from regular users.

## How It Works

### 1. Admin Panel - "Test as User" Button
- Located in the admin panel header next to the logout button
- When clicked, sets admin mode flags in localStorage and redirects to `/home`
- Stores: `admin_mode`, `admin_user_id`, and `admin_role`

### 2. User Panel - Admin Mode Detection
- The `DashboardLayout` component automatically detects admin mode
- Shows an orange warning banner at the top when admin is in user mode
- Adds "Admin Mode Active" indicator in the profile dropdown
- Provides "Return to Admin Panel" button in multiple locations

### 3. Admin-Only Features
- Uses the `AdminOnlyButton` component to show admin-only actions
- Only visible when admin is in user mode
- Completely hidden from regular users
- Includes admin identification in action logs

## Implementation Details

### Files Modified/Created:

#### 1. `app/admin/page.js`
- Added "Test as User" button in header
- Added `handleTestAsUser` function to set admin mode and redirect

#### 2. `app/components/DashboardLayout.js`
- Added utility functions: `isAdminMode()`, `getAdminData()`, `clearAdminMode()`
- Added admin mode state management
- Added admin warning banner
- Added "Return to Admin Panel" functionality
- Enhanced profile dropdown with admin indicators

#### 3. `app/components/AdminOnlyButton.js` (New)
- Reusable component for admin-only features
- Multiple styling variants (primary, secondary, outline, ghost)
- Automatic admin mode detection
- Built-in logging for admin actions
- Completely hidden from regular users

#### 4. `app/home/page.js`
- Added example AdminOnlyButton implementation
- Demonstrates "Force Enroll" admin-only feature

## Usage Examples

### Adding Admin-Only Buttons
```jsx
import AdminOnlyButton from "../components/AdminOnlyButton";

// Basic usage
<AdminOnlyButton
  onClick={(e, adminData) => {
    console.log('Admin action by:', adminData.userId);
    // Your admin action here
  }}
>
  Delete User
</AdminOnlyButton>

// With different variants
<AdminOnlyButton variant="secondary">
  Approve Request
</AdminOnlyButton>

<AdminOnlyButton variant="outline">
  Update Status
</AdminOnlyButton>
```

### Checking Admin Mode in Components
```jsx
import { isAdminMode, getAdminData } from "../components/AdminOnlyButton";

const MyComponent = () => {
  const [adminMode, setAdminMode] = useState(false);
  
  useEffect(() => {
    setAdminMode(isAdminMode());
  }, []);
  
  return (
    <div>
      {adminMode && (
        <div className="admin-only-section">
          <h3>Admin Controls</h3>
          {/* Admin-only content */}
        </div>
      )}
    </div>
  );
};
```

## Security Considerations

1. **Client-Side Only**: This implementation uses localStorage for simplicity
2. **Session-Based**: Admin mode is cleared when the browser session ends
3. **Logging**: All admin actions are logged with admin identification
4. **Visual Indicators**: Clear visual cues show when admin mode is active

## Future Enhancements

1. **Server-Side Validation**: Add backend validation for admin actions
2. **Audit Trail**: Store admin actions in database for compliance
3. **Time Limits**: Add automatic timeout for admin mode sessions
4. **Specific User Impersonation**: Allow admins to impersonate specific users
5. **Permission Levels**: Different admin roles with different capabilities

## Testing the Feature

1. **Login as Admin**: Access the admin panel at `/admin`
2. **Click "Test as User"**: Button in the top-right header
3. **Observe User Panel**: You'll be redirected to `/home` with admin indicators
4. **See Admin Features**: Look for orange "Force Enroll" button (example)
5. **Return to Admin**: Use "Return to Admin Panel" button or banner

## Troubleshooting

- **Admin buttons not showing**: Check browser localStorage for `admin_mode` flag
- **Can't return to admin**: Clear localStorage and login again as admin
- **Features not working**: Check browser console for JavaScript errors

This feature provides a seamless way for administrators to test and manage the user experience while maintaining clear separation between admin and user functionalities.