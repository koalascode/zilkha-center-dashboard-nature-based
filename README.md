## Overview

To run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Dev server is configured to use a self-signed certificate for https (as opposed to the default of http). To change that, remove the flag "--experimental-https" from package.json.

## Organization

The api folder has routes that extract data from the eGauge API (to avoid issues with client/server components and CORS). There might be a better way to handle these issues.

The data folder contains info about the sensors for constructing API URLs.

actions.ts contains functions that work with the eGauge API directly, to be imported in other places. actions.ts imports username and password for authentication purposes from a login.ts file, which is not committed to git for security reasons.

The components folder contains the custom folder, which has components made for this project, usually based on the imported components found in the components folder.

The lib folder contains helper files for Tremor Charts.

## Dashboard look

<img width="1406" height="893" alt="Screenshot 2025-08-06 at 16 18 43" src="https://github.com/user-attachments/assets/b6f1d666-131b-4d92-9e64-530698747bc3" />
# zilkha-center-dashboard-nature-based
