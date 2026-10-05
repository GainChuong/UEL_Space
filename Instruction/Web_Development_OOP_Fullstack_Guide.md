# Web Development Course - Object Oriented Full-stack Structure Guide

## 1. Tổng quan kiến thức cần nắm

Môn học tập trung vào xây dựng ứng dụng Web hiện đại theo hướng
Full-stack:

-   Frontend: Angular
-   Backend: NodeJS + ExpressJS
-   Database: MongoDB
-   API communication: RESTful API
-   Authentication state: Cookie / Session

Kiến trúc tổng thể:

    User
     |
    Angular Application
     |
    HTTP Request
     |
    RESTful API
     |
    NodeJS + ExpressJS
     |
    MongoDB

------------------------------------------------------------------------

# 2. Tư duy quan trọng: Lập trình hướng đối tượng (OOP)

## 2.1 Vì sao cần OOP trong Web?

Trong ứng dụng Web lớn, dữ liệu không nên xử lý bằng các biến rời rạc.

Ví dụ không nên:

    name
    email
    phone
    address

Mà nên tổ chức thành Object:

    User Object

    {
     name,
     email,
     phone,
     address
    }

Object đại diện cho một thực thể trong hệ thống.

Ví dụ:

-   User
-   Product
-   Fashion
-   Room
-   Booking
-   CourseRegistration

------------------------------------------------------------------------

# 3. Cấu trúc Object trong Web

Mỗi Entity nên có:

## Data (Properties)

Thông tin của đối tượng.

Ví dụ:

    Product

    id
    name
    price
    image
    category

## Behavior (Methods)

Các hành động của đối tượng.

Ví dụ:

    Product

    getInformation()
    calculatePrice()
    updateProduct()

------------------------------------------------------------------------

# 4. Tổ chức Class Model

Frontend Angular:

    src
    |
    ├── classes
    │   ├── Product.ts
    │   ├── User.ts
    │   └── Booking.ts

Ví dụ:

``` typescript
export class Product {

 constructor(
   public id:number = 0,
   public name:string = "",
   public price:number = 0
 ){}

 getInformation(){
   return this.name + this.price;
 }

}
```

Lợi ích:

-   Code dễ đọc
-   Dễ mở rộng
-   Dễ binding dữ liệu
-   Dễ test

------------------------------------------------------------------------

# 5. Kiến trúc Angular theo hướng đối tượng

Cấu trúc chuẩn:

    Angular Project

    src/app

    ├── classes
    │   └── Models

    ├── components
    │   ├── ProductComponent
    │   └── LoginComponent

    ├── services
    │   ├── ProductService
    │   └── AuthService

    ├── guards

    ├── routes

    └── app.module

------------------------------------------------------------------------

# 6. Vai trò từng lớp

## Model / Class

Quản lý dữ liệu.

Ví dụ:

    Product.ts

Chứa:

-   Properties
-   Constructor
-   Method

------------------------------------------------------------------------

## Component

Quản lý giao diện.

Chịu trách nhiệm:

-   Hiển thị dữ liệu
-   Nhận thao tác người dùng
-   Gọi Service

Luồng:

    HTML
     |
    Component
     |
    Service
     |
    API

------------------------------------------------------------------------

## Service

Đóng vai trò trung gian.

Không để Component gọi API trực tiếp.

Sai:

    Component
     |
    HTTP
     |
    Server

Đúng:

    Component
     |
    Service
     |
    HTTP
     |
    Server

------------------------------------------------------------------------

# 7. Data Binding trong Angular

## One-way Binding

Data đi một chiều:

    Class
     |
    HTML

Ví dụ:

``` html
{{product.name}}
```

------------------------------------------------------------------------

## Two-way Binding

Đồng bộ:

    HTML
    <---->
    Class

Ví dụ:

``` html
[(ngModel)]
```

Dùng nhiều trong Form.

------------------------------------------------------------------------

# 8. Form Management

Có hai cách:

## Template Driven Form

Phù hợp:

-   Form nhỏ
-   Logic đơn giản

Đặc điểm:

-   Xử lý chủ yếu trong HTML
-   Dùng ngModel

------------------------------------------------------------------------

