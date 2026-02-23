
import ExcelJS from 'exceljs';
import path from 'path';

async function inspectExcel() {
    const filePath = '/Users/mayordelmar/Desktop/Local Workspace/crm-official/ISO Campaign.xlsx';
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    workbook.eachSheet((sheet, id) => {
        console.log(`Sheet: ${sheet.name} (id: ${id})`);
        const firstRow = sheet.getRow(1);
        console.log('Headers:', firstRow.values);

        // Show row 2
        const secondRow = sheet.getRow(2);
        console.log('Sample Data (Row 2):', secondRow.values);
    });
}

inspectExcel().catch(console.error);
