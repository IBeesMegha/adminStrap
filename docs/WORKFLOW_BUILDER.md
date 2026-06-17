# Workflow Builder Module

The Workflow Builder module provides a comprehensive interface for configuring AI Chatbot workflows, including welcome messages, quick questions, variables, and conditional logic.

## Overview

The Workflow Builder follows the same design pattern as the Theme Settings module, providing a clean, intuitive interface for managing chatbot behavior without writing code.

## Features

### 1. Welcome Message

Configure the greeting message shown when users first open the chatbot.

**Features:**
- Enable/Disable welcome screen toggle
- Multiline text input
- Preview message before saving
- Persistent storage in database

**Usage:**
- Navigate to `AI Agents > Workflow Builder > Welcome Message`
- Toggle the welcome screen on/off
- Enter your custom welcome message
- Click "Preview Message" to see how it will appear
- Click "Save Changes" to persist

### 2. Quick Questions

Add predefined questions as clickable buttons for quick user access.

**Features:**
- Add/Edit/Delete questions
- Enable/Disable individual questions
- Drag-and-drop reordering
- Display as clickable buttons when chat opens

**Example Questions:**
- Track My Order
- Return Product
- Contact Support
- Talk to AI

**Usage:**
- Navigate to `AI Agents > Workflow Builder > Quick Questions`
- Click "Add Question" to create new questions
- Drag questions to reorder them
- Toggle questions on/off using the switch
- Edit question text by clicking the edit icon
- Delete questions using the trash icon
- Click "Save Quick Questions" to persist changes

### 3. Variables

Create custom variables to collect and store user information.

**Variable Types:**
- **Text**: General text input
- **Number**: Numeric values
- **Email**: Email addresses with validation
- **Phone**: Phone numbers
- **Boolean**: True/false values

**Features:**
- Add/Edit/Delete variables
- Mark variables as required or optional
- Set default values
- Type-safe data collection

**Example Variables:**
- `name` (Text, Required)
- `email` (Email, Required)
- `phone_number` (Phone, Optional)
- `order_number` (Text, Optional)

**Usage:**
- Navigate to `AI Agents > Workflow Builder > Variables`
- Click "Add Variable" to create new variables
- Enter variable name (e.g., `email`, `phone_number`)
- Select variable type
- Check "Mark as required" if mandatory
- Click "Add Variable" to create
- Click "Save Variables" to persist changes

### 4. Conditions

Create If/Else rules to control chatbot behavior based on variables.

**Supported Operators:**
- **Equals**: Exact match
- **Not Equals**: Does not match
- **Contains**: Contains substring
- **Greater Than**: Numeric comparison (>)
- **Less Than**: Numeric comparison (<)
- **Is Empty**: Variable has no value
- **Is Not Empty**: Variable has a value

**Features:**
- Create named conditions
- Select variable to evaluate
- Choose comparison operator
- Define comparison value (when applicable)
- Configure action to take when condition is true
- Enable/Disable individual conditions

**Example Condition:**
```
IF order_number is empty
THEN Ask for Order Number
ELSE Continue Workflow
```

**Usage:**
- Navigate to `AI Agents > Workflow Builder > Conditions`
- Click "Add Condition" to create new conditions
- Enter condition name (e.g., "Check Order Number")
- Select variable to evaluate
- Choose operator
- Enter comparison value (if needed)
- Define the action to take
- Click "Add Condition" to create
- Click "Save Conditions" to persist changes

## Technical Architecture

### Database Schema

The module uses a single `workflow_settings` table to store all workflow configurations:

```prisma
model WorkflowSettings {
  id        String   @id @default(cuid())
  type      String   @unique
  settings  String   @db.Text
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("workflow_settings")
}
```

### API Endpoints

- `GET/POST /api/workflow-builder/welcome-message` - Welcome message settings
- `GET/POST /api/workflow-builder/quick-questions` - Quick questions configuration
- `GET/POST /api/workflow-builder/variables` - Variables management
- `GET/POST /api/workflow-builder/conditions` - Conditional logic rules

### File Structure

```
pages/
  admin/
    workflow-builder.tsx              # Main UI component
  api/
    workflow-builder/
      welcome-message.ts              # Welcome message API
      quick-questions.ts              # Quick questions API
      variables.ts                    # Variables API
      conditions.ts                   # Conditions API

prisma/
  schema.prisma                       # Database schema
  migrations/
    20260612131153_add_workflow_settings/
      migration.sql                   # Migration for WorkflowSettings table
```

## UI Design Principles

The Workflow Builder follows these design principles from Theme Settings:

1. **Sidebar Navigation**: Left-side navigation with clear section hierarchy
2. **Responsive Layout**: Scales appropriately on different screen sizes
3. **Clean Forms**: Well-organized input fields with clear labels
4. **Action Buttons**: Consistent button styles (primary, secondary, danger)
5. **Visual Feedback**: Toast notifications for all actions
6. **Professional Look**: Enterprise-grade chatbot management experience

## Future Enhancements

This module serves as the foundation for future features:

- **Flow Designer**: Visual workflow builder with node-based UI
- **Automation Features**: Scheduled tasks and triggers
- **Integration Hub**: Connect with external APIs
- **Advanced Conditions**: Complex logical expressions
- **A/B Testing**: Test different workflows
- **Analytics**: Track workflow performance

## Access Control

The Workflow Builder respects the existing permission system:
- Requires `settings.manage` permission to access
- Redirects to 403 page if user lacks permission
- Uses the same `ProtectedRoute` component as other admin pages

## Navigation

The Workflow Builder is accessible through:
1. **Sidebar**: `AI Agents > Workflow Builder`
2. **Direct URL**: `/admin/workflow-builder`

## Notes

- All settings are persisted to the database
- Changes take effect immediately after saving
- Default values are provided for first-time users
- Data is validated on both client and server side
- Compatible with existing AI Chatbot configuration
