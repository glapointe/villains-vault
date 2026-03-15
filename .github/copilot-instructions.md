# Copilot Instructions for Villains Vault

## Project Overview
React Native (Expo) + .NET 10 full-stack app. Cross-platform web/iOS/Android with Auth0 social authentication.

## Architecture

**Monorepo**: `src/app/` (frontend), `src/api/` (backend)

**Routing**: Expo Router v6 with file-based routing
- `(auth)/` and `(tabs)/` = groups (parentheses not in URLs)
- `(tabs)/` routes are protected, check auth in `_layout.tsx`
- Logout: `router.push('/(auth)/login')`

**Auth**: Platform-specific providers unified via `hooks/useAuth.ts`
- Web: `@auth0/auth0-react`, Native: `react-native-auth0`
- Components use `useAuth()` hook, never import providers directly

## Theme System (CRITICAL)

**Three-tier architecture** for dark mode support:

1. **`theme/tokens.ts`** - spacing, typography, borderRadius, shadows (import from `theme`, not `theme/tokens`)
2. **`theme/index.ts`** - `getThemedColors(isDark)`, color palettes, re-exports tokens
3. **`theme/commonStyles.ts`** - layout, text, components (no colors)

**Component Style Pattern (MANDATORY)** - Always use separate styles files:

**NEVER** define styles inline in components. **ALWAYS** create a separate `.styles.ts` file.

```typescript
// Component.styles.ts
import { spacing, typography } from '../../../theme';
import type { ThemeColors } from '../../../theme';

export const styles = StyleSheet.create({
	container: { padding: spacing.md } // structure only, NO colors
});

export const getThemedStyles = (colors: ThemeColors) => StyleSheet.create({
	container: { backgroundColor: colors.surface } // colors only
});

// Component.tsx
import { styles, getThemedStyles } from './Component.styles';

const { isDark } = useTheme();
const colors = getThemedColors(isDark);
const themedStyles = getThemedStyles(colors);
return <View style={[styles.container, themedStyles.container]} />;
```

**Semantic colors** (never use hex):
- Text: `textPrimary`, `textSecondary`, `textTertiary`, `textDisabled`, `textInverse`
- Surfaces: `background`, `surface`, `surfaceElevated`, `overlay`
- Borders: `border`, `borderLight`, `borderFocus`
- Brand: `primary`, `primaryHover`, `secondary`, `buttonPrimary`, `buttonGhost`
- Semantic: `success`, `warning`, `error`, `info` (+ `*Subtle` variants)

**Rules**: Separate structure from colors, use tokens from `theme`, check `commonStyles` before creating new styles

**Typography lineHeight (CRITICAL)**:
- `lineHeight` values are **multipliers**, not pixels
- Always multiply: `lineHeight: fontSize * lineHeightMultiplier`
- ❌ Wrong: `lineHeight: typography.lineHeight.relaxed` (becomes 1.75px!)
- ✅ Correct: `lineHeight: typography.fontSize.base * typography.lineHeight.relaxed`

## Types Organization
- **`models/`** - Domain types (User, Event, Race), barrel export via `models/index.ts`
- **`types/`** - Framework types (svg.d.ts, React Native augmentations)
- No "I" prefix on interfaces

## Components
- **`components/ui/`** - Button, Card, LoadingSpinner (use variant pattern)
- **`components/layout/`** - AppHeader, layout components
- Export from `components/[category]/index.ts` barrel files

## Platform-Specific Components (CRITICAL)

When a component has different web and native implementations, use the **`require()` + `Platform.OS` pattern** in `index.ts`. This allows Metro to tree-shake the unused platform branch and prevents web-only dependencies (e.g. `plotly.js`, `victory`, `jszip`) from being bundled into native builds.

**File structure:**
```
MyComponent/
  MyComponent.web.tsx       # Web implementation
  MyComponent.native.tsx    # Native implementation
  MyComponent.types.ts      # Shared prop types/interfaces
  MyComponent.styles.ts     # Shared structural styles (no colors)
  MyComponent.logic.ts      # Shared business logic (if needed)
  index.ts                  # Platform router (see pattern below)
```

**`index.ts` pattern (MANDATORY) — matches Weather, Tooltip, Dropdown, KillChart, PaceChart, AgeGroupChart:**
```typescript
import { Platform } from 'react-native';
import type { MyComponentProps } from './MyComponent.types';

// Shared types - always available regardless of platform
export type { MyComponentProps } from './MyComponent.types';

// Platform-specific component export
export const MyComponent: React.FC<MyComponentProps> = Platform.OS === 'web'
	? require('./MyComponent.web').MyComponent
	: require('./MyComponent.native').MyComponent;
```

**Rules:**
- ❌ NEVER use static `import` to load both platform files in `index.ts` — both branches are bundled
- ❌ NEVER use an inline `Platform.OS` ternary inside a single shared file that imports web-only libs
- ✅ Shared prop types go in `MyComponent.types.ts`, imported with `import type` (erased at runtime)
- ✅ If a component is **web-only** (e.g. admin tools), provide a no-op native stub: `export const MyComponent = () => null;`

## API
- Services in `services/api/` modules
- Types in `models/` (not `types/`)
- Auth token auto-injected after login

## Code Style
- Tabs (not spaces)
- Explicit TypeScript types, no "I" prefix
- JSDoc for exports
- Design tokens from `theme/`, semantic colors only