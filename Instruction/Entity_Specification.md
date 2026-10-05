# Campus Space Management System

# Entity Specification for Web Development

## 1. Purpose

This document defines the complete entity model for the campus space
management web system.

The entity list is consolidated from: - Real-world entities used in the
business process. - System-generated entities required for operation,
tracking, automation, and auditing.

The development team should use this document as the basis for: -
Database design - Backend domain model - API design - Validation logic -
ORM entity mapping

------------------------------------------------------------------------

# 2. Real-world Entities

## 2.1 User

### Purpose

Represents students, lecturers, staff, or representatives of
organizations requesting space usage.

### Attributes

  Field                   Description
  ----------------------- -----------------------
  User_ID                 Unique identifier
  Student/Employee Code   University identifier
  Full_Name               User name
  Email                   Contact email
  Phone                   Phone number
  Role_ID                 System role
  Status                  Account status
  Created_Date            Creation date
  Updated_Date            Last update

------------------------------------------------------------------------

## 2.2 Role

### Purpose

Defines user groups and permission scope.

### Attributes

  Field             Description
  ----------------- ---------------------
  Role_ID           Role identifier
  Role_Name         Role name
  Description       Role description
  Permission_List   Allowed permissions
  Status            Active/inactive

------------------------------------------------------------------------

## 2.3 Organization

### Purpose

Represents faculties, departments, clubs, classes, teams, or
administrative units.

### Attributes

  Field                    Description
  ------------------------ --------------------
  Organization_ID          Identifier
  Organization_Code        Organization code
  Organization_Name        Name
  Organization_Type        Type
  Parent_Organization_ID   Parent hierarchy
  Manager                  Responsible person
  Email                    Contact
  Phone                    Contact
  Status                   Current state

------------------------------------------------------------------------

## 2.4 Organization Member

### Purpose

Stores relationships between users and organizations.

### Attributes

  Field               Description
  ------------------- -------------------------------
  Membership_ID       Identifier
  User_ID             User reference
  Organization_ID     Organization reference
  Organization_Role   User role inside organization
  Start_Date          Membership start
  End_Date            Membership end
  Status              Membership status

------------------------------------------------------------------------

## 2.5 Building

### Purpose

Defines physical campus locations.

### Attributes

  Field                  Description
  ---------------------- ------------------
  Building_ID            Identifier
  Building_Code          Building code
  Building_Name          Name
  Area_Type              Campus area type
  Address                Location
  Number_Of_Floors       Floor count
  Description            Information
  Coordinates/Map_Data   Map location
  Status                 Status

------------------------------------------------------------------------

## 2.6 Floor

### Purpose

Represents floors inside buildings.

### Attributes

  Field          Description
  -------------- -----------------
  Floor_ID       Identifier
  Building_ID    Parent building
  Floor_Number   Floor number
  Floor_Name     Name
  Floor_Map      Floor map
  Description    Information

------------------------------------------------------------------------

## 2.7 Space

### Purpose

Main resource users search, reserve, and use.

### Attributes

  Field             Description
  ----------------- ---------------------
  Space_ID          Identifier
  Space_Code        Space code
  Space_Name        Name
  Floor_ID          Location
  SpaceType_ID      Space category
  Managed_By        Managing unit
  Parent_Space_ID   Parent relationship
  Capacity          Maximum users
  Area              Size
  Description       Detail
  Map_Position      Campus position
  Status            Current status

------------------------------------------------------------------------

## 2.8 Space Type

### Purpose

Classifies spaces by usage purpose.

### Attributes

  Field          Description
  -------------- ---------------
  SpaceType_ID   Identifier
  Name           Type name
  Description    Description
  Allowed_User   Allowed users
  Status         Status

------------------------------------------------------------------------

## 2.9 Equipment

### Purpose

Catalog of available equipment.

### Attributes

  Field            Description
  ---------------- ----------------
  Equipment_ID     Identifier
  Equipment_Code   Code
  Name             Equipment name
  Type             Category
  Description      Detail
  Status           Condition

------------------------------------------------------------------------

## 2.10 Space Equipment

### Purpose

Defines equipment assigned to spaces.

### Attributes

  Field               Description
  ------------------- ---------------------
  SpaceEquipment_ID   Identifier
  Space_ID            Space reference
  Equipment_ID        Equipment reference
  Quantity            Amount
  Condition           Current condition
  Updated_Date        Update time

------------------------------------------------------------------------

## 2.11 Schedule

### Purpose

Stores existing usage schedules.

### Attributes

  Field             Description
  ----------------- --------------------
  Schedule_ID       Identifier
  Space_ID          Space reference
  Organization_ID   Using organization
  Date/Cycle        Schedule period
  Start_Time        Start
  End_Time          End
  Schedule_Type     Class/event/etc
  Semester          Academic period
  Course_Code       Course identifier
  Recurrence        Repeat rule
  Source            Data source
  Status            Status

------------------------------------------------------------------------

## 2.12 Booking Request

### Purpose

Stores user requests to use spaces.

### Attributes

  Field                 Description
  --------------------- --------------------
  Request_ID            Identifier
  User_ID               Requester
  Organization_ID       Organization
  Space_ID              Requested space
  Activity_Type         Activity
  Purpose               Usage purpose
  Usage_Date            Date
  Start_Time            Start
  End_Time              End
  Expected_User_Count   Number of users
  Equipment_Request     Required equipment
  Attachment            File attachment
  Submitted_Date        Submission time
  Status                Request status

