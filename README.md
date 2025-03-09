# SPA template

Provide a template to create simple SolidJS apps including simple persistence
to localStorage and syncing between devices using WebDAV.

## Usage

```bash
$ docker-compose build && HOSTNAME=$(hostname) docker-compose up
```

Runs the app in the development mode.<br>
Open [http://localhost:8080](http://localhost:8080) to view it in the browser.

The page will reload if you make edits.<br>

spabase-web-1 - port 8080 - nginx server that handles WebDAV and proxies to spabase-dev-1

spabase-dev-1 - port 3000 - vite.js server that handles hotloading etc.

setting the HOSTNAME environment variable allows access via another device
 
## Deployment

In production the nginx server handles WebDAV and serves the app using static files.

TODO: push production container


## To Do

- add sample/test save/sync