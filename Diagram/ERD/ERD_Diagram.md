# Sơ đồ Entity Relationship Diagram (ERD) - Campus Space Management System

> **Lưu ý về thiết kế:** Hệ thống gồm 23 thực thể. Để sơ đồ không bị kéo dài lộn xộn và dễ theo dõi nhất, tài liệu này cung cấp **Sơ đồ Tóm tắt Cấp cao (High-Level Core ERD)** cùng **6 Sơ đồ Phân hệ Chi tiết (Modular ERD)**.

---

## 1. Sơ đồ Tổng quan Cấp cao (Core Conceptual ERD)

Sơ đồ thể hiện luồng liên kết chính giữa các thực thể nòng nốt trong hệ thống (đã tinh gọn các bảng chi tiết để các dây nối ngắn và không bị đè lên nhau):

```mermaid
erDiagram
    direction TB

    %% Real-world Entities
    ROLE ||--o{ USER : "assigns"
    USER ||--o{ ORGANIZATION_MEMBER : "belongs_to"
    ORGANIZATION ||--o{ ORGANIZATION_MEMBER : "has"
    
    BUILDING ||--o{ FLOOR : "contains"
    FLOOR ||--o{ SPACE : "contains"
    SPACE_TYPE ||--o{ SPACE : "classifies"
    SPACE ||--o{ SPACE_EQUIPMENT : "has"
    EQUIPMENT ||--o{ SPACE_EQUIPMENT : "assigned"

    %% Core Workflows
    USER ||--o{ BOOKING_REQUEST : "creates"
    SPACE ||--o{ BOOKING_REQUEST : "reserved_for"
    BOOKING_REQUEST ||--o| USAGE_SESSION : "starts"
    USER ||--o{ USAGE_SESSION : "uses"
    SPACE ||--o{ USAGE_SESSION : "occupies"

    %% Management
    BOOKING_REQUEST ||--o{ APPROVAL : "requires"
    USAGE_SESSION ||--o{ RELEASE_CASE : "generates"
    SPACE ||--o{ INCIDENT : "reports"
```

---

## 2. Các Sơ đồ Phân hệ Chi tiết (Modular ERD Diagrams)

### 2.1 Phân hệ Phân quyền & Người dùng (Identity Module)

```mermaid
erDiagram
    ROLE {
        string Role_ID PK
        string Role_Name
        string Description
        array Permission_List
    }

    USER {
        string User_ID PK
        string Student_Employee_Code
        string Full_Name
        string Email
        string Role_ID FK
        string Status
    }

    ORGANIZATION {
        string Organization_ID PK
        string Organization_Code
        string Organization_Name
        string Organization_Type
        string Parent_Organization_ID FK
    }

    ORGANIZATION_MEMBER {
        string Membership_ID PK
        string User_ID FK
        string Organization_ID FK
        string Organization_Role
    }

    ROLE ||--o{ USER : "assigns"
    USER ||--o{ ORGANIZATION_MEMBER : "belongs_to"
    ORGANIZATION ||--o{ ORGANIZATION_MEMBER : "has_members"
    ORGANIZATION ||--o{ ORGANIZATION : "parent_of"
```

---

### 2.2 Phân hệ Cơ sở vật chất & Không gian (Space Infrastructure Module)

