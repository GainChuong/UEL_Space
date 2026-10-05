# Space Management & Booking System --- Developer Specification

## 1. Overview

This document defines the functional requirements for the web system
development. The system manages campus spaces, booking workflows, usage
tracking, occupancy monitoring, incidents, feedback, notifications, and
administration.

The implementation must follow the defined roles, functions, business
rules, validation logic, and automated processes described below.

## 2. User Roles

### 2.1 Student / Lecturer

Main responsibilities: - Browse campus maps and spaces. - Search
available spaces based on usage needs. - Create and manage booking
requests. - Check-in/check-out usage sessions. - Report incidents and
provide feedback. - Receive system notifications.

### 2.2 Space Manager

Examples: QTTTS, Library, Faculty units.

Responsibilities: - Manage buildings, floors, spaces. - Configure space
policies. - Manage schedules and approvals. - Handle incidents and
release cases. - Monitor utilization and occupancy.

### 2.3 System Admin

Responsibilities: - Manage users, roles, permissions. - Manage
organizations and members. - Configure system parameters. - Review audit
logs.

### 2.4 Automated System Jobs

Responsibilities: - Detect booking conflicts. - Process no-show cases. -
Monitor user presence. - Auto checkout inactive sessions. - Generate
release cases. - Calculate occupancy metrics. - Send notifications.

------------------------------------------------------------------------

# 3. Functional Requirements

## F01 --- View Campus Map

Users can browse:

    Campus → Building → Floor → Space

Rules: - Only display spaces that are not hidden or in MAINTENANCE
status. - Support filtering by Building, Floor, and Space Type.

## F02 --- Search Space

Users can search spaces by:

-   Time availability
-   Capacity
-   Space type
-   Equipment
-   Purpose
-   Status

Rules: - RESTRICTED spaces are only visible to authorized users.

## F03 --- View Space Detail

Display:

-   Capacity
-   Equipment
-   Usage policies
-   Existing schedules
-   Approved bookings
-   Real-time status

## F04 --- Create Booking Request

Validation:

-   User must have Organization Member permission.
-   Requested capacity must not exceed space capacity.
-   No conflict with approved schedules/bookings.
-   Space cannot be MAINTENANCE.
-   Validate booking limits:
    -   max simultaneous holds
    -   advance booking days
    -   maximum usage duration
-   Activity Type and Purpose are required.

## F05 --- Track Booking Request

Users can view:

-   Their own booking requests.
-   Requests belonging to organizations where they have permission.

## F06 --- Cancel Booking

Rules:

-   Only allowed before start time or according to policy.
-   cancel_reason may be required.

## F07 --- Check-in

Rules:

-   Valid booking required if space requires booking.
-   Check-in must occur within allowed check-in window.
-   Space cannot be locked.

## F08 --- Check-out

Rules:

-   Only available when Usage Session is ACTIVE or WARNING.
-   Session moves to COMPLETED.

## F09 --- Presence Tracking

MVP methods:

-   User confirmation ("I am still here")
-   QR rescan

Future support: - Staff manual verification.

## F10 --- Away Warning

Trigger:

    total_away_minutes >= away_warning_minutes

Send warning notification.

## F11 --- Usage History

Users can view previous Usage Sessions.

Restriction: - Only their own history.

## F12 --- Incident Report

Users can report:

-   Equipment problems
-   Room problems
-   Facility issues

Rules: - Space is required. - Equipment must belong to that space.

## F13 --- Space Feedback

Rules:

-   Feedback requires a related Usage Session.

## F14 --- Notifications

Events:

-   Booking
-   Approval
-   Warning
-   No-show
-   Auto checkout
-   Release case

------------------------------------------------------------------------

# 4. Space Manager Features

## F15-F18 Space Administration

Managers can:

-   Create/update/lock spaces.
-   Change space status.
-   Manage schedules.
-   Configure space policies.

Rules: - Only managers assigned to the space or Admin can modify. -
MAINTENANCE can only return to AVAILABLE after confirmation. - Schedule
conflicts are prohibited. - Policy validation:

    away_warning_minutes < auto_checkout_minutes

## F19-F20 Booking Approval Workflow

Manager actions:

-   Review booking requests.
-   Approve or reject requests.

Required rejection information:

-   Processor
-   Processing time
-   Reason

## F21-F23 Exception Handling

Support:

-   Manual no-show handling.
-   Release case verification.
-   Incident processing.

Release case results:

-   USER_RETURNED
-   SPACE_RELEASED
-   STILL_PENDING
-   ITEM_FOUND
-   ESCALATED

## F24-F28 Monitoring

Managers can:

-   Manage equipment catalog.
-   View occupancy/utilization.
-   View reports.
-   Review status history.
-   Handle space feedback.

Important: Occupancy rate is calculated dynamically from Usage Session
and Occupancy Record, not stored directly.

------------------------------------------------------------------------

# 5. Administration Module

## F29-F34

Admin capabilities:

-   User management.
-   Role and permission management.
-   Organization hierarchy management.
-   Organization membership.
-   System configuration.
-   Audit log access.

Rules:

-   One user has one primary system role.
-   Organization supports hierarchy using parent organization
    relationships.
-   Numeric configuration values must be greater than zero.

------------------------------------------------------------------------

# 6. Automated Background Jobs

## F35 Booking Conflict Detection

Trigger: - Booking creation/update.

Logic:

Compare:

-   Space
-   Time range
-   Existing schedules
-   Approved bookings

## F36 No-show Detection

Scheduled job:

Example:

    Every 5 minutes

Checks bookings that started but have no check-in.

## F37 Away Monitoring

Checks:

-   Active Usage Sessions
-   last_presence_at

## F38 Auto Checkout

Condition:

    total_away_minutes >= auto_checkout_minutes

Result:

    Usage Session → AUTO_CHECKED_OUT

## F39 Release Case Creation

Triggered after auto checkout caused by absence.

## F40 Space Status Synchronization

Updates status based on:

-   Booking events
-   Check-in
-   Check-out
-   Approval
-   Maintenance
-   Release events

## F41 Occupancy / Utilization Calculation

Source data:

-   Usage Session
-   Presence
-   Occupancy Record

Calculated dynamically.

## F42 Notification Engine

Creates notifications from system events.

## F43 Occupancy Snapshot

Scheduled process:

Example:

    Every 15 minutes

Logic:

1.  Collect ACTIVE Usage Sessions.
2.  Group by space_id.
3.  Count users.
4.  Save Occupancy Record.

------------------------------------------------------------------------

# 7. Suggested Development Modules

Backend: - Authentication & Authorization - User / Role / Permission -
Organization - Space Management - Booking Engine - Approval Workflow -
Usage Session - Presence Tracking - Incident Management - Feedback -
Notification Service - Reporting

Frontend: - Campus Map UI - Space Search - Space Detail - Booking Flow -
Manager Dashboard - Admin Dashboard - Reports

Database entities should support: - User - Role - Permission -
Organization - Building - Floor - Space - Equipment - Schedule - Booking
Request - Approval - Usage Session - Presence Record - Incident -
Feedback - Notification - Audit Log - Occupancy Record

------------------------------------------------------------------------

# 8. Development Notes

All business rules in this specification must be implemented as
validation rules, authorization checks, database constraints, or
background processing logic depending on the use case.

The system should maintain auditability for important actions and ensure
all role-based access rules are enforced server-side.
