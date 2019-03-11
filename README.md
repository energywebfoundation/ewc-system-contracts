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
     - Style: [original guidelines](https://solidity.readthedocs.io/en/v0.5.4/style-guide.html) + function modifiers below function names. ```npm run lint:solhint``` must pass, which means no error. Warnings pass, but make sure it really doesn't make sense to correct them. You can also run ```npm run lint:solium``` which also checks other things.
     - Coverage report: ```npm run coverage```
     - Security analysis: install [slither (a pip package, not npm)](https://github.com/trailofbits/slither#how-to-install) and do ```npm run security```. It is used for checks by Travis. Run it and see if there are some security flaws and suggestions that would make sense to apply.
       1. Make sure a python 3.6 env is active
       2. run: ```pip install slither-analyzer``` (or sometimes ```pip3 install slither-analyzer```)
   - **JS style (tests)**:
     - use ;
     - await/async is easier to read than callbacks
