# genome-system-contracts
Infrastructure contracts for Genome live launch

## Maintainers
**Primary**: Adam Nagy (@ngyam)

## Quickstart
```
npm install -D
```
and code away.

## Guidelines
 - **Development**:
   - **Commit style**: [Angular](https://github.com/angular/angular.js/blob/master/DEVELOPERS.md#commits)
   - **PRs**: 2 reviews are needed + build pass on travis. Review according to: https://github.com/energywebfoundation/docs-and-guidelines/blob/master/review.md
     - When opening the PR, request 2 reviewers, ping them and set yourself as Assignee.
   - **Flow**: use feature branches, do the original [GitHub flow](https://guides.github.com/introduction/flow/).
   - **Comments**: NatSpec + 1 docstring above state variables + above structs + events + modifier. If something is super self-explanatory then comments would be redundant, so no need to overkill it. But, every reader should be able to clearly understand what is what, without ambiguity
   - **Solidity**:
     - Style: [original guidelines](https://solidity.readthedocs.io/en/v0.5.4/style-guide.html) + function modifiers below function names. ```npm run lint``` must pass
     - Coverage: ```npm run coverage```
   - **JS style (tests)**:
     - use ;
     - await/async is easier to read than callbacks
