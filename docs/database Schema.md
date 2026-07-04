# **E-Commerce Database Architecture & Schema Design**

This document details a highly scalable, production-grade database structure optimized for modern e-commerce operations. It covers both **Relational (SQL)** and **Document-Oriented (NoSQL/Firestore)** approaches, providing entity-relationship mapping, system flow formulas, and architectural recommendations.

## **1\. Architectural Math & Pricing Integrity**

To avoid rounding discrepancies during discount calculations and multi-item tax evaluations, all financial values must be stored as **fixed-point decimals** (e.g., DECIMAL(10, 2\) or integer cents) instead of floating-point values.

The system calculates the order totals dynamically using the following formula:

![][image1]Where:

* ![][image2] is the snapshot unit price of item ![][image3] at the time of purchase.  
* ![][image4] is the absolute value subtracted based on promotional rules.  
* ![][image5] is represented as a percentage (e.g., ![][image6] for ![][image7]).

## **2\. Relational Database Design (SQL / PostgreSQL)**

This normalized relational model ensures strict data consistency, ACID transactions, and comprehensive historical reporting.

### **Entity Relationship Diagram (ERD) Conceptual Flow**

 \[Users\] ────\< \[Orders\] ────\< \[Order\_Items\] \>──── \[Products\] \>──── \[Categories\]  
    │                                                    │  
    └────────\< \[Reviews\] \>───────────────────────────────┘

### **Table: users**

Stores customer credentials delegated to third-party OAuth identity providers (e.g., Google, Apple, GitHub), profiles, system roles, and privileges.

| Field Name | Data Type | Constraints | Description |
| :---- | :---- | :---- | :---- |
| id | UUID / BIGINT | PRIMARY KEY, DEFAULT gen\_random\_uuid() | Unique user identifier in the local system |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User email retrieved from the OAuth provider |
| oauth\_provider | VARCHAR(50) | NOT NULL | Identity provider name (e.g., google, apple, github) |
| oauth\_id | VARCHAR(255) | NOT NULL | Unique user identifier returned by the provider |
| role | VARCHAR(30) | NOT NULL, DEFAULT 'customer', CHECK (role IN ('customer', 'admin', 'staff', 'support')) | User authorization role for access control (RBAC) |
| first\_name | VARCHAR(100) | NOT NULL | User's first name, synced from OAuth profile |
| last\_name | VARCHAR(100) | NOT NULL | User's last name, synced from OAuth profile |
| avatar\_url | VARCHAR(2048) | NULL | Profile picture URL synced from the OAuth provider |
| phone | VARCHAR(20) | NULL | Contact phone number |
| created\_at | TIMESTAMP | DEFAULT CURRENT\_TIMESTAMP | Account creation date |
| updated\_at | TIMESTAMP | DEFAULT CURRENT\_TIMESTAMP | Last updated profile timestamp |

*Note: A composite unique constraint should be placed on (oauth\_provider, oauth\_id) to prevent duplicate social accounts mapping to different internal IDs.*

### **Table: categories**

Handles the hierarchical taxonomy of products.

| Field Name | Data Type | Constraints | Description |
| :---- | :---- | :---- | :---- |
| id | INT | PRIMARY KEY, AUTO\_INCREMENT | Category index |
| parent\_id | INT | FOREIGN KEY REFERENCES categories(id), NULL | Supports infinite sub-categories |
| name | VARCHAR(100) | NOT NULL | Category name (e.g., "Electronics") |
| slug | VARCHAR(100) | UNIQUE, NOT NULL | URL-friendly slug |
| description | TEXT | NULL | Detailed category summary |

### **Table: products**

The core catalog containing product metadata, pricing, and active stock counts.

| Field Name | Data Type | Constraints | Description |
| :---- | :---- | :---- | :---- |
| id | UUID | PRIMARY KEY, DEFAULT gen\_random\_uuid() | Unique product identifier |
| category\_id | INT | FOREIGN KEY REFERENCES categories(id) | Associated category |
| sku | VARCHAR(50) | UNIQUE, NOT NULL | Stock Keeping Unit code |
| title | VARCHAR(255) | NOT NULL | Product display name |
| slug | VARCHAR(255) | UNIQUE, NOT NULL | URL-friendly slug |
| description | TEXT | NOT NULL | Main marketing copy |
| price | DECIMAL(10,2) | NOT NULL, CHECK (price \>= 0\) | Current selling price |
| original\_price | DECIMAL(10,2) | NULL | Original MSRP for slash-through display |
| stock\_qty | INT | NOT NULL, DEFAULT 0, CHECK (stock\_qty \>= 0\) | Real-time physical inventory |
| is\_active | BOOLEAN | DEFAULT TRUE | Soft toggle to hide/show products |
| created\_at | TIMESTAMP | DEFAULT CURRENT\_TIMESTAMP | Insertion date |
| updated\_at | TIMESTAMP | DEFAULT CURRENT\_TIMESTAMP | Last modification date |

### **Table: product\_images**

Supports multiple image galleries per product.

| Field Name | Data Type | Constraints | Description |
| :---- | :---- | :---- | :---- |
| id | BIGINT | PRIMARY KEY, AUTO\_INCREMENT | Image entry ID |
| product\_id | UUID | FOREIGN KEY REFERENCES products(id) ON DELETE CASCADE | Associated product |
| image\_url | VARCHAR(2048) | NOT NULL | Hosted URL of the assets |
| is\_main | BOOLEAN | DEFAULT FALSE | Primary image displayed in listings |
| sort\_order | INT | DEFAULT 0 | Display ordering sequence |

### **Table: reviews**

Allows authenticated customers to review items and recalculate product ratings.

