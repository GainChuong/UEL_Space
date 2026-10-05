# Campus Space Management ERD

Dựa trên nguyên tắc thiết kế Database Design (`/database-design`), quy chuẩn Normalization (`erd-schema-designer`) và các yêu cầu trong bộ tài liệu đặc tả, đây là sơ đồ Thực thể - Liên kết (ERD) hoàn chỉnh.

### Thiết kế theo nguyên tắc:
1. **Multi-tenancy**: Tất cả các bảng (trừ Organization/Audit) đều có `organization_id` để đảm bảo cô lập dữ liệu (Tenant Isolation) và sẵn sàng cho RLS (Row-Level Security).
2. **Soft Deletion**: Sử dụng `deleted_at` thay vì xóa vật lý.
3. **Auditing**: Bổ sung `created_at`, `updated_at`, `created_by_id`, và bảng `AuditLog` riêng.
4. **Optimistic Locking**: Trường `version` cho các entity quan trọng để tránh conflict khi cập nhật đồng thời (Booking, Space, Incident).
5. **Surrogate Keys**: Sử dụng chuỗi UUID/CUID (`id PK`) cho toàn bộ primary key.

### Sơ đồ ERD (Mermaid)
Để đảm bảo các đường nối gọn gàng và không chồng chéo, các quan hệ được bố trí từ thực thể Root (Organization, User, Space) xuống các thực thể Transaction (Booking, Session, Incident).

```mermaid
erDiagram
    Organization ||--o{ User : has
    Organization ||--o{ Space : owns
    Organization ||--o{ BookingRequest : scopes
    Organization ||--o{ Incident : scopes

    User ||--o{ BookingRequest : "requests"
    Space ||--o{ BookingRequest : "booked for"
    
    User ||--o{ UsageSession : "attends"
    Space ||--o{ UsageSession : "hosts"
    BookingRequest ||--o| UsageSession : "generates"

    User ||--o{ Incident : "reports"
    Space ||--o{ Incident : "occurs at"

    Organization {
        string id PK
        string name
        string domain
        timestamp created_at
        timestamp updated_at
    }

    User {
        string id PK
        string organization_id FK
        string email
        string full_name
        string role
        timestamp deleted_at
        timestamp created_at
        timestamp updated_at
        int version
    }

    Space {
        string id PK
        string organization_id FK
        string name
        string type
        int capacity
        string status
        string created_by_id FK
        timestamp deleted_at
        timestamp created_at
        timestamp updated_at
        int version
    }

    BookingRequest {
        string id PK
        string organization_id FK
        string user_id FK
        string space_id FK
        timestamp start_time
        timestamp end_time
        string status
        string reason
        string approved_by_id FK
        timestamp deleted_at
        timestamp created_at
        timestamp updated_at
        int version
    }

    UsageSession {
        string id PK
        string booking_id FK
        string user_id FK
        string space_id FK
        timestamp check_in_time
        timestamp check_out_time
        string status
        timestamp created_at
        timestamp updated_at
        int version
    }

    Incident {
        string id PK
        string organization_id FK
        string space_id FK
        string reported_by_id FK
        string description
        string severity
        string status
        timestamp resolved_at
        timestamp deleted_at
        timestamp created_at
        timestamp updated_at
        int version
    }

    AuditLog {
        string id PK
        string entity_name
        string entity_id
        string action
        string changed_by_id FK
        jsonb changes_json
        timestamp created_at
    }
```

### Chiến lược Index
1. **Primary & Foreign Keys**: Tự động đánh index cho các cột FK như `organization_id`, `user_id`, `space_id`, `booking_id`.
2. **Partial Index cho Soft Delete**:
   - `CREATE INDEX idx_space_active ON spaces(organization_id) WHERE deleted_at IS NULL;`
   - `CREATE INDEX idx_booking_active ON booking_requests(space_id, start_time) WHERE deleted_at IS NULL;`
3. **Composite Index**:
   - Bảng BookingRequest: `CREATE INDEX idx_booking_time ON booking_requests (space_id, start_time, end_time, status);` (Để tối ưu F35 - Check Overlap).
   - Bảng UsageSession: `CREATE INDEX idx_session_status ON usage_sessions (status, check_in_time);` (Tối ưu cho Cron Job Auto-checkout).
