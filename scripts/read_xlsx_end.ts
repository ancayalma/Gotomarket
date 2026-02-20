
import ExcelJS from "exceljs";

async function readEnd() {
    const filePath = "/Volumes/Mayor/Build/crm-official-1/temp/Web3Crypto Investors_emails.xlsx";
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.worksheets[0];
    const rowCount = worksheet.rowCount;
    console.log("Total Rows:", rowCount);

    // Look at rows near the middle and end
    for (let i = Math.max(1, rowCount - 20); i <= rowCount; i++) {
        const row = worksheet.getRow(i);
        console.log(`Row ${i}:`, row.getCell(2).value, "|", row.getCell(7).value);
    }
}

readEnd().catch(console.error);
