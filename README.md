# CodeGov Website

## Setup

- Install [NodeJS](https://nodejs.org/)
- Install [PNPM](https://pnpm.io/)

## Commands

All commands are run from the root of the project, from a terminal:

| Command             | Action                                           |
| :------------------ | :----------------------------------------------- |
| `pnpm install`      | Installs dependencies                            |
| `pnpm start`        | Starts local dev server at `localhost:3000`      |
| `pnpm build`        | Build your production site to `./dist/`          |
| `pnpm astro ...`    | Run CLI commands like `astro add`, `astro check` |
| `pnpm astro --help` | Get help using the Astro CLI                     |

## Contributing

Content is written in Markdown in the `./src/pages` directory. New pages should be added to the navbar configuration in `./src/omponents/PrimaryNavbarMenu.astro`. Currently only one level of nesting is supported for the menu.
