# Contributing

## Introduction

Following these guidelines helps to communicate that you respect the time of the developers managing and developing this open source project. In return, they should reciprocate that respect in addressing your issue, assessing changes, and helping you finalize your pull requests.

We love your input! We want to make contributing to this project as easy and transparent as possible, whether it's:
 - Reporting a bug
 - Discussing the current state of the code
 - Submitting a fix
 - Writing code that can be incorporated into the project itself
 - Proposing new features
 - Improving the documentation
 - Writing tutorials or blog posts
 - Becoming a maintainer

When contributing to this repository, please first discuss the change you wish to make via issue,
email, or any other method with the owners of this repository before making a change. 

As for everything else in the project, the contributions to the repo are governed by our [Code of Conduct](./CODE_OF_CONDUCT.md).

## Using the issue tracker

First things first: Do **NOT** report security vulnerabilities in public issues! Please disclose responsibly by letting the EWF team (core@energyweb.org) know upfront. We will assess the issue as soon as possible on a best-effort basis and will give you an estimate for when we have a fix and release available for an eventual public disclosure.

The issue tracker is the preferred channel for bug reports, features requests and submitting pull requests, but please respect the following restrictions:

 - Please do not use the issue tracker for personal support requests. Use our [Slack channel/whatever].

 - Please do not derail or troll issues. Keep the discussion on topic and respect the opinions of others.

## Your first contribution

Working on your first Pull Request? You can learn how from this free series, [How to Contribute to an Open Source Project on GitHub](https://egghead.io/series/how-to-contribute-to-an-open-source-project-on-github).

## Guidelines

Check out our guidelines repo if you have access: https://github.com/energywebfoundation/docs-and-guidelines.

### Solidity

 - Style: [original style guide](https://solidity.readthedocs.io/en/v0.5.7/style-guide.html).
 - function modifiers below function names.
 - ```npm run lint:solhint``` must pass, which means no error. Warnings pass, but make sure it really doesn't make sense to correct them.
 - ```npm run lint:solium``` must pass, which also checks other things.
 - Documentation: NatSpec + 1 docstring above state variables + above structs + events + modifiers. If something is super self-explanatory then comments would be redundant, so no need to overkill it. But, every reader should be able to clearly understand what is what, without ambiguity.
 - Security checks: run them, and see if there are some security flaws and suggestions that would make sense to apply. Security checks are not done by Travis, they are only manual.

### JS

No strict guidelines here yet.
 - await/async is easier to read than callbacks for the tests

## Commit style preferred

[Angular](https://github.com/angular/angular.js/blob/master/DEVELOPERS.md#commits)

## Pull request process

Do the [GitHub flow](https://guides.github.com/introduction/flow/)

 1. Fork the repo, clone it to your own machine and create your branch from `master`
 2. Commit changes to your branch
 3. If you've added code that should be tested, add tests
 4. If you've changed APIs, or if needed, update the documentation, README, etc.
 5. Ensure the test suite passes.
 6. Make sure formatting is according to the repo`s style guidelines. Use a linter if needed.
 7. Push your work back to your fork
 8. Create that pull request
 9. Pass the review, reiterate if requests are made by the maintainers

NOTE: Be sure to merge the latest from "upstream" before making a pull request!

## Reviews

2 reviews are needed with each PR.

Don't forget to review your own code first. Does it make sense? Did you include something unrelated to the overall purpose of the changes? Did you forget to remove any debugging code?

Our code review process is based on the following guidelines:
* [Gitlab's Code Review Guidelines](https://gitlab.com/help/development/code_review.md)
* [thoughtbot's Code Review Guidelines](https://github.com/thoughtbot/guides/tree/master/code-review)

Especially pay attention to the ["Having your code reviewed"](https://gitlab.com/help/development/code_review.md#having-your-code-reviewed) section.

## Copyright and Licensing

All of your contributions will be made under [GPLv3](./LICENSE).

## FAQ
