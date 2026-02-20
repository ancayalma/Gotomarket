
import ExcelJS from "exceljs";

async function readMore() {
    const filePath = "/Volumes/Mayor/Build/crm-official-1/temp/Web3Crypto Investors_emails.xlsx";
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.worksheets[0];

    for (let i = 2; i <= 50; i++) {
        const row = worksheet.getRow(i);
        console.log(`Row ${i}:`, row.getCell(2).value, "|", row.getCell(7).value);
    }
}

readMore().catch(console.error);