| Field Name | Data Type | Constraints | Description |
| :---- | :---- | :---- | :---- |
| id | BIGINT | PRIMARY KEY, AUTO\_INCREMENT | Review ID |
| product\_id | UUID | FOREIGN KEY REFERENCES products(id) | Target product |
| user\_id | UUID | FOREIGN KEY REFERENCES users(id) | Submitting author |
| rating | INT | NOT NULL, CHECK (rating BETWEEN 1 AND 5\) | Numerical star ranking |
| display\_name | VARCHAR(80) | NULLABLE | Optional public name shown on storefront; user\_id remains the audit identity |
| comment | TEXT | NOT NULL | Customer review text |
| created\_at | TIMESTAMP | DEFAULT CURRENT\_TIMESTAMP | Review submission timestamp |

### **Table: orders**

Tracks purchases, statuses, transactional pricing snapshots, and shipping markers.

| Field Name | Data Type | Constraints | Description |
| :---- | :---- | :---- | :---- |
| id | UUID | PRIMARY KEY, DEFAULT gen\_random\_uuid() | Unique checkout invoice ID |
| user\_id | UUID | FOREIGN KEY REFERENCES users(id) | Purchasing account |
| status | VARCHAR(50) | NOT NULL (e.g., PENDING, PAID, SHIPPED, DELIVERED, CANCELLED) | Order processing state |
| subtotal | DECIMAL(10,2) | NOT NULL | Total cost of items before adjustments |
| discount | DECIMAL(10,2) | DEFAULT 0.00 | Saved promo deduction |
| tax | DECIMAL(10,2) | NOT NULL | Dynamic tax aggregate |
| shipping\_fee | DECIMAL(10,2) | DEFAULT 0.00 | Flat rate/calculated logistics fee |
| grand\_total | DECIMAL(10,2) | NOT NULL | Net transactional amount charged |
| shipping\_address | TEXT | NOT NULL | Full address context at purchase |
| tracking\_number | VARCHAR(100) | NULL | Shipping courier tracking |
| created\_at | TIMESTAMP | DEFAULT CURRENT\_TIMESTAMP | Purchase timestamp |
| updated\_at | TIMESTAMP | DEFAULT CURRENT\_TIMESTAMP | Stage progression timestamp |

### **Table: order\_items**

Saves the specific quantity and transactional price of ordered products. **Important:** Always copy the dynamic price here because product base catalog prices change over time.

| Field Name | Data Type | Constraints | Description |
| :---- | :---- | :---- | :---- |
| id | BIGINT | PRIMARY KEY, AUTO\_INCREMENT | Item line ID |
| order\_id | UUID | FOREIGN KEY REFERENCES orders(id) ON DELETE CASCADE | Parent invoice ID |
| product\_id | UUID | FOREIGN KEY REFERENCES products(id) ON DELETE SET NULL | Reference product |
| quantity | INT | NOT NULL, CHECK (quantity \> 0\) | Bought volume |
| unit\_price | DECIMAL(10,2) | NOT NULL | Transactional price point snapshot |

## **3\. High-Performance SQL Indexes**

To prevent slow response times on high-traffic sites, apply these indices to optimize queries:

\-- Speed up catalog searches by category and active status  
CREATE INDEX idx\_products\_category\_active ON products(category\_id, is\_active);

\-- Speed up search auto-complements using slug/URI mappings  
CREATE INDEX idx\_products\_slug ON products(slug);

\-- Fast tracking of order histories for particular users  
CREATE INDEX idx\_orders\_user\_created ON orders(user\_id, created\_at DESC);

\-- Fast compilation of average product reviews  
CREATE INDEX idx\_reviews\_product ON reviews(product\_id);

\-- Speed up user lookups during OAuth authentication sessions  
CREATE INDEX idx\_users\_oauth ON users(oauth\_provider, oauth\_id);

\-- Speed up back-office and administration lookups by role  
CREATE INDEX idx\_users\_role ON users(role);

## **4\. NoSQL Document Database Design (MongoDB / Firestore)**

If building on a document store to support rapid JSON streaming and high read scale, restructure the database to utilize nested documents, limiting expensive lookup joins.

### **Collection: products**

{  
  "\_id": "507f1f77bcf86cd799439011",  
  "sku": "ZN-AEROSOUND-MAX",  
  "title": "AeroSound Max",  
  "slug": "aerosound-max",  
  "category": {  
    "id": 101,  
    "name": "Electronics"  
  },  
  "description": "Experience absolute acoustical tranquility...",  
  "price": 299.99,  
  "original\_price": 349.99,  
  "stock\_qty": 45,  
  "images": \[  
    { "url": "\[https://images.unsplash.com/photo-1505740420928-5e560c06d30e\](https://images.unsplash.com/photo-1505740420928-5e560c06d30e)", "is\_main": true },  
    { "url": "\[https://images.unsplash.com/photo-1546435770-a3e426bf472b\](https://images.unsplash.com/photo-1546435770-a3e426bf472b)", "is\_main": false }  
  \],  
  "specs": {  
    "warranty": "2-Year Manufacturer Warranty",  
    "materials": "Recycled aluminum and memory foam",  
    "dimensions": "186mm x 165mm x 80mm"  
  },  
  "average\_rating": 4.8,  
  "reviews\_count": 2,  
  "reviews": \[  
    {  
      "reviewer\_name": "Alex Mercer",  
      "rating": 5,  
      "comment": "The soundstage is wide\!",  
      "created\_at": "2026-06-15T10:30:00Z"  
    },  
    {  
      "reviewer\_name": "Sarah Connor",  
      "rating": 4,  
      "comment": "Comfortable over several hours.",  
      "created\_at": "2026-06-11T14:20:00Z"  
    }  
  \]  
}

