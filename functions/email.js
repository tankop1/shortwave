const SITE_URL = String(process.env.APP_URL || 'https://shortwaveut.com').replace(/\/$/, '')

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function formatCreditRole(role, roles, kind) {
  const list = Array.isArray(roles) && roles.length
    ? roles.map((item) => String(item).trim()).filter(Boolean)
    : String(role || '')
        .split(/\s*·\s*/)
        .map((item) => item.trim())
        .filter(Boolean)
  if (list.length <= 1) return list[0] || (kind === 'cast' ? 'cast' : 'crew')
  if (list.length === 2) return `${list[0]} and ${list[1]}`
  return `${list.slice(0, -1).join(', ')}, and ${list[list.length - 1]}`
}

function previewText(value, max = 280) {
  const text = String(value || '').replace(/\s+/g, ' ').trim()
  if (text.length <= max) return text
  return `${text.slice(0, max).trim()}…`
}

function emailLayout({
  pageTitle,
  preheader,
  kicker,
  headline,
  extraHtml = '',
  greeting,
  body,
  buttonLabel,
  buttonUrl,
  footer,
}) {
  const siteHref = escapeHtml(SITE_URL)
  const safeUrl = escapeHtml(buttonUrl)
  const greetingRow = greeting
    ? `<tr>
            <td style="padding:12px 32px 0;font-family:Outfit,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.55;color:#f4f4f1">
              ${escapeHtml(greeting)}
            </td>
          </tr>`
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="dark" />
  <meta name="supported-color-schemes" content="dark" />
  <title>${escapeHtml(pageTitle)}</title>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Syne:wght@700;800&display=swap" rel="stylesheet" />
</head>
<body style="margin:0;padding:0;background:#0a0a0b;color:#f4f4f1">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">
    ${escapeHtml(preheader)}
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0b;padding:48px 16px">
    <tr>
      <td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="width:100%;max-width:480px">
          <tr>
            <td align="center" style="padding:0 8px 18px;text-align:center">
              <a href="${siteHref}" style="display:block;font-family:Syne,'Trebuchet MS',sans-serif;font-size:22px;font-weight:800;letter-spacing:-0.05em;line-height:1;color:#f4f4f1;text-decoration:none">Shortwave</a>
              <a href="${siteHref}" style="display:block;margin-top:1px;font-family:Outfit,Helvetica,Arial,sans-serif;font-size:12px;font-weight:500;color:#e8703a;text-decoration:none">The UT film site</a>
            </td>
          </tr>
        </table>
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="width:100%;max-width:480px;background:#101011;border:1px solid rgba(255,255,255,0.08);border-radius:22px;overflow:hidden">
          <tr>
            <td style="padding:24px 32px 10px;font-family:Outfit,Helvetica,Arial,sans-serif;font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:#e8703a">${escapeHtml(kicker)}</td>
          </tr>
          <tr>
            <td style="padding:0 32px 16px;font-family:Syne,'Trebuchet MS',sans-serif;font-size:28px;line-height:1.15;font-weight:800;letter-spacing:-0.04em;color:#f4f4f1">
              ${escapeHtml(headline)}
            </td>
          </tr>
          ${extraHtml}
          ${greetingRow}
          <tr>
            <td style="padding:8px 32px 22px;font-family:Outfit,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.55;color:#8d8d88">
              ${escapeHtml(body)}
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 28px">
              <a href="${safeUrl}" style="display:inline-block;background:#e8703a;color:#160c06;font-family:Outfit,Helvetica,Arial,sans-serif;font-size:14px;font-weight:700;text-decoration:none;padding:13px 22px;border-radius:999px">
                ${escapeHtml(buttonLabel)}
              </a>
            </td>
          </tr>
        </table>
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="width:100%;max-width:480px">
          <tr>
            <td style="padding:18px 8px 0;font-family:Outfit,Helvetica,Arial,sans-serif;font-size:12px;line-height:1.5;color:#8d8d88">
              ${escapeHtml(footer)}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function quoteBlock(text) {
  const line = escapeHtml(text)
  if (!line) return ''
  return `<tr>
        <td style="padding:0 32px 20px;font-family:Outfit,Helvetica,Arial,sans-serif;font-size:14px;line-height:1.5;color:#8d8d88">“${line}”</td>
      </tr>`
}

export function creditInviteEmail({
  ownerName,
  filmTitle,
  role,
  roles,
  kind,
  poster,
  logline,
  acceptUrl,
  inviteeName,
}) {
  const creditRole = formatCreditRole(role, roles, kind)
  const name = inviteeName || ''
  const posterBlock = poster
    ? `<tr>
        <td style="padding:0 32px 8px">
          <img src="${escapeHtml(poster)}" alt="" width="416" style="display:block;width:100%;max-width:416px;height:auto;border-radius:16px;border:0" />
        </td>
      </tr>`
    : ''
  const loglineBlock = logline
    ? `<tr>
        <td style="padding:0 32px 20px;font-family:Outfit,Helvetica,Arial,sans-serif;font-size:14px;line-height:1.5;color:#8d8d88">Log line: ${escapeHtml(logline)}</td>
      </tr>`
    : ''

  return emailLayout({
    pageTitle: `You’re credited on ${filmTitle}`,
    preheader: `${ownerName} credited you as ${creditRole} on ${filmTitle}. Accept to appear on the slate.`,
    kicker: 'You’re invited',
    headline: `${ownerName} credited you as ${creditRole} on “${filmTitle}”`,
    extraHtml: `${posterBlock}${loglineBlock}`,
    greeting: name ? `Hi, ${name}!` : 'Hi!',
    body: `Join Shortwave and accept this credit to be shown as ${kind === 'cast' ? 'cast' : 'crew'} on the film. Until you do, it stays off the public slate.`,
    buttonLabel: 'Accept your credit!',
    buttonUrl: acceptUrl,
    footer: `You’re getting this because ${ownerName} listed you on a UT student film. If that wasn’t you, you can ignore the email.`,
  })
}

export function creditInviteText({ ownerName, filmTitle, role, roles, kind, acceptUrl, inviteeName, logline }) {
  const hello = inviteeName ? `Hi, ${inviteeName}!` : 'Hi!'
  const loglineLine = logline ? `\nLog line: ${logline}\n` : '\n'
  return `${hello}

${ownerName} credited you as ${formatCreditRole(role, roles, kind)} on “${filmTitle}”.
${loglineLine}
Accept this invite to appear on the film’s cast & crew:
${acceptUrl}

Until you accept, the credit stays off Shortwave.
`
}

export function contactMessageEmail({ ownerName, senderName, preview, inboxUrl }) {
  const hello = ownerName ? `Hi, ${ownerName}!` : 'Hi!'
  const snippet = previewText(preview)
  return emailLayout({
    pageTitle: `${senderName} sent you a message`,
    preheader: `${senderName} sent you a message on your Shortwave site.`,
    kicker: 'New message',
    headline: `${senderName} sent you a message`,
    extraHtml: quoteBlock(snippet),
    greeting: hello,
    body: 'Open your inbox to read the full note and reply.',
    buttonLabel: 'View message',
    buttonUrl: inboxUrl,
    footer: 'You’re getting this because someone filled out the contact form on your Shortwave site.',
  })
}

export function contactMessageText({ ownerName, senderName, preview, inboxUrl }) {
  const hello = ownerName ? `Hi, ${ownerName}!` : 'Hi!'
  const snippet = previewText(preview)
  return `${hello}

${senderName} sent you a message on your Shortwave site.

“${snippet}”

Open your inbox to read the full note and reply:
${inboxUrl}
`
}

export function filmRatingEmail({ ownerName, reviewerName, filmTitle, rating, filmUrl }) {
  const hello = ownerName ? `Hi, ${ownerName}!` : 'Hi!'
  const stars = Number(rating) || 0
  const starsLabel = stars === 1 ? '1 star' : `${stars} stars`
  return emailLayout({
    pageTitle: `${reviewerName} rated “${filmTitle}”`,
    preheader: `${reviewerName} gave “${filmTitle}” ${starsLabel}.`,
    kicker: 'New rating',
    headline: `${reviewerName} rated “${filmTitle}”`,
    extraHtml: quoteBlock(starsLabel),
    greeting: hello,
    body: 'Open the project to see the rating and any written review.',
    buttonLabel: 'See the rating',
    buttonUrl: filmUrl,
    footer: `You’re getting this because you posted “${filmTitle}” on Shortwave.`,
  })
}

export function filmRatingText({ ownerName, reviewerName, filmTitle, rating, filmUrl }) {
  const hello = ownerName ? `Hi, ${ownerName}!` : 'Hi!'
  const stars = Number(rating) || 0
  const starsLabel = stars === 1 ? '1 star' : `${stars} stars`
  return `${hello}

${reviewerName} rated “${filmTitle}” ${starsLabel}.

Open the project to see the rating:
${filmUrl}
`
}

export function tenPlaysEmail({ ownerName, filmTitle, filmUrl }) {
  const hello = ownerName ? `Hi, ${ownerName}!` : 'Hi!'
  return emailLayout({
    pageTitle: `“${filmTitle}” just hit 10 plays`,
    preheader: `“${filmTitle}” just hit 10 plays on Shortwave.`,
    kicker: 'Milestone',
    headline: `“${filmTitle}” just hit 10 plays`,
    greeting: hello,
    body: 'People are watching. Open the project to see how it’s doing.',
    buttonLabel: 'See your project',
    buttonUrl: filmUrl,
    footer: `You’re getting this because you posted “${filmTitle}” on Shortwave.`,
  })
}

export function tenPlaysText({ ownerName, filmTitle, filmUrl }) {
  const hello = ownerName ? `Hi, ${ownerName}!` : 'Hi!'
  return `${hello}

“${filmTitle}” just hit 10 plays on Shortwave.

Open the project to see how it’s doing:
${filmUrl}
`
}

export function welcomeEmail({ name, uploadUrl }) {
  const hello = name ? `Hi, ${name}!` : 'Hi!'
  return emailLayout({
    pageTitle: 'Welcome to Shortwave',
    preheader: 'Welcome to Shortwave — the UT Austin film site. Add your first project to get on the slate.',
    kicker: 'Welcome',
    headline: 'You’re on Shortwave',
    greeting: hello,
    body: 'Shortwave is the UT Austin film site — a place to post student shorts, find cast and crew, and share your work with other filmmakers on campus. Your films, credits, and portfolio all live here. Add your first project to get on the slate.',
    buttonLabel: 'Add your first project',
    buttonUrl: uploadUrl,
    footer: 'You’re getting this because you just joined Shortwave.',
  })
}

export function welcomeText({ name, uploadUrl }) {
  const hello = name ? `Hi, ${name}!` : 'Hi!'
  return `${hello}

Welcome to Shortwave, the UT Austin film site. Post your student shorts, find cast and crew, and share work with other filmmakers on campus. Your films, credits, and portfolio all live here.

Add your first project to get on the slate:
${uploadUrl}
`
}
