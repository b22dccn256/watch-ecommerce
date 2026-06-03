# Watch E-Commerce Platform 🛒

An advanced e-commerce platform built with the MERN stack (MongoDB, Express, React, Node.js), featuring a robust backend with Redis caching, BullMQ message queues, secure authentication (JWT & OAuth), and modern payment integrations (Stripe, VNPay).

## 📂 Project Structure

- **`backend/`**: Node.js & Express API server. Handles business logic, database interactions, background jobs, and third-party integrations.
- **`frontend/`**: React application built with Vite and Tailwind CSS.
- **`scripts/`**: Utility scripts for database seeding, migrations, and development tasks.
- **`UI-Design/`**: UI/UX design assets and mockups.
- **`uploads/`**: Local storage directory for user uploads (if not using Cloudinary).

## 🚀 Getting Started (Local Development)

There are two primary ways to run this project locally: **Using Docker** or **Manual Setup (Recommended for coding)**.

### Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v18 or higher)
- [Git](https://git-scm.com/)
- _Optional but recommended:_ [Docker Desktop](https://www.docker.com/products/docker-desktop) (for easy database setup)
- _If not using Docker:_ MongoDB and Redis installed and running locally.

---

### Option 1: Manual Setup (For Active Development)

Use this method if you want to actively modify the code and see real-time updates (Hot Reloading).

#### 1. Setup Databases

Ensure you have **MongoDB** (running on `localhost:27017`) and **Redis** (running on `localhost:6379`) active on your machine. _(Mẹo: Bạn có thể dùng Docker chỉ để chạy Mongo và Redis cho tiện)._

#### 2. Install Dependencies

Run the following command from the root directory to install dependencies for both frontend and backend concurrently:

```bash
npm run install:all
```

#### 3. Configure Environment Variables

Navigate to the `backend/` folder and duplicate `.env.example` to `.env`:

```bash
cp backend/.env.example backend/.env
# On Windows, you can just manually copy and paste the file and rename it to .env
```

Fill in the necessary credentials in `backend/.env`:

- `MONGO_URI`: Your MongoDB connection string (e.g., `mongodb://localhost:27017/watchstore_db`).
- `UPSTASH_REDIS_URL` or `REDIS_URL`: Your Redis connection string (e.g., `redis://localhost:6379`).
- `ACCESS_TOKEN_SECRET` & `REFRESH_TOKEN_SECRET`: Random secure strings.
- Keys for **Cloudinary** (Image Uploads), **Stripe/VNPay** (Payments), and **SMTP/Email** settings.

#### 4. Run the Development Servers

From the root directory, start both the React frontend and Node backend concurrently:

```bash
npm run dev
```

- Frontend will run on: `http://localhost:5173`
- Backend will run on: `http://localhost:5000`

---

### Option 2: Run via Docker (Easiest Method to Demo)

This method spins up the entire stack (MongoDB, Redis, Backend, and Frontend) inside isolated Docker containers.

1. **Configure Environment Variables:**
   - Copy the `.env.example` file in the backend to `.env` and fill in API keys like Cloudinary and Stripe.
   - _Note: Docker will automatically inject the correct Database and Redis URIs for you._

2. **Start the containers:**
   From the root folder, run:

   ```bash
   npm run docker:up
   # Alternatively: docker-compose up --build -d
   ```

3. **Access the application:**
   - Frontend: `http://localhost:80`
   - Backend API: `http://localhost:5000`

4. **Stop the containers:**
   ```bash
   npm run docker:down
   ```

---

## 🛠️ Useful Scripts (Run from root folder)

- `npm run dev`: Starts both client and server in development mode.
- `npm run install:all`: Installs root, frontend, and backend `node_modules`.
- `npm run seed:admin`: Creates a default admin account.
- `npm run seed:real`: Populates the database with sample products.
- `npm run docker:logs`: View logs of running Docker containers.

## 🔑 Technologies Used

- **Frontend:** React.js, Vite, Tailwind CSS.
- **Backend:** Node.js, Express.js, MongoDB (Mongoose).
- **Caching & Queues:** Redis, BullMQ.
- **Security:** Passport.js (OAuth), JWT, Bcrypt, Helmet, Rate Limit.
- **Payments:** Stripe, VNPay.
- **DevOps:** Docker, Docker Compose.

## 📄 License

This project is licensed under the MIT License.
