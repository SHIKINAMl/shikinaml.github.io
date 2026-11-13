const CONFIG = {
  contactRecipient: "myukku1213@gmail.com",
  worksSpreadsheetId: "PASTE_YOUR_SPREADSHEET_ID_HERE",
  worksSheetName: "Works",
};

const WORKS_COLUMNS = [
  "title",
  "summary",
  "story",
  "craft",
  "role",
  "tech",
  "links",
  "imageUrl",
  "date",
  "tags",
];

function doGet(e) {
  const action = getAction_(e);

  if (action === "works") {
    return jsonResponse_({
      ok: true,
      items: listWorksItems_(),
    });
  }

  return jsonResponse_({
    ok: true,
    message: "Shikinami Portfolio GAS is running.",
  });
}

function doPost(e) {
  const payload = parseRequestPayload_(e);
  const action = String(payload.action || "contact").toLowerCase();

  if (action === "contact") {
    const result = sendContactMail_(payload);
    return jsonResponse_(result);
  }

  if (action === "works") {
    const result = appendWorkItem_(payload);
    return jsonResponse_(result);
  }

  return jsonResponse_({
    ok: false,
    message: "Unsupported action.",
  });
}

function sendContactMail_(payload) {
  const name = normalizeText_(payload.name);
  const email = normalizeText_(payload.email);
  const message = normalizeText_(payload.message);

  if (!name || !email || !message) {
    return {
      ok: false,
      message: "name, email, message are required.",
    };
  }

  const subject = `Portfolio Contact: ${name}`;
  const body = [
    `Name: ${name}`,
    `Email: ${email}`,
    "",
    message,
  ].join("\n");

  MailApp.sendEmail({
    to: CONFIG.contactRecipient,
    subject,
    body,
    replyTo: email,
  });

  return {
    ok: true,
    message: "Contact mail sent.",
  };
}

function listWorksItems_() {
  const sheet = getWorksSheet_();
  if (!sheet) {
    return [];
  }

  // Use display values so date-like cells keep the exact visible text format.
  const values = sheet.getDataRange().getDisplayValues();
  if (values.length <= 1) {
    return [];
  }

  const headers = values[0].map(String);
  return values.slice(1).map((row) => {
    const item = {};
    headers.forEach((header, index) => {
      item[header] = row[index];
    });

    return normalizeWorkItem_(item);
  });
}

function appendWorkItem_(payload) {
  const sheet = getWorksSheet_();
  if (!sheet) {
    return {
      ok: false,
      message: "Works sheet not found.",
    };
  }

  const title = normalizeText_(payload.title);
  if (!title) {
    return {
      ok: false,
      message: "title is required.",
    };
  }

  const row = [
    title,
    normalizeText_(payload.summary),
    normalizeText_(payload.story),
    normalizeText_(payload.craft),
    normalizeText_(payload.role),
    normalizeText_(payload.tech),
    normalizeLinksPayload_(payload.links),
    normalizeText_(payload.imageUrl),
    normalizeText_(payload.date),
    normalizeText_(payload.tags),
  ];

  sheet.appendRow(row);

  return {
    ok: true,
    message: "Work item appended.",
  };
}

function getWorksSheet_() {
  if (!CONFIG.worksSpreadsheetId || CONFIG.worksSpreadsheetId === "PASTE_YOUR_SPREADSHEET_ID_HERE") {
    return null;
  }

  const spreadsheet = SpreadsheetApp.openById(CONFIG.worksSpreadsheetId);
  const sheet = spreadsheet.getSheetByName(CONFIG.worksSheetName);

  if (sheet) {
    ensureWorksHeader_(sheet);
  }

  return sheet;
}

function parseRequestPayload_(e) {
  if (!e) {
    return {};
  }

  if (e.postData && e.postData.contents) {
    const type = String(e.postData.type || "").toLowerCase();
    if (type.includes("application/json")) {
      try {
        return JSON.parse(e.postData.contents);
      } catch (error) {
        return {};
      }
    }

    const formData = e.parameter || {};
    if (Object.keys(formData).length > 0) {
      return formData;
    }

    try {
      return JSON.parse(e.postData.contents);
    } catch (error) {
      return {};
    }
  }

  return e.parameter || {};
}

function getAction_(e) {
  if (!e) {
    return "default";
  }

  if (e.parameter && e.parameter.action) {
    return String(e.parameter.action).toLowerCase();
  }

  return "default";
}

function normalizeText_(value) {
  return String(value || "").trim();
}

function normalizeLinksPayload_(value) {
  if (Array.isArray(value)) {
    return value.map((item) => formatLinkItem_(item)).filter(Boolean).join(", ");
  }

  const text = normalizeText_(value);
  if (!text) {
    return "";
  }

  return text;
}

function normalizeLinkItem_(item) {
  if (!item) {
    return null;
  }

  if (typeof item === "string") {
    const label = normalizeText_(item);
    return label ? { label, url: "" } : null;
  }

  const label = normalizeText_(item.label || item.name || item.title);
  const url = normalizeText_(item.url || item.href);
  if (!label && !url) {
    return null;
  }

  return { label, url };
}

function formatLinkItem_(item) {
  const link = normalizeLinkItem_(item);
  if (!link) {
    return "";
  }

  if (!link.label && !link.url) {
    return "";
  }

  return `${link.label || ""}|${link.url || ""}`.trim();
}

function ensureWorksHeader_(sheet) {
  const header = sheet.getRange(1, 1, 1, WORKS_COLUMNS.length).getValues()[0].map(String);
  const isSame = WORKS_COLUMNS.every((column, index) => header[index] === column);

  if (!isSame) {
    sheet.getRange(1, 1, 1, WORKS_COLUMNS.length).setValues([WORKS_COLUMNS]);
  }
}

function normalizeWorkItem_(item) {
  return {
    title: normalizeText_(item.title),
    summary: normalizeText_(item.summary),
    story: normalizeText_(item.story),
    craft: normalizeText_(item.craft),
    role: normalizeText_(item.role),
    tech: parseList_(item.tech),
    links: parseLinks_(item.links),
    imageUrl: normalizeText_(item.imageUrl),
    date: normalizeText_(item.date),
    tags: parseList_(item.tags),
  };
}

function parseList_(value) {
  return String(value || "")
    .split(/[、,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseLinks_(value) {
  const text = normalizeText_(value);
  if (!text) {
    return [];
  }

  return text
    .split(/[\n,]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [label, url] = part.split("\\").map((item) => item.trim());
      return normalizeLinkItem_({ label, url });
    })
    .filter(Boolean);
}

function jsonResponse_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
