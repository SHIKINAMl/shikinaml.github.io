# GAS for Shikinami Portfolio

This folder contains the Google Apps Script code for the portfolio site.

## Endpoints

- `doPost({ action: "contact" })`
  - Sends a contact email to the site owner.
- `doPost({ action: "works" })`
  - Appends a new work item to the spreadsheet.
- `doGet({ action: "works" })`
  - Returns work items as JSON.

## Contact payload

Required fields:

- `name`
- `email`
- `message`

Example JSON:

```json
{
  "action": "contact",
  "name": "Shikinami",
  "email": "example@example.com",
  "message": "Hello!"
}
```

## Works spreadsheet

Use a sheet named `Works` with the following header row:

- `title`
- `summary`
- `story`
- `role`
- `tech`
- `links`
- `imageUrl`
- `date`
- `tags`

Example row order matches the header order above.

### Column notes

- `story`
  - Works page modal section `制作にあたって`.
  - Store the episode, motivation, and what you learned from creating the work.
  - If you separate text with line breaks, it will be rendered as bullet points.
- `craft`
  - Works page modal section `工夫やこだわり`.
  - Store implementation details, design choices, and points you focused on.
  - If you separate text with line breaks, it will be rendered as bullet points.
- `links`
  - Multiple labeled links.
  - Recommended format: `label|url, label|url`.
- `imageUrl`
  - Store a Google Drive file ID.
  - The front-end converts it to a display URL automatically.
  - Legacy full URL values are still supported.

Example `links` value:

```text
GitHub|https://github.com/example/repo, Download|https://example.com/file.zip
```

Each item is separated by a comma. Use a pipe between label and URL.

### Play in browser (GitHub Pages embed)

- Works whose `links` contain a `https://<user>.github.io/<repo>/` URL get a
  "ブラウザで遊べる" badge, and the modal can run the game in an iframe.
- The front-end reads the Unity WebGL page, takes the `unity-canvas` size and
  scales the iframe to fit, so no extra column is required.
- Optional: add an `embedUrl` column to point at a different page than the
  links. It takes priority over the links when present.

## Deployment notes

1. Paste your spreadsheet ID into `Code.gs`.
2. Deploy the script as a Web App.
3. Grant permission to send mail and access spreadsheets.
4. Use the Web App URL from the front-end fetch requests.
5. If you add or rename columns, keep the header row aligned with the script.
