# Database Relationship Diagram

Bạn có thể xem biểu đồ này bằng cách sử dụng tính năng Preview Markdown của VS Code (Ctrl+Shift+V) nếu đã cài đặt extension hỗ trợ Mermaid (như "Markdown Preview Mermaid Support").

```mermaid
erDiagram
    users ||--o{ buildings : "owns (owner_id)"
    users ||--o{ rooms : "owns (owner_id)"
    users ||--o{ tenants : "is user (user_id)"
    users ||--o{ notifications : "receives (owner_id)"
    
    buildings ||--o{ rooms : "contains (building_id)"
    
    rooms ||--o{ tenants : "has (room_id)"
    rooms ||--o{ notifications : "related to (room_id)"

    tenants ||--o{ payment_details : "has (tenant_id)"
    tenants ||--o{ notifications : "related to (tenant_id)"

    users {
        string id PK
        string name
        string role
        string bank_account
        string bank_name
        string qr_code_url
        timestamp created_at
    }

    buildings {
        int id PK
        string name
        string address
        string owner_id FK
        timestamp created_at
    }

    rooms {
        int id PK
        string name
        int building_id FK
        string owner_id FK
        decimal room_price
        decimal service_fee
        decimal electricity_price
        decimal water_price
        timestamp created_at
    }

    tenants {
        int id PK
        int room_id FK
        string user_id FK
        decimal current_bill
        decimal debt
        timestamp last_bill_at
        string payment_status
        timestamp payment_confirmed_at
        decimal owner_confirmed_amount
        timestamp owner_confirmed_at
        timestamp created_at
    }

    payment_details {
        int id PK
        int tenant_id FK
        decimal room_price
        decimal service_fee
        decimal electricity_amount
        decimal water_amount
        decimal penalty
        decimal debt_amount
        decimal total_amount
        int month
        int year
        timestamp created_at
    }

    notifications {
        int id PK
        string owner_id FK
        int tenant_id FK
        int room_id FK
        string type
        string title
        string message
        jsonb data
        boolean is_read
        timestamp created_at
    }
```
