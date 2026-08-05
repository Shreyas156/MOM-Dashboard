import { DailyMOM } from './types';

export function generateHTMLEmail(mom: DailyMOM): string {
  const presentAttendees = mom.qaTasks
    .filter((q) => !q.isOnLeave)
    .map((q) => q.qaName)
    .join(', ');

  const tasksHTML = mom.qaTasks
    .map((qa) => {
      if (qa.isOnLeave) {
        return `<p style="margin: 6px 0 10px 0;"><strong>${escapeHTML(qa.qaName)} :</strong> <span style="color: #dc2626; font-weight: bold;">[ ON LEAVE ]</span></p>`;
      }

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
  <p style="margin-bottom: 16px;"><strong>Date :</strong> ${escapeHTML(mom.dateFormatted)}</p>

  <p style="margin-bottom: 8px;"><strong>Assigned Tasks :</strong></p>
  
  <div style="margin-bottom: 20px;">
    ${tasksHTML}
  </div>

  <p style="margin-bottom: 10px;"><strong>Please find the daily smoke report execution summary below:</strong></p>

  <table style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; font-size: 11px; margin-bottom: 24px; border: 1px solid #000000;" border="1">
    <thead>
      <tr style="background-color: #fff2cc;">
        <th colspan="12" style="border: 1px solid #000000; padding: 6px; text-align: center; font-size: 12px; font-weight: bold; color: #000000;">
          Daily smoke report execution
        </th>
      </tr>
      <tr style="background-color: #d9ead3; font-weight: bold; color: #000000;">
        <th rowspan="2" style="border: 1px solid #000000; padding: 6px; text-align: center; width: 12%;">Module</th>
        <th rowspan="2" style="border: 1px solid #000000; padding: 6px; text-align: center; width: 8%;">QA</th>
        <th colspan="3" style="border: 1px solid #000000; padding: 6px; text-align: center;">Count of Desktop Test Cases</th>
        <th style="border: 1px solid #000000; padding: 6px; text-align: center;">Desktop</th>
        <th style="border: 1px solid #000000; padding: 6px; text-align: center;">Bug Ticket ID</th>
        <th colspan="3" style="border: 1px solid #000000; padding: 6px; text-align: center;">Count of Msite Test Cases</th>
        <th style="border: 1px solid #000000; padding: 6px; text-align: center;">Msite</th>
        <th style="border: 1px solid #000000; padding: 6px; text-align: center;">Bug Ticket ID</th>
      </tr>
      <tr style="background-color: #d9ead3; font-weight: bold; color: #000000;">
        <th style="border: 1px solid #000000; padding: 5px; text-align: center;">Total count</th>
        <th style="border: 1px solid #000000; padding: 5px; text-align: center;">Pass</th>
        <th style="border: 1px solid #000000; padding: 5px; text-align: center;">Fail</th>
        <th style="border: 1px solid #000000; padding: 5px; text-align: center;">Report</th>
        <th style="border: 1px solid #000000; padding: 5px; text-align: center;">ID</th>
        <th style="border: 1px solid #000000; padding: 5px; text-align: center;">Total count</th>
        <th style="border: 1px solid #000000; padding: 5px; text-align: center;">Pass</th>
        <th style="border: 1px solid #000000; padding: 5px; text-align: center;">Fail</th>
        <th style="border: 1px solid #000000; padding: 5px; text-align: center;">Report</th>
        <th style="border: 1px solid #000000; padding: 5px; text-align: center;">ID</th>
      </tr>
    </thead>
    <tbody>
      ${tableRowsHTML}
    </tbody>
  </table>

  <div style="margin-top: 24px; font-weight: bold;">
    <p style="margin: 0; text-transform: uppercase;">${escapeHTML(mom.senderName || 'RAKHI DAS')}</p>
    <p style="margin: 2px 0 0 0; color: #4b5563; font-weight: normal;">${escapeHTML(mom.senderTitle || 'Executive || Quality Assurance')}</p>
  </div>

</body>
</html>
  `.trim();
}

export function generatePlainTextEmail(mom: DailyMOM): string {
  const presentAttendees = mom.qaTasks
    .filter((q) => !q.isOnLeave)
    .map((q) => q.qaName)
    .join(', ');

  let tasksText = '';
  mom.qaTasks.forEach((qa) => {
    if (qa.isOnLeave) {
      tasksText += `${qa.qaName} : [ ON LEAVE ]\n\n`;
    } else {
      tasksText += `${qa.qaName} : ${qa.status || ''}\n`;
      if (qa.tasks && qa.tasks.length > 0) {
        qa.tasks.forEach((t) => {
          tasksText += `  • ${t}\n`;
        });
      }
      tasksText += '\n';
    }
  });

  let tableText = `Daily smoke report execution:\n`;
  tableText += `Module | QA | Desktop (Total/Pass/Fail/Report/Bug) | Msite (Total/Pass/Fail/Report/Bug)\n`;
  tableText += `--------------------------------------------------------------------------------\n`;

  mom.smokeRows.forEach((r) => {
    const dStr = r.desktopReport === 'NA' ? 'NA' : `${r.desktopTotal || 0}/${r.desktopPass || 0}/${r.desktopFail || 0} (${r.desktopReport}) [Bug: ${r.desktopBugTicketId}]`;
    const mStr = r.msiteReport === 'NA' ? 'NA' : `${r.msiteTotal || 0}/${r.msitePass || 0}/${r.msiteFail || 0} (${r.msiteReport}) [Bug: ${r.msiteBugTicketId}]`;
    tableText += `${r.module} | ${r.qa} | ${dStr} | ${mStr}\n`;
  });

  return `
MOM of QA Stand up on ${mom.dateFormatted}

Hi Team,

Please find below the quick summary for our daily QA stand-up Meet.

Attendees : ${presentAttendees}
Date : ${mom.dateFormatted}

Assigned Tasks :

${tasksText}
Please find the daily smoke report execution summary below:

${tableText}

${mom.senderName || 'RAKHI DAS'}
${mom.senderTitle || 'Executive || Quality Assurance'}
  `.trim();
}

function formatCellLink(text: string, url?: string): string {
  if (!text || text === '-') return '-';
  
  // Format multiline bug IDs cleanly
  const lines = text.split('\n');
  return lines
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return '';
      if (trimmed === 'Link') {
        const href = url || '#';
        return `<a href="${href}" style="color: #1155cc; text-decoration: underline;" target="_blank">Link</a>`;
      }
      if (url && url !== '#') {
        return `<a href="${url}" style="color: #1155cc; text-decoration: underline;" target="_blank">${escapeHTML(trimmed)}</a>`;
      }
      return escapeHTML(trimmed);
    })
    .filter(Boolean)
    .join('<br/>');
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
