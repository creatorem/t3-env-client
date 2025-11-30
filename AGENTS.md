# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

The project uses pnpm workspaces. Key commands:

- `pnpm build` - Build all packages (runs recursive build command)
- `pnpm vitest run` - Run all tests with Vitest
- `pnpm vitest run <path>` - Run specific test file (e.g., `packages/zod/src/v4/classic/tests/string.test.ts`)
- `pnpm vitest run <path> -t "<pattern>"` - Run specific test(s) within a file (e.g., `-t "MAC"`)
- `pnpm vitest run --update` - Update all test snapshots
- `pnpm vitest run <path> --update` - Update snapshots for specific test file
- `pnpm test:watch` - Run tests in watch mode
- `pnpm vitest run --coverage` - Run tests with coverage report
- `pnpm dev` - Execute code with tsx under source conditions
- `pnpm dev <file>` - Execute `<file>` with tsx & proper resolution conditions. Usually use for `play.ts`.
- `pnpm dev:play` - Quick alias to run play.ts for experimentation
- `pnpm lint` - Run biome linter with auto-fix
- `pnpm format` - Format code with biome
- `pnpm fix` - Run both format and lint

## Rules


Code is clean if it can be understood easily – by everyone on the team. Clean code can be read and enhanced by a developer other than its original author. With understandability comes readability, changeability, extensibility and maintainability.

## General rules
1. Follow standard conventions.
2. Keep it simple stupid. Simpler is always better. Reduce complexity as much as possible.
3. Boy scout rule. Leave the campground cleaner than you found it.
4. Always find root cause. Always look for the root cause of a problem.

```ts
// ❌ Overly complex
if (user) {
  if (user.isActive) {
    if (user.email?.includes('@')) {
      return sendEmail(user.email);
    }
  }
}

// ✅ Simple and clear
if (!user?.isActive || !user?.email?.includes('@')) return null;
return sendEmail(user.email);
```

## Design rules
1. Keep configurable data at high levels.
2. Prefer polymorphism to if/else or switch/case.
3. Use dependency injection.
4. Follow Law of Demeter. A class should know only its direct dependencies.

```ts
// ❌ Switch for payment types
function processPayment(method: string, amount: number) {
  switch (method) {
    case 'stripe': return processStripe(amount);
    case 'paypal': return processPayPal(amount);
  }
}

// ✅ Polymorphism with dependency injection
interface PaymentProcessor {
  process(amount: number): Promise<PaymentResult>;
}

class PaymentService {
  constructor(private processor: PaymentProcessor) {}
  async process(amount: number) {
    return this.processor.process(amount);
  }
}
```

## Understandability tips
1. Be consistent. If you do something a certain way, do all similar things in the same way.
2. Use explanatory variables.
3. Prefer dedicated value objects to primitive types.
4. Avoid negative conditionals.

```ts
// ❌ Complex condition
if (user.age >= 18 && user.hasVerifiedEmail && user.subscription.status === 'active') {
  allowAccess();
}

// ✅ Explanatory variables
const canAccessPremiumContent = 
  user.age >= 18 && 
  user.hasVerifiedEmail && 
  user.subscription.status === 'active';

if (canAccessPremiumContent) {
  allowAccess();
}
```

```ts
// ❌ Primitives everywhere
function createUser(email: string, age: number) {
  if (!email.includes('@')) throw new Error('Invalid email');
  if (age < 0 || age > 150) throw new Error('Invalid age');
}

// ✅ Value objects
class Email {
  private constructor(private readonly value: string) {
    if (!value.includes('@')) throw new Error('Invalid email');
  }
  static create(value: string) { return new Email(value); }
  toString() { return this.value; }
}

function createUser(email: Email, age: Age) {
  // Validation already done!
}
```

## Names rules
1. Choose descriptive and unambiguous names.
2. Use pronounceable names.
3. Use searchable names.
4. Replace magic numbers with named constants.
5. Avoid encodings. Don't append prefixes or type information.

```ts
// ❌ Bad names
const yyyymmdd = new Date().toISOString().split('T')[0];
function calc(a: number, b: number) { return a * 1.2 + b; }

// ✅ Good names
const currentDate = new Date().toISOString().split('T')[0];
const TAX_RATE = 1.2;
function calculateTotalWithTax(basePrice: number, shipping: number) {
  return basePrice * TAX_RATE + shipping;
}
```

## Functions rules
1. Small.
2. Do one thing.
3. Use descriptive names.
4. Prefer fewer arguments (use objects for 3+).
5. Have no side effects.
6. Don't use flag arguments. Split into separate methods.

```ts
// ❌ Flag argument
function saveUser(user: User, sendEmail: boolean) {
  db.save(user);
  if (sendEmail) sendWelcomeEmail(user.email);
}
saveUser(user, true); // What does true mean?

// ✅ Separate methods
function saveUser(user: User) {
  db.save(user);
}

function saveUserAndNotify(user: User) {
  saveUser(user);
  sendWelcomeEmail(user.email);
}
```

```ts
// ❌ Too many arguments
function createPost(title: string, content: string, authorId: string, 
  categoryId: string, tags: string[], isDraft: boolean) { }

// ✅ Object parameter
interface CreatePostParams {
  title: string;
  content: string;
  authorId: string;
  categoryId: string;
  tags: string[];
  isDraft: boolean;
}

function createPost(params: CreatePostParams) { }
```

