# Skill: Commits and Branches

## Overview
This skill guides git workflow decisions for feature development, experimental work, and progress tracking.

## Core Rules

### 1. Branch for New/Experimental Work
When starting new features or experimental implementations:
- Create a new feature branch: `git checkout -b feature/description` or `git checkout -b experiment/description`
- Never commit experimental/untested code directly to main
- This keeps main stable and deployable

### 2. Merge When User Approves
Once experimental work is complete and the user has tested and approved it:
- Create a pull request or ask user for approval to merge
- Merge the feature branch back to main: `git checkout main && git merge feature/description`
- Delete the feature branch after merging: `git branch -d feature/description`
- This ensures main only contains verified, working code

### 3. Commit When Making Positive Progress
On any branch (feature or main), commit when:
- A discrete feature is complete (e.g., component done, integration tested)
- A bug is fixed and verified
- Tests pass and code quality is maintained
- Progress milestone is reached that makes logical sense to preserve in history

Avoid:
- Committing incomplete or broken work
- Committing before testing (unless clearly marked as WIP)
- Committing unless there's something meaningful to preserve in git history

## Workflow Example

```
# Start new feature
git checkout -b feature/lit-ui-custom

# Make commits as you complete discrete pieces
git add file1 file2
git commit -m "description of work"

# User tests the feature
# User says "looks good, merge it"

# Merge back to main
git checkout main
git merge feature/lit-ui-custom
git branch -d feature/lit-ui-custom
git push
```

## When in Doubt
Ask the user: "Should I work in a feature branch for this?" or "Is this ready to commit/merge?"
