# Im-Vestor Platform

A comprehensive platform connecting entrepreneurs, investors, and incubators.

## Admin Home Features

### Project Views & Activity Monitoring

The admin home at `/admin/project-views` provides comprehensive monitoring of platform activity:

#### Features:
- **Activity Summary**: Overview of platform metrics including:
  - Project views count
  - New projects created
  - Meetings scheduled
  - Support tickets opened
  - Total notifications generated

- **Project Views List**: Detailed view of which investors viewed which projects, including:
  - Date and time of view
  - Project name and entrepreneur details
  - Investor information and contact details
  - Search and pagination functionality

- **Notification Logs**: Complete audit trail of all platform notifications:
  - Filter by notification type
  - Date range filtering
  - User details and notification status
  - Comprehensive activity tracking

#### Access:
- Navigate to `/admin/project-views` in the admin panel
- Use the tabbed interface to switch between different views
- All data is real-time and paginated for performance

#### Technical Implementation:
- Built with Next.js and TypeScript
- Uses tRPC for type-safe API calls
- Prisma ORM for database operations
- Real-time data with proper error handling
- Responsive design with mobile support

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up the database:
```bash
npm run db:push
```

3. Start the development server:
```bash
npm run dev
```

4. Access the admin home at `http://localhost:3000/admin/project-views`

## Admin Access

To access admin features, users must have:
- Valid authentication
- `userType: "ADMIN"` in their user metadata
- `userIsAdmin: true` flag set

## Database Schema

The platform uses the following key models for activity tracking:
- `ProjectView`: Tracks investor project views
- `Notification`: System notifications and alerts
- `Project`: Entrepreneur projects
- `Meeting`: Scheduled meetings
- `SupportTicket`: Customer support tickets
- `Negotiation`: Investment negotiations