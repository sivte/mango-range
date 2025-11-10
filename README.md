# Mango Range

A React-based range slider component with advanced features including dual thumbs, vertical/horizontal orientation, fixed values, and editable numeric inputs.

## Project Overview

This project demonstrates a modern React application architecture with a focus on component design, state management, and server-side data handling.

## Architecture

### Server-Side Architecture

The application follows a three-layer architecture pattern:

#### 1. **Server Actions Layer**

Server Actions provide the entry point for client-server communication. They handle:

- Error handling
- Calling the appropriate service layer

Located in `app/actions/`, these functions are called directly from React components using Next.js Server Actions.

#### 2. **Service Layer**

Services contain business logic and orchestrate data operations.
Located in `services/`, each service corresponds to a domain entity (e.g., `ExerciseService`).

#### 3. **Repository Layer**

Repositories abstract data access.

- Provide a clean API for data operations
- Handle data fetching/mutations
- Can be easily swapped with real database implementations

Located in `repositories/`, repositories use a mockable database interface.

#### 4. **Database Layer (Mockable)**

The database layer is designed to be mockable for development and testing:

- Uses in-memory data structures for mock implementation
- Can be replaced with actual database clients (PostgreSQL, MongoDB, etc.) without changing upper layers

Located in `db/mock/`, the mock database simulates a real database.

## Range Component Architecture

The Range component is a dual-thumb slider with multiple features.

### Components

#### 1. **Range** (Main Component)

The primary component that orchestrates all functionality:

**Key Responsibilities:**

- State management (min/max values, editing state, dragging state)
- Value calculations and conversions (value ↔ percentage)
- Handling drag interactions via `useDraggable` hook
- Managing numeric input synchronization
- Applying business rules (allowPush, thumbGap, fixedValues)

**Key Features:**

- **Controlled Component**: Requires `minValue` and `maxValue` props
- **Orientation**: Supports horizontal and vertical layouts
- **Fixed Values**: Can snap to predefined values instead of using min/max/step
- **Allow Push**: Thumbs can push each other or stop at boundaries
- **Thumb Gap**: Visual separation when thumbs are too close
- **Numeric Inputs**: Optional editable inputs for precise value entry
- **Format Labels**: Custom formatting for displayed values (currency, percentages, etc.)

**Props:**

```typescript
{
  min?: number                    // Minimum value (auto-calculated with fixedValues)
  max?: number                    // Maximum value (auto-calculated with fixedValues)
  minValue: number                // Current minimum value (controlled)
  maxValue: number                // Current maximum value (controlled)
  onChange?: (min: number, max: number) => void
  orientation?: "horizontal" | "vertical"
  step?: number                   // Increment step
  disabled?: boolean              // Disable all interactions
  className?: string
  allowPush?: boolean             // Allow thumbs to push each other
  thumbGap?: number               // Visual separation between thumbs
  showInputs?: boolean            // Show numeric inputs
  disabledInputs?: boolean        // Disable only inputs (slider still works)
  fixedValues?: number[]          // Array of allowed values
  formatLabel?: (value: number) => string  // Format display values
}
```

#### 2. **Thumb** (Sub-component)

Renders individual draggable thumb handles.

**Responsibilities:**

- Positioning based on percentage coordinates
- Visual feedback for drag state
- Touch and mouse event handling
- 2D positioning (supports both X and Y movement)

**Props:**

```typescript
{
  id: string                      // Unique identifier
  percentageX: number             // Horizontal position (0-100)
  percentageY: number             // Vertical position (0-100)
  isDragging: boolean             // Active drag state
  onMouseDown?: (e: React.MouseEvent) => void
  onTouchStart?: (e: React.TouchEvent) => void
}
```

#### 3. **RangeBar** (Sub-component)

Renders the track and active range visualization.

**Responsibilities:**

- Displaying inactive track (background)
- Displaying active track (selected range)
- Adapting to horizontal/vertical orientation

**Props:**

```typescript
{
  minPercentage: number; // Start of active range (0-100)
  maxPercentage: number; // End of active range (0-100)
  orientation: "horizontal" | "vertical";
}
```

#### 4. **NumericInput** (Shared Component)

Editable numeric input fields for precise value entry.

**Responsibilities:**

- Display formatted or raw values based on focus state
- Handle keyboard event (Enter to apply)
- Blur to apply changes

**Features:**

- Shows formatted value when not focused (e.g., "€250")
- Shows raw value when focused for editing (e.g., "250")

### Styling

CSS Modules are used for component styling to maintain framework independence:

- `Range.module.css`: Main component styles
- `RangeBar.module.css`: Track and active range styles
- `Thumb.module.css`: Thumb handle styles

**Framework Agnostic Design:**

The Range component deliberately uses CSS Modules instead of utility frameworks (like Tailwind CSS).

Note: While the demo pages (`/exercise/[id]`) use Tailwind CSS for layout and styling, the core Range component and its subcomponents are completely framework-agnostic and can be used in any React application.

## Usage Examples

### Basic Range

```typescript
<Range
  min={0}
  max={100}
  minValue={25}
  maxValue={75}
  onChange={(min, max) => console.log(min, max)}
/>
```

### Fixed Values with Currency Formatting

```typescript
<Range
  fixedValues={[1.99, 5.99, 10.99, 25.99, 50.99, 70.99]}
  minValue={5.99}
  maxValue={25.99}
  onChange={(min, max) => console.log(min, max)}
  formatLabel={(value) => `€${value.toFixed(2)}`}
  showInputs
/>
```

### Vertical with Inputs

```typescript
<Range
  min={0}
  max={1000}
  minValue={250}
  maxValue={750}
  onChange={(min, max) => console.log(min, max)}
  orientation="vertical"
  showInputs
  step={10}
  allowPush={false}
/>
```

## Development

### Running the Project

```bash
pnpm i
pnpm dev
```

### Testing

```bash
pnpm test
```

### Project Structure

```
/app
  /actions          # Server Actions
  /exercise/[id]    # Exercise detail page
  /test             # Range component testing page
/components
  /ui
    /Range          # Main Range component
    /NumericInput   # Shared input component
/services           # Business logic layer
/repositories       # Data access layer
/db/mock            # Mock database
/hooks              # Custom React hooks
/types              # TypeScript type definitions
```
