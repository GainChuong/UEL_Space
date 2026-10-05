# Campus Space Management System

## Developer Specification (Business Rules)

## 1. System Purpose

This document defines the business requirements and validation rules for
the web system managing campus spaces, room booking, check-in/check-out,
occupancy monitoring, and space administration.

The development team must implement these rules consistently across: -
Frontend validation - Backend business logic - Database constraints -
Scheduled background processes - Authorization mechanisms

------------------------------------------------------------------------

# 2. User Authentication & Authorization

## BR01 --- User Authentication

All users must authenticate using: - University-provided accounts, or -
Accounts verified by the system

Users must be logged in before accessing protected functions.

## BR02 --- Role-based Access Control

The system contains two main user groups:

### User

Includes: - Students - Lecturers

### Admin

Responsible for: - Space administration - System management

## BR03 --- Different Usage Permissions

Usage permissions may differ between user groups.

Examples: - Lecturer-only spaces - Restricted spaces for specific user
groups

------------------------------------------------------------------------

# 3. Space Management Rules

## BR04 --- Unique Space Identifier

Each space must have a unique identifier.

Required:

    space_id UNIQUE

## BR05 --- Required Space Information

Each space must contain:

-   Space ID
-   Space name
-   Space type
-   Location
-   Capacity
-   Equipment
-   Operating hours
-   Allowed users
-   Current status

## BR06 --- Space Classification

Spaces must be categorized by purpose.

Purpose classification supports searching based on usage needs instead
of only room names.

## BR07 --- Maximum Capacity

Each space must define maximum capacity.

The system must reject bookings exceeding capacity.

------------------------------------------------------------------------

# 4. Space Status Management

## BR08 --- Space Status

A space can only have one status at a time.

Available statuses:

  Status        Description
  ------------- -----------------------------
  Available     Ready for use
  Reserved      Reserved for future booking
  Occupied      Currently being used
  Maintenance   Under maintenance
  Closed        Temporarily unavailable

## BR09 --- Status Synchronization

Space status must update based on:

-   Booking schedule
-   Check-in information
-   Check-out information

## BR10 --- Booking Restriction

Booking is not allowed when:

-   Occupied
-   Maintenance
-   Closed

or when a conflicting booking exists.

## BR11 --- Check-in Priority

Actual usage must be based on check-in/check-out data.

A booking without check-in should not automatically mean the room is
occupied.

Example:

    Reserved + Not Checked In

------------------------------------------------------------------------

# 5. Space Search Rules

## BR12 --- Multi-condition Search

Users can search spaces by:

-   Time
-   Capacity
-   Area
-   Purpose
-   Status

## BR13 --- Suitable Result Filtering

The system only displays spaces matching search conditions.

## BR14 --- Usage Schedule Display

The system must display room usage history according to time.

------------------------------------------------------------------------

# 6. Booking Rules

## BR15 --- Booking Conditions

Booking creation requires:

-   Space is Available
-   No booking conflict
-   User has permission
-   Requested time is within operating hours
-   Expected users do not exceed capacity

## BR16 --- Booking Purpose

Every booking requires a purpose.

Supported examples:

-   Self study
-   Group study
-   Teaching
-   Club activity
-   Meeting
-   Workshop
-   Event

Purpose data is used for analytics.

## BR17 --- Expected Users

Booking must include expected number of users.

Validation:

    expected_users <= capacity

## BR18 --- Booking Cancellation

Users may cancel before the booking start time.

Cancellation policy may configure allowed cancellation period:

    30 - 60 minutes before start time

------------------------------------------------------------------------

# 7. Check-in / Check-out Rules

## BR19 --- Check-in Requirement

Users must check in to confirm actual room usage.

Method:

    Scan QR Code

System records:

-   Actual check-in time

## BR20 --- Check-in Window

Check-in is only allowed within configured time range.

Example:

Booking:

    09:00

Allowed:

    08:50 - 09:30

## BR21 --- Booking Association

Check-in requires an existing booking.

Users cannot check in without reservation.

## BR22 --- Check-out Requirement

Users must check out after usage.

System stores:

-   Reserved duration
-   Actual usage duration

## BR23 --- No-show Detection

If users fail to check in within allowed time:

System:

-   Marks booking as No Show
-   Releases space availability

------------------------------------------------------------------------

# 8. No-show Management

## BR24 --- No-show History

System stores user no-show history.

Formula:

    No Show Rate =
    Number of No Shows / Total Bookings

## BR25 --- No-show Handling Policy

If No Show Rate exceeds configured threshold:

System may:

-   Send warning
-   Restrict booking permission

------------------------------------------------------------------------

# 9. Analytics Requirements

## BR26 --- Usage History Storage

System must store space usage history.

## BR27 --- Utilization Calculation

System calculates space utilization rate.

## BR28 --- Peak Usage Detection

System identifies high-demand periods.

## BR29 --- Low Usage Detection

System identifies underused spaces.

## BR30 --- Purpose Analysis

Analyze demand based on booking purposes.

## BR31 --- Equipment Demand Analysis

Analyze usage demand based on equipment requirements.

------------------------------------------------------------------------

# 10. Campus Map Rules

## BR32 --- Space Location Mapping

Each space must have campus map information:

-   Building
-   Floor
-   Room

## BR33 --- Map Information Display

Selecting a space on the map displays:

Example:

    Capacity: 50
    Current occupancy: 32
    Occupancy rate: 64%
    Status: Occupied
    Available again: 15:00
    Equipment:
    - Projector
    - Air Conditioner
    - WiFi

------------------------------------------------------------------------

# 11. Space Administration

## BR34 --- Create Space Permission

Only Admin can create new spaces.

## BR35 --- Update Space Information

Only Admin can update:

-   Capacity
-   Operating hours
-   Equipment

## BR36 --- Temporary Locking

Admin can lock spaces for:

-   Maintenance
-   Events
-   Exams

## BR37 --- Audit History

The system must store important changes.

------------------------------------------------------------------------

# 12. Occupancy Management

## BR38 --- Occupancy Rate

Formula:

    Occupancy Rate =
    (Current Users / Capacity) * 100%

Classification:

  Level       Range
  ----------- --------
  Low         \<30%
  Medium      30-70%
  High        70-90%
  Very High   \>90%

## BR39 --- Occupancy Update

Occupancy data is updated through:

-   QR Check-in
-   QR Check-out

------------------------------------------------------------------------

# 13. Development Implementation Notes

Backend must enforce all business rules.

Recommended modules:

    Authentication
    Authorization
    User Management
    Space Management
    Booking Service
    Check-in Service
    Check-out Service
    Occupancy Service
    Analytics Service
    Notification Service
    Audit Log Service

Database should support:

    User
    Role
    Permission
    Space
    Building
    Floor
    Equipment
    Booking
    CheckIn
    CheckOut
    UsageHistory
    OccupancyRecord
    AuditLog

All important actions must be traceable through audit records.
