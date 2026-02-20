
import ExcelJS from "exceljs";

async function inspectExcel() {
    const filePath = "/Volumes/Mayor/Build/crm-official-1/temp/Web3Crypto Investors_emails.xlsx";
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    workbook.eachSheet((worksheet) => {
        console.log("-----------------------------------------");
        console.log("Worksheet Name:", worksheet.name);

        // Get headers (row 1)
        const row1 = worksheet.getRow(1);
        const headers: string[] = [];
        row1.eachCell((cell) => {
            headers.push(cell.value?.toString() || "");
        });

        console.log("Headers:", headers);

        // Sample first data row
        const row2 = worksheet.getRow(2);
        const data: any[] = [];
        row2.eachCell((cell) => {
            data.push(cell.value);
        });
        console.log("Sample Data (Row 2):", data);
    });
}

inspectExcel().catch(console.error);
