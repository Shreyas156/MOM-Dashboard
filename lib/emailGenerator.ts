import { DailyMOM } from './types';

export function generateHTMLEmail(mom: DailyMOM): string {
  const presentAttendees = mom.qaTasks
    .filter((q) => !q.isOnLeave)
    .map((q) => q.qaName)
    .join(', ');

  const absentAttendees = mom.qaTasks
    .filter((q) => q.isOnLeave)
    .map((q) => q.qaName)
    .join(', ');

  const tasksHTML = mom.qaTasks
    .filter((q) => !q.isOnLeave)
    .map((qa) => {
      let bulletsHTML = '';
      if (qa.tasks && qa.tasks.length > 0) {
        const bullets = qa.tasks
          .map(
            (t) =>
              `<li style="margin-bottom: 3px;">${escapeHTML(t)}</li>`
          )
          .join('');
        bulletsHTML = `<ul style="margin: 4px 0 8px 20px; padding: 0; list-style-type: disc;">${bullets}</ul>`;
      }

      const statusText = qa.status ? ` : ${escapeHTML(qa.status)}` : '';
      return `
        <div style="margin-bottom: 8px;">
          <p style="margin: 0; padding: 0;"><strong>${escapeHTML(qa.qaName)}</strong>${statusText}</p>
          ${bulletsHTML}
        </div>
      `;
    })
    .join('');

  const tableRowsHTML = mom.smokeRows
    .map((row) => {
      const desktopTotalStr = row.desktopTotal !== null ? row.desktopTotal : '';
      const desktopPassStr = row.desktopPass !== null ? row.desktopPass : '';
      const desktopFailStr =
        row.desktopFail !== null
          ? row.desktopFail > 0
            ? `<span style="color: #dc2626; font-weight: bold;">${row.desktopFail}</span>`
            : row.desktopFail
          : row.desktopReport === 'NA'
          ? 'NA'
          : '';

      const msiteTotalStr = row.msiteTotal !== null ? row.msiteTotal : '';
      const msitePassStr = row.msitePass !== null ? row.msitePass : '';
      const msiteFailStr =
        row.msiteFail !== null
          ? row.msiteFail > 0
            ? `<span style="color: #dc2626; font-weight: bold;">${row.msiteFail}</span>`
            : row.msiteFail
          : row.msiteReport === 'NA'
          ? 'NA'
          : '';

      const desktopReportCell = formatCellLink(row.desktopReport, row.desktopReportUrl);
      const desktopBugCell = formatCellLink(row.desktopBugTicketId, row.desktopBugTicketUrl);
      const msiteReportCell = formatCellLink(row.msiteReport, row.msiteReportUrl);
      const msiteBugCell = formatCellLink(row.msiteBugTicketId, row.msiteBugTicketUrl);

      return `
        <tr>
          <td style="border: 1px solid #000000; padding: 5px 6px; text-align: center; font-weight: bold;">${escapeHTML(row.module)}</td>
          <td style="border: 1px solid #000000; padding: 5px 6px; text-align: center;">${escapeHTML(row.qa)}</td>
          <td style="border: 1px solid #000000; padding: 5px 6px; text-align: center;">${desktopTotalStr}</td>
          <td style="border: 1px solid #000000; padding: 5px 6px; text-align: center;">${desktopPassStr}</td>
          <td style="border: 1px solid #000000; padding: 5px 6px; text-align: center;">${desktopFailStr}</td>
          <td style="border: 1px solid #000000; padding: 5px 6px; text-align: center;">${desktopReportCell}</td>
          <td style="border: 1px solid #000000; padding: 5px 6px; text-align: center;">${desktopBugCell}</td>
          <td style="border: 1px solid #000000; padding: 5px 6px; text-align: center;">${msiteTotalStr}</td>
          <td style="border: 1px solid #000000; padding: 5px 6px; text-align: center;">${msitePassStr}</td>
          <td style="border: 1px solid #000000; padding: 5px 6px; text-align: center;">${msiteFailStr}</td>
          <td style="border: 1px solid #000000; padding: 5px 6px; text-align: center;">${msiteReportCell}</td>
          <td style="border: 1px solid #000000; padding: 5px 6px; text-align: center;">${msiteBugCell}</td>
        </tr>
      `;
    })
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>MOM of QA Stand up on ${escapeHTML(mom.dateFormatted)}</title>
</head>
<body style="font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: #1f2937; line-height: 1.5; padding: 10px; background-color: #ffffff;">

  <p style="margin-bottom: 12px;">Hi Team,</p>
  
  <p style="margin-bottom: 14px;">Please find below the quick summary for our daily QA stand-up Meet.</p>

  <p style="margin-bottom: 4px;"><strong>Attendees :</strong> ${escapeHTML(presentAttendees || mom.attendees.join(', '))}</p>
  ${absentAttendees ? `<p style="margin-bottom: 4px;"><strong>Absence :</strong> ${escapeHTML(absentAttendees)}</p>` : ''}
  <p style="margin-bottom: 16px;"><strong>Date :</strong> ${escapeHTML(mom.dateFormatted)}</p>

  <p style="margin-bottom: 8px;"><strong>Assigned Tasks :</strong></p>
  
  ${tasksHTML}

  <p style="margin-top: 16px; margin-bottom: 8px;"><strong>Daily smoke report execution:</strong></p>

  <table style="border-collapse: collapse; width: 100%; font-size: 12px; margin-bottom: 24px;">
    <thead>
      <tr style="background-color: #10b981; color: #ffffff;">
        <th style="border: 1px solid #000000; padding: 6px; text-align: center;" rowspan="2">Module Name</th>
        <th style="border: 1px solid #000000; padding: 6px; text-align: center;" rowspan="2">QA</th>
        <th style="border: 1px solid #000000; padding: 6px; text-align: center;" colspan="5">Desktop</th>
        <th style="border: 1px solid #000000; padding: 6px; text-align: center;" colspan="5">Msite</th>
      </tr>
      <tr style="background-color: #10b981; color: #ffffff;">
        <th style="border: 1px solid #000000; padding: 5px; text-align: center;">Total TC</th>
        <th style="border: 1px solid #000000; padding: 5px; text-align: center;">Passed</th>
        <th style="border: 1px solid #000000; padding: 5px; text-align: center;">Failed</th>
        <th style="border: 1px solid #000000; padding: 5px; text-align: center;">Report</th>
        <th style="border: 1px solid #000000; padding: 5px; text-align: center;">Bug Ticket</th>
        <th style="border: 1px solid #000000; padding: 5px; text-align: center;">Total TC</th>
        <th style="border: 1px solid #000000; padding: 5px; text-align: center;">Passed</th>
        <th style="border: 1px solid #000000; padding: 5px; text-align: center;">Failed</th>
        <th style="border: 1px solid #000000; padding: 5px; text-align: center;">Report</th>
        <th style="border: 1px solid #000000; padding: 5px; text-align: center;">Bug Ticket</th>
      </tr>
    </thead>
    <tbody>
      ${tableRowsHTML}
    </tbody>
  </table>

  <p style="margin-bottom: 2px;">Thanks & Regards,</p>
  <p style="margin: 0; font-weight: bold;">${escapeHTML(mom.senderName || 'RAKHI DAS')}</p>
  <p style="margin: 0; color: #6b7280; font-size: 12px;">${escapeHTML(mom.senderTitle || 'Executive || Quality Assurance')}</p>

</body>
</html>
  `;
}

export function generatePlainTextEmail(mom: DailyMOM): string {
  const presentAttendees = mom.qaTasks
    .filter((q) => !q.isOnLeave)
    .map((q) => q.qaName)
    .join(', ');

  const absentAttendees = mom.qaTasks
    .filter((q) => q.isOnLeave)
    .map((q) => q.qaName)
    .join(', ');

  const tasksText = mom.qaTasks
    .filter((q) => !q.isOnLeave)
    .map((qa) => {
      const bullets = qa.tasks.map((t) => `  * ${t}`).join('\n');
      const statusText = qa.status ? ` : ${qa.status}` : '';
      return `${qa.qaName}${statusText}\n${bullets}`;
    })
    .join('\n\n');

  return `Hi Team,

Please find below the quick summary for our daily QA stand-up Meet.

Attendees : ${presentAttendees || mom.attendees.join(', ')}
${absentAttendees ? `Absence : ${absentAttendees}\n` : ''}Date : ${mom.dateFormatted}

Assigned Tasks :

${tasksText}

Daily smoke report execution:
(See attached HTML or table for full matrix)

Thanks & Regards,
${mom.senderName || 'RAKHI DAS'}
${mom.senderTitle || 'Executive || Quality Assurance'}
  `;
}

function escapeHTML(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatCellLink(text: string, url?: string): string {
  if (!text) return '';
  if (url && url.startsWith('http')) {
    return `<a href="${url}" style="color: #2563eb; text-decoration: underline;" target="_blank">${escapeHTML(text)}</a>`;
  }
  if (text.toLowerCase() === 'link') {
    return `<span style="color: #2563eb; text-decoration: underline;">Link</span>`;
  }
  return escapeHTML(text);
}
