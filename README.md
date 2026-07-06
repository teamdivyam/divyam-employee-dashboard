# Divyam Employee Dashboard Frontend
<!-- hi -->
A modern, enterprise-grade React-based employee dashboard built with Vite, featuring comprehensive employee management, inventory control, and real-time data visualization capabilities.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Development](#development)
- [Build & Deployment](#build--deployment)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [API Integration](#api-integration)
- [State Management](#state-management)
- [Security](#security)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [Support](#support)

## Overview

Divyam Employee Dashboard is a full-featured employee interface designed to streamline business operations through centralized management of employees, inventory, and organizational settings. The application provides a user-friendly interface with role-based access control, real-time data synchronization, and comprehensive analytics capabilities.

**Project Name:** employeedashboard  
**Version:** 0.0.0  
**Type:** React SPA (Single Page Application)  
**Build Tool:** Vite  
**Package Manager:** npm

## Features

### Core Functionality

- **Authentication & Authorization**
  - JWT-based user authentication
  - Role-based access control (RBAC)
  - Secure login/registration with reCAPTCHA verification
  - Password reset and change functionality

- **Employee Management**
  - Create, read, update, and delete employee records
  - Employee search and filtering capabilities
  - Password change functionality for employees
  - Comprehensive employee data pagination

- **Inventory Management**
  - **Products:** Full product lifecycle management with pricing and categorization
  - **Stock:** Real-time inventory tracking and stock level management
  - **Packages:** Package configuration and bundle management
  - Inventory reporting and analytics

- **Area & Region Management**
  - Geographic area configuration
  - Area-based resource allocation

- **Dashboard Analytics**
  - Real-time data visualization with charts and graphs
  - Latest stock creation tracking
  - Upcoming orders monitoring
  - Key metrics and KPIs

- **User Experience**
  - Dark mode/Light mode theme switching
  - Responsive design for desktop and tablet
  - Intuitive navigation and breadcrumb support
  - Toast notifications for user feedback
  - Smooth animations and transitions

- **Payment Integration**
  - Razorpay payment gateway integration
  - Secure payment processing

## Tech Stack

### Frontend Framework & Build
- **React** 19.2.3 - UI library
- **Vite** 6.0.1 - Build tool with HMR (Hot Module Replacement)
- **React Router** 7.0.2 - Client-side routing

### State Management
- **Redux Toolkit** 2.5.0 - State management
- **React Redux** 9.2.0 - React bindings for Redux
- **TanStack React Query** 5.85.3 - Server state management

### UI & Styling
- **TailwindCSS** 3.4.16 - Utility-first CSS framework
- **Radix UI** - Accessible component library (accordion, alert, avatar, checkbox, dialog, dropdown, select, tabs, tooltip, etc.)
- **Lucide React** 0.468.0 - Icon library
- **Framer Motion** 12.38.0 - Animation library
- **Sonner** 0.4.0 - Toast notifications

### Forms & Validation
- **React Hook Form** 7.68.0 - Form state management
- **Zod** 4.1.13 - TypeScript-first schema validation
- **Yup** 1.5.0 - Object schema validation
- **@hookform/resolvers** 3.10.0 - Resolvers for Hook Form

### Data & Utilities
- **Recharts** 2.15.0 - React charting library
- **date-fns** 3.6.0 - Modern date utility library
- **date-fns-tz** 3.2.0 - Timezone support for date-fns
- **moment** 2.30.1 - Date manipulation library
- **lodash.debounce** 4.0.8 - Debounce utility
- **react-fast-compare** 3.2.2 - Fast deep equality comparison

### Security & Authentication
- **jwt-decode** 4.0.0 - JWT decoding
- **react-google-recaptcha** 3.1.0 - reCAPTCHA v2 integration
- **react-google-recaptcha-v3** 1.11.0 - reCAPTCHA v3 integration

### Payment Processing
- **razorpay** 2.9.6 - Payment gateway integration

### Other Libraries
- **next-themes** 0.4.6 - Theme management
- **clsx** 2.1.1 - Utility for constructing className strings
- **class-variance-authority** 0.7.1 - Type-safe CSS variants
- **tailwind-merge** 2.5.5 - Merge Tailwind CSS classes
- **cmdk** 1.0.0 - Command menu component
- **react-day-picker** 8.10.1 - Date picker component
- **rollup-plugin-visualizer** 6.0.3 - Bundle visualization

### Development Tools
- **ESLint** 9.15.0 - Code linting
- **Autoprefixer** 10.4.20 - PostCSS plugin for vendor prefixes
- **PostCSS** 8.4.49 - CSS transformations

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 16.x or higher (recommended: 18.x LTS)
- **npm** 8.x or higher (or yarn/pnpm)
- **Git** for version control

### Verify Installation

```bash
node --version    # v18.x.x
npm --version     # 8.x.x or higher
git --version     # git version 2.x.x
```

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/teamdivyam/divyam-employee-dashboard.git
cd divyam-employee-frontend
```

### 2. Install Dependencies

```bash
npm install
```

This installs all required packages listed in `package.json` including React, Vite, Redux Toolkit, and all UI components.

### 3. Verify Installation

```bash
npm run dev --version
```

## Configuration

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Backend API Configuration
VITE_BACKEND_URL=http://localhost:3000
# Production: VITE_BACKEND_URL=https://api.divyam.com

# Frontend Application URL
VITE_APP_URL=http://localhost:5173
# Production: VITE_APP_URL=https://admin.divyam.com

# CDN/Asset Configuration
VITE_IMG_PATH=https://assets.divyam.com
# Alternative: VITE_IMG_PATH=https://d3lnbhsbcabqkl.cloudfront.net

# reCAPTCHA Configuration
VITE_SITE_KEY_RECAPTCHA=your_recaptcha_site_key

# Feature Flags
VITE_SHOW_REGISTER_PAGE=true

# Environment Mode
VITE_PRODUCTION=development
# Production: VITE_PRODUCTION=production
```

### Environment Variable Usage

Access environment variables in your code using `import.meta.env`:

```javascript
import { config } from './config.js';

console.log(config.BACKEND_URL);    // Backend URL
console.log(config.APP_URL);        // Frontend URL
console.log(config.IMAGE_CDN);      // Image CDN
console.log(config.PRODUCTION_MODE); // Environment mode
```

### Build Configuration

- **Vite Config:** `vite.config.js` - Configure build optimization and aliases
- **Tailwind Config:** `tailwind.config.js` - Customize Tailwind theme
- **PostCSS Config:** `postcss.config.js` - CSS processing pipeline
- **ESLint Config:** `eslint.config.js` - Code quality rules
- **TypeScript Config:** `tsconfig.json` - TypeScript settings

## Development

### Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173` with Hot Module Replacement (HMR) enabled.

### Development Features

- **Hot Reload:** Changes to files are instantly reflected in the browser
- **Source Maps:** Full debugging support in browser DevTools
- **API Proxy:** Backend calls proxied to configured `VITE_BACKEND_URL`

### Code Quality

#### Linting

```bash
npm run lint
```

Runs ESLint to check code quality and style compliance. Fix issues automatically:

```bash
npm run lint -- --fix
```

#### Pre-commit Checks

Ensure code quality before committing:

```bash
npm run lint
npm run build  # Verify build succeeds
```

## Build & Deployment

### Production Build

```bash
npm run build
```

Generates optimized production build in the `dist/` directory:

- JavaScript files are minified and split into chunks
- CSS is optimized and purged of unused styles
- Assets are optimized and cache-busted
- Bundle analysis available via `dist/stats.html`

### Preview Production Build

```bash
npm run preview
```

Serves the production build locally for testing before deployment.

### Build Optimization

The project includes advanced build optimizations:

- **Code Splitting:** Vendor and app code separated for better caching
- **Tree-shaking:** Unused code removed from bundles
- **Chunk Splitting:** Node modules chunked by package for browser caching
- **Bundle Visualization:** `rollup-plugin-visualizer` generates stats

## Architecture

### Design Patterns

#### 1. **Component-Based Architecture**
- Modular, reusable UI components
- Feature-based folder organization
- Clear separation of concerns

#### 2. **State Management**
```
Redux (Global State)
├── Auth Slice (User authentication & authorization)
├── Theme Slice (Light/Dark mode)
└── Additional Slices (Domain-specific state)

React Query (Server State)
└── Handles API data caching and synchronization
```

#### 3. **Data Flow**
```
User Interaction → Component → Action/Query → API → Redux/Query → UI Update
```

#### 4. **Service Layer**
- Centralized API calls
- Request/response interceptors
- Error handling and retry logic

### Authentication Flow

```
1. User enters credentials
2. Frontend validates with reCAPTCHA
3. API authenticates and returns JWT token
4. Token stored in Redux store
5. All subsequent requests include token in Authorization header
6. Automatic token refresh on expiry
7. Logout clears token from store
```

## API Integration

### Backend URL

The application communicates with backend API configured via `VITE_BACKEND_URL`:

```javascript
// config.js
const API_BASE = config.BACKEND_URL; // e.g., http://localhost:3000
```

### Request Headers

```javascript
{
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${jwtToken}`,
  'Accept': 'application/json'
}
```

### Error Handling

- 401 Unauthorized → Redirect to login
- 403 Forbidden → Show access denied message
- 500+ Server Error → Show error toast notification
- Network Error → Retry with exponential backoff

## State Management

### Redux Store Structure

```javascript
store: {
  auth: {
    user: { id, email, role, permissions },
    token: 'jwt_token',
    isAuthenticated: boolean,
    loading: boolean,
    error: null
  },
  theme: {
    mode: 'light' | 'dark',
    primaryColor: '#...'
  },
  // Additional domain slices
}
```

### Query Management

React Query handles:
- Automatic background data refetching
- Cache invalidation strategies
- Loading and error states
- Pagination and infinite queries

### Usage Example

```javascript
// Using Redux
import { useDispatch, useSelector } from 'react-redux';
const user = useSelector(state => state.auth.user);

// Using React Query
import { useQuery } from '@tanstack/react-query';
const { data, isLoading, error } = useQuery({
  queryKey: ['employees'],
  queryFn: fetchEmployees
});
```

## Security

### Implementation Best Practices

1. **Authentication**
   - JWT tokens with expiration
   - Secure token storage (Redux store, HttpOnly cookies for sensitive ops)
   - Token refresh mechanism

2. **reCAPTCHA**
   - v2 for traditional forms
   - v3 for invisible verification
   - Site key: `VITE_SITE_KEY_RECAPTCHA`

3. **Authorization**
   - Role-based access control (RBAC)
   - Route guards for protected pages
   - Permission verification before API calls

4. **Data Protection**
   - HTTPS for all communications (production)
   - Password hashing on backend
   - Sensitive data not logged

5. **Input Validation**
   - Frontend validation with Zod/Yup
   - Backend validation enforced
   - XSS prevention via React's built-in escaping

### Sensitive Data Handling

```javascript
// ✅ SECURE: Use environment variables for keys
const recaptchaKey = config.SITE_KEY_RECAPTCHA;

// ❌ INSECURE: Don't hardcode secrets
const apiKey = 'sk_live_xxx...';
```

## Testing

### Running Tests

```bash
# Execute test suite
npm run test

# Run tests with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

### Test Structure

```
src/
├── __tests__/
│   ├── components/
│   ├── pages/
│   ├── utils/
│   └── store/
└── [Source files with .test.js or .spec.js]
```

### Testing Best Practices

- Unit tests for utility functions
- Component tests with React Testing Library
- Integration tests for user workflows
- Mock API responses with MSW (Mock Service Worker)

## Troubleshooting

### Common Issues & Solutions

#### 1. Port Already in Use
```bash
# Development server won't start on port 5173
# Solution: Use a different port
npm run dev -- --port 5174
```

#### 2. CORS Errors
```bash
# API requests blocked by CORS
# Verify VITE_BACKEND_URL is correct
# Check backend CORS configuration
# Ensure backend allows requests from VITE_APP_URL
```

#### 3. Build Fails
```bash
# Clear cache and reinstall
rm -rf node_modules dist
npm install
npm run build
```

#### 4. Environment Variables Not Loading
```bash
# Ensure .env file exists in root directory
# Variables must be prefixed with VITE_
# Restart dev server after .env changes
```

#### 5. Theme Not Persisting
```bash
# Verify localStorage is enabled
# Check browser DevTools > Application > Storage
# Clear cache: Hard refresh (Ctrl+Shift+R)
```

### Debug Mode

Enable debug logging:

```javascript
// In development
if (config.PRODUCTION_MODE === 'development') {
  window.DEBUG = true;
  console.log = (msg) => console.log('[DEBUG]', msg);
}
```

### Browser DevTools Tips

1. **React DevTools**: Inspect component tree and props
2. **Redux DevTools**: Monitor state changes over time
3. **Network Tab**: Monitor API requests/responses
4. **Console**: Check for warnings and errors
5. **Lighthouse**: Audit performance and accessibility

## Contributing

### Getting Started

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Run tests and linting: `npm run lint`
5. Commit with clear message: `git commit -m 'feat: add new feature'`
6. Push to branch: `git push origin feature/your-feature`
7. Open a Pull Request

### Code Standards

- Follow ESLint configuration
- Use meaningful variable and function names
- Add comments for complex logic
- Write reusable, modular components
- Test your changes

### Git Commit Convention

```
feat:   new feature
fix:    bug fix
docs:   documentation
style:  code style changes (formatting, missing semicolons)
refactor: code refactoring without feature changes
test:   adding or updating tests
chore:  build process, dependencies, tooling
```

## Support

### Getting Help

- **Documentation**: Check README and inline code comments
- **Issues**: Open GitHub issue with detailed description
- **Discussion**: Use GitHub Discussions for questions
- **Contact**: Reach out to the development team

### Reporting Bugs

When reporting bugs, include:
- Detailed description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Browser and OS information
- Screenshots/error logs if applicable

### Performance Monitoring

Monitor application performance:

```bash
# Build analysis
npm run build
# View dist/stats.html for bundle breakdown

# Development profiling
# Open Chrome DevTools > Performance > Record
```

---

**Last Updated:** June 2, 2026  
**Version:** 1.0.0  
**Maintainer:** Team Divyam  
**License:** Proprietary
