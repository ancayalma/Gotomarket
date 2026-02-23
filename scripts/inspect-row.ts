
import ExcelJS from 'exceljs';

async function inspectRow48() {
    const filePath = '/Users/mayordelmar/Desktop/Local Workspace/crm-official/ISO Campaign.xlsx';
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const sheet = workbook.getWorksheet(1);
    if (!sheet) return;

    const row = sheet.getRow(48);
    console.log('Row 48 Values:', row.values);
}

inspectRow48().catch(console.error);