------------------------------------------------------------------------

## 2.13 Approval

### Purpose

Stores approval/rejection results.

### Attributes

  Field             Description
  ----------------- -------------------
  Approval_ID       Identifier
  Request_ID        Booking request
  Processor_ID      Reviewer
  Organization_ID   Processing unit
  Process_Time      Processing time
  Result            Approved/Rejected
  Reject_Reason     Reason
  Note              Additional note

------------------------------------------------------------------------

## 2.14 Space Policy

### Purpose

Defines rules and limitations for space usage.

### Attributes

  Field                   Description
  ----------------------- -------------------------
  Policy_ID               Identifier
  SpaceType_ID            Default type policy
  Space_ID                Specific override
  Target_User             Applicable users
  Check_In_Window         Allowed check-in period
  No_Show_Grace_Period    No-show limit
  Away_Warning_Minutes    Warning threshold
  Auto_Checkout_Minutes   Auto checkout threshold
  Max_Usage_Duration      Usage limit
  Max_Booking_Count       Booking limit
  Max_Hold_Time           Hold limit
  Advance_Booking_Days    Booking range
  Status                  Status

------------------------------------------------------------------------

## 2.15 Incident

### Purpose

Stores problems reported about spaces or equipment.

### Attributes

  Field            Description
  ---------------- -------------------
  Incident_ID      Identifier
  Space_ID         Related space
  Equipment_ID     Related equipment
  Reporter_ID      Reporter
  Incident_Type    Category
  Description      Detail
  Report_Time      Time
  Severity         Level
  Status           Processing status
  Handler_ID       Handler
  Completed_Time   Completion

------------------------------------------------------------------------

## 2.16 Space Feedback

### Purpose

Stores user evaluations.

### Attributes

  Field           Description
  --------------- -------------------
  Feedback_ID     Identifier
  User_ID         Reviewer
  Space_ID        Space
  Usage_ID        Related usage
  Rating          Score
  Feedback_Type   Type
  Content         Comment
  Submit_Time     Submission
  Status          Processing status

------------------------------------------------------------------------

# 3. System-generated Entities

## Usage Session

Tracks actual space usage.

Attributes:

-   Usage_ID
-   User_ID
-   Space_ID
-   Request_ID
-   Check_In_Time
-   Check_Out_Time
-   Check_In_Method
-   Check_Out_Method
-   Status
-   Last_Presence_At
-   Total_Away_Minutes
-   End_Reason

------------------------------------------------------------------------

## Booking Equipment

Equipment requested in booking.

Attributes:

-   BookingEquipment_ID
-   Request_ID
-   Equipment_ID
-   Requested_Quantity
-   Note
-   Status

------------------------------------------------------------------------

## Presence Record

Tracks user presence.

Attributes:

-   Presence_ID
-   Usage_ID
-   User_ID
-   Space_ID
-   Recorded_Time
-   Presence_Status
-   Data_Source

------------------------------------------------------------------------

## Release Case

Handles abandoned usage cases.

Attributes:

-   Case_ID
-   Usage_ID
-   Space_ID
-   Detection_Time
-   Staff_User_ID
-   Verification_Time
-   Found_Item
-   Description
-   Processing_Result

------------------------------------------------------------------------

## Occupancy Record

Stores occupancy snapshots.

Attributes:

-   Occupancy_ID
-   Space_ID
-   Recorded_Time
-   User_Count
-   Data_Source

------------------------------------------------------------------------

## Space Status History

Tracks status changes.

Attributes:

-   StatusHistory_ID
-   Space_ID
-   Old_Status
-   New_Status
-   Change_Time
-   Actor
-   Reason

------------------------------------------------------------------------

## Notification

Stores system notifications.

Attributes:

-   Notification_ID
-   User_ID
-   Notification_Type
-   Title
-   Content
-   Related_Entity
-   Related_ID
-   Channel
-   Sent_Time
-   Read_Time
-   Status

------------------------------------------------------------------------

## Audit Log

Tracks important system operations.

Attributes:

-   Log_ID
-   User/System
-   Action_Type
-   Related_Entity
-   Entity_ID
-   Timestamp
-   Change_Content

------------------------------------------------------------------------

# 4. Suggested Database Modules

    Identity Module
    - User
    - Role
    - Permission

    Organization Module
    - Organization
    - Membership

    Space Module
    - Building
    - Floor
    - Space
    - Space Type
    - Equipment
    - Space Equipment

    Booking Module
    - Booking Request
    - Booking Equipment
    - Approval
    - Schedule

    Usage Module
    - Usage Session
    - Presence Record
    - Release Case

    Monitoring Module
    - Occupancy Record
    - Status History
    - Notification

    Administration Module
    - Incident
    - Feedback
    - Audit Log

------------------------------------------------------------------------

# 5. Implementation Requirement

All entities must support:

-   Primary keys
-   Foreign key relationships
-   Status management
-   Audit tracking where required
-   Role-based authorization
-   Historical data preservation

This document is the entity foundation for database schema and backend
implementation.