### **Collection: orders**

{  
  "\_id": "607f1f77bcf86cd799439022",  
  "user\_id": "807f1f77bcf86cd799439099",  
  "status": "PAID",  
  "financials": {  
    "subtotal": 299.99,  
    "discount": 0.00,  
    "tax": 24.75,  
    "shipping": 0.00,  
    "grand\_total": 324.74  
  },  
  "shipping": {  
    "recipient": "John Doe",  
    "address": "123 Design Blvd, San Francisco, CA 94103"  
  },  
  "items": \[  
    {  
      "product\_id": "507f1f77bcf86cd799439011",  
      "title": "AeroSound Max",  
      "quantity": 1,  
      "unit\_price\_at\_purchase": 299.99  
    }  
  \],  
  "created\_at": "2026-07-04T12:00:00Z"  
}  


[image1]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAmwAAABMCAYAAADQpus6AAAVRklEQVR4Xu2df6wdx1XH75MDSvnZAsFpbN/ZaxtFTvkRcIhICVIpCTRqS6s4IkWJgkRUXESEUKq4akAiUcgfoELVJqWVlRIVKST0h6qqOA3FggdGjWklSKpYQW0sxZHbCFBkNWqsNJFtznfnnH3nnjd7d+979z7H19+PNO/tnpmdnZ09c+bszOzewYAQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEFBiNRkn49ygn5Hxn9+7d3zccDvfJ5lKMI4QQQjYMdEjirH1x69atr4txhJDBYNu2bb8pTttzUU4IIYRsGOKs7ZHw81FeYsuWLT8u/5b0PyHnBTrK9uBFF130QzGOEEII2QiWxFn7dhSWkHS7qqrau3379h/FvnRgH4hpCFlg0Fa+uWPHjm0xghBCCJkr4nS9STqhe6K8hQsk7UPYwEgDpoliAkIWGdH/E/LQcleUE0IIIXNDOh+8aXBcNi+IcW1I+sfxH6Nro9HoZ2M8IYuM6P010gZORzkhhBAyN6TjOSzh6SifRFVVF7rdTW6bkPMCjLBJeFuUE0IIIXNBnLXvYSF1lBNC2pE2czXbDSGEkA0Ba9DEYXsBLxLEOELIRPDywZkoJIQQQmaOdDg3SXggygkh3UjbeZWf+CCEEDJ3pMP5qITboxyI/ChGENYaBvwiPFlwRM+PD4fD7VFOCCGEzIwtW7ZsRYczGo1+LsYBfGdN4g+qA3YixrexefPmH5T035FwW4wjZJEQHX8otTzwEEIIITNhOBzuls7mJQlvjHGGfp+tHjGzD+X2YevWrT8mxxye5hhCzjVEx+9NXFJACDmfqarqbjGET4jD8Jj8fzt+EmbHjh0/GdPNEjnnu+RcN8n/Ksbp4vw3toXwmYs1I3ntkmu+Qf7fMas828A31OCIdZ1H0uxHOgmnYtwk4OxJ3p8Ksk9I2AeHDtcZA+6zT38uoCOKB6X8z0FvY/y5hv780icGM5zSjvdZwjvFmR/GdOcauA6590cuueSSn4hxs2Q0Gl0pIUX5rIGNjbbNh8EMdKLU9ue1DlB1eV+UzwKdocCykSd27tz5I/L/7ZBP6kdeq0y673IZr4/pCanRaTg4BmPf9oJMDcZcgYMhDXx3SY5GiW3ES1mOWXnk/+Fhj59ngnGPshLqHC7Py4gZuKaU15p1gg4DaSUcXOuomRjqndu2bfsV21eDcMzXt+z/Cc7T5rhJOTZL/FEp+94YdzZQvdzfJZsHvt4wrS3nPC2ya0wWneVpgV5H2XpQ/Vm2fdzjWFeyfbuEI7Z/tulqs2oLXirZjFkh+d8j4dO2L/f1ctn/Fuqzq3xGW3uKDPNDR/1tuWAfNknc76UZ2WDk4+tNR+QPSdgT05bA8X3to5zj5r6/eYyHrygroQ5O88swUlc3JvchZdm+s00nUKcSDkT5NKgd7GW7+yL5Lcc8Zf/P0muoPZLXFnhN/h5R9I/HCJF/Go00ymdNm8M2zCMOtj3msMF5GHY7bEt9jetGOWxJ16dFeRtqaNBJrOmJVerpLjHMr7N91B/q0de37O9K+TMjV5ksInn8jM/nbDHM08VPw3h6ucjun6Ze18Kll176w0FPoV9XD9yDjpThiy5+auT4o1G2HlR/lr1MdOKDWlf1yA06TDj2Ps1ZpLPN6ijLq1r3cwH3wZwoIPWzBQ4I6q2rfEbJppWQPD850F88CQ7bAKOIaUY2GPmk4Oim/MZ6r9FKefD7xb72EfUl1/KeKC8h578vykpIua/xdQ97JPuPufgPtNW5yN8xi3qUfK6NsvWAtunvN4Bt89dFSAOUXI3QGwpx203J0VB1evQC/V93UlXm3fjjDoUTWA/rSrhQ8xgbvUOcypdgpGJD0+Huj9k+4pNz2OBAVCu/K7hJ5LvEoFxhT7VozCJ7oGBccT4rbzPVsIEO29diA52ENN6E9AjYjvGTkGu/OoUXF1B/qEdf33qfn8fvk9r9Qj3CcGh9bsI9R5zLCk//N0iaX3cyGPUrIEe8l7eh9X59lIvsH6IMiPzZoRvRMvTp96j+xuoSOld9wsc9hn74aYZaX6AbwfGr9RYbuFav5zoa8c++3kIdoWxvTsE5mhY57144JFG+VqA3hTLhd2k/i7aPHdwDPxoidXgJ6kZHt5ufTsO9xr31I0eoJwlv0fZUo6N4zWiM6ZTF6/ZSrL8JbXYMHI/rmpRO9erzUS6yPT3aeF0/+B8jus7r8boyCamf97ntVSPwsHX4j1F21D/amI/vi9Zbl8MG+wjejW2XDrp9olR3qI/SDICkP95Hl1N/hw19AOxZUy5vE6HPSKOO9Zhzhv1K27/WQ90noY37a/J2w9JYHLZ9vthW3a3Txrpx7Qrxt6bCSGZyDpuU/Q0p6x3kf2Bp0EbQ9mzfqFba3bqnzMk5AhREFWbVTYcyus4IC+XxOv2H5f9JCZ+DQoq+fF3Cb8v+M/L/YqQ1oyNpH0E6CZ+U8CXLVzs//JAz0v1LyuvmJho3bayNw+YR2VMS/jblz2Xg9zkh+1+UQUNtpNSIP2rllXDQ8thAhw3X0NthAylPYaE+H4xxk5Dr3CvHPe9lKRurMYdN0r1NZKd1yqEun4S/kPBtCf+JetHzNx2V7D8t4VY59m4Jf6T5YNroYfn/O/L/KUvbRXK6oft7Sh0ASHlkZZWu2P2TcK/pH/adHOsG6+lK2X5S8vjHlKcCT9iUjB1X5REo6O3zVrak90BDrYf6v9atpCN8FpAX6sv2re788SulX2GYv+Q/s5EjPd9yQf5Ayk6blbFOo8sj/kbkWNP5jLWHlKfNPyrX9R75/6Rmg47oOOJE/mXrnJPq0FA70JRth3VKtobz9+X/AQn/nVRXUqHN6nnG0FEnpLkpxnnUzjSdJLZxTp+mhOZ/b5QDnNe3g0lI2uuirAvTwSgHIv8u6l/CF2T7rZA5XUeoHVkt46rZB40vTYk2D0wp28evD/NU7MFKbbo7Rx0gQ98g8X8uaf8w5T7h/ZaPHnOijy4Pe9o1dehx/u9K+Gy0Eapv0Nu6v0l6XU7nUFdNHUl4QmWnXD8HOfoG6CbyQb92ubcjmif0GvV8i94PnO9lK4uuscVau0MS/w0JH5HtFy3e8HnK9f1UCksiUL8ptzG8aIP6rftp2b5Own0pl3XMfpIFxitMF0nX64gSvR4KrA22fhJThW6e1FI22l9zx77ktsfOh0bTZpwNbSCrOjrZfzi5XwzA08hQh5O1ATfGFeWV/fcOVsq7bOWd5LDZE1tbQH3EY9rQa+hV34b/1Idc35Uxvg01RstepmVGGT6f8osN+/H05kdNUG9y7F51yOtrQz1aXcoxf6kjWTjHxSL/Zfl/VxpfTwLnufcvOaRs8NChfgkdSYw3UAfDwje47P7hmjUdrrO5n7L9kou7A2V26ZpOPGVnth5tVp1r9Lakp4g3mZ3Tx0s9/XTKowL1aI1sf8bHR5AH6j/K1wrqK5YJ4Bwmt7rDdspOLBZyb8K9l3Ch6MelLo+lKju0IwnHEa9yO9dttu2vA/tue9nuYVJ9tDgcY3rWhpa36JREzGlDmKRXHtzPtjLoeYtxkb7pPNpmi/ZB5He47aatOfuwS46/0eQRreuTkuY3dFoZjvTnfBop83urbNPr+5R0LZUee8zbx5Qdibrt4NwSXrA4laEtdd4ja5c9gV7C+Xk2ZX1rXspSnW6ceJwf5bZtO4+ma+oYfYbsn9C2Gu3GbZrWHKXmuHg+vXf1SBvysHNDDp2ydB5NB526ocqO37MuDm3sgLWxlJetwK6iz6vrGnFI02dKmywAVX5iPuNvuHNQTosiXe07vaB4eMLGSNmXxRjuTKGBJNdR4Fj8N2NrcjBJoQ3E+/yNKNP863OhQQWjic7mRlfex+3YSQ7bLNHyFg1yF3LcqWFey7ZqNLSEGpBlL8P1ogyT6rtQb43D1nY8zpPyU3bjyLqn1j/uWliM+5Ly0yg6nNbrS3lKedUUqnZA6ECu0nTR8I45bFrWN4/yiwPLlk9ynZLq3LocNqBt7DaMEKBTiPEe5IH6j3Kg+RdD1fLQkAoOm71hW+lLJN5hA3L+f006oogyozxWdy5NPTLnZSk7AMu6PdFhQ5l1u9YniyvpXmQah22QbRRGkQ5hO0aWwP1sK4OetxiHe6DXUwdJd4vf7/PGvbbZon2QuK/ino10mUSMV1nrNWo5Gn01/R66B6Aqt0PYdIy6wz7W90aPjQ7bGQmf0bg6WJzGFx22WE+FPIrLKYZhKYQ6Whjpr88bdQfntzhsmw4jXVqtu7U+aRkau2F15PIZc9j8+fTeWbo9qEsJlWwf9Q/EHpzL8tR2+VcWh7xTqButO1wXXoDprDOyYOg02FNooDEuOUW1fWvsQLZvFtl+KKMa0U6HbZDXh8zSYcOwcyPTctRPH9ag0NDlHO/T8tZvQ8anoEkOmxz3p0lHo0oB8aXjSqT1OWzfHEzRMNWAoKNqwPWiDJPqOxoildUOGxbeI894fMpTCCe9zKg6PmEyyJ3qAR0pQD57YgIDZZP4+we5Y6rXoEAO/RX5aTgY2NfrLDlsOBeMc/0Sh6XLuef7E421xZmeqi7VnQfirS4sr2h4tWM5nPIU2di6qGjIUx4lmdnbuLhWf33ARv2k7rZh3ztsOL8mw0jG3+M6RXa91l0DrgV5BxnshY24TOWwuTofa7N2jGcah03yuBF6pbrVqlceve+rHgqAnrfosEX6pvNom11lH/CAKXHfsP2YRp24wzbyXULrepXDhpcJXJozSd8gTvk+rXLYoN/ab5yW8JAdG5G4F/roctStNgr1ibaMjyi3OWy+bU5y2GqbIOF6vc7GbqBuZP8k7J7mM9Fhs/NV2R79l4QXRfZhSxPBuUJZGtAGcH2D4ISL7EjSpT/k/AQKeyosEMUCSyixOUNIczI0bqzbqQ2bKugxMRxXaoeF0Y7GWcCxyEO3D+7cufMi3a4Xs0r4VUtbQtN9K35HSg1V7TTK7pIo+T6UQY9Bp4Ih7TtgyFIubz2VoOU9ZeVVR+Qrw8LLF7Mk6U9PRfkkcG24xrhmowu9/rGXDtxIVLFDAhJ3Z4zHvsmQR+g8PmTTMuhYIEO96pqTX0jBaQxAr8YWh3d1rjg3QtLFyilPE7zsy6x5HMJ91fpDR/uIlskMOc4N/Vg2oyrbx804m7FGOo27HXoj4SOuI2jahOr903KOLcOwLkfk30Oclw1yvmPGGB1AmmIquQtcN+oB21oPuB+vyHlusTTmhGMbnZBcX4VtOHY2Iphyu6kfFtJKh15PNWLb7r/pqF7vndjW0WzvsB0yW2P66DrEsTZrx3hS7lS7HKelSp01E9gDgUtTRO9j6cO85uz/Vowo0VG+ItBRrasxvVB7VZdJti9GGgn3j/II8V9L+AriUq73R/2xhtZ1o6+6Vg+df71eD/ml7ITV7SjlUVY83D1oo7Jyvs3Qb3Wacf9flaSbVLfq9mikPIXXqcvVFA5bclO4sv3W5OxbGrdbY/1Vyjavdi6h47Jdjx5rHD7h8n7dNqfWlkzgAbtptzjObcfzPeTOh6UFWAMH23RTfDAzUh79be0PJO5VqZ8P6vZ9Uq5r5R4k2D+b4k+5DY7pCzkPQGNEo0DAdowvUa287Tm47LLLvr9NMSP+OGxX3aMwE4EBQT5RrrL4hNKMyPUt76xIE56oWoAheBKNNEZ0gTpNuYOaS2NGPcY613OifmtnBIZeZP/m08yKkb61KOe71TkKtZMAcG9Vjzfhv76xBeq3SE3npOP6ATumC5dHEZyzpMspG/NmOlQ7uA8Nwogb9MPvbzQ6dV2PXMa2AVnBLozVpce3Sd/muii1WQ/yQhtKa1jU3xfJ+3+6pq+7WIvDNgnUsb11OJhipL0LyfctaEcDrXPUv40wwab7tLj/8V6X7r/e+7u8rI2qp8NWrbzUVpe3qy22YQ7bYGWEvqlL1a16hG0anfUM81v3zwxW8sUb9c+J7GGfbgrQB6wqS1ufRwiZEei41Vj0QtLuGU3xokEk5ZGxUZRvIPUo1mCGHUwk5QXPmErFJwrm/vHcvsD5EUP9a9hOeXSkcc7E0P5SlaeLosM20++wLSKjPKoU19POFMl/ua/D0QbKGWXnC1J/V8n9eVOUl5C0vxtl88Q5bKtIYUp0LcBRTzqVbKQ8GrfsZYSQ1ziTjEVEp5Lqofq+SPrrh2HNhOz/R1/jOWt0GuaeKJ81co7/Q73GUaGzia7z+VjKr92vGjES+eN+dA9TgNNOe5+PpDxtiqmqVaMOM2RJHbZV9410k3pMPZ8NtE2eQZD7+9X4IojIX9H4V7x8WsTeXpbyJ5H2y3m+IOFum4IlhJwjpDwKdKbrCW6U1+Zh7cRUHQaOqcILJOIIXCHyv/OyjaTrWhcZnUIqTlvIPbnf1mmlPEo4tpaPlEl51HhdoyB90Gnr1rWepAx0GfYrys830O4x2hbXXRNCzhG0Y34B6xxinKEdRe/fD63y1+bfBUdwvdM4ZOMYzvkFl0Ul5Y/+1gvlCSGEkHlR/+xN25N7ym/I+a/qTxU47E4WHdHzI/5tdUIIIWQu6Dq24giByK+T+BvWGmJ+hCwa0kZe5JfdCSGEzB18x0g6nWfxP8YRQiaDkeQoI4QQQuYCOh2MtEU5IaSdlNeALkc5IYQQMhdS/vL2cpQTQtpJ+S1rfNePEEIImT/49EbSn8maRJ/viulbpfP8JhUhZ51h/oL884PwsWFCCCFkbuBtTumAHsN3umKcge/34CWEKPfoFNEznF4liw5G1iScinJCCCFkruDDn3DaolzBD9n3+k5XVVWfosNGFh1x1l4WPb82ygkhhJC5Ix3Qx0s/Yowv4Ff6W5OV/thxDJaWDhtZdES/bx6epZ9XI4QQQuwnqFb9Xih+5UDkj0Z5CTpsZJHR36M9EuWEEELIhiLO1j7pkP7Jy/ATU0l/axIjcHipIAaXlg4bWVhE1w/0/Zk2QgghZG7oW577B+6H3jHqJk7YI10dlaS7TsJ3JBwTx+3yGE/IucxoNLqSPyROCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEELIu/h+mVnm4b2BfDgAAAABJRU5ErkJggg==>

