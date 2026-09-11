# Contributing to Formly (Seva Saarthi)

Thank you for your interest in contributing to **Formly**! We welcome contributions to make government service preparation more accessible, transparent, and seamless for millions of citizens.

---

## 🛠️ Development Workflow

1. **Fork and Clone the Repository**
   ```bash
   git clone https://github.com/SaiSankeerth-dev/Formly.git
   cd Formly
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   ```bash
   cp .env.example .env.local
   ```

4. **Start the Local Development Server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Quality Standards & Testing

Before submitting a Pull Request, ensure that all checks pass:

- **Typecheck**: `npx tsc --noEmit`
- **Lint**: `npm run lint`
- **Production Build**: `npm run build`

---

## 🌿 Git Branch & Commit Conventions

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` A new user-facing feature (e.g., `feat(vault): add OCR confidence badges`)
- `fix:` A bug fix (e.g., `fix(checklist): preserve manual overrides on recompute`)
- `refactor:` Code refactoring without behavioral changes
- `docs:` Documentation updates
- `test:` Adding or updating tests
- `chore:` Maintenance tasks and dependency updates

---

## 🔒 Security Vulnerabilities

If you discover a security vulnerability, please report it privately to the maintainers rather than opening a public issue.