## Comments rules
1. Always try to explain yourself in code.
2. Don't be redundant.
3. Don't comment out code. Just remove.
4. Use as explanation of intent.
5. Use as warning of consequences.

```ts
// ❌ Redundant
const userName = user.name; // Get the user name

// ✅ Good: Code explains itself
const userName = user.name;

// ✅ Good: Explaining intent
// Using Set for O(1) lookup performance with large datasets
const processedIds = new Set<string>();

// ✅ Good: Warning
// WARNING: Deletes all user data permanently. Cannot be undone.
async function deleteAllUsers() {
  await db.query('TRUNCATE TABLE users CASCADE');
}
```

### Explanatory variables example
```ts
// ❌ Wrong: Comment explains complex condition
if (config.allowClose && config.interactWithActiveElement && event.key === 'Escape') {
  close(); // popover escape disabled when interactWithActiveElement is true
}

// ✅ Fix: Variable explains intent
const escapePopoverFeatureDisabled = config.interactWithActiveElement;
if (config.allowClose && escapePopoverFeatureDisabled && event.key === 'Escape') {
  close();
}
```

## Source code structure
1. Separate concepts vertically.
2. Declare variables close to their usage.
3. Dependent functions should be close.
4. Keep lines short.
5. Use whitespace to associate related things.

```ts
// ❌ Variables far from usage
function processOrder(order: Order) {
  const userName = order.user.name;
  const userEmail = order.user.email;
  // ... 50 lines of code ...
  sendInvoice(userEmail, userName);
}

// ✅ Declare close to usage
function processOrder(order: Order) {
  // ... 50 lines of code ...
  const userName = order.user.name;
  const userEmail = order.user.email;
  sendInvoice(userEmail, userName);
}
```

## Objects and data structures
1. Hide internal structure.
2. Prefer data structures for simple data, objects for behavior.
3. Should be small and do one thing.
4. Prefer non-static methods to static methods.

```ts
// ❌ Exposing internals
class User {
  public passwordHash: string;
  public internalId: string;
}

// ✅ Hide implementation
class User {
  private passwordHash: string;
  private internalId: string;
  
  verifyPassword(password: string): boolean {
    return bcrypt.compareSync(password, this.passwordHash);
  }
}
```

```ts
// ❌ Static method requiring dependency every time
class UserService {
  static async getUser(db: Database, id: string) {
    return db.query('SELECT * FROM users WHERE id = $1', [id]);
  }
}
await UserService.getUser(db, '123');

// ✅ Instance method with injected dependency
class UserService {
  constructor(private db: Database) {}
  async getUser(id: string) {
    return this.db.query('SELECT * FROM users WHERE id = $1', [id]);
  }
}
```

## Tests
1. One assert per test (one concept per test).
2. Readable with clear intent.
3. Fast - mock external dependencies.
4. Independent - no shared state between tests.
5. Repeatable - don't depend on dates or external APIs.

```ts
// ❌ Multiple concepts in one test
test('user operations', () => {
  const user = createUser({ name: 'John' });
  expect(user.name).toBe('John');
  const updated = updateUser(user, { name: 'Jane' });
  expect(updated.name).toBe('Jane');
});

// ✅ One concept per test
test('should create user with correct name', () => {
  const user = createUser({ name: 'John' });
  expect(user.name).toBe('John');
});

test('should update user name', () => {
  const user = createUser({ name: 'John' });
  const updated = updateUser(user, { name: 'Jane' });
  expect(updated.name).toBe('Jane');
});
```

## Code smells to avoid
1. **Rigidity** - Small change causes cascade of changes
2. **Fragility** - Software breaks in many places from single change
3. **Needless Complexity** - Don't add features you don't need (YAGNI)
4. **Needless Repetition** - Extract common logic (DRY)
5. **Opacity** - Code is hard to understand

```ts
// ❌ Rigidity: Changing User breaks multiple places
class UserDisplay {
  show(user: { name: string; email: string; age: number }) { }
}
class UserForm {
  submit(name: string, email: string, age: number) { }
}
// Adding phone requires changing both classes!

// ✅ Use interface as single source of truth
interface User {
  name: string;
  email: string;
  age: number;
  phone?: string; // Easy to extend
}
class UserDisplay {
  show(user: User) { }
}
class UserForm {
  submit(user: User) { }
}
```

```ts
// ❌ Needless Repetition (DRY violation)
async function createUser(data: UserData) {
  if (!data.email.includes('@')) throw new Error('Invalid email');
  if (data.age < 18) throw new Error('Must be 18+');
  return db.insert('users', data);
}

async function updateUser(id: string, data: Partial<UserData>) {
  if (data.email && !data.email.includes('@')) throw new Error('Invalid email');
  if (data.age && data.age < 18) throw new Error('Must be 18+');
  return db.update('users', id, data);
}

// ✅ Extract common validation
function validateEmail(email: string) {
  if (!email.includes('@')) throw new Error('Invalid email');
}
function validateAge(age: number) {
  if (age < 18) throw new Error('Must be 18+');
}

async function createUser(data: UserData) {
  validateEmail(data.email);
  validateAge(data.age);
  return db.insert('users', data);
}

async function updateUser(id: string, data: Partial<UserData>) {
  if (data.email) validateEmail(data.email);
  if (data.age) validateAge(data.age);
  return db.update('users', id, data);
}
```
