const ExcelJS = require('exceljs');
const { normalizeRow } = require('./lib/import-utils');

(async () => {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile('U:\\BasaltCRM\\crm-official\\Vendor List (1).xlsx');
  const ws = wb.getWorksheet(1);

  // Resolve cell values (same as our fix in the routes)
  function resolveExcelCellValue(val) {
    if (val === null || val === undefined) return val;
    if (typeof val === 'object') {
      if ('hyperlink' in val && 'text' in val) return val.text;
      if ('richText' in val && Array.isArray(val.richText)) return val.richText.map(r => r.text || '').join('');
      if ('result' in val) return val.result;
      if (val instanceof Date) return val.toISOString().split('T')[0];
      if ('error' in val) return '';
      return String(val);
    }
    return val;
  }

  // Collect headers
  const headers = [];
  ws.getRow(1).eachCell({ includeEmpty: true }, (cell, colNumber) => {
    headers[colNumber] = resolveExcelCellValue(cell.value) || '';
  });

  // Simulate the crmFieldToColsKey + columnMap remapping
  const crmFieldToColsKey = {
    companyName: "company", domain: "domain", homepageUrl: "homepage",
    description: "description", industry: "industry",
    billingStreet: "billing street", billingCity: "billing city",
    billingState: "billing state", billingPostalCode: "billing zip",
    billingCountry: "billing country",
    firstName: "first name", lastName: "last name",
    email: "email", phone: "phone", fullName: "name", title: "title",
    linkedinUrl: "linkedin", department: "department",
    personalEmail: "personal email", mobilePhone: "mobile",
    officePhone: "office phone", accountEmail: "company email",
    accountPhone: "company phone",
  };

  // Build columnMap as the scan step would (header → crmField)
  const DETECTION_MAP = {
    'company name': 'companyName', 'company': 'companyName', 'organization': 'companyName',
    'street address': 'billingStreet', 'address': 'billingStreet', 'street': 'billingStreet',
    'city': 'billingCity', 'state': 'billingState', 'province': 'billingState',
    'zip code': 'billingPostalCode', 'zip': 'billingPostalCode', 'postal code': 'billingPostalCode',
    'first name': 'firstName', 'firstname': 'firstName',
    'last name': 'lastName', 'lastname': 'lastName',
    'email': 'email', 'email address': 'email', 'e-mail': 'email',
    'phone': 'phone', 'phone number': 'phone', 'telephone': 'phone',
  };

  const columnMap = {};
  headers.forEach(h => {
    if (!h) return;
    const lh = String(h).toLowerCase().trim();
    if (DETECTION_MAP[lh]) columnMap[h] = DETECTION_MAP[lh];
  });

  function remapRow(row) {
    if (!Object.keys(columnMap).length) return row;
    const remapped = {};
    const mappedCsvHeaders = new Set();
    for (const [csvHeader, crmField] of Object.entries(columnMap)) {
      const colsKey = crmFieldToColsKey[crmField];
      if (colsKey) {
        const originalKey = Object.keys(row).find(k => k.toLowerCase() === csvHeader.toLowerCase());
        if (originalKey && row[originalKey] !== undefined && row[originalKey] !== null && row[originalKey] !== "") {
          remapped[colsKey] = row[originalKey];
          mappedCsvHeaders.add(originalKey);
        }
      }
    }
    for (const [key, val] of Object.entries(row)) {
      if (!mappedCsvHeaders.has(key)) remapped[key] = val;
    }
    return remapped;
  }

  let totalRows = 0;
  let droppedCandidates = 0;
  let droppedContacts = 0;
  let droppedBoth = 0;
  const droppedExamples = [];

  ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return; // skip header
    totalRows++;

    const rowObj = {};
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const header = headers[colNumber];
      if (header) rowObj[header] = resolveExcelCellValue(cell.value);
    });

    const remapped = remapRow(rowObj);
    const result = normalizeRow(remapped);
    
    const hasCandidate = !!result.candidate;
    const hasContact = result.contacts.length > 0;
    const hasEmail = !!rowObj['Email'];
    const hasPhone = !!rowObj['Phone'];
    const hasName = !!(rowObj['First Name'] || rowObj['Last Name']);
    const hasCompany = !!rowObj['Company Name'];

    if (!hasCandidate) droppedCandidates++;
    if (!hasContact && (hasEmail || hasPhone || hasName)) droppedContacts++;
    if (!hasCandidate && !hasContact) {
      droppedBoth++;
      if (droppedExamples.length < 10) {
        droppedExamples.push({
          excelRow: rowNumber,
          company: rowObj['Company Name'] || '<empty>',
          email: rowObj['Email'] || '<empty>',
          phone: rowObj['Phone'] || '<empty>',
          firstName: rowObj['First Name'] || '<empty>',
          lastName: rowObj['Last Name'] || '<empty>',
          reason: !hasCompany && !hasEmail ? 'No company name AND no email' : 'Unknown'
        });
      }
    } else if (!hasContact && (hasEmail || hasPhone || hasName)) {
      if (droppedExamples.length < 10) {
        droppedExamples.push({
          excelRow: rowNumber,
          company: rowObj['Company Name'] || '<empty>',
          email: rowObj['Email'] || '<empty>',
          phone: rowObj['Phone'] || '<empty>',
          firstName: rowObj['First Name'] || '<empty>',
          lastName: rowObj['Last Name'] || '<empty>',
          reason: 'Contact dropped despite having data'
        });
      }
    }
  });

  console.log('=== IMPORT PIPELINE AUDIT ===');
  console.log('Total data rows:', totalRows);
  console.log('Dropped candidates (no account created):', droppedCandidates);
  console.log('Dropped contacts (had email/phone/name but no contact created):', droppedContacts);
  console.log('Dropped BOTH (entire row lost):', droppedBoth);
  console.log('');
  console.log('=== SAMPLE DROPPED ROWS ===');
  droppedExamples.forEach(ex => {
    console.log(`  Row ${ex.excelRow}: "${ex.company}" | ${ex.email} | ${ex.phone} | ${ex.firstName} ${ex.lastName} | REASON: ${ex.reason}`);
  });
})();
