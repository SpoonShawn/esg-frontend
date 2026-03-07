# ESG Sustainability Platform - Frontend

A responsive web application for managing and analyzing Environmental, Social, and Governance (ESG) data. Built with React, TypeScript, and modern UI components.

## 🚀 Features

### **Core Functionality**
- **Company Management**: Add, edit, and manage company profiles
- **Activity Tracking**: Log and categorize sustainability activities
- **AI-Powered Analysis**: Generate comprehensive ESG analysis reports
- **Real-time Chat Assistant**: AI-powered chat interface for sustainability insights
- **Dashboard Analytics**: Visual representation of ESG metrics and trends
- **Report Generation**: Create detailed sustainability reports

### **AI Chat Assistant**
- **Intelligent Conversations**: Ask questions about sustainability activities
- **Context-Aware**: Understands your company's specific ESG data
- **Chat History**: Persistent conversation history per company
- **Real-time Responses**: Instant AI-powered insights and recommendations
- **Loading States**: Smooth user experience with loading indicators

### **User Experience**
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Modern UI**: Built with shadcn/ui components and Tailwind CSS
- **Dark/Light Mode**: Adaptive theming system
- **Accessibility**: WCAG compliant interface components
- **Real-time Updates**: Live data synchronization

## 🛠️ Technology Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and building
- **UI Components**: shadcn/ui component library
- **Styling**: Tailwind CSS for utility-first styling
- **State Management**: React hooks and local state
- **HTTP Client**: Native fetch API with custom hooks
- **Icons**: Lucide React icon library
- **Forms**: React Hook Form with validation

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── Layout.tsx      # Main layout wrapper
│   ├── ProtectedRoute.tsx  # Authentication guard
│   └── FollowUpQuestionsModal.tsx  # Activity follow-up modal
├── hooks/               # Custom React hooks
│   ├── use-api.ts      # API interaction hook
│   ├── use-mobile.tsx  # Mobile detection hook
│   └── use-toast.ts    # Toast notification hook
├── lib/                 # Utility libraries
│   ├── api.ts          # API configuration and endpoints
│   ├── colors.ts       # Color scheme definitions
│   └── utils.ts        # Helper functions
├── pages/               # Main application pages
│   ├── Dashboard.tsx   # Main dashboard view
│   ├── AI.tsx          # AI chat and analysis interface
│   ├── Activities.tsx  # Activity management
│   ├── CompanyInfo.tsx # Company profile management
│   ├── Reports.tsx     # Report generation
│   └── Analytics.tsx   # Data analytics and charts
└── App.tsx             # Main application component
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Backend API server running (see backend README)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd ESG/frontend

# Install dependencies
npm install

# Set up environment variables
cp env.example .env.local
# Edit .env.local with your backend API URL

# Start development server
npm run dev
```

### Environment Variables

Create a `.env.local` file with:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript type checking
```

### Code Style

- **TypeScript**: Strict type checking enabled
- **ESLint**: Code quality and consistency
- **Prettier**: Automatic code formatting
- **Component Structure**: Functional components with hooks
- **File Naming**: PascalCase for components, camelCase for utilities

## 🎨 UI Components

### Design System

The application uses a comprehensive design system built on:

- **shadcn/ui**: Modern, accessible component library
- **Tailwind CSS**: Utility-first CSS framework
- **Custom Color Palette**: ESG-themed color scheme
- **Responsive Breakpoints**: Mobile-first design approach

### Key Components

- **Cards**: Information containers with consistent styling
- **Buttons**: Interactive elements with hover states
- **Forms**: Validated input fields and controls
- **Modals**: Overlay dialogs for focused interactions
- **Tables**: Data display with sorting and filtering
- **Charts**: Data visualization components

## 🔌 API Integration

### Backend Communication

- **RESTful API**: Standard HTTP methods for data operations
- **Real-time Updates**: Live data synchronization
- **Error Handling**: Comprehensive error management
- **Authentication**: Secure API access with tokens

### Endpoints

- `/api/companies` - Company management
- `/api/activities` - Activity tracking
- `/api/analysis` - AI analysis generation
- `/api/chat` - AI chat functionality
- `/api/reports` - Report generation

## 📱 Responsive Design

### Breakpoints

- **Mobile**: 320px - 768px
- **Tablet**: 768px - 1024px
- **Desktop**: 1024px+

### Mobile Features

- Touch-friendly interface
- Optimized navigation
- Responsive data tables
- Mobile-specific layouts

## 🚀 Deployment

### Production Build

```bash
npm run build
```

### Deployment Options

- **Vercel**: Automatic deployments from Git
- **Netlify**: Static site hosting
- **AWS S3**: Cloud storage hosting
- **Custom Server**: Any Node.js/static hosting

### Environment Configuration

Ensure production environment variables are set:
- API endpoints point to production backend
- Supabase credentials are production keys
- Analytics and monitoring are enabled

## 🤝 Contributing

### Development Workflow

1. Create feature branch from `main`
2. Make changes with proper TypeScript types
3. Test functionality across different screen sizes
4. Update documentation as needed
5. Submit pull request with clear description

### Code Quality

- All components must be TypeScript
- Props interfaces are required
- Error boundaries for error handling
- Accessibility attributes included
- Responsive design considerations

## 📚 Additional Resources

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Vite Documentation](https://vitejs.dev/)

## 📄 License

This project is part of the ESG Sustainability Platform. See the main project README for licensing information.

---

**Built with ❤️ using modern web technologies for a sustainable future.**