[image2]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADQAAAAZCAYAAAB+Sg0DAAAC1klEQVR4Xu2WPWhUQRDH3xEDEb8iepzJXW7vwulVfuBhpYUEmxRaRCtLRUXQRvwAQVC0ULSwSCEBEbVQO8UmYsBgxMJCRBREFDwxjYJFQBuJ8ff37Qt763uX48SYwP3hz+zOzO6b2Z2duyBooYUW/grGmH44lMRCoXAml8uV/HUzINXb27umWCyu19g3/lOk0+nF2Ww2R/An4RR8BbusTsnegD/z+fy1TCazyF8fByXCmgk4yYFs9e2zAgLebhMa9W3oBqztA7eV9e1zEvUScmwTtozmPuolZGw54jPMDS00YSmOMP+I3GPCMn2kd0OJdTK+CF8wfon/2mif7u7ulegH4Rf4Cb7H57xbyswvSA/H4XPYFzTzDhMSSjHfCKsKno9tkJJ5F+ODyG/ojyOPaS3jK5jbkFuw37P2itZwswbdW3Q3bQILGN/SOvQH5FMqldL4344SxLZTe0hGATUMJ6FJBW9PXw97XKfGx5a6/koKVvWmsK9ifEo35Ox3wk2I8X34Gf/Vjs9hdG+Qm5mm2OeyDiOyl8vlJdjH4KiaV6RvCAk3lIgooaQPxSSkw0kMzJbja/z3wV0RSfKxvqPvRb7aA32Hu/4PzEJCv/dO8o/28xMS0ffr7cpPlcL8CTzi71GDWUjoR72EeGMZEzaD6ZtIgkoR0ebra+AkNObb4tBEQuqE6mxF14/SKaDbHYQNaDDvvCFr70C/F9mpOe90WaVSaXd9YuEkVPVtcZgpIRO2+u89PT2b7FwdaxIOOQEpiaNwQBN1QjCioJ19+uAlhu0m/Ik4R6wPXJ8a2JOc8ljzCH3ErJkuJd2ICVvttJ3TvR6EwSu4d5ZX8R1GHgqc8rFN4CvyDva7Wqvg0RWZ74fbGD9FLo/W/G+k+J+4woS/ZbGdSocju3v7ulVbfoPI0477/IX9zXtGaa5r9I/ynAbvcQc39BCe1Xvz7fMSDXe5FlpooSn8AmkR/wQj6wq2AAAAAElFTkSuQmCC>

