# 🛒 Django E-Commerce Web Application

A full-stack E-Commerce web application built using Django with secure authentication, product management, shopping cart, and order processing system.

---

## 🚀 Features

- User Registration & Login (Django Authentication)
- Role-based access control (User & Admin)
- Product listing with category filtering
- Product detail page
- Add to Cart / Remove from Cart
- Dynamic cart with quantity update
- Checkout system with order creation
- Stock validation before order placement
- Order history tracking
- Django Admin panel for managing products & orders
- Responsive UI using Bootstrap

---

## 🛠 Tech Stack

- Python
- Django
- SQLite
- HTML5
- CSS3
- Bootstrap 5

---

## 🗃 Database Models

- User
- Category
- Product
- Cart
- Order
- OrderItem

---

## ⚙️ Installation Guide

1. Clone the repository

```bash
git clone https://github.com/yourusername/django-ecommerce-webapp.git
cd django-ecommerce-webapp
```

2. Create Virtual Environment

```bash
python -m venv venv
venv\Scripts\activate   # Windows
```

3. Install Dependencies

```bash
pip install -r requirements.txt
```

4. Apply Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

5. Create Superuser

```bash
python manage.py createsuperuser
```

6. Run Server

```bash
python manage.py runserver
```

Open in browser:
```
http://127.0.0.1:8000/
```

---

## 📊 Project Highlights

- Designed relational database models using Django ORM
- Implemented secure authentication and session handling
- Applied stock validation during checkout
- Followed clean folder structure and MVC architecture
- Responsive UI with Bootstrap

---

## 📌 Future Improvements

- Payment gateway integration (Stripe/Razorpay)
- Wishlist feature
- Product reviews & ratings
- Email notifications
- Coupon system

---

## 👨‍💻 Author

Aadarsh Kumar
B.Tech Engineering Student  
