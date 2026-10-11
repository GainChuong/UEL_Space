# DEVELOPER HANDBOOK
## Hướng dẫn xây dựng ứng dụng web Angular – Node.js – Express – MongoDB

> **Tài liệu kỹ thuật dành cho developer**  
> Phiên bản: 1.0 · Biên soạn từ 09 bộ slide của môn *Phát triển Web Kinh doanh Nâng cao* (tổng quan + Chương I–VIII).  
> Đối tượng: Frontend Developer, Backend Developer, Full-stack Developer, Tech Lead và thành viên mới của nhóm.  
> Mục tiêu: thống nhất **cách tổ chức dự án**, **tư duy hướng đối tượng**, **luồng lập trình**, **hợp đồng API**, **quy trình kiểm thử** và **tiêu chí hoàn thành tính năng**.

> [!IMPORTANT]
> **Phạm vi và nguồn nội dung.** Các khái niệm Angular, NgModule, Component, Service, Binding, Routing, Form, MVC, RESTful API, MongoDB, Cookie và Session được tổng hợp từ slide môn học. Cấu trúc `features/`, `controllers/`, `repositories/`, quy ước code, ví dụ tích hợp liên tục và checklist bảo mật là **đề xuất triển khai bổ sung** để nhóm developer áp dụng thực tế; không phải nguyên văn từ slide. Tài liệu lấy **NgModule** làm luồng học chính vì slide sử dụng `--no-standalone`. Theo tài liệu Angular chính thức, **Standalone** là kiến trúc được khuyến nghị cho mã nguồn Angular mới. Nếu dự án được tạo mặc định bằng Standalone, cách khai báo imports/providers/routes phải điều chỉnh tương ứng.

---

## Mục lục

