# Operation Pro Max

Landing page (`/`), contribute page (`/give`), and a contributions API (`/api/contributions`) on Netlify Functions + Netlify Blobs.

## Deploy (needs the CLI, not drag-and-drop, because of the function)
    npm install
    npx netlify-cli login
    npx netlify-cli deploy --prod     # choose "Create & configure a new site"

## Change the goal or bank details
Edit the CONFIG block at the bottom of index.html, then redeploy.

## Remove a fake entry
Set ADMIN_KEY in Site configuration > Environment variables, redeploy, then:
    curl -X DELETE "https://<site>.netlify.app/api/contributions?id=<id>" -H "x-admin-key: <ADMIN_KEY>"
Entry ids are in the JSON at /api/contributions.
