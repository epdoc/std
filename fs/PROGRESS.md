# Progress Log

## Current Tasks

### Runtime compatibility

Our eventual goal is to make this module be runtime agnostic such that it runs on Deno, Nodejs and Bun.

We are accomplishing this goal bit by bit. While doing this, we DO NOT want to introduce any Deno-specific dependencies
that we will not easily be able to use for NodeJs and Deno projects.
