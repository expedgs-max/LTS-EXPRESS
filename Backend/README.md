# TawsilStar Multi-Service Platform

## 🔥 Table of Contents
1. [API Documentation](#api-documentation)
2. [WebSocket Documentation](#websocket-documentation)
3. [Data Models](#data-models)
4. [Core Features](#core-features)
5. [Decimal Handling](#decimal-handling)
6. [Technical Stack](#technical-stack)

---

## Technical Stack Overview

| Technology | Description | Key Features |
|------------|-------------|--------------|
| **Django** | High-level Python Web framework | - MVC architecture<br>- ORM support<br>- Built-in admin interface<br>- Security features (CSRF, XSS protection) |
| **REST API** | Architectural style for web services | - Stateless communication<br>- Resource-based URLs<br>- Standard HTTP methods<br>- JSON/XML responses |
| **JWT** | JSON Web Token authentication | - Token-based security<br>- Self-contained tokens<br>- Signature verification<br>- Expiration control |

---

## 📡 API Documentation

### Authentication

| Endpoint                | Method | Description                          | Permissions      | Parameters       | Request Body Example               | Response Example                           |
|-------------------------|--------|--------------------------------------|------------------|------------------|------------------------------------|--------------------------------------------|
| `/api/v1/login`         | POST   | Authenticate user and return JWT     | None             | `username`, `password` | `{"username":"user","password":"pass"}` | `{"access_token":"xyz", "refresh_token":"abc"}` |
| `/api/v1/logout`        | POST   | Invalidate refresh token             | IsAuthenticated  | `refresh_token`  | `{"refresh_token": "abc"}`         | `{"detail": "Logged out"}`                 |
| `/api/v1/decode/token`  | POST   | Decode JWT token                     | IsAuthenticated  | Header: `Authorization` | None                              | User data JSON                             |
| `/api/v1/resetpassword` | POST   | Send password reset email            | None             | `email`          | `{"email": "user@example.com"}`    | Success message                            |
| `/api/v1/user/changepassword` | POST | Reset password with token       | None             | `token`, `uid`, `new_password` | `{"token":"xyz", "uid":1, "new_password":"newpass"}` | Success message |

---

### User Management

#### User Operations
| Endpoint                | Method | Description                          | Permissions       | Parameters               | Response Example                   |
|-------------------------|--------|--------------------------------------|-------------------|--------------------------|------------------------------------|
| `/api/v1/users`         | GET    | List all users (filterable)          | Iscommerciale     | `role`, `wilaya`, `groupe` | Paginated user list                |
| `/api/v1/users/employer`| GET    | List administrative agents           | IsOwnerOrAdmin    | None                     | List of agents JSON                |
| `/api/v1/user`          | GET    | Get current user profile             | IsAuthenticated   | None                     | User details JSON                  |
| `/api/v1/user/update`   | PUT    | Update user profile                  | IsAuthenticated   | None                     | `{"first_name": "New Name"}`       |
| `/api/v1/user/add/groupe` | PATCH | Assign user to group              | IsCentreappel     | `id`, `groupe`           | Success message                    |

#### Role-Specific Endpoints
| Endpoint                      | Method | Description                          | Permissions       | Parameters       |
|-------------------------------|--------|--------------------------------------|-------------------|------------------|
| `/api/v1/users/chefbureau`    | GET    | List all bureau chiefs               | IsOwnerOrAdmin    | None             |
| `/api/v1/chefbureux/emplois`  | GET    | List agents in group                 | Ischefbureux      | `search`         |
| `/api/v1/account/desactiver`  | PATCH  | Deactivate account                   | Ischefbureux      | `id`             |

---

### Partner Management

#### Partner Operations
| Endpoint                          | Method | Description                          | Permissions       | Parameters       |
|-----------------------------------|--------|--------------------------------------|-------------------|------------------|
| `/api/v1/centreappel/parteners`   | GET    | List inactive partners               | Iscommerciale     | `search`         |
| `/api/v1/user/partener/registre`  | POST   | Register new partner                 | None              | Partner data     |
| `/api/v1/supervisseur/pertenneurs`| GET    | Filter partners                      | IssuperVisseur    | `wilaya`, `type_compte` |

#### Partner Actions
| Endpoint                          | Method | Description                          | Permissions       |
|-----------------------------------|--------|--------------------------------------|-------------------|
| `/api/v1/user/activate`           | PATCH  | Activate partner account             | IssuperVisseur    |
| `/api/v1/centre_appel/comentaire/add` | POST | Add partner comment             | IsCentreappel     |

---

### Course Management

| Endpoint                          | Method | Description                          | Permissions       | Parameters       |
|-----------------------------------|--------|--------------------------------------|-------------------|------------------|
| `/v1/course/partener/<id>/create` | POST   | Create new course                    | None              | Course details   |
| `/api/v1/vtc/courses`             | GET    | List all VTC courses                 | Isvtc             | `valide`, `search` |
| `/api/v1/user/courses`            | GET    | List courses by group                | IsAgentAdmin      | None             |

---

### Payment Management

| Endpoint                          | Method | Description                          | Permissions       | Parameters       |
|-----------------------------------|--------|--------------------------------------|-------------------|------------------|
| `/v1/payments/`                   | GET    | List all payments                    | None              | `partner_name`, `paid` |
| `/v1/user/<id>/payment/create`    | POST   | Create payment                       | None              | `course_ids`     |
| `/v1/payment/<id>/refuse`         | PATCH  | Reject payment                       | None              | None             |
| `/v1/payment/<id>/accepter`       | PATCH  | Accept payment                       | None              | None             |

---

### Administrative Tools

| Endpoint                          | Method | Description                          | Permissions       |
|-----------------------------------|--------|--------------------------------------|-------------------|
| `/api/v1/commercial/static`       | GET    | Get business analytics               | Iscommerciale     |
| `/api/v1/cassies`                 | GET    | List all cash registers              | IsAuthenticated   |
| `/api/v1/chef/cassies`            | GET    | Cash register history                | Ischefbureux      |
| `/api/v1/chef/commandes/today`    | GET    | Today's validated orders             | Ischefbureux      |

---

### Support

| Endpoint                          | Method | Description                          |
|-----------------------------------|--------|--------------------------------------|
| `/api/v1/send/email/support/dev`  | POST   | Contact support team                 |
| `/api/v1/conatctme`               | POST   | Send general contact email           |

---

## 📶 WebSocket Documentation

### 🚚 Delivery Service
| Endpoint               | Consumer             | Description       | Key Messages        |
|------------------------|----------------------|-------------------|---------------------|
| `ws/commandes/{id}`    | `CommandeConsumer`   | Order flow        | `create`, `update`  |
| `ws/livreur/{id}`      | `LivreurConsumer`    | Delivery ops      | `assign`, `complete` |

---

## 🧩 Data Models

### **Partenneur**
The `Partenneur` model represents partners in the platform, such as drivers or delivery personnel. Each partner is associated with a user account and includes additional attributes to manage their availability and location.

```python
class Partenneur(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE)
    vehicle_type = models.CharField(max_length=50)
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    is_available = models.BooleanField(default=True)