[image3]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAcAAAAcCAYAAACtQ6WLAAAAyElEQVR4XmNgGHjAKCMjI2RsbMyKLsEgJycXJi8v/x+Ii9DlGICC3kB8AqhbF12ODKCkpKQGNG4/EJ9WUFAwgEsoKyuLAQXXAB2jBMQrgOylQGFGsCRQZTgIS0lJiQAlrgLxJLhOoIQGyG9A2gMo8QtEwyWhgBEoMQWkE2QCigxQpzRQ4gEQt6JIgADQqAigxDcgtpSVldUBOqweLgnkzAB5Q1paWhiosBKkCC4JVO0HFHgCxNuBuJgB5hUYAOoQAGEUwVHAwAAAsXYmxzYxU7QAAAAASUVORK5CYII=>

[image4]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAAAYCAYAAABtGnqsAAAD0UlEQVR4Xu1XTUhUURSewQKjoqimwXGcO+NEs2gTDAQuiogWSdpCFxFBtAiSCIKioiAQokVUC1uFWeFOzcJNEOFCCEJcWEFQBEJG1EIyglpoOPZ9754zXF9vnkoYaO/A4d7ze8/77u+LxSKKKKKI/mNKJBLramtr08aYy+BZ8BtwDTmXy+1Cexs8nc1mR+rr67e7sdCflZjXyLHZtS1XIh741mq/fl7KZDLNAsaQ35ZOp7ch6XsyQDWql5hp8CP4rHFjlivhW67xu/z6eSkMQFJdXd1u2KYA4jPOkt++EoiLADg8XRIACRpt4BJAPOC3rwTid+H7ZpYEQBIG6BafLpF70R9DbE8ymVwrbnFs8z1cqdzysL8F97mrFqs5D91D8CRiP6J9Bz6t9lQqtQXyLcaK/RW4lblpR/8GdbRhjDbq0GYh32Eu6sH70W9EOyByD8ZNwe06a9Yxi8Xiaqy8TcbeAT/Bs6wdbSfaDubVukJpIQDKIJ6PHLZH0B9XWXwaWBzPTY1jQWqXi2kSunYWj4tpA+RhcEl8d6L/Ae0liFXUMZexE3GTMai1iH4/a0H/In2oh7wP/EL0zbzY0D8B/gb+DO7jhSnjHIY8g7aNsagrCfmqxB4z9hJN0iafEU4LAZDFqg8BcbZ1GUDxGXNnDvJ92vP5/FZjb/lR59ZeZexqG3byDRNYjZccR8ElcAtlrVcBVNIaaafs5JwCN6ifsS+NcZTZXSl2UbQQAGHrEp8nGLg6CEDo90KeAU8j5wDkk058I+Pdol3K2G3HM/YPu6w6brF+kRcLIHdKjfqxT90/AxD6HPgTeAK+O6gLAlC2Nt9Rca44yevNvrGrKAxAr4YguwPgoOv7twBqvqDYrD1OGtUeSmEAyvnSKfZzqg8CkEVg4PZycMwr9gvzE3j0J0zAFpVidZLK+ZSga+H4mrsSgMY+/BcD4JDq/ABKzXPyV6QKAMblAH8M/gWfMzE52EmFQmE99M/J7FMnRfjPQN6MRXTjaC9ALrGlTDsnCO4d4ttq7KF/UOPlohkkK/DGrugp9wM5Jsc29ju8s9KpcQ6A8vflTZbqcEsfYizSHKeM/nnq1B5IinoI/4DPA9xIBX+s31dnDAWMQB7lVkR7D3wqJmCBqrL29iZIL41d2UOIaxI7QW4y9tbkymE8QbnL54b4KOh8knzlODIWn0beChS+4vQ9lvr0OaY6b8XJRDHHd3Af/Hr9O2XJie9BufqreAbyKeD3ESrbKzwV4vIMqcmG/JvSJj4bKcuWDY2Zj5hLXgk66RFFFFFEEUUUUUQrjX4DtbKciK4zvkwAAAAASUVORK5CYII=>

