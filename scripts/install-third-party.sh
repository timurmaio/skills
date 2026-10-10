#!/usr/bin/env bash
set -euo pipefail

# Installs the third-party agent skills recommended for every project.
# See docs/recommended-skills.md.

npx skills add https://github.com/anthropics/skills --skill frontend-design
npx skills add https://github.com/vercel-labs/agent-skills --skill vercel-react-best-practices
npx skills add https://github.com/vercel-labs/agent-skills --skill web-design-guidelines
npx skills add https://github.com/vercel-labs/agent-skills --skill vercel-composition-patterns
