# Portfolio documentation

Use these guides to update and maintain the portfolio:

- [Add or update portfolio content](CONTENT.md)
- [Add library content](LIBRARY.md)
- [Deploy the site](DEPLOYMENT.md)
- [Debug common problems](DEBUGGING.md)

For most updates, edit one file in `src/content/`. The UI reads those files and
automatically renders each entry in the appropriate section.

After making a change, verify it with:

```bash
npm run dev
npm run lint
npm run build
```