[image5]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFQAAAAZCAYAAACvrQlzAAAEXklEQVR4Xu2XXahVRRTHz+EUlEVpeTvdrz3nfhBYQcbpgyC0B4vEFPqgIiEEEakHHyQNSqiXKN8qowchRCQSKSjQHm4QoqIPQlEo9yL4YGASPUjh7aG43n7/M2tsztx9jvte7oEe9h8WM7PWmpk1/5m9ZnalUqJEiRIlFoxGo3GTc24HsreI4P8BsjQdZzGh8TVPOncSx9a03/8CAwMDywnwLPIHsivLshcI9hvqs8hp6i9Lh2yjfQG5RH00HWeRURsbG7treHj4IeabsljeQPpHRkYo3LMiFTk0NDR0R9p5HqixlmWU1dSwYBDUCgY9WK/Xbwk62m9qEZC5P/YFVWz7kDWJvifo6+u7lTiOKhbmXJ/a0U8jVxcaD+t7GpnQPKltwSCYJkHtSXSdCG3Z8hbXC/SSUBv7iMZfVEKVQ9Oc2I1QTa4+qlPejfyM/y/4n6e+e3x8/LbgS3ula897K1MdsiOMl6IAoYpxzgkbHR29B/+vsZ+12KZIDTcHO2ljFbrv1R/5HZ99Fsvm4IPuXtqHrf8l5IvBwcGhYJ8XuhEaA5+Pke2qK5dZkJNhYtusJ+RHeQyfQdlon0EuMM82FvdApUMOSwh9lbJfQm69n/I9jRunKkFzOn/yZpG10jHveEw89aWaF/tF5JTsGld6s6+m/ZvzBFebzeaNzh+Ic8rh0XTFMA9CNyLrkrYWsjH2s4AuE8wjlA8iJ4oEFhMqQrQok8PITHzqIlSx7UImbbNaoP0P63o8amtzdMm2ffK6DJ3f8NOZv7BaYBMfRveXuAm6wihKaIB2VqeGcrf65U2qBdrnc1TEpvY8dPnkq8y1Cf1ebVakT1Hli7jTNrJtjE6E4rMG3VXGP5b5102QLegvF+WkDUUJ1Qlx/tP4EXm9G6HYHnX+EjlwHRKuoQuhgZBp9M1YLyiPWyx/It8hm9MxrH8eoevlm0NoS7SO4FsYRQi1y2mC3X8q6EIweYSi24ntV+dv5Z2VDnkzRgFCZ5HnYr3l6EmRRZ/7Iv+uhDZ87hXxa+Xbbe3zRhFCM/s0KhExMaEm8QKOcHL6nM+BM9ieDLZO6Eao/ZDMIm/FemLemqcPY1DuyfxTsY1QI3U/B6Tu/Ia05VABewP9K7GuEBSMBfV5pcNJsqCmw8Wgzzjzz48WoRrDSKg5v+uPWb9l1E8S2zndrm2DJogJdclJtBMl/Zc0b7CTeYDxXzT9JxWLnWfU7dKR5zdQfqrYo7F/UJ7VC0Txyx/d885fYvGXVGPOdzWGta8PI0LBzJGc06qL4TVsx51/UkwgL1H/Fvkb+Yr2O2n/nDnm5EH33+mJ/Vqi/sEv85fcDPI2439Iud029n3nY9Br4DPnY/oJuYLfRyGH014nnfNrUK4Nm6Y/wmecvx+mbIzjWq9sYf6eQJ+InhpUa6aqpm/DXkHE6H8/8xeGnkQhhnCC+3X6Kp6EGmliybXOBo2hNcg/tYHwSqgXvUhLlChRokSJEiVKFMK/4Li0E1MRDFEAAAAASUVORK5CYII=>