```mermaid
erDiagram
    BUILDING {
        string Building_ID PK
        string Building_Code
        string Building_Name
        int Number_Of_Floors
    }

    FLOOR {
        string Floor_ID PK
        string Building_ID FK
        int Floor_Number
        string Floor_Name
    }

    SPACE_TYPE {
        string SpaceType_ID PK
        string Name
        string Description
    }

    SPACE {
        string Space_ID PK
        string Space_Code
        string Space_Name
        string Floor_ID FK
        string SpaceType_ID FK
        int Capacity
        string Status
    }

    EQUIPMENT {
        string Equipment_ID PK
        string Equipment_Code
        string Name
        string Type
    }

    SPACE_EQUIPMENT {
        string SpaceEquipment_ID PK
        string Space_ID FK
        string Equipment_ID FK
        int Quantity
        string Condition
    }

    SPACE_POLICY {
        string Policy_ID PK
        string SpaceType_ID FK
        string Space_ID FK
        int Check_In_Window
        int Away_Warning_Minutes
        int Auto_Checkout_Minutes
    }

    BUILDING ||--o{ FLOOR : "contains"
    FLOOR ||--o{ SPACE : "contains"
    SPACE_TYPE ||--o{ SPACE : "classifies"
    SPACE ||--o{ SPACE_EQUIPMENT : "equips"
    EQUIPMENT ||--o{ SPACE_EQUIPMENT : "used_in"
    SPACE_TYPE ||--o{ SPACE_POLICY : "default_policy"
    SPACE ||--o{ SPACE_POLICY : "override_policy"
```

---

### 2.3 Phân hệ Đặt phòng & Lịch biểu (Booking & Schedule Module)

```mermaid
erDiagram
    BOOKING_REQUEST {
        string Request_ID PK
        string User_ID FK
        string Organization_ID FK
        string Space_ID FK
        date Usage_Date
        time Start_Time
        time End_Time
        string Status
    }

    BOOKING_EQUIPMENT {
        string BookingEquipment_ID PK
        string Request_ID FK
        string Equipment_ID FK
        int Requested_Quantity
    }

    APPROVAL {
        string Approval_ID PK
        string Request_ID FK
        string Processor_ID FK
        string Result
        string Reject_Reason
    }

    SCHEDULE {
        string Schedule_ID PK
        string Space_ID FK
        string Organization_ID FK
        time Start_Time
        time End_Time
        string Recurrence
    }

    BOOKING_REQUEST ||--o{ BOOKING_EQUIPMENT : "requests"
    BOOKING_REQUEST ||--o{ APPROVAL : "requires"
    SPACE ||--o{ SCHEDULE : "scheduled"
```

---

### 2.4 Phân hệ Quản lý Sử dụng & Check-in (Usage Session Module)

```mermaid
erDiagram
    USAGE_SESSION {
        string Usage_ID PK
        string User_ID FK
        string Space_ID FK
        string Request_ID FK
        datetime Check_In_Time
        datetime Check_Out_Time
        string Status
    }

    PRESENCE_RECORD {
        string Presence_ID PK
        string Usage_ID FK
        string Recorded_Time
        string Presence_Status
    }

    RELEASE_CASE {
        string Case_ID PK
        string Usage_ID FK
        string Space_ID FK
        datetime Detection_Time
        boolean Found_Item
        string Processing_Result
    }

    USAGE_SESSION ||--o{ PRESENCE_RECORD : "logs"
    USAGE_SESSION ||--o{ RELEASE_CASE : "generates"
```

---

### 2.5 Phân hệ Giám sát, Sự cố & Đánh giá (Monitoring & Admin Module)

```mermaid
erDiagram
    OCCUPANCY_RECORD {
        string Occupancy_ID PK
        string Space_ID FK
        datetime Recorded_Time
        int User_Count
    }

    STATUS_HISTORY {
        string StatusHistory_ID PK
        string Space_ID FK
        string Old_Status
        string New_Status
        datetime Change_Time
    }

    INCIDENT {
        string Incident_ID PK
        string Space_ID FK
        string Equipment_ID FK
        string Reporter_ID FK
        string Severity
        string Status
    }

    FEEDBACK {
        string Feedback_ID PK
        string User_ID FK
        string Space_ID FK
        string Usage_ID FK
        int Rating
        string Content
    }

    NOTIFICATION {
        string Notification_ID PK
        string User_ID FK
        string Title
        string Content
    }

    AUDIT_LOG {
        string Log_ID PK
        string User_System
        string Action_Type
        datetime Timestamp
    }
```