## Reactive Form

Phù hợp:

-   Form lớn
-   Nhiều validation
-   Cần test

Đặc điểm:

-   Quản lý bằng TypeScript
-   Form trở thành Object

------------------------------------------------------------------------

# 9. Validation

Các kiểm tra thường dùng:

    required
    email
    minlength
    maxlength
    pattern

Luồng:

    User Input

    ↓

    Validation

    ↓

    Valid Data

    ↓

    Submit API

------------------------------------------------------------------------

# 10. RESTful API Architecture

REST API là cầu nối giữa Frontend và Backend.

Mô hình:

    Angular

    HTTP Request

    NodeJS Express

    MongoDB

------------------------------------------------------------------------

# 11. CRUD Pattern

Mọi Entity đều có CRUD:

## Create

POST

    POST /products

Tạo object mới.

## Read

GET

    GET /products

Lấy danh sách.

## Update

PUT

    PUT /products/id

Cập nhật object.

## Delete

DELETE

    DELETE /products/id

Xóa object.

------------------------------------------------------------------------

# 12. Backend Structure

NodeJS:

    server

    ├── models
    │   └── Product.js

    ├── controllers
    │   └── productController.js

    ├── routes
    │   └── productRoutes.js

    ├── middleware

    └── index.js

------------------------------------------------------------------------

# 13. MVC Pattern

## Model

Quản lý dữ liệu.

    MongoDB

------------------------------------------------------------------------

## View

Giao diện.

    Angular HTML

------------------------------------------------------------------------

## Controller

Điều phối request.

    Express Controller

Luồng:

    Client

    ↓

    Controller

    ↓

    Model

    ↓

    Database

    ↓

    Response

------------------------------------------------------------------------

# 14. MongoDB Organization

MongoDB tổ chức:

    Database

    |
    Collection

    |
    Document

Ví dụ:

    FashionDatabase

    |
    Fashion Collection

    |
    Fashion Document

Document tương tự Object trong OOP.

------------------------------------------------------------------------

# 15. Service Design Pattern

Quy tắc:

Component không xử lý nghiệp vụ.

Service xử lý:

-   API call
-   Business logic
-   Data transformation

Ví dụ:

    ProductComponent

    ↓

    ProductService

    ↓

    REST API

    ↓

    MongoDB

------------------------------------------------------------------------

# 16. Authentication

## Cookie

Lưu thông tin phía Client.

Dùng cho:

-   Remember login
-   User preference

------------------------------------------------------------------------

## Session

Lưu trạng thái phía Server.

Dùng cho:

-   User session
-   Authentication state

------------------------------------------------------------------------

# 17. Quy trình xây dựng một Feature chuẩn

Ví dụ tạo Product:

## Step 1

Tạo Model

    Product.ts

## Step 2

Tạo API Backend

    productRoutes
    productController

## Step 3

Tạo Service Angular

    ProductService

## Step 4

Tạo Component

    ProductComponent

## Step 5

Binding UI

    HTML <-> Object

## Step 6

Test CRUD

------------------------------------------------------------------------

# 18. Quy tắc tổ chức code Web Developer

## Không viết tất cả trong Component

Sai:

    Component

    - HTML
    - API
    - Database logic
    - Validation

Đúng:

    Component

    ↓

    Service

    ↓

    API

    ↓

    Database

------------------------------------------------------------------------

# 19. Checklist trước khi code

1.  Xác định Entity

Ví dụ:

    User
    Product
    Booking

2.  Tạo Model/Class

3.  Thiết kế API CRUD

4.  Tạo Service

5.  Tạo Component

6.  Binding dữ liệu

7.  Validation

8.  Test

------------------------------------------------------------------------

# 20. Mindset quan trọng nhất

Web hiện đại không xây bằng từng trang HTML riêng lẻ.

Cách tư duy đúng:

    Application

    =
    Objects

    +
    Components

    +
    Services

    +
    APIs

    +
    Database

Mỗi chức năng là một module độc lập.

Mỗi dữ liệu quan trọng là một Object.

Mỗi Object có:

-   State
-   Behavior
-   Responsibility

Đó là nền tảng để xây dựng Web Application có khả năng mở rộng.
