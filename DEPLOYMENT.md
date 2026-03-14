# Deployment Guide: QuizAI

This guide provides step-by-step instructions to deploy the QuizAI application. The backend (Django) will be deployed to **Render**, and the frontend (Next.js) will be deployed to **Vercel**. 

Both platforms offer excellent free tiers suitable for this project.

---

## Part 1: Prerequisites

Before deploying, ensure your code is pushed to a GitHub repository.
1. Create a new repository on GitHub (e.g., `quiz-ai`).
2. Push your entire project folder (including both `frontend` and `backend`) to this repository.

---

## Part 2: Deploy Backend to Render

Render is a platform-as-a-service (PaaS) that makes deploying Django apps very simple and includes a free PostgreSQL database.

### Step 1: Create a PostgreSQL Database
1. Go to [Render](https://render.com/) and create an account.
2. Click **New** -> **PostgreSQL**.
3. Name it (e.g., `quiz-db`), select the **Free** instance type, and click **Create Database**.
4. Once created, copy the **Internal Database URL** (we'll use this later).

postgresql://quiz_db_fs0m_user:d0IgITL19DG9YmdYW7Wdymadyii4U0Fd@dpg-d6qjb4q4d50c73bea5ag-a/quiz_db_fs0m

### Step 2: Deploy the Django Web Service
1. Click **New** -> **Web Service**.
2. Connect your GitHub account and select your `quiz-ai` repository.
3. Configure the service:
   - **Name**: `quizai-backend`
   - **Root Directory**: `backend` (This is crucial since your repo has frontend/backend folders)
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate`
   - **Start Command**: `gunicorn quiz_project.wsgi:application`
   - **Instance Type**: Free

### Step 3: Set Environment Variables
Scroll down to the **Advanced** section and click **Add Environment Variable**. Add the following:

| Key | Value |
|---|---|
| `PYTHON_VERSION` | `3.11.0` (or whatever python version you used locally) |
| `DJANGO_SECRET_KEY` | *(Generate a random long string, e.g., using `python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'`)* |
| `DEBUG` | `False` |
| `ALLOWED_HOSTS` | `quizai-backend.onrender.com` (replace with your actual Render URL) |
| `DATABASE_URL` | *(Paste the Internal Database URL you copied in Step 1)* |
| `CORS_ALLOWED_ORIGINS` | `https://quizai-frontend.vercel.app` (We will get this exact URL in Part 3) |
| `GROQ_API_KEY` | *(Your actual Groq API Key)* |

### Step 4: Deploy Let it Build
Click **Create Web Service**. Render will now install dependencies, run migrations, and start your Django server. 
- Wait until it says "Live".
- Note the public URL provided by Render (e.g., `https://quizai-backend-xxxx.onrender.com`).

https://quizai-backend-9bch.onrender.com
---

## Part 3: Deploy Frontend to Vercel

Vercel is the creator of Next.js and provides the smoothest deployment experience.

### Step 1: Create a new Vercel Project
1. Go to [Vercel](https://vercel.com/) and create an account using your GitHub.
2. Click **Add New** -> **Project**.
3. Import your `quiz-ai` repository from GitHub.

### Step 2: Configure the Project
1. In the "Configure Project" screen, look for **Root Directory**.
2. Click **Edit**, select the `frontend` folder, and save. Vercel will automatically detect that it's a Next.js project.
3. Leave the Build and Output Settings as default.

### Step 3: Add Environment Variables
Expand the **Environment Variables** section and add:

| Key | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://quizai-backend-xxxx.onrender.com/api` *(Use the Render URL you got from Part 2. Make sure it ends with `/api` and has NO trailing slash)* |

### Step 4: Deploy
Click **Deploy**. Vercel will build your Next.js application and assign it a public URL (e.g., `https://quiz-ai-frontend.vercel.app`).

---

## Part 4: Final Connection (CORS Update)

Now that Vercel has given your frontend a URL, you need to tell your Django backend to allow requests from it.

1. Go back to your Render Dashboard.
2. Select your `quizai-backend` Web Service.
3. Go to the **Environment** tab.
4. Edit the `CORS_ALLOWED_ORIGINS` variable.
5. Set its value to your Vercel frontend URL: `https://quiz-ai-frontend.vercel.app` (ensure there is no trailing slash `/`).
6. Save the changes. Render will automatically restart your backend.

---

## 🎉 Done!
Your full-stack application is now live on the internet. 

- **Frontend:** Access your app via the Vercel URL.
- **Backend API:** Hosted on Render.
- **Database:** Hosted on Render PostgreSQL.
- **AI Engine:** Running via Groq.
