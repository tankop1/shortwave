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
  const owner = escapeHtml(ownerName)
  const title = escapeHtml(filmTitle)
  const creditRole = escapeHtml(formatCreditRole(role, roles, kind))
  const name = escapeHtml(inviteeName || '')
  const line = escapeHtml(logline || '')
  const safeUrl = escapeHtml(acceptUrl)
  const posterBlock = poster
    ? `<tr>
        <td style="padding:0 32px 8px">
          <img src="${escapeHtml(poster)}" alt="" width="416" style="display:block;width:100%;max-width:416px;height:auto;border-radius:16px;border:0" />
        </td>
      </tr>`
    : ''
  const loglineBlock = line
    ? `<tr>
        <td style="padding:0 32px 8px;font-size:14px;line-height:1.5;color:#8d8d88">${line}</td>
      </tr>`
    : ''
  const hello = name ? `Hey ${name},` : 'Hey,'

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="dark" />
  <meta name="supported-color-schemes" content="dark" />
  <title>You’re credited on ${title}</title>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Syne:wght@700;800&display=swap" rel="stylesheet" />
</head>
<body style="margin:0;padding:0;background:#0a0a0b;color:#f4f4f1">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">
    ${owner} credited you as ${creditRole} on ${title}. Accept to appear on the slate.
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0b;padding:48px 16px">
    <tr>
      <td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="width:100%;max-width:480px;background:#101011;border:1px solid rgba(255,255,255,0.08);border-radius:22px;overflow:hidden">
          <tr>
            <td style="padding:28px 32px 6px">
              <div style="font-family:Syne,'Trebuchet MS',sans-serif;font-size:22px;font-weight:800;letter-spacing:-0.05em;color:#f4f4f1">Shortwave</div>
              <div style="font-family:Outfit,Helvetica,Arial,sans-serif;margin-top:4px;font-size:12px;font-weight:500;color:#e8703a">The UT film site</div>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 32px 10px;font-family:Outfit,Helvetica,Arial,sans-serif;font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:#e8703a">You’re invited</td>
          </tr>
          <tr>
            <td style="padding:0 32px 16px;font-family:Syne,'Trebuchet MS',sans-serif;font-size:28px;line-height:1.15;font-weight:800;letter-spacing:-0.04em;color:#f4f4f1">
              ${owner} credited you as ${creditRole} on “${title}”
            </td>
          </tr>
          ${posterBlock}
          ${loglineBlock}
          <tr>
            <td style="padding:12px 32px 0;font-family:Outfit,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.55;color:#f4f4f1">
              ${hello}
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 22px;font-family:Outfit,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.55;color:#8d8d88">
              Join Shortwave and accept this credit to be shown as ${kind === 'cast' ? 'cast' : 'crew'} on the film. Until you do, it stays off the public slate.
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 28px">
              <a href="${safeUrl}" style="display:inline-block;background:#e8703a;color:#160c06;font-family:Outfit,Helvetica,Arial,sans-serif;font-size:14px;font-weight:700;text-decoration:none;padding:13px 22px;border-radius:999px">
                Accept your credit
              </a>
            </td>
          </tr>
        </table>
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="width:100%;max-width:480px">
          <tr>
            <td style="padding:18px 8px 0;font-family:Outfit,Helvetica,Arial,sans-serif;font-size:12px;line-height:1.5;color:#8d8d88">
              You’re getting this because ${owner} listed you on a UT student film. If that wasn’t you, you can ignore the email.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export function creditInviteText({ ownerName, filmTitle, role, roles, kind, acceptUrl, inviteeName }) {
  const hello = inviteeName ? `Hey ${inviteeName},` : 'Hey,'
  return `${hello}

${ownerName} credited you as ${formatCreditRole(role, roles, kind)} on “${filmTitle}”.

Accept this invite to appear on the film’s cast & crew:
${acceptUrl}

Until you accept, the credit stays off Shortwave.
`
}
