# Inventory Management System

> *A modern, real-time inventory tracking solution for businesses*

---

## 📖 About
This is an Inventory Management System designed to help businesses efficiently track stock levels, manage sales, and generate insightful reports. Built with modern web technologies, it provides a seamless user experience for inventory control and business analytics.

The project was created to solve the common challenges of manual inventory tracking—reducing errors, improving efficiency, and providing real-time insights into business operations.

---

## 🛠 Tech Stack
**Frontend:**
* [Next.js 15](https://nextjs.org/) - React framework for production
* [React](https://reactjs.org/) - UI library
* [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
* [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework

**Backend & Database:**
* [Appwrite](https://appwrite.io/) - Backend-as-a-Service platform
* Authentication & database management

**Development Tools:**
* [ESLint](https://eslint.org/) - Code linting
* [PostCSS](https://postcss.org/) - CSS processing

---

## ✨ Key Features
* **Inventory Management:** Track and manage product stock levels in real-time
* **Sales Tracking:** Monitor sales transactions and history
* **Reports & Analytics:** Generate comprehensive business reports
* **User Authentication:** Secure login and signup functionality
* **Protected Routes:** Role-based access control for different sections
* **Responsive Design:** Seamless experience across desktop and mobile devices
* **Modern UI:** Clean, intuitive interface with sidebar navigation
* **Type Safety:** Full TypeScript implementation for robust code

---

## 🚀 Getting Started
Follow these steps to set up the project locally.

### Prerequisites
* Node.js (v18 or higher)
* npm, yarn, pnpm, or bun
* Appwrite account and project setup

### Installation
1. Clone the repo
   ```sh
   git clone https://github.com/yourusername/inventory-management.git
   cd inventory-management
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. Configure environment variables
   * Create a `.env.local` file in the root directory
   * Add your Appwrite credentials:
   ```env
   NEXT_PUBLIC_APPWRITE_ENDPOINT=your_appwrite_endpoint
   NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_DATABASE_ID=your_database_id
   NEXT_PUBLIC_PRODUCTS_COLLECTION_ID=your_collection_id
   ```

4. Run the development server
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   # or
   bun dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application

---

## 📂 Project Structure
```
├── app/                    # Next.js app directory
│   ├── inventory/         # Inventory management pages
│   ├── sales/             # Sales tracking pages
│   ├── reports/           # Reports and analytics
│   └── signin/signup/     # Authentication pages
├── components/            # Reusable React components
├── lib/                   # Core application logic
│   ├── config/           # Configuration files
│   ├── contexts/         # React contexts
│   ├── hooks/            # Custom React hooks
│   ├── services/         # Business logic services
│   └── types/            # TypeScript type definitions
└── public/               # Static assets
```

---

## 📝 License
This project is open source and available under the [MIT License](LICENSE).

---

*Built with 💻 for learning and portfolio demonstration*