1. [Mục đích và lộ trình triển khai](#1-mục-đích-và-lộ-trình-triển-khai)
2. [Kiến trúc tổng thể và cách phân chia trách nhiệm](#2-kiến-trúc-tổng-thể-và-cách-phân-chia-trách-nhiệm)
3. [Nền tảng TypeScript và thiết kế hướng đối tượng](#3-nền-tảng-typescript-và-thiết-kế-hướng-đối-tượng)
4. [Chuẩn bị môi trường và khởi tạo dự án](#4-chuẩn-bị-môi-trường-và-khởi-tạo-dự-án)
5. [Cấu trúc thư mục và quy ước phát triển](#5-cấu-trúc-thư-mục-và-quy-ước-phát-triển)
6. [Angular Components, Binding, Directives, Interaction](#6-angular-components-binding-directives-interaction)
7. [Angular Services, HTTP, RxJS và Signals](#7-angular-services-http-rxjs-và-signals)
8. [Routing, phân quyền và Lazy Loading](#8-routing-phân-quyền-và-lazy-loading)
9. [Form và kiểm tra dữ liệu](#9-form-và-kiểm-tra-dữ-liệu)
10. [RESTful API và backend theo lớp](#10-restful-api-và-backend-theo-lớp)
11. [MongoDB, truy vấn và CRUD](#11-mongodb-truy-vấn-và-crud)
12. [Cookie, Session và đăng nhập](#12-cookie-session-và-đăng-nhập)
13. [Upload file, ảnh và xử lý tài nguyên](#13-upload-file-ảnh-và-xử-lý-tài-nguyên)
14. [Kịch bản lập trình một tính năng end-to-end](#14-kịch-bản-lập-trình-một-tính-năng-end-to-end)
15. [Kiểm thử, xử lý lỗi và chất lượng mã nguồn](#15-kiểm-thử-xử-lý-lỗi-và-chất-lượng-mã-nguồn)
16. [Checklist dành cho nhóm dev](#16-checklist-dành-cho-nhóm-dev)
17. [Đối chiếu với slide và tài liệu tham khảo](#17-đối-chiếu-với-slide-và-tài-liệu-tham-khảo)

---

## 1. Mục đích và lộ trình triển khai

### 1.1. Hệ thống đích

Ví dụ xuyên suốt trong tài liệu là **Product Management**: hiển thị danh sách sản phẩm, xem chi tiết, thêm/sửa/xóa sản phẩm, đăng nhập người dùng và bảo vệ thao tác ghi. Tên model có thể thay bằng `Book` hoặc `Fashion` để tương ứng với ví dụ trong slide Chương VI–VII.

```text
Người dùng / Browser
         │
         ▼
Angular SPA  (localhost:4200)
  ├── Component: hiển thị + nhận thao tác
  ├── Router: chọn màn hình
  ├── Form: thu thập và kiểm tra sơ bộ input
  └── Service: gọi HttpClient, quản lý shared state
         │  HTTP + JSON / Cookie Session
         ▼
Express REST API  (localhost:3000)
  ├── Route: URL + HTTP verb
  ├── Middleware: session, auth, validation, error
  ├── Controller: request/response
  ├── Business Service: luật nghiệp vụ
  └── Repository: truy xuất dữ liệu
         │
         ▼
MongoDB  (localhost:27017)
  └── Database → Collection → BSON Document
```

### 1.2. Thứ tự học và lập trình hiệu quả

| Giai đoạn | Xây dựng | Kết quả bàn giao |
|---|---|---|
| 1 | Angular project, Component, Template, Binding | Trang hiển thị dữ liệu tĩnh |
| 2 | Model, Service, HTTP, Signals | Trang đọc dữ liệu JSON/API |
| 3 | Routing, Params, Query Params | Danh sách và trang chi tiết |
| 4 | Template-driven / Reactive Forms | Form nhập liệu và validation |
| 5 | Express API GET/POST/PUT/DELETE | API CRUD chạy được trên Postman |
| 6 | MongoDB | CRUD có lưu dữ liệu thực |
| 7 | Cookie/Session, Login, Guards | API ghi có xác thực |
| 8 | Error handling, tests, review | Hoàn thiện mức có thể bàn giao |

**Definition of Done:** Không coi một tính năng hoàn thành chỉ vì UI hiển thị đúng. Tính năng phải hoạt động xuyên suốt View → Service → API → Database, xử lý tình huống lỗi và có bằng chứng kiểm thử.

## 2. Kiến trúc tổng thể và cách phân chia trách nhiệm

### 2.1. Nguyên tắc Separation of Concerns (SoC)

| Thành phần | Nên đảm nhiệm | Không nên đảm nhiệm |
|---|---|---|
| Angular Template | Render dữ liệu, nhận event, hiển thị validation | Truy vấn DB, nghiệp vụ phức tạp |
| Angular Component | State của màn hình, gọi service, điều phối UI | HTTP trực tiếp tràn lan, xử lý nghiệp vụ dùng chung |
| Angular Service | HTTP request, business/shared state phù hợp client | Thao tác DOM thủ công, truy vấn MongoDB |
| Express Route | Gắn method/path với handler và middleware | Chứa toàn bộ nghiệp vụ |
| Controller | Đọc params/body, gọi service, chọn HTTP status | Xử lý query DB phức tạp |
| Backend Service | Validate quy tắc nghiệp vụ, phối hợp repositories | Biết cấu trúc HTTP response hoặc HTML |
| Repository | Query/insert/update/delete database | Hiển thị UI, kiểm tra quyền của người dùng |
| MongoDB | Lưu trữ, lọc, index dữ liệu | Xử lý tương tác trình duyệt |

### 2.2. Một request mẫu

```text
GET /api/products/65f0...
  → Router kiểm tra route
  → Controller lấy params.id
  → ProductService kiểm tra id/logic
  → MongoProductRepository.findById(id)
  → MongoDB trả document hoặc null
  → Controller trả 200 JSON hoặc 404
  → Angular ProductApiService nhận Observable<Product>
  → ProductDetailComponent cập nhật Signal
  → HTML render lại
```

**Hai quy tắc bắt buộc:** (1) Angular **không kết nối trực tiếp MongoDB**; luôn qua backend API. (2) Route Guard trong trình duyệt chỉ là một lớp UX; **quyền truy cập phải được thực thi lại tại server**.

## 3. Nền tảng TypeScript và thiết kế hướng đối tượng

Đây là phần quan trọng nhất để nhóm code theo cùng tư duy, thay vì viết lệnh tùy tiện vào Component.

### 3.1. Các khái niệm OOP ứng dụng thực tế

| Khái niệm | Ý nghĩa trong ứng dụng |
|---|---|
| Class | Khuôn mẫu để biểu diễn trạng thái và hành vi (`ProductService`, `ProductController`) |
| Object | Instance của class, ví dụ một service được injector cung cấp |
| Encapsulation | Đóng gói dữ liệu và hành vi; không sửa state nội bộ tùy ý |
| Abstraction | Chỉ lộ ra interface cần dùng, che giấu cách lưu dữ liệu |
| Inheritance | Kế thừa khi có quan hệ “is-a” thực sự; không lạm dụng `extends` |
| Polymorphism | Nhiều implementation dùng chung một contract, ví dụ repository giả khi test |
| Composition | Lắp ghép class bằng dependency; thường ưu tiên hơn kế thừa cho service |
| Dependency Injection | Nhận dependency qua constructor / `inject()` thay vì `new` cứng trong Component |

### 3.2. Phân biệt `interface`, `type` và `class`

```typescript
// models/product.model.ts
export interface Product {
  _id: string;              // id MongoDB trả về ở dạng chuỗi JSON
  name: string;
  price: number;
  description: string;
}

export type CreateProductDto = Omit<Product, '_id'>;

// Dùng class khi thật sự cần hành vi / phương thức.
export class Money {
  constructor(private readonly amount: number) {
    if (amount < 0) throw new Error('Amount cannot be negative');
  }

  format(): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency', currency: 'VND'
    }).format(this.amount);
  }
}
```

- `interface`: định nghĩa *shape* dữ liệu, bị xóa sau khi TypeScript biên dịch, **không tự validate JSON ở runtime**.
- `type`: hợp thành kiểu (`union`, `Omit`, `Pick`, DTO...).
- `class`: dùng khi cần constructor, phương thức, bất biến của object (invariants) và vòng đời instance.
- **DTO** (*Data Transfer Object*): hợp đồng dữ liệu gửi/nhận API; không nhất thiết trùng 100% DB schema.

### 3.3. SOLID theo mức thực hành

**SRP:** `ProductListComponent` chỉ xử lý luồng hiển thị, `ProductApiService` chuyên truy xuất API.  
**OCP:** khi thêm kiểu dữ liệu/repository mới, giới hạn tác động đến code đang hoạt động.  
**LSP:** implementation của interface phải giữ được hợp đồng hành vi.  
**ISP:** ưu tiên interface nhỏ vừa đủ, tránh `IEverythingService`.  
**DIP:** lớp nghiệp vụ phụ thuộc abstraction/repository contract, không trói chặt vào hệ quản trị dữ liệu.

Ví dụ **composition và DI** phía server:

```javascript
// Repository được truyền vào, service không tự mở MongoClient.
class ProductService {
  constructor(productRepository) {
    this.products = productRepository;
  }

  async listProducts() {
    return this.products.findAll();
  }
}
```

Trong Angular, `@Injectable({ providedIn: 'root' })` cho phép injector cung cấp một instance service trong root injector. **Không dùng `new ProductApiService()` trong Component**. Instance không nhất thiết toàn ứng dụng nếu service được khai báo ở injector con.

### 3.4. Nguyên tắc review OOP

1. Tên class thể hiện trách nhiệm, không đặt `Manager`/`Helper` chung chung cho mọi thứ.
2. Phương thức nên làm một việc có ý nghĩa và có hợp đồng input/output rõ ràng.
3. Không lặp cấu trúc model và API logic ở nhiều component (*Spaghetti State* trong Chương III).
4. Không truyền dữ liệu qua 5 lớp con chỉ để “đi ngang” (*prop drilling*); cân nhắc shared service khi các component không có quan hệ cha–con.
5. Không nhầm **tổ chức hướng đối tượng** với việc bắt buộc biến mọi JSON và utility function thành class.

## 4. Chuẩn bị môi trường và khởi tạo dự án

### 4.1. Công cụ

- Node.js/npm tương thích phiên bản Angular CLI đang dùng; kiểm tra bảng tương thích chính thức trước khi cài.
- VS Code, Angular CLI, MongoDB Community hoặc Atlas, MongoDB Compass, Postman.
- Git; môi trường Node tách biệt cho frontend/backend.

```bash
node -v
npm -v
npm install -g @angular/cli
ng version
```

### 4.2. Tạo Angular theo **NgModule** (đúng mạch slide)

```bash
ng new my-app --no-standalone --routing --ssr=false --style=css --file-name-style-guide=2016
cd my-app
ng serve --open
```

Mặc định thường mở `http://localhost:4200`. Tham số `--file-name-style-guide=2016` (được hỗ trợ ở Angular CLI hiện hành) chọn kiểu tên file dạng `app.component.ts`, `app.module.ts`, phù hợp các ví dụ bên dưới. Nếu làm theo project do slide hoặc người khác tạo theo naming style 2025 (`app.ts`, `app-module.ts`...), **điều chỉnh import/path theo file thực tế**, không trộn hai quy ước.

Tạo artifact bằng CLI (có thể đặt dưới `features/products/`):

```bash
ng generate component features/products/product-list --standalone=false
ng generate component features/products/product-detail --standalone=false
ng generate component features/products/product-form --standalone=false
ng generate service core/services/product-api
ng generate guard core/guards/auth
```

Trên PowerShell, nếu lỗi `ng.ps1` bị chặn, có thể dùng Command Prompt hoặc xem chính sách script của máy. Slide hướng dẫn lệnh dưới đây cho **CurrentUser**, nhưng chỉ áp dụng nếu được phép theo chính sách máy/đơn vị:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 4.3. Tạo backend

```bash
mkdir my-server
cd my-server
npm init -y
npm install express mongodb dotenv morgan cors express-session bcryptjs
npm install --save-dev nodemon
```

Bổ sung vào `package.json`:

```json
{
  "scripts": {
    "dev": "nodemon src/server.js",
    "start": "node src/server.js"
  }
}
```

Khi đưa đoạn trên vào `package.json` thực tế, **chỉ thay `scripts`**, giữ nguyên các khóa khác. `nodemon` tự khởi động lại backend khi file đổi; `morgan` ghi log HTTP request.

### 4.4. Cấu hình môi trường

Tạo `my-server/.env` (không commit) và `my-server/.env.example` (được commit, không có bí mật):

```dotenv
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017
MONGO_DB=angular_dev
SESSION_SECRET=REPLACE_WITH_LONG_RANDOM_SECRET
NODE_ENV=development
```

`.gitignore` tối thiểu ở mỗi project:

```gitignore
node_modules/
.env
.env.*.local
dist/
coverage/
*.log
```

**Lưu ý:** `SESSION_SECRET` minh họa trong `.env.example` không được dùng nguyên trong môi trường thực. MongoDB Atlas yêu cầu URI/credential riêng; không đưa URI có mật khẩu lên Git.

## 5. Cấu trúc thư mục và quy ước phát triển

### 5.1. Tổ chức theo feature, có lớp dùng chung

```text
web-project/
├── README.md
├── docs/
│   ├── architecture.md
│   └── api-contract.md
├── my-app/                         # Angular
│   ├── proxy.conf.json
│   ├── public/
│   │   └── datasets/
│   │       └── products.json        # dữ liệu học HTTP local (nếu cần)
│   └── src/
│       └── app/
│           ├── app.module.ts       # tên file theo CLI thực tế
│           ├── app-routing.module.ts
│           ├── core/
│           │   ├── guards/
│           │   │   └── auth.guard.ts
│           │   └── services/
│           │       ├── product-api.service.ts
│           │       └── auth.service.ts
│           ├── shared/
│           │   └── components/
│           └── features/
│               ├── products/
│               │   ├── models/
│               │   │   └── product.model.ts
│               │   ├── product-list/
│               │   ├── product-detail/
│               │   └── product-form/
│               └── auth/
│                   └── login/
└── my-server/                       # Express
    ├── .env.example
    └── src/
        ├── server.js
        ├── config/
        │   └── db.js
        ├── common/
        │   ├── async-handler.js
        │   ├── app-error.js
        │   └── error-handler.js
        └── modules/
            ├── products/
            │   ├── product.repository.js
            │   ├── product.service.js
            │   ├── product.controller.js
            │   └── product.routes.js
            └── auth/
                └── auth.routes.js
```

**Đối chiếu slide:** ví dụ học tập đặt chung `classes/`, `services/` và nhiều component ngang cấp là hợp lý cho từng bài nhỏ. Khi xây hệ thống có nhiều feature, ưu tiên gom màn hình/model theo nghiệp vụ và tách `core`, `shared` để giảm phụ thuộc chéo.

### 5.2. Naming conventions

| Loại | Quy ước | Ví dụ |
|---|---|---|
| File | `kebab-case` + loại | `product-api.service.ts` |
| Class / Interface | `PascalCase` | `ProductApiService`, `Product` |
| Biến / phương thức | `camelCase` | `loadProducts()`, `currentUser` |
| Selector | `app-...` | `app-product-list` |
| URL | danh từ số nhiều | `/api/products`, `/api/products/:id` |
| Environment | `UPPER_SNAKE_CASE` | `MONGO_URI` |
| Git branch | theo tính năng | `feature/product-crud` |

Không trộn tiếng Việt không dấu và tiếng Anh trong cùng một public API; team nên chọn ngôn ngữ code thống nhất (ví dụ tên biến tiếng Anh, tài liệu tiếng Việt).

### 5.3. Quy tắc dependency

```text
UI Component  →  Angular Service  →  REST API
Route         →  Controller        →  Service  →  Repository
```

Không import ngược: backend repository không được phụ thuộc controller; Angular service không được tham chiếu một product-list component cụ thể.

## 6. Angular Components, Binding, Directives, Interaction

### 6.1. Component là đơn vị UI

Trong slide Chương I, Component được ghép từ **Class TypeScript + Template HTML + CSS + metadata `@Component`**. `selector` xác định custom tag, `templateUrl` trỏ đến giao diện, `styleUrl`/`styleUrls` đến style. Component khác có thể sử dụng tag trong template hoặc được render qua Router.

```typescript
import { Component } from '@angular/core';

@Component({
  selector: 'app-counter',
  standalone: false,
  templateUrl: './counter.component.html',
  styleUrl: './counter.component.css'
})
export class CounterComponent {
  title = 'Ví dụ binding';
  count = 0;
  disabled = false;

  increment(): void {
    this.count += 1;
  }
}
```

```html
<!-- counter.component.html -->
<h2>{{ title }}</h2>
<!-- {{ }}: interpolation; [ ]: property/class/style; ( ): event -->
<button [disabled]="disabled" [class.active]="count > 0"
        [style.opacity]="disabled ? 0.4 : 1" (click)="increment()">
  Đã bấm {{ count }} lần
</button>
```

### 6.2. Bảng binding chuẩn

| Binding | Cú pháp | Hướng | Dùng để |
|---|---|---|---|
| Interpolation | `{{ product.name }}` | TS → View | Render text |
| Property | `[disabled]="isSaving"` | TS → View | Thuộc tính DOM |
| Class | `[class.invalid]="hasError"` | TS → View | Bật/tắt CSS class |
| Style | `[style.width.%]="progress"` | TS → View | Giá trị CSS động |
| Event | `(click)="save()"` | View → TS | Tương tác người dùng |
| Two-way | `[(ngModel)]="name"` | Hai chiều | Nhập liệu dạng template-driven |

`[(ngModel)]` cần `FormsModule` trong NgModule (hoặc import ở Component standalone). Nên chọn `Class Binding` thay vì nhồi nhiều inline style nếu UI có nhiều trạng thái.

### 6.3. Hiển thị có điều kiện và lặp

Slide giới thiệu `*ngIf`, `*ngFor`, `[ngSwitch]`, đồng thời so sánh với control flow mới `@if`, `@for`, `@switch`. Với project Angular hiện đại, code nên thống nhất một lối viết; ví dụ:

```html
@if (products().length > 0) {
  <ul>
    @for (p of products(); track p._id) {
      <li>{{ p.name }} – {{ p.price }}</li>
    } @empty {
      <li>Chưa có sản phẩm</li>
    }
  </ul>
} @else {
  <p>Danh sách trống.</p>
}

@switch (status) {
  @case ('loading') { <p>Đang tải...</p> }
  @case ('error')   { <p>Có lỗi xảy ra.</p> }
  @default         { <p>Sẵn sàng.</p> }
}
```

`track p._id` giúp Angular xác định identity của từng dòng, tránh thay thế DOM không cần thiết. `@for` và `@if` không yêu cầu import `CommonModule` chỉ để dùng cú pháp control flow mới.

### 6.4. Trao đổi dữ liệu Parent–Child

Dùng `@Input()` khi **cha truyền dữ liệu xuống con**, `@Output()` và `EventEmitter` khi **con phát sự kiện lên cha**:

```typescript
// product-card.component.ts
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Product } from '../models/product.model';

@Component({
  selector: 'app-product-card', standalone: false,
  template: `
    <article>
      <strong>{{ product.name }}</strong>
      <button type="button" (click)="view.emit(product._id)">Chi tiết</button>
    </article>
  `
})
export class ProductCardComponent {
  @Input({ required: true }) product!: Product;
  @Output() view = new EventEmitter<string>();
}
```

```html
<app-product-card [product]="product" (view)="openDetail($event)" />
```

**Quyết định kiến trúc:** dữ liệu cha–con → Input/Output; nhiều màn hình không liên quan → Service/Signal; dữ liệu từ backend → HttpClient tại Service.

## 7. Angular Services, HTTP, RxJS và Signals

### 7.1. Vì sao cần Service?

Chương III bắt đầu từ tình trạng hai Component giữ hai bản sao dữ liệu sản phẩm, dẫn tới *Spaghetti State*. Service giúp gom logic và thống nhất nguồn dữ liệu. `@Injectable({ providedIn: 'root' })` đăng ký Service với DI.

```typescript
// core/services/product-api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { Product, CreateProductDto } from '../../features/products/models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductApiService {
  private readonly url = '/api/products';

  constructor(private readonly http: HttpClient) {}

  list(): Observable<Product[]> {
    return this.http.get<Product[]>(this.url).pipe(
      catchError(err => throwError(() => new Error(
        err.status === 0 ? 'Không thể kết nối máy chủ' : 'Không tải được sản phẩm'
      )))
    );
  }

  detail(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.url}/${encodeURIComponent(id)}`);
  }

  create(input: CreateProductDto): Observable<Product> {
    return this.http.post<Product>(this.url, input, { withCredentials: true });
  }

  update(id: string, input: CreateProductDto): Observable<Product> {
    return this.http.put<Product>(`${this.url}/${encodeURIComponent(id)}`, input,
      { withCredentials: true });
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${encodeURIComponent(id)}`,
      { withCredentials: true });
  }
}
```

Angular `HttpClient` mặc định tự parse JSON nếu nhận response JSON: **không `JSON.parse()` lần nữa**, trừ khi cố tình đặt `responseType: 'text'` như ví dụ đặc thù trong slide. Observable từ `HttpClient` phát ra khi request hoàn tất; thực hiện request thông qua `subscribe`, `async` pipe hoặc kỹ thuật reactive phù hợp.

### 7.2. Sử dụng Signal để quản lý UI state

```typescript
// features/products/product-list/product-list.component.ts
import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Product } from '../models/product.model';
import { ProductApiService } from '../../../core/services/product-api.service';

@Component({
  selector: 'app-product-list', standalone: false,
  templateUrl: './product-list.component.html'
})
export class ProductListComponent implements OnInit {
  readonly products = signal<Product[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');

  constructor(
    private readonly api: ProductApiService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.api.list().subscribe({
      next: data => {
        this.products.set(data);
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message);
        this.loading.set(false);
      }
    });
  }

  openDetail(id: string): void {
    this.router.navigate(['/products', id]);
  }
}
```

```html
<!-- product-list.component.html -->
<h1>Danh sách sản phẩm</h1>
@if (loading()) {
  <p>Đang tải dữ liệu...</p>
} @else if (error()) {
  <p role="alert">{{ error() }}</p>
} @else {
  <table>
    <thead><tr><th>Tên</th><th>Giá</th><th>Chi tiết</th></tr></thead>
    <tbody>
      @for (p of products(); track p._id) {
        <tr>
          <td>{{ p.name }}</td>
          <td>{{ p.price }}</td>
          <td><button type="button" (click)="openDetail(p._id)">Xem</button></td>
        </tr>
      } @empty {
        <tr><td colspan="3">Chưa có dữ liệu</td></tr>
      }
    </tbody>
  </table>
}
```

`signal<T>(initialValue)` là reactive state; khi render cần **gọi `products()`** để lấy giá trị. `.set(data)` thay state; `.update(fn)` tính state tiếp theo. Với luồng thay đổi liên tục hoặc subscription dài hạn, quản lý lifecycle bằng `takeUntilDestroyed()` hoặc dùng `async` pipe; ví dụ HTTP một lần ở trên hoàn tất sau response.

### 7.3. Cấu hình HttpClient, proxy

Nếu project NgModule có sẵn bootstrap kiểu module, có thể cấu hình:

```typescript
// Trong AppModule (file root theo tên CLI)
import { provideHttpClient } from '@angular/common/http';

@NgModule({
  // declarations, imports, bootstrap ...
  providers: [provideHttpClient()]
})
export class AppModule {}
```

Một số bản Angular mới đã có HttpClient mặc định; khai báo trên vẫn rõ ràng và phù hợp khi muốn cấu hình interceptor. Không copy nguyên đoạn `@NgModule` rời rạc này đè lên module hiện có: **ghép `providers` vào metadata sẵn có**.

Tạo `my-app/proxy.conf.json`:

```json
{
  "/api": {
    "target": "http://localhost:3000",
    "secure": false,
    "changeOrigin": true
  }
}
```

```bash
ng serve --proxy-config proxy.conf.json --open
```

Client gọi `/api/products`, proxy dev chuyển sang `http://localhost:3000/api/products`. Proxy là **cấu hình môi trường phát triển**, không tự giải quyết mọi vấn đề CORS trong production. Nếu frontend và backend ở hai origin khác nhau, cần chính sách CORS đúng ở backend.

## 8. Routing, phân quyền và Lazy Loading

### 8.1. Các khái niệm

- **SPA Router:** ánh xạ URL vào Angular Component, không cần tải lại toàn bộ HTML.
- **`router-outlet`:** vị trí gắn Component của route hiện tại.
- **`routerLink`:** điều hướng declarative qua template.
- **`Router`:** điều hướng bằng TypeScript (`navigate()`).
- **`ActivatedRoute`:** đọc `params`, `queryParams`, fragment của route hiện tại.
- **Redirect / `**`:** đường dẫn mặc định và Not Found.
- **Nested routes:** Component cha có `router-outlet` của riêng mình.
- **Lazy loading:** chỉ tải feature khi điều hướng tới nó.

### 8.2. Khai báo route cơ bản

```typescript
// app-routing.module.ts (hoặc app-routing-module.ts tùy CLI)
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProductListComponent } from './features/products/product-list/product-list.component';
import { ProductDetailComponent } from './features/products/product-detail/product-detail.component';
import { ProductFormComponent } from './features/products/product-form/product-form.component';
import { LoginComponent } from './features/auth/login/login.component';
import { authGuard } from './core/guards/auth.guard';

const routes: Routes = [
  { path: '', redirectTo: 'products', pathMatch: 'full' },
  { path: 'products', component: ProductListComponent },
  { path: 'products/new', component: ProductFormComponent, canActivate: [authGuard] },
  { path: 'products/:id', component: ProductDetailComponent },
  { path: 'login', component: LoginComponent },
  { path: '**', redirectTo: 'products' }
];

@NgModule({ imports: [RouterModule.forRoot(routes)], exports: [RouterModule] })
export class AppRoutingModule {}
```

**Lưu ý thứ tự:** `products/new` phải đứng trước `products/:id`, nếu không `new` có thể bị hiểu là giá trị của `:id`.

Template root:

```html
<nav>
  <a routerLink="/products">Sản phẩm</a>
  <a routerLink="/products/new">Thêm mới</a>
  <a routerLink="/login">Đăng nhập</a>
</nav>
<router-outlet />
```

### 8.2a. Đăng ký các Components vào AppModule

Khi dùng NgModule, mọi Component không phải standalone cần nằm trong `declarations` của đúng NgModule. Ví dụ AppModule hoàn chỉnh theo file name convention 2016 ở mục 4:

```typescript
// src/app/app.module.ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { ProductListComponent } from './features/products/product-list/product-list.component';
import { ProductDetailComponent } from './features/products/product-detail/product-detail.component';
import { ProductFormComponent } from './features/products/product-form/product-form.component';
import { LoginComponent } from './features/auth/login/login.component';

@NgModule({
  declarations: [
    AppComponent, ProductListComponent, ProductDetailComponent,
    ProductFormComponent, LoginComponent
  ],
  imports: [BrowserModule, AppRoutingModule, FormsModule, ReactiveFormsModule],
  providers: [provideHttpClient()],
  bootstrap: [AppComponent]
})
export class AppModule {}
```

Bảo đảm các Component trên đã được tạo bằng CLI và khai báo `standalone: false`. Nếu một Component thuộc *feature module* lazy-loaded thì khai báo tại **feature module**, không khai báo lặp ở AppModule. Trong `src/app/app.component.html` đặt thanh điều hướng và `<router-outlet />` như mẫu ở trên.

### 8.3. Route params, query params, slug

```typescript
// Khi đã vào /products/:id
const id = this.route.snapshot.paramMap.get('id');

// Điều hướng từ danh sách
this.router.navigate(['/products', product._id]);

// URL như /products?keyword=shirt&page=2
const keyword = this.route.snapshot.queryParamMap.get('keyword') ?? '';
const page = Number(this.route.snapshot.queryParamMap.get('page') ?? '1');
```

Nếu component được tái sử dụng và tham số có thể đổi **mà instance không bị tạo lại**, nên theo dõi `this.route.paramMap`/`queryParamMap` bằng Observable thay cho `snapshot` đơn thuần. Với slug như `ao-so-mi-nam-p123`, có thể tách ID qua regex `/-p(\d+)$/`. Khi dùng MongoDB `ObjectId` chuỗi hex, cần quy ước slug khác hoặc lưu một product ID công khai riêng; không áp dụng máy móc `parseInt()` của ví dụ product số trong slide.

**SEO:** URL thân thiện chỉ là một yếu tố; SEO còn liên quan metadata, canonical URL, nội dung render/crawl và cấu hình SSR/prerender nếu phù hợp. Việc dùng slug không tự động đảm bảo SEO tốt.

Ví dụ Component chi tiết tương ứng với route `/products/:id`:

```typescript
// product-detail.component.ts
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Product } from '../models/product.model';
import { ProductApiService } from '../../../core/services/product-api.service';

@Component({
  selector: 'app-product-detail', standalone: false,
  templateUrl: './product-detail.component.html'
})
export class ProductDetailComponent implements OnInit {
  readonly product = signal<Product | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  private readonly destroyRef = inject(DestroyRef);

  constructor(private readonly route: ActivatedRoute,
              private readonly api: ProductApiService) {}

  ngOnInit(): void {
    this.route.paramMap.pipe(
      switchMap(params => {
        this.loading.set(true);
        this.error.set('');
        return this.api.detail(params.get('id') ?? '');
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: product => {
        this.product.set(product);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Không tìm thấy hoặc không tải được sản phẩm');
        this.loading.set(false);
      }
    });
  }
}
```

```html
<!-- product-detail.component.html -->
@if (loading()) {
  <p>Đang tải...</p>
} @else if (error()) {
  <p role="alert">{{ error() }}</p>
} @else if (product(); as p) {
  <h1>{{ p.name }}</h1>
  <p>Mã: {{ p._id }}</p>
  <p>Giá: {{ p.price }}</p>
  <p>Mô tả: {{ p.description }}</p>
}
<a routerLink="/products">Quay về danh sách</a>
```

`switchMap()` hữu ích khi route ID thay đổi liên tục: request cũ bị hủy đăng ký nếu request mới đến. Khi request lỗi và Observable kết thúc, component nên có cơ chế retry/reload nếu cần tiếp tục theo dõi ID; demo trên chỉ minh họa một vòng truy xuất thông thường.

### 8.4. Nested route và Lazy Loading

```typescript
// Ví dụ khái niệm: AdminLayoutComponent phải có <router-outlet />.
{
  path: 'admin',
  component: AdminLayoutComponent,
  children: [
    { path: 'products', component: AdminProductComponent },
    { path: 'orders', component: AdminOrdersComponent }
  ]
}

// Khi chia feature thành NgModule riêng:
{
  path: 'reports',
  loadChildren: () => import('./features/reports/reports.module')
    .then(m => m.ReportsModule)
}
```

Hai ví dụ này là **mẫu mở rộng riêng**, chỉ chạy khi đã tạo đầy đủ component/module được nhắc tới. Lazy loading giúp giảm mã tải ban đầu, nhưng phải đo hiệu năng thật; không tự động cam kết cải thiện một chỉ số cụ thể.

### 8.5. Functional Auth Guard

```typescript
// core/guards/auth.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.me().pipe(
    map(() => true),
    catchError(() => of(router.parseUrl('/login')))
  );
};
```

Guard kiểm tra session hiện có bằng backend thay vì dựa vào biến cục bộ mất đi sau refresh. **Backend vẫn phải trả 401/403** cho API cần quyền; không dựa riêng vào Guard.

## 9. Form và kiểm tra dữ liệu

### 9.1. Chọn kỹ thuật

| Tiêu chí | Template-driven | Reactive Forms |
|---|---|---|
| Trọng tâm | HTML + `ngModel`, `ngForm` | TypeScript + `FormGroup`, `FormControl` |
| Phù hợp | Form nhỏ, quy tắc đơn giản | Form nghiệp vụ phức tạp, nhiều điều kiện |
| Module cần | `FormsModule` | `ReactiveFormsModule` |
| Unit test | Có thể nhưng kém tách biệt hơn | Thuận lợi vì logic ở TS |
| Cross-field | Cần phối hợp cấp form | Validator cấp `FormGroup` rất tự nhiên |

### 9.2. Template-driven Form

```html
<form #courseForm="ngForm" (ngSubmit)="submitCourse()">
  <label for="email">Email</label>
  <input id="email" name="email" type="email"
         [(ngModel)]="courseModel.email"
         #email="ngModel" required email />
  @if (email.invalid && (email.touched || courseForm.submitted)) {
    <p role="alert">Vui lòng nhập email hợp lệ.</p>
  }
  <button type="submit" [disabled]="courseForm.invalid">Đăng ký</button>
</form>
```

```typescript
// Thuộc tính và handler tối thiểu cần có trong Component
courseModel = { email: '' };
submitCourse(): void {
  console.log(this.courseModel); // thay bằng Service khi triển khai thật
}
```

Với `ngModel` nằm trong `<form>`, mỗi control cần `name` thích hợp. Trạng thái `touched/untouched`, `dirty/pristine`, `valid/invalid` dùng để quyết định khi nào thông báo lỗi xuất hiện.

### 9.3. Reactive Form sản phẩm (khuyên dùng cho CRUD)

```typescript
// product-form.component.ts
import { Component, signal } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ProductApiService } from '../../../core/services/product-api.service';

@Component({
  selector: 'app-product-form', standalone: false,
  templateUrl: './product-form.component.html'
})
export class ProductFormComponent {
  readonly error = signal('');
  readonly saving = signal(false);

  readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3)]
    }),
    price: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0)]
    }),
    description: new FormControl('', { nonNullable: true })
  });

  constructor(private readonly api: ProductApiService,
              private readonly router: Router) {}

  onSubmit(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.error.set('');
    this.api.create(this.form.getRawValue()).subscribe({
      next: () => this.router.navigate(['/products']),
      error: () => {
        this.error.set('Không lưu được sản phẩm');
        this.saving.set(false);
      }
    });
  }
}
```

```html
<form [formGroup]="form" (ngSubmit)="onSubmit()">
  <label for="name">Tên sản phẩm</label>
  <input id="name" formControlName="name" />
  @if (form.controls.name.invalid && form.controls.name.touched) {
    <small role="alert">Tên phải có ít nhất 3 ký tự.</small>
  }

  <label for="price">Giá</label>
  <input id="price" type="number" formControlName="price" />
  @if (form.controls.price.invalid && form.controls.price.touched) {
    <small role="alert">Giá không được âm.</small>
  }

  <label for="description">Mô tả</label>
  <textarea id="description" formControlName="description"></textarea>
  @if (error()) { <p role="alert">{{ error() }}</p> }
  <button type="submit" [disabled]="saving()">
    {{ saving() ? 'Đang lưu...' : 'Lưu' }}
  </button>
</form>
```

Khi triển khai form cập nhật, gọi `detail(id)` để `patchValue()` rồi sử dụng `api.update(id, form.getRawValue())` thay cho `api.create(...)`. Với form phức tạp, nên tách Form Component tái sử dụng hoặc use-case riêng để tránh một component xử lý quá nhiều chế độ.

### 9.4. Custom Validation và Cross-field Validation

```typescript
import { AbstractControl, ValidationErrors } from '@angular/forms';

// Gắn cho FormControl
export function noSpecialCharacters(control: AbstractControl): ValidationErrors | null {
  const value = String(control.value ?? '');
  return /^[\p{L}\p{N} .'-]*$/u.test(value) ? null : { invalidCharacters: true };
}

// Gắn cho FormGroup gồm password và confirmPassword
export function passwordMatch(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return password === confirm ? null : { passwordMismatch: true };
}
```

Cross-field validator cần ở cấp FormGroup vì phải xem hai trường. Validator client tăng UX, **không thay thế validation trên server**.

## 10. RESTful API và backend theo lớp

### 10.1. REST và hợp đồng API

Chương VI trình bày MVC, nguyên lý Resource và các HTTP Method. Với dự án ví dụ:

| Method | URL | Mục đích | Thành công | Lỗi cần xét |
|---|---|---|---|---|
| GET | `/api/products` | Danh sách | 200 + `Product[]` | 500 |
| GET | `/api/products/:id` | Chi tiết | 200 + `Product` | 400, 404 |
| POST | `/api/products` | Tạo mới | 201 + `Product` | 400, 401, 403 |
| PUT | `/api/products/:id` | Cập nhật | 200 + `Product` | 400, 401, 403, 404 |
| DELETE | `/api/products/:id` | Xóa | 204 không body | 400, 401, 403, 404 |
| POST | `/api/auth/register` | Đăng ký | 201 | 400, 409 |
| POST | `/api/auth/login` | Đăng nhập | 200 + user công khai | 401 |
| GET | `/api/auth/me` | Lấy người đang đăng nhập | 200 + user | 401 |
| POST | `/api/auth/logout` | Thoát phiên | 204 | 500 |

**Request JSON để tạo sản phẩm**:

```json
{
  "name": "Áo sơ mi Oxford",
  "price": 350000,
  "description": "Chất liệu cotton"
}
```

**Response JSON**:

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Áo sơ mi Oxford",
  "price": 350000,
  "description": "Chất liệu cotton"
}
```

**Định dạng lỗi thống nhất (đề xuất)**:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Tên sản phẩm không hợp lệ"
  }
}
```

### 10.2. Kết nối MongoDB trước khi nhận request

```javascript
// src/config/db.js
const { MongoClient } = require('mongodb');

let client;
let database;

async function connectToDb() {
  client = new MongoClient(process.env.MONGO_URI);
  await client.connect();
  database = client.db(process.env.MONGO_DB || 'angular_dev');
  return database;
}

function getDb() {
  if (!database) throw new Error('Database has not connected');
  return database;
}

module.exports = { connectToDb, getDb };
```

```javascript
// src/common/app-error.js
class AppError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}
module.exports = { AppError };
```

```javascript
// src/common/async-handler.js
module.exports = handler => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);
```

```javascript
// src/common/error-handler.js
const { AppError } = require('./app-error');

function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  if (!(err instanceof AppError)) console.error(err);
  const status = err instanceof AppError ? err.status : 500;
  res.status(status).json({
    error: {
      code: err instanceof AppError ? err.code : 'INTERNAL_ERROR',
      message: err instanceof AppError ? err.message : 'Lỗi hệ thống'
    }
  });
}
module.exports = { errorHandler };
```

### 10.3. Repository – tập trung thao tác DB

```javascript
// src/modules/products/product.repository.js
const { ObjectId } = require('mongodb');

class MongoProductRepository {
  constructor(collection) {
    this.collection = collection;
  }

  findAll() {
    return this.collection.find({}).sort({ _id: -1 }).toArray();
  }

  findById(id) {
    return this.collection.findOne({ _id: new ObjectId(id) });
  }

  async create(input) {
    const result = await this.collection.insertOne(input);
    return this.findById(result.insertedId.toString());
  }

  async update(id, input) {
    await this.collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: input }
    );
    return this.findById(id);
  }

  async remove(id) {
    return this.collection.deleteOne({ _id: new ObjectId(id) });
  }
}

module.exports = { MongoProductRepository };
```

### 10.4. Service – kiểm tra nghiệp vụ

```javascript
// src/modules/products/product.service.js
const { ObjectId } = require('mongodb');
const { AppError } = require('../../common/app-error');

class ProductService {
  constructor(repository) {
    this.repository = repository;
  }

  list() {
    return this.repository.findAll();
  }

  async detail(id) {
    this.validateId(id);
    const product = await this.repository.findById(id);
    if (!product) throw new AppError(404, 'NOT_FOUND', 'Không tìm thấy sản phẩm');
    return product;
  }

  validateInput(input) {
    if (!input || typeof input.name !== 'string' ||
        input.name.trim().length < 3 ||
        typeof input.price !== 'number' || !Number.isFinite(input.price) ||
        input.price < 0 ||
        (input.description !== undefined && typeof input.description !== 'string')) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Dữ liệu sản phẩm không hợp lệ');
    }
    return {
      name: input.name.trim(),
      price: input.price,
      description: input.description || ''
    };
  }

  validateId(id) {
    if (!ObjectId.isValid(id) || !/^[a-f\d]{24}$/i.test(id)) {
      throw new AppError(400, 'INVALID_ID', 'Product ID không hợp lệ');
    }
  }

  create(input) {
    return this.repository.create(this.validateInput(input));
  }

  async update(id, input) {
    await this.detail(id); // đồng thời kiểm tra ID và sự tồn tại
    return this.repository.update(id, this.validateInput(input));
  }

  async remove(id) {
    await this.detail(id);
    await this.repository.remove(id);
  }
}

module.exports = { ProductService };
```

### 10.5. Controller + Routes – chỉ xử lý HTTP

```javascript
// src/modules/products/product.controller.js
class ProductController {
  constructor(service) {
    this.service = service;
  }

  list = async (req, res) => res.json(await this.service.list());
  detail = async (req, res) => res.json(await this.service.detail(req.params.id));

  create = async (req, res) => {
    const created = await this.service.create(req.body);
    res.status(201).json(created);
  };

  update = async (req, res) =>
    res.json(await this.service.update(req.params.id, req.body));

  remove = async (req, res) => {
    await this.service.remove(req.params.id);
    res.status(204).end();
  };
}

module.exports = { ProductController };
```

```javascript
// src/modules/products/product.routes.js
const { Router } = require('express');
const asyncHandler = require('../../common/async-handler');
const { MongoProductRepository } = require('./product.repository');
const { ProductService } = require('./product.service');
const { ProductController } = require('./product.controller');

function requireAuth(req, res, next) {
  if (!req.session?.user) {
    return res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Cần đăng nhập' }
    });
  }
  next();
}

function productRoutes(collection) {
  const router = Router();
  const controller = new ProductController(
    new ProductService(new MongoProductRepository(collection))
  );

  router.get('/', asyncHandler(controller.list));
  router.get('/:id', asyncHandler(controller.detail));
  router.post('/', requireAuth, asyncHandler(controller.create));
  router.put('/:id', requireAuth, asyncHandler(controller.update));
  router.delete('/:id', requireAuth, asyncHandler(controller.remove));
  return router;
}

module.exports = { productRoutes };
```

Trong bản minh họa, mọi tài khoản đăng nhập có thể ghi dữ liệu. **Dự án thật** cần thêm phân quyền theo role/owner, audit log và giới hạn thao tác theo yêu cầu nghiệp vụ.

### 10.6. Khởi tạo Express app

```javascript
// src/server.js
require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const session = require('express-session');
const { connectToDb, getDb } = require('./config/db');
const { productRoutes } = require('./modules/products/product.routes');
const { authRoutes } = require('./modules/auth/auth.routes');
const { errorHandler } = require('./common/error-handler');

async function start() {
  if (!process.env.MONGO_URI || !process.env.SESSION_SECRET) {
    throw new Error('Missing MONGO_URI or SESSION_SECRET');
  }
  await connectToDb();
  const app = express();
  app.use(morgan('dev'));
  app.use(express.json({ limit: '1mb' }));
  app.use(cors({ origin: 'http://localhost:4200', credentials: true }));

  app.use(session({
    name: 'sid',
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 1000
    }
    // Chỉ để học/làm local; production phải cấu hình session store bền vững.
  }));

  app.get('/api/health', (req, res) => res.json({ ok: true }));
  app.use('/api/auth', authRoutes(getDb().collection('users')));
  app.use('/api/products', productRoutes(getDb().collection('products')));
  app.use((req, res) => res.status(404).json({
    error: { code: 'NOT_FOUND', message: 'Endpoint không tồn tại' }
  }));
  app.use(errorHandler);

  const port = Number(process.env.PORT || 3000);
  app.listen(port, () => console.log(`API listening on ${port}`));
}

start().catch(err => {
  console.error('Server startup failed:', err);
  process.exitCode = 1;
});
```

Chạy backend:

```bash
cd my-server
npm run dev
# GET http://localhost:3000/api/health
```

**Giới hạn của ví dụ:** `express-session` dùng `MemoryStore` mặc định, chỉ phù hợp học/local. Production cần session store chung, quản lý secret/HTTPS/reverse proxy và CSRF phù hợp. Nội dung bảo mật chi tiết tại mục 12.

## 11. MongoDB, truy vấn và CRUD

### 11.1. Từ dữ liệu quan hệ sang document

| SQL | MongoDB |
|---|---|
| Database | Database |
| Table | Collection |
| Row | Document |
| Primary key | `_id` mặc định |
| Bảng liên kết / JOIN | Embedded document hoặc reference; có thể dùng `$lookup` |

MongoDB dùng **BSON** để lưu document. Không kết luận MongoDB luôn nhanh hơn SQL hoặc “không có JOIN”: hiệu năng phụ thuộc mô hình dữ liệu, index, cardinality, truy vấn và hạ tầng.

### 11.2. Tạo database và dữ liệu thử

- Mở MongoDB Compass và kết nối `mongodb://127.0.0.1:27017`.
- Dùng DB `angular_dev` với `products`, `users` cho handbook.
- Slide Chương VII sử dụng DB `FashionData`, collection `Fashion` và file dataset `Fashion.json`: có thể làm tương tự nếu cần thực hành sát slide.
- MongoDB có thể tạo collection khi ghi document đầu tiên; Compass cũng cho phép tạo thủ công.

Mongo shell mẫu:

```javascript
use angular_dev

db.products.insertOne({
  name: 'Áo sơ mi Oxford', price: 350000, description: 'Cotton'
})

db.products.find({ price: { $gte: 100000 } })

db.products.createIndex({ name: 1 })
```

Tạo index dựa trên truy vấn thật; không tạo index vô hạn vì chúng tăng chi phí ghi/dung lượng. Chỉ bật sharding khi đã có nhu cầu và chọn **shard key** phù hợp. Slide giải thích `mongos`, config servers, shards và truy vấn **scatter-gather** khi filter không nhắm shard key.

### 11.3. Chú ý với ObjectId và dữ liệu

- `_id` ở Mongo là `ObjectId`; Angular nhận giá trị qua JSON dưới dạng **string**.
- Trước `new ObjectId(id)` phải kiểm tra ID hợp lệ để tránh trả lỗi 500 cho input xấu.
- `updateOne()` có thể `matchedCount = 0`; service/controller nên phân biệt 404 với thao tác thành công.
- Không nhận toàn bộ object client rồi đưa thẳng vào `$set` khi chưa whitelist trường được chỉnh sửa.
- Thêm pagination/filter/sort khi dữ liệu lớn, thay vì trả vô hạn kết quả trong một request.

## 12. Cookie, Session và đăng nhập

### 12.1. Bản chất

**HTTP stateless:** mỗi request tự nó độc lập. **Cookie** là cơ chế để browser lưu và gửi kèm dữ liệu nhỏ theo domain/path/policy. **Session** là trạng thái của một phiên được lưu ở server (khi dùng `express-session`, cookie chỉ chứa mã phiên). Đây là cách xây dựng hệ thống đăng nhập **stateful** trên HTTP; không đồng nhất session-stateful API với REST stateless thuần túy.

| Tiêu chí | Cookie | Server-side Session |
|---|---|---|
| Nơi lưu nội dung | Trình duyệt | Server hoặc session store |
| Thứ gửi trong request | Cookie theo quy tắc browser | Cookie chứa session ID |
| Ví dụ | Ngôn ngữ, theme, remember username | `userId`, role, giỏ hàng tạm |
| Rủi ro chính | XSS/CSRF/phạm vi cookie sai | Session hijacking/fixation, session store, CSRF |

**Cookie quan trọng:** `HttpOnly` (JS không đọc), `Secure` (HTTPS), `SameSite`, `Path`, `Max-Age`/`Expires`. Không đặt password, token nhạy cảm hoặc quyền thực tế vào cookie có thể sửa từ client. Cookie nhớ username **không phải bằng chứng đã xác thực**.

### 12.2. Login an toàn hơn ví dụ học tập

Slide minh họa so sánh trực tiếp username/password trong MongoDB và có cookie `httpOnly: false`, `secure: false` để dễ quan sát. **Chỉ xem đây là demo lớp học, không dùng để triển khai production.** Mẫu đề xuất sau hash password và lưu identity trong server session.

```javascript
// src/modules/auth/auth.routes.js
const { Router } = require('express');
const bcrypt = require('bcryptjs');
const asyncHandler = require('../../common/async-handler');
const { AppError } = require('../../common/app-error');

function authRoutes(users) {
  const router = Router();

  router.post('/register', asyncHandler(async (req, res) => {
    const username = String(req.body?.username ?? '').trim();
    const password = String(req.body?.password ?? '');
    if (username.length < 3 || password.length < 12) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Tên >= 3, mật khẩu >= 12 ký tự');
    }
    if (await users.findOne({ username })) {
      throw new AppError(409, 'USERNAME_EXISTS', 'Tài khoản đã tồn tại');
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const result = await users.insertOne({ username, passwordHash, role: 'user' });
    res.status(201).json({ id: result.insertedId.toString(), username });
  }));

  router.post('/login', asyncHandler(async (req, res, next) => {
    const username = String(req.body?.username ?? '');
    const password = String(req.body?.password ?? '');
    const user = await users.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Thông tin đăng nhập không đúng');
    }
    req.session.regenerate(err => {
      if (err) return next(err);
      req.session.user = {
        id: user._id.toString(), username: user.username, role: user.role
      };
      res.json({ user: req.session.user });
    });
  }));

  router.get('/me', (req, res) => {
    if (!req.session?.user) return res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Chưa đăng nhập' }
    });
    res.json({ user: req.session.user });
  });

  router.post('/logout', (req, res, next) => {
    if (!req.session) return res.status(204).end();
    req.session.destroy(err => {
      if (err) return next(err);
      res.clearCookie('sid', { path: '/' });
      res.status(204).end();
    });
  });

  return router;
}

module.exports = { authRoutes };
```

**Nâng cấp production:** unique index cho `users.username`; giới hạn brute force/rate limit; kiểm tra dữ liệu bằng schema validator; CSRF protection phù hợp; HTTPS; session store (Redis/Mongo-compatible); xử lý trusted proxy; luân chuyển secret; phân quyền role/ownership. Đăng ký không nên phát sinh session đăng nhập nếu nghiệp vụ không yêu cầu.

### 12.3. Angular AuthService

```typescript
// core/services/auth.service.ts
import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface AuthUser { id: string; username: string; role: string; }
export interface AuthResponse { user: AuthUser; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly currentUser = signal<AuthUser | null>(null);

  constructor(private readonly http: HttpClient) {}

  login(username: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/login', { username, password },
      { withCredentials: true }).pipe(
        tap(response => this.currentUser.set(response.user))
      );
  }

  me(): Observable<AuthResponse> {
    return this.http.get<AuthResponse>('/api/auth/me',
      { withCredentials: true }).pipe(
        tap(response => this.currentUser.set(response.user))
      );
  }

  logout(): Observable<void> {
    return this.http.post<void>('/api/auth/logout', {},
      { withCredentials: true }).pipe(
        tap(() => this.currentUser.set(null))
      );
  }
}
```

Client chỉ lưu thông tin user hiển thị trong Signal; **mật khẩu không được lưu vào Signal dùng chung, localStorage hay cookie**. Mất state do refresh có thể phục hồi bằng `GET /api/auth/me`. Nếu session hết hạn, backend trả 401 để frontend đưa về trang đăng nhập.

Mẫu màn hình Login tối thiểu cho route đã khai báo ở mục 8:

```typescript
// features/auth/login/login.component.ts
import { Component, signal } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login', standalone: false,
  templateUrl: './login.component.html'
})
export class LoginComponent {
  readonly error = signal('');
  readonly loading = signal(false);
  readonly form = new FormGroup({
    username: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] })
  });

  constructor(private readonly auth: AuthService,
              private readonly router: Router) {}

  submit(): void {
    if (this.form.invalid || this.loading()) return;
    this.loading.set(true);
    this.error.set('');
    const { username, password } = this.form.getRawValue();
    this.auth.login(username, password).subscribe({
      next: () => this.router.navigate(['/products']),
      error: () => {
        this.loading.set(false);
        this.error.set('Tài khoản hoặc mật khẩu không đúng');
      }
    });
  }
}
```

```html
<!-- features/auth/login/login.component.html -->
<form [formGroup]="form" (ngSubmit)="submit()">
  <label for="username">Tài khoản</label>
  <input id="username" formControlName="username" autocomplete="username" />
  <label for="password">Mật khẩu</label>
  <input id="password" type="password" formControlName="password"
         autocomplete="current-password" />
  @if (error()) { <p role="alert">{{ error() }}</p> }
  <button type="submit" [disabled]="loading() || form.invalid">
    Đăng nhập
  </button>
</form>
```

### 12.4. Session giỏ hàng theo slide

Nội dung cuối Chương VIII minh họa giỏ hàng `req.session.cart`: khách chưa đăng nhập thêm/bớt sản phẩm; đến khi checkout/đăng nhập mới ghi đơn hàng vào DB. Chỉ lưu `productId` và `quantity` trong session, **không tin `price` từ client** khi tính thanh toán.

```javascript
// Ví dụ endpoint thêm sản phẩm vào session, rút gọn
app.post('/api/cart/items', (req, res) => {
  const productId = String(req.body.productId ?? '');
  const quantity = Number(req.body.quantity);
  if (!/^[a-f\d]{24}$/i.test(productId) || !Number.isInteger(quantity) ||
      quantity < 1 || quantity > 100) {
    return res.status(400).json({ error: { code: 'INVALID_CART_ITEM' } });
  }
  req.session.cart ??= [];
  req.session.cart.push({ productId, quantity });
  res.status(201).json({ cart: req.session.cart });
});
```

Đây là đoạn mở rộng **chỉ minh họa**, phải đặt sau session middleware trong `server.js` nếu sử dụng. Dự án thật cần cộng dồn quantity, giới hạn kích thước session, chống gửi trùng, kiểm tra tồn kho/giá từ DB và xử lý checkout theo transaction phù hợp.

## 13. Upload file, ảnh và xử lý tài nguyên

Chương VI–VII có ví dụ tải ảnh của Book/Fashion qua Express và lưu trong `public/images`. Quy trình chuẩn:

1. Client tạo `FormData` từ file và các trường liên quan; dùng `HttpClient.post()`.
2. Backend dùng middleware multipart (`express-fileupload` như trong slide, hoặc giải pháp tương đương) để nhận file.
3. Kiểm tra quyền trước khi upload; đặt giới hạn dung lượng, loại file, đổi tên ngẫu nhiên an toàn, không tin vào tên file từ browser.
4. Lưu file ở storage phù hợp; DB chỉ giữ URL/path và metadata, không tự ý nhúng Base64 khổng lồ trong document.
5. Backend trả metadata/URL, frontend hiển thị ảnh bằng binding `[src]`.

```typescript
// Mẫu Angular (không tự đặt multipart Content-Type)
uploadImage(file: File) {
  const form = new FormData();
  form.append('image', file);
  return this.http.post<{ url: string }>('/api/uploads/images', form,
    { withCredentials: true });
}
```

**Bảo mật:** whitelist MIME type, xác minh magic bytes nếu có thể, chống path traversal, giới hạn request, quét nội dung theo rủi ro và không public file chứa dữ liệu nhạy cảm. Code upload ở slide mang tính thực hành, không mặc nhiên đáp ứng các kiểm soát trên.

## 14. Kịch bản lập trình một tính năng end-to-end

**Task: “Người quản trị thêm sản phẩm mới”**

1. **Hợp đồng:** frontend và backend thống nhất `POST /api/products`, `CreateProductDto`, 201/400/401/403.
2. **Model:** tạo `Product` và `CreateProductDto`; xác định `_id` dạng chuỗi từ JSON.
3. **Database:** Mongo `products` collection; không cho client tự gán `_id`.
4. **Repository:** implement `create(input)`; không lộ HTTP chi tiết xuống DB layer.
5. **Business Service:** validate `name`, `price`, whitelist `description`.
6. **Controller/Route:** map POST, kiểm tra session/role, trả 201.
7. **Postman:** thử 201 hợp lệ, 400 tên ngắn/giá âm, 401 khi chưa login.
8. **Angular Service:** `create(input): Observable<Product>`.
9. **Form:** Reactive Form, disable submit khi đang gửi để tránh double submit; hiển thị lỗi.
10. **Router:** route `/products/new` và sau submit chuyển tới `/products`.
11. **Review:** server vẫn validate khi bỏ qua Angular; refresh dữ liệu vẫn còn trong MongoDB.

```text
Acceptance criteria
[ ] User chưa login không thể POST dù gọi thẳng bằng Postman
[ ] User có quyền thêm sản phẩm nhận HTTP 201 và id hợp lệ
[ ] Dữ liệu sai trả HTTP 400 cùng error code, không ghi DB
[ ] Danh sách hiển thị dữ liệu vừa tạo sau khi reload
[ ] Lỗi mạng/API được hiển thị, không treo loading vô hạn
[ ] Không có password, Mongo URI hoặc secret trong frontend/Git
```

## 15. Kiểm thử, xử lý lỗi và chất lượng mã nguồn

### 15.1. Test API bằng cURL / Postman

```bash
curl http://localhost:3000/api/health
curl http://localhost:3000/api/products
curl -i http://localhost:3000/api/products/invalid-id
```

Đăng ký, đăng nhập và giữ cookie khi thử thủ công:

```bash
# Ví dụ bash/macOS/Linux; với PowerShell cần điều chỉnh quote.
curl -i -X POST http://localhost:3000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"username":"demo_user","password":"DemoPassword123!"}'

curl -i -c cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"demo_user","password":"DemoPassword123!"}'

curl -i -b cookies.txt -X POST http://localhost:3000/api/products \
  -H 'Content-Type: application/json' \
  -d '{"name":"Áo sơ mi Oxford","price":350000,"description":"Cotton"}'
```

`cookies.txt` trong ví dụ chứa thông tin phiên xác thực; chỉ dùng ở môi trường local, bảo vệ file và không commit lên Git. Nếu chạy lệnh đăng ký nhiều lần với cùng username, server trả `409` là đúng kỳ vọng.

### 15.2. Những trạng thái UI phải có

| Trạng thái | Hành vi kỳ vọng |
|---|---|
| Initial | Chưa vẽ dữ liệu sai/lỗi cũ |
| Loading | Có thông báo/progress và chống submit lặp |
| Success | Render dữ liệu đúng, điều hướng có chủ đích |
| Empty | Thông báo “Chưa có dữ liệu” |
| Validation error | Chỉ ra trường cần sửa, giữ dữ liệu đã nhập |
| Unauthorized | Đăng nhập lại hoặc thông báo rõ |
| Server/network error | Không kẹt spinner, có thông báo và khả năng thử lại |

### 15.3. Unit test nên viết cho đâu?

- `ProductService.validateInput()` (backend): kiểm tra tên, giá, type, whitelist.
- `MongoProductRepository`: kiểm thử tích hợp với test DB.
- `ProductApiService`: mock HTTP request/response, 200 và lỗi.
- Reactive Forms validators: kiểm tra `passwordMatch`, `noSpecialCharacters`.
- Auth: chưa đăng nhập → 401, đã đăng nhập → có quyền; logout làm session vô hiệu.

### 15.4. Anti-pattern cần tránh

| Không nên | Vì sao | Hướng sửa |
|---|---|---|
| Gọi `HttpClient` trong mọi Component | Logic API lặp và khó mock | API Service |
| Hardcode JSON sản phẩm ở hai View | Spaghetti State, không đồng bộ | Shared source + service |
| Trả 200 với mọi lỗi | API client không biết trạng thái thật | HTTP status rõ ràng |
| Lưu password dạng plain text | Rủi ro rò rỉ tài khoản | Hash bằng bcrypt/Argon2 |
| Dùng `req.body` để `$set` tất cả | Mass-assignment | DTO validation + whitelist |
| Tin Angular Guard thay quyền server | Client có thể bị sửa | Backend authorization |
| Để Mongo URI trong Angular | Lộ DB credential | DB chỉ ở server |
| Nuốt lỗi trong `catchError` | Debug khó, UI im lặng | Log phù hợp + thông báo + trạng thái an toàn |
| Lạm dụng `any` | Mất tính chặt chẽ TypeScript | Typed DTO/interface |
| Đọc cả collection không phân trang | Quá tải payload | Filter, pagination, index |

### 15.5. Checklist code review

- Tính nhất quán model ↔ DTO ↔ response đã bảo đảm chưa?
- Nguyên tắc SRP có bị vi phạm không? Có logic nào thuộc Service/Repository nhưng nằm ở Component/Controller?
- Có xử lý các lỗi 400/401/403/404/500 và lỗi network?
- Có **runtime validation** ở backend và sanitize/whitelist dữ liệu được lưu?
- `session cookie` có `HttpOnly`, `Secure`, `SameSite` phù hợp deployment không?
- Form có hỗ trợ keyboard, label, thông báo lỗi dễ đọc?
- Có dữ liệu bí mật trong commit, console log, error response, ảnh upload?
- Có test ít nhất cho luồng thành công và 2 luồng lỗi quan trọng?

## 16. Checklist dành cho nhóm dev

### 16.1. Khi nhận task mới

- [ ] Xác định feature, màn hình, quyền người dùng.
- [ ] Xác định data model, API contract, error contract.
- [ ] Chỉ rõ phần nào thuộc Component, Angular Service, Controller, Backend Service, Repository.
- [ ] Kiểm tra lại source chung trước khi tạo class/service mới.
- [ ] Thống nhất API mẫu trên Postman trước khi hai nhóm làm song song.

### 16.2. Khi viết frontend

- [ ] Các Component nhỏ, không chứa query Mongo hoặc hardcode endpoint rải rác.
- [ ] Binding đúng `[prop]`, `(event)`, `[(ngModel)]` / Reactive Form.
- [ ] Lặp danh sách có identity (`track id`).
- [ ] Có loading/empty/error state.
- [ ] Route, query param, path param xử lý được khi refresh hoặc truy cập trực tiếp.
- [ ] API service typed rõ ràng; không dùng `any` tràn lan.

### 16.3. Khi viết backend

- [ ] REST verb/status code đúng.
- [ ] Request body/params được validate server-side.
- [ ] Controller không query Mongo trực tiếp.
- [ ] Repository không viết response HTML/Express.
- [ ] Xử lý DB connection fail, duplicate, missing ObjectId.
- [ ] Authorization ở server, không dựa vào UI.
- [ ] Session store, cookie, credential, CORS/CSRF theo môi trường.

### 16.4. Trước khi merge/deploy

- [ ] `npm install` và scripts chạy được trong môi trường sạch.
- [ ] `ng build` thành công; test frontend/backend theo cấu hình dự án.
- [ ] `.env` được loại khỏi version control; có `.env.example`.
- [ ] API docs và README được cập nhật.
- [ ] Test theo acceptance criteria; đính kèm ảnh/log/kết quả Postman khi cần.
- [ ] Đã review security và migration/index khi thay đổi DB.

### 16.5. Mẫu mô tả pull request

```markdown
## Mục tiêu
Thêm tính năng ...

## Thay đổi chính
- Frontend: ...
- Backend: ...
- Database: ...

## API liên quan
- POST /api/...

## Cách kiểm thử
1. ...
2. ...

## Kết quả
- [ ] Success
- [ ] Validation error
- [ ] Unauthorized
- [ ] Empty/Network error

## Lưu ý triển khai
- Migration/env/config/rollback (nếu có): ...
```

## 17. Đối chiếu với slide và tài liệu tham khảo

### 17.1. Bản đồ kiến thức từ 09 bộ slide

| Slide nguồn | Nội dung đưa vào handbook | Mục tương ứng |
|---|---|---|
| 00 – Giới thiệu môn học | Mục tiêu Angular full-stack, công cụ học, REST/MongoDB | 1, 4 |
| Chương I – Giới thiệu Angular Framework | SPA, NgModule, Component, Service, Angular CLI và cấu trúc project | 2, 4, 5, 6 |
| Chương II – Các kỹ thuật lõi | Property/Class/Style/Event/Two-way Binding; directives; Parent–Child interaction | 6 |
| Chương III – Services | Spaghetti State, DI, HTTP, RxJS, Signal, catchError | 3, 7, 15 |
| Chương IV – Routing | RouterOutlet/Link, params, slug, query, redirect, nested routes, lazy load, guards | 8 |
| Chương V – FORM | Template-driven, Reactive Forms, validation, cross-field, post data | 9 |
| Chương VI – RESTful API | MVC, Express, nodemon, morgan, CRUD, external API, image upload | 10, 13 |
| Chương VII – MongoDB | NoSQL, collection/document, MongoDB, API CRUD, ObjectId, index/sharding | 11 |
| Chương VIII – Cookie và Session | Cookie attributes, AuthService, login, server session, giỏ hàng | 12 |

### 17.2. Các điểm cần đọc đúng ngữ cảnh khi chuyển từ slide sang dự án thật

1. **NgModule vs Standalone:** slide đi theo NgModule; tài liệu Angular hiện nay khuyến nghị Standalone cho dự án mới. Không trộn cấu hình hai kiểu bootstrap vô thức.
2. **Ví dụ thực hành vs bảo mật production:** dữ liệu user/password plain text và cookie thiếu cấu hình bảo mật trong ví dụ học là chưa đủ cho ứng dụng thật.
3. **Tối ưu performance:** Signal, lazy loading, NoSQL, index là công cụ; mức cải thiện cần đo trên hệ thống thực, không xem như cam kết tự động.
4. **SPA + SEO:** slug chỉ giải quyết URL thân thiện; phải xét render/metadata/indexability.
5. **Session vs REST stateless:** session giúp duy trì đăng nhập, nhưng tạo server-side state; không nên phát biểu rằng mọi session-based endpoint đều hoàn toàn stateless.
6. **OOP không đồng nghĩa mọi thứ đều là class:** interface, function validator, composable service và DI có vai trò riêng.
7. **Demo minh họa chưa phải production template:** ví dụ session store, upload, authentication và error contract trong handbook có các điều kiện bổ sung ghi rõ ở từng mục.

### 17.3. Tài liệu chính thức để kiểm tra khi nâng cấp phiên bản

- Angular CLI (`ng new`): <https://angular.dev/cli/new>
- Angular NgModules & lựa chọn Standalone: <https://angular.dev/guide/ngmodules>
- Angular HttpClient setup: <https://angular.dev/guide/http/setup>
- Angular Route Guards: <https://angular.dev/guide/routing/route-guards>
- Express session: <https://expressjs.com/en/resources/middleware/session.html>
- MongoDB Node.js Driver: <https://www.mongodb.com/docs/drivers/node/current/>

---

## Tóm tắt một trang cho developer

> **Trước khi code:** xác định feature → model/DTO → API contract → trách nhiệm từng lớp.  
> **Trong khi code Angular:** Component điều phối UI; Service gọi API; Binding/Signals phản ánh state; Forms validate tại client.  
> **Trong khi code backend:** Route gọi Controller → Service → Repository; validate ở server; HTTP status chuẩn; DB chỉ truy cập từ backend.  
> **Trước khi bàn giao:** kiểm tra authentication/authorization, dữ liệu lưu thật, loading/empty/error, test API và tài liệu vận hành.  
> **Nguyên tắc xuyên suốt:** *Cấu trúc rõ ràng – trách nhiệm độc lập – hợp đồng nhất quán – bảo mật từ server – dễ test và dễ bảo trì.*
