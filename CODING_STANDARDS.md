# ESG Platform - Frontend Coding Standards

## Language Requirements

### Code Comments and Documentation
**ALL code comments, docstrings, and documentation MUST be written in English.**

This applies to:
- ✅ Code comments (inline and block comments)
- ✅ Function and method docstrings
- ✅ Component documentation
- ✅ Variable naming (use English words)
- ✅ Interface definitions and types
- ✅ README and documentation files

## React/TypeScript Standards

### Component Documentation

```tsx
/**
 * SustainabilityReportCard Component
 *
 * Displays a summary card showing sustainability metrics and targets.
 * Fetches data from the backend API and renders visual indicators.
 *
 * @param companyId - The unique identifier of the company
 * @param onReportClick - Callback function when report card is clicked
 *
 * @example
 * ```tsx
 * <SustainabilityReportCard
 *   companyId={1}
 *   onReportClick={(report) => console.log(report)}
 * />
 * ```
 */
interface SustainabilityReportCardProps {
  companyId: number;
  onReportClick: (report: Report) => void;
}

export function SustainabilityReportCard({
  companyId,
  onReportClick
}: SustainabilityReportCardProps) {
  // Component implementation
}
```

### Type Definitions

```typescript
/**
 * Represents a sustainability target with progress tracking
 */
interface SustainabilityTarget {
  /** Unique identifier for the target */
  id: string;

  /** Target title describing the goal */
  title: string;

  /** Current progress percentage (0-100) */
  progress: number;

  /** Target year for completion */
  targetYear: number;

  /** Creation timestamp */
  createdAt: Date;
}
```

### Component Comments

```tsx
// Fetch company activities for the dashboard
const { data: activities, loading } = useActivities();

// Show loading spinner while data is being fetched
if (loading) {
  return <LoadingSpinner />;
}

// Calculate total emissions from all activities
const totalEmissions = activities?.reduce((sum, activity) =>
  sum + activity.emissions, 0
) ?? 0;
```

## Naming Conventions

### Components
- Use PascalCase for component names
- Be descriptive and concise
- Avoid abbreviations

```tsx
// ✅ Good
<SustainabilityReportCard />
<CarbonEmissionChart />
<EmployeeDiversityTable />

// ❌ Bad
<StrCard />  // Abbreviation
<CO2Chart />  # Ambiguous
<EmpDiv />   # Abbreviation
```

### Hooks
- Use camelCase starting with 'use'
- Be descriptive of what the hook does

```typescript
// ✅ Good
const useCompanyData = () => { ... };
const useCarbonCalculator = () => { ... };

// ❌ Bad
const useData = () => { ... };  // Too generic
const useComp = () => { ... };   # Abbreviation
```

### Variables and Functions
- Use camelCase
- Use descriptive names
- Avoid single-letter variables except in loops

```typescript
// ✅ Good
const totalCarbonEmissions = calculateTotalEmissions();
const employeeTrainingPercentage = (trained / total) * 100;

for (let i = 0; i < items.length; i++) {
  // i is acceptable for loop counters
}

// ❌ Bad
const t = calculateTotalEmissions();  // Not descriptive
const empTrain = (trained / total) * 100;  // Abbreviation
```

## File Organization

### Directory Structure
```
src/
├── components/       # Reusable UI components
│   ├── ui/            # Base UI components (buttons, inputs, etc.)
│   └── features/      # Feature-specific components
├── pages/            # Page components
├── hooks/            # Custom React hooks
├── lib/              # Utility libraries
├── types/            # TypeScript type definitions
└── utils/            # Helper functions
```

### File Naming
- Components: PascalCase (e.g., `SustainabilityDashboard.tsx`)
- Hooks: camelCase with 'use' prefix (e.g., `useCompanyData.ts`)
- Utilities: camelCase (e.g., `carbonCalculator.ts`)
- Types: camelCase (e.g., `companyTypes.ts`)

## Code Style Guidelines

### TypeScript Configuration
- Strict mode enabled
- No implicit any
- Strict null checks
- Use ESNext modules