[image6]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADkAAAAZCAYAAACLtIazAAADlklEQVR4Xu1WO2hUQRR9y0ZQ/H/WNfub3c1qSKW4WERE8AuisdAUQsTCgEoKBS0UwcIihU0KEQRBMIqCiKBglEAKUUGIhUkhSDCoQQgWKglGUIl6Tt6d9b7ZjxEkWLwDh5m5c8/MvTPzZp7nhQgR4r9FsViclUqlVhpj1rp9taB1sVhsntuvEGloaFgOv3rUo26nIMp+sFn8AojH43Mx15JKdtdWBgy4GXwNngfbWU5L6E1ptW6gkjabza7IZDK96LsnfJlOp9dpH9ia4NcP3iXRngR3aB+MUYRtAvwI9sHvJsq34Jj2K4ME+C6ZTKaUrZM2MKd9XVCrdWILaHO53GrUB7RfY2PjfNgeI+gW0bSBP8H7+jSIrQfJzGZbknyA3SygrP/DyfEB0WI4PwOHEUxc2U/KBHu0v4bVap3YA1oJbByBnkVwc2hDmUR7CH1b2Tb+KaAmEIfYBrFAS+1Y4J1pJWcBQR6DjIIPnRU8zgkYsPbXsFp3QlfLABmoBPyK3zDKSyTr9GEJ/y3cIWcsavrs8bdJ8rvEYmxEvcVd5DLIKvOMB5KkmBNgtbu1v4bVuklW0qK+BvYRCfoDeMbuajXIYnCcI9YmSXKcp2A76odQvgG7tDaAmUrS82/Ng+AnSXQMfrtgjyifAHAx7TZqtwn5vm/l8/mF1ob2JvC7V22smUhSHc9rPHYon0uik0xEay3Q12TkaLt9Loz/5PCGrXxJymA8Pu43aW+709pfw2rdJF0tjxvqL+y3w2MK2ynjPxGlm9MCfjCbQSzWMW0n4LuI1DYjSbpPUgmJRGIZA6ATna098/uGbNP+GkobeLS1lglIIu6JiMB+AfYh/iBYI58Z2PvAndLmpdVVKBQWoGT2fJq+gs1Ww/lNrSQ9mQwcRXB5azT+28kdbrI23nzw2aYujCmt1hGOlj7XSda1nyxGaSf5naF9Qycgn8RlVOs4D+M0/pNSenOtveYtKwONo9xvbZi4H+2LqNaxzQHgM2z8b+2w1modV97VygXC4NZbP+xMDO0n9puUBLmDn6EdsUT7G9gpMiZ6Be29dhyC88P2Q9sqIQLHA3B8D55AkPvQ7tX/iNw99N0GJ9C3QWu1DmWPqxWfDuP/EHSD54x/7DrYRwcjb2sVlj4Z7iD0j2C7SruUXzDn0dJstcDVxI5th6DVq3YdV4DWob7Kq6K1fqT7b/uXiMoJauVY+jkJESJEiBAh/iF+AeGtS+nCZZS9AAAAAElFTkSuQmCC>

