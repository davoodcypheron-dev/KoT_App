# Antigravity KOT Application

A modern, high-performance Kitchen Order Ticket (KOT) and Point of Sale (POS) system built with React and Vite.

## 🚀 Getting Started

### Prerequisites
- Node.js (Latest LTS version recommended)
- npm or yarn

### Installation
1. Clone the repository or navigate to the project directory.
2. Install dependencies:
   ```bash
   npm install
   ```

### Running Locally
To start the development server:
```bash
npm run dev
```
The application will be available at `http://localhost:5173` (or the port specified in your terminal).

## 🔑 Login & Access Details

The system comes pre-loaded with default user accounts for different roles.

| Role | Username | Password |
| :--- | :--- | :--- |
| **Admin** | `Admin` | `1234` |
| **Manager** | `Manager` | `pass` |
| **Cashier** | `Chasier` | `1234` |
| **User** | `User` | `user` |

### Waiter PINs (for Authorization/Table Opening)
| Waiter Name | PIN |
| :--- | :--- |
| Anil Das | `1234` |
| Sanjay Kumar | `1111` |
| Rahul Sharma | `2222` |
| Vikram Singh | `3333` |
| Prakash Raj | `4444` |
| Amit Verma | `5555` |

## 🛠 Tech Stack
- **Frontend**: React, Vite
- **Styling**: Tailwind CSS / Vanilla CSS
- **Database**: IndexedDB (Local Browser Storage) via custom wrapper
- **Icons**: Lucide React
- **Animations**: Framer Motion

## 📖 Key Features
- **Dine-In Management**: Single table multi-order logic with virtual table support.
- **Order Flow**: Real-time KOT generation, billing, and settlement.
- **Customizable**: Configurable PAX mandatory, tax rates, and discount limits.
- **Reports**: Order history and delivery dashboard.