### React Best Practices

```tsx
// ✅ Good: Functional component with hooks
interface DashboardProps {
  companyId: number;
}

function Dashboard({ companyId }: DashboardProps) {
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    fetchActivities(companyId).then(setActivities);
  }, [companyId]);

  return (
    <div>
      <h1>Dashboard</h1>
      <ActivityList activities={activities} />
    </div>
  );
}

// ❌ Bad: Missing types, implicit any
function Dashboard({ companyId }) {
  const [activities, setActivities] = useState([]);

  return (
    <div>
      <h1>Dashboard</h1>
      <ActivityList activities={activities} />
    </div>
  );
}
```

### Error Handling

```tsx
// ✅ Good: Proper error handling
const { data, error, isLoading } = useApiCall<Company>(
  `/api/companies/${companyId}`
);

if (error) {
  return <ErrorMessage message={error.message} />;
}

if (isLoading) {
  return <LoadingSpinner />;
}

return <CompanyDashboard data={data} />;
```

## Comment Guidelines

### When to Add Comments
- Explain WHY, not WHAT (code should be self-explanatory)
- Document complex business logic
- Add context for non-obvious decisions
- Explain workarounds for known issues

### Comment Style

```tsx
// ✅ Good: Explains WHY
// Using optimistic updates for better UX, assuming API will succeed
// Rollback will happen automatically if API call fails
const handleAddActivity = async (activity: Activity) => {
  setActivities(prev => [...prev, activity]);
  await apiCall(activity);
};

// ❌ Bad: Explains WHAT (obvious from code)
// Add activity to state
const handleAddActivity = async (activity: Activity) => {
  setActivities(prev => [...prev, activity]);
  await apiCall(activity);
};
```

## ESLint Configuration

The project uses ESLint with TypeScript support. Key rules:

- No console.log in production code
- All imports must be properly typed
- No unused variables
- Consistent quote style (single quotes)
- Proper React hooks dependencies

Run linting:
```bash
npm run lint
npm run lint -- --fix  # Auto-fix issues
```

## Testing

### Test File Naming
- Unit tests: `ComponentName.test.tsx`
- Integration tests: `FeatureName.integration.test.tsx`
- End-to-end tests: `UserFlow.e2e.test.tsx`

### Test Descriptions
Always use English for test descriptions:

```typescript
describe('SustainabilityReport', () => {
  it('should display total emissions correctly', () => {
    // Test implementation
  });

  it('should filter activities by category', () => {
    // Test implementation
  });
});
```

## Commit Message Standards

Follow conventional commits:

```
[type] [scope]: Description in English

Detailed explanation (optional):
- Change 1
- Change 2

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

**Types**: `feat`, `fix`, `refactor`, `docs`, `style`, `test`, `chore`

**Examples**:
```
feat(dashboard): Add carbon emission chart component

- Implement line chart showing emissions over time
- Add category filtering
- Support responsive design

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

## Quality Checklist

Before committing code, verify:

- [ ] All comments are in English
- [ ] All variables use English names
- [ ] Components have proper TypeScript types
- [ ] No `any` types (unless absolutely necessary)
- [ ] No console.log statements
- [ ] Proper error handling
- [ ] Tests pass
- [ ] ESLint passes
- [ ] Commit message is in English

## Internationalization (i18n)

### Current Approach
- User-facing text: Stored in component (can be extracted later)
- API responses: Can be in any language (AI matches user input)
- Error messages: English for developers, localized for users

### Future i18n Implementation
When adding multi-language support:
1. Extract all user-facing strings
2. Use i18n library (react-i18next recommended)
3. Create translation files for each language
4. Update components to use translation keys

## Why English Comments?

1. **Global Collaboration**: International teams can understand code
2. **Industry Standard**: Most open-source React projects
3. **Better Tooling**: AI assistants work better with English
4. **Career Growth**: English code is more transferable
5. **Maintenance**: Easier to debug and modify

---

**Last Updated**: 2026-03-13
**Version**: 1.0.0