[image7]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADYAAAAZCAYAAAB6v90+AAAD3klEQVR4Xu2WXWiPURzHn7Up8jrMP3t7nv82lpcLa7iaYnlpFyTUFCtxgXKhiSkuKKXlDqEkTQkTkdxoLaUUylvTVrZskqJmV5QV8/l6zpmzs+c/Kzcu/t/69Zzf+/md8zvnOUGQRRZZJCAniqL6MAy7SktLG8T7BkJ1dfUEbM5gu9LXJUIOxcXF83CY4evGQkFBwZSSkpLFIo19vVBRUVGQJCPfJMvjv4EJvyF/xPcSn7sUuDBwCkSehm4jv6D5WnlGYFwLdRKshe8rqJWkM307H9gdgTqMXzc0BF0tKyub7toxkSbkfdjd4NsGfUH2hO9c6ZFPZHxfvrA56Go0hk5Az6EX+mL3gO/LdDoduvETgWGjDWhlrN4ygry2iZNA8nz0g3zXWxmLUYSsF/qJfLVjq8LmMqFU0kpLF8aFt4gvKioqxudyKpWabG3Q7YGOBxladBRM0gGc1gXGybRFR2Fh4WzPfBgknxXGO9RoZWpF+IdGvtPKlcOOk6ACsG+zhWnHGDdbPboq6LbfCWOCACtx+mEm06ptDuN23Ozb+mACa9xzYnbxmYlV58ibtBDaXeVT61mdY7Mdn7foIsYXFFtyFWPmtdz3+RtycNznFPfOBB3fljtgp1fg/x3qKC8vn2PlpiuuMOetjE8y7ldXBCNz5Goe6N9jt9fodFMeRn7AsRs/uKGmqQ0I8M0U91gr59uNBbVhFB/uAX91ke8P/hShyTZrAbQQjtkomIW6ZruC3ZsP3w71aIHcbhkF23ok2wGbx/irKa5Th9i3T4IuBPyP4dPLd4mv96GWNDmuweb5ekG5tVBMvsLyZp71sLo5D8Ef9NxiqGKU96CzgVlRE/CuEvPd7bkk4XcSbJ9m2OVcty0Fp7BHlZWVU12dYH/CoXPONRf4vtDc1LrYGLf+8XKAYgHUr0SunF1MIe/UIXblCbDnc8S/C78Gc4Y0oa0qwtOPWZgKUmHuryGKj8pwYUHcXRetfgTM9n6ANrlye227O6aW0KXi9rX8oNNer6vYc9jWGJttKiJwWs7KQqdTXKgF/WOQUJjyyD8ReUzgPAbt7ksDvlatZYObHezRZNxi4Qehj7rJLMF/NrIyY5PWRK2PabNWaACqsnILLVLSpVJqXi+2MPh84t7w7YahFsHoOg6foKPQTagrci4BcxZvQV/tTphihzLQMyW2/vB1YRx7Vxg/j7r1urF6F2H8wx+1i8RbFMavmlXio/jBfMq386ErWNhIgGr4XN/gX8FCrCX2FgpamvSsErCpDOPnXSLC+E2rx8M9Yt1Jelz/r8jNVLSDHPcNmUUWWWSRxd/wC3ETIddfmym3AAAAAElFTkSuQmCC>
