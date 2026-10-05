# Sơ đồ Entity Relationship Diagram (ERD) - Campus Space Management System

Tài liệu sơ đồ quan hệ thực thể (ERD) được trích xuất hoàn chỉnh từ [Entity_Specification.md](file:///d:/H%E1%BB%8Dc%20t%E1%BA%ADp/3rd/PTWNC/DoAnCki/Instruction/Entity_Specification.md), bao gồm đầy đủ 23 thực thể (Real-world Entities & System-generated Entities) phân chia theo 7 Phân hệ Database Modules.

---

## 1. Top-Level ERD Overview (Mermaid Syntax)

```mermaid
erDiagram
    %% Identity Module
    ROLE ||--o{ USER : "assigns"
    ORGANIZATION ||--o{ ORGANIZATION_MEMBER : "has"
    USER ||--o{ ORGANIZATION_MEMBER : "belongs_to"

    %% Space Module
    BUILDING ||--o{ FLOOR : "contains"
    FLOOR ||--o{ SPACE : "contains"
    SPACE_TYPE ||--o{ SPACE : "classifies"
    SPACE ||--o{ SPACE : "parent_child"
    SPACE ||--o{ SPACE_EQUIPMENT : "has"
    EQUIPMENT ||--o{ SPACE_EQUIPMENT : "assigned_to"
    SPACE_TYPE ||--o{ SPACE_POLICY : "defines_policy"
    SPACE ||--o{ SPACE_POLICY : "overrides_policy"

    %% Booking Module
    USER ||--o{ BOOKING_REQUEST : "submits"
    ORGANIZATION ||--o{ BOOKING_REQUEST : "makes"
    SPACE ||--o{ BOOKING_REQUEST : "reserved_in"
    BOOKING_REQUEST ||--o{ BOOKING_EQUIPMENT : "requests"
    EQUIPMENT ||--o{ BOOKING_EQUIPMENT : "requested"
    BOOKING_REQUEST ||--o{ APPROVAL : "has"
    USER ||--o{ APPROVAL : "processes"
    SPACE ||--o{ SCHEDULE : "scheduled_in"
    ORGANIZATION ||--o{ SCHEDULE : "uses_schedule"

    %% Usage Module
    USER ||--o{ USAGE_SESSION : "initiates"
    SPACE ||--o{ USAGE_SESSION : "occurs_in"
    BOOKING_REQUEST ||--o| USAGE_SESSION : "originates_from"
    USAGE_SESSION ||--o{ PRESENCE_RECORD : "logs"
    USAGE_SESSION ||--o{ RELEASE_CASE : "generates"

    %% Monitoring & Admin Module
    SPACE ||--o{ OCCUPANCY_RECORD : "snapshots"
    SPACE ||--o{ STATUS_HISTORY : "tracks_changes"
    USER ||--o{ NOTIFICATION : "receives"
    USER ||--o{ INCIDENT : "reports"
    SPACE ||--o{ INCIDENT : "occurs_at"
    EQUIPMENT ||--o{ INCIDENT : "involved_in"
    USER ||--o{ FEEDBACK : "submits"
    SPACE ||--o{ FEEDBACK : "evaluated_for"
    USAGE_SESSION ||--o{ FEEDBACK : "rated_for"
    USER ||--o{ AUDIT_LOG : "triggers"
```

---

## 2. Detailed Schema Definitions by Module

### 2.1 Identity & Organization Modules

```mermaid
erDiagram
    ROLE {
        string Role_ID PK
        string Role_Name
        string Description
        array Permission_List
        string Status
    }

    USER {
        string User_ID PK
        string Student_Employee_Code
        string Full_Name
        string Email
        string Phone
        string Role_ID FK
        string Status
        datetime Created_Date
        datetime Updated_Date
    }

    ORGANIZATION {
        string Organization_ID PK
        string Organization_Code
        string Organization_Name
        string Organization_Type
        string Parent_Organization_ID FK
        string Manager
        string Email
        string Phone
        string Status
    }

    ORGANIZATION_MEMBER {
        string Membership_ID PK
        string User_ID FK
        string Organization_ID FK
        string Organization_Role
        datetime Start_Date
        datetime End_Date
        string Status
    }

    ROLE ||--o{ USER : "assigns"
    USER ||--o{ ORGANIZATION_MEMBER : "belongs_to"
    ORGANIZATION ||--o{ ORGANIZATION_MEMBER : "has"
    ORGANIZATION ||--o{ ORGANIZATION : "parent_hierarchy"
```

---

### 2.2 Space & Asset Modules

```mermaid
erDiagram
    BUILDING {
        string Building_ID PK
        string Building_Code
        string Building_Name
        string Area_Type
        string Address
        int Number_Of_Floors
        string Description
        json Coordinates_Map_Data
        string Status
    }

    FLOOR {
        string Floor_ID PK
        string Building_ID FK
        int Floor_Number
        string Floor_Name
        string Floor_Map
        string Description
    }

    SPACE_TYPE {
        string SpaceType_ID PK
        string Name
        string Description
        string Allowed_User
        string Status
    }

    SPACE {
        string Space_ID PK
        string Space_Code
        string Space_Name
        string Floor_ID FK
        string SpaceType_ID FK
        string Managed_By
        string Parent_Space_ID FK
        int Capacity
        float Area
        string Description
        json Map_Position
        string Status
    }

    EQUIPMENT {
        string Equipment_ID PK
        string Equipment_Code
        string Name
        string Type
        string Description
        string Status
    }

    SPACE_EQUIPMENT {
        string SpaceEquipment_ID PK
        string Space_ID FK
        string Equipment_ID FK
        int Quantity
        string Condition
        datetime Updated_Date
    }

    SPACE_POLICY {
        string Policy_ID PK
        string SpaceType_ID FK
        string Space_ID FK
        string Target_User
        int Check_In_Window
        int No_Show_Grace_Period
        int Away_Warning_Minutes
        int Auto_Checkout_Minutes
        int Max_Usage_Duration
        int Max_Booking_Count
        int Max_Hold_Time
        int Advance_Booking_Days
        string Status
    }

    BUILDING ||--o{ FLOOR : "contains"
    FLOOR ||--o{ SPACE : "contains"
    SPACE_TYPE ||--o{ SPACE : "classifies"
    SPACE ||--o{ SPACE : "parent_child"
    SPACE ||--o{ SPACE_EQUIPMENT : "has"
    EQUIPMENT ||--o{ SPACE_EQUIPMENT : "assigned_to"
    SPACE_TYPE ||--o{ SPACE_POLICY : "defines"
    SPACE ||--o{ SPACE_POLICY : "overrides"
```

---

### 2.3 Booking & Usage Modules

```mermaid
erDiagram
    BOOKING_REQUEST {
        string Request_ID PK
        string User_ID FK
        string Organization_ID FK
        string Space_ID FK
        string Activity_Type
        string Purpose
        date Usage_Date
        time Start_Time
        time End_Time
        int Expected_User_Count
        string Equipment_Request
        string Attachment
        datetime Submitted_Date
        string Status
    }

    BOOKING_EQUIPMENT {
        string BookingEquipment_ID PK
        string Request_ID FK
        string Equipment_ID FK
        int Requested_Quantity
        string Note
        string Status
    }

    APPROVAL {
        string Approval_ID PK
        string Request_ID FK
        string Processor_ID FK
        string Organization_ID FK
        datetime Process_Time
        string Result
        string Reject_Reason
        string Note
    }

    SCHEDULE {
        string Schedule_ID PK
        string Space_ID FK
        string Organization_ID FK
        string Date_Cycle
        time Start_Time
        time End_Time
        string Schedule_Type
        string Semester
        string Course_Code
        string Recurrence
        string Source
        string Status
    }

    USAGE_SESSION {
        string Usage_ID PK
        string User_ID FK
        string Space_ID FK
        string Request_ID FK
        datetime Check_In_Time
        datetime Check_Out_Time
        string Check_In_Method
        string Check_Out_Method
        string Status
        datetime Last_Presence_At
        int Total_Away_Minutes
        string End_Reason
    }

    PRESENCE_RECORD {
        string Presence_ID PK
        string Usage_ID FK
        string User_ID FK
        string Space_ID FK
        datetime Recorded_Time
        string Presence_Status
        string Data_Source
    }

    RELEASE_CASE {
        string Case_ID PK
        string Usage_ID FK
        string Space_ID FK
        datetime Detection_Time
        string Staff_User_ID FK
        datetime Verification_Time
        boolean Found_Item
        string Description
        string Processing_Result
    }

    BOOKING_REQUEST ||--o{ BOOKING_EQUIPMENT : "includes"
    BOOKING_REQUEST ||--o{ APPROVAL : "reviewed_by"
    BOOKING_REQUEST ||--o| USAGE_SESSION : "initiates"
    USAGE_SESSION ||--o{ PRESENCE_RECORD : "tracks"
    USAGE_SESSION ||--o{ RELEASE_CASE : "escalates"
```

---

### 2.4 Monitoring & Administration Modules

```mermaid
erDiagram
    OCCUPANCY_RECORD {
        string Occupancy_ID PK
        string Space_ID FK
        datetime Recorded_Time
        int User_Count
        string Data_Source
    }

    STATUS_HISTORY {
        string StatusHistory_ID PK
        string Space_ID FK
        string Old_Status
        string New_Status
        datetime Change_Time
        string Actor
        string Reason
    }

    INCIDENT {
        string Incident_ID PK
        string Space_ID FK
        string Equipment_ID FK
        string Reporter_ID FK
        string Incident_Type
        string Description
        datetime Report_Time
        string Severity
        string Status
        string Handler_ID FK
        datetime Completed_Time
    }

    FEEDBACK {
        string Feedback_ID PK
        string User_ID FK
        string Space_ID FK
        string Usage_ID FK
        int Rating
        string Feedback_Type
        string Content
        datetime Submit_Time
        string Status
    }

    NOTIFICATION {
        string Notification_ID PK
        string User_ID FK
        string Notification_Type
        string Title
        string Content
        string Related_Entity
        string Related_ID
        string Channel
        datetime Sent_Time
        datetime Read_Time
        string Status
    }

    AUDIT_LOG {
        string Log_ID PK
        string User_System
        string Action_Type
        string Related_Entity
        string Entity_ID
        datetime Timestamp
        json Change_Content
    }
```
