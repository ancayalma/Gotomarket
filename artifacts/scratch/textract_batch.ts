const replacementCode = `
        if (type === "EXCEL" && !isImage) {
            await (prismadb as any).crm_Transform_Jobs.update({ where: { id: jobId }, data: { progress: 20 } });
            
            // ── AWS Textract Async Batch API (Bypassing LLM for deterministic multi-page table extraction) ──
            const { TextractClient, StartDocumentAnalysisCommand, GetDocumentAnalysisCommand } = require("@aws-sdk/client-textract");
            const textract = new TextractClient({
                region: process.env.AWS_REGION || "us-west-2",
                credentials: {
                    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
                    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
                },
            });

            const s3Key = \`transform_jobs/\${jobId}.pdf\`;
            
            // 1. Upload PDF to S3
            await s3.send(new PutObjectCommand({
                Bucket: S3_BUCKET,
                Key: s3Key,
                Body: buffer,
                ContentType: "application/pdf"
            }));

            await (prismadb as any).crm_Transform_Jobs.update({ where: { id: jobId }, data: { progress: 30 } });

            // 2. Start Async Analysis
            const startRes = await textract.send(new StartDocumentAnalysisCommand({
                DocumentLocation: { S3Object: { Bucket: S3_BUCKET, Name: s3Key } },
                FeatureTypes: ["TABLES"]
            }));
            const textractJobId = startRes.JobId;

            await (prismadb as any).crm_Transform_Jobs.update({ where: { id: jobId }, data: { progress: 40 } });

            // 3. Poll for Completion
            let jobStatus = "IN_PROGRESS";
            while (jobStatus === "IN_PROGRESS" || jobStatus === "PARTIAL_SUCCESS") {
                await new Promise(res => setTimeout(res, 5000));
                const statusRes = await textract.send(new GetDocumentAnalysisCommand({ JobId: textractJobId }));
                jobStatus = statusRes.JobStatus;
                if (jobStatus === "FAILED") {
                    throw new Error("AWS Textract Analysis Failed: " + statusRes.StatusMessage);
                }
            }

            await (prismadb as any).crm_Transform_Jobs.update({ where: { id: jobId }, data: { progress: 75 } });

            // 4. Fetch Paginated Results
            let allBlocks: any[] = [];
            let nextToken = undefined;
            do {
                const res = await textract.send(new GetDocumentAnalysisCommand({ JobId: textractJobId, NextToken: nextToken }));
                if (res.Blocks) allBlocks.push(...res.Blocks);
                nextToken = res.NextToken;
            } while (nextToken);

            // 5. Parse Tables and Consolidate
            const blockMap: Record<string, any> = {};
            allBlocks.forEach(b => { if (b.Id) blockMap[b.Id] = b; });

            const getBlockText = (block: any): string => {
                if (!block?.Relationships) return block?.Text || "";
                const childRel = block.Relationships.find((r: any) => r.Type === "CHILD");
                if (!childRel?.Ids) return block?.Text || "";
                return childRel.Ids.map((id: string) => blockMap[id]?.Text || "").filter(Boolean).join(" ");
            }

            const tableBlocks = allBlocks.filter((b: any) => b.BlockType === "TABLE");
            
            const workbook = new ExcelJS.Workbook();
            const sheet = workbook.addWorksheet("Consolidated Data");

            let currentRowOffset = 0;
            let previousTableHeaders: string[] = [];

            for (const table of tableBlocks) {
                const cellRel = table.Relationships?.find((r: any) => r.Type === "CHILD");
                if (cellRel?.Ids) {
                    const cells = cellRel.Ids.map((id: string) => blockMap[id]).filter(Boolean);
                    
                    let maxRow = 0;
                    let maxCol = 0;
                    const cellGrid: Record<string, string> = {};

                    cells.forEach((cell: any) => {
                        if (cell.BlockType === "CELL") {
                            const r = cell.RowIndex || 0;
                            const c = cell.ColumnIndex || 0;
                            maxRow = Math.max(maxRow, r);
                            maxCol = Math.max(maxCol, c);
                            cellGrid[\`\${r}_\${c}\`] = getBlockText(cell).trim();
                        }
                    });

                    // Extract current table headers (Row 1)
                    const currentHeaders: string[] = [];
                    for (let c = 1; c <= maxCol; c++) {
                        currentHeaders.push(cellGrid[\`1_\${c}\`] || "");
                    }

                    // Header Matching Heuristic
                    const isHeaderMatch = previousTableHeaders.length > 0 && 
                                          previousTableHeaders.length === currentHeaders.length && 
                                          previousTableHeaders.every((h, i) => h === currentHeaders[i]);

                    let startRow = 1;
                    if (isHeaderMatch) {
                        // Skip the header row and append directly without gap
                        startRow = 2; 
                    } else if (currentRowOffset > 0) {
                        // Add a blank row gap if it's a completely new/different table
                        currentRowOffset += 1;
                        previousTableHeaders = currentHeaders;
                    } else {
                        previousTableHeaders = currentHeaders;
                    }

                    for (let r = startRow; r <= maxRow; r++) {
                        const excelRow = sheet.getRow(currentRowOffset + (r - startRow + 1));
                        for (let c = 1; c <= maxCol; c++) {
                            excelRow.getCell(c).value = cellGrid[\`\${r}_\${c}\`] || "";
                        }
                    }
                    
                    // Style headers if this is a new table
                    if (!isHeaderMatch) {
                        const headerExcelRow = sheet.getRow(currentRowOffset + 1);
                        headerExcelRow.font = { bold: true };
                        headerExcelRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
                    }

                    currentRowOffset += (maxRow - startRow + 1);
                }
            }

            // Cleanup S3
            try {
                await s3.send(new DeleteObjectCommand({
                    Bucket: S3_BUCKET,
                    Key: s3Key
                }));
            } catch (cleanupErr) {
                console.error("[S3_CLEANUP_ERROR]", cleanupErr);
            }

            await (prismadb as any).crm_Transform_Jobs.update({ where: { id: jobId }, data: { progress: 95 } });

            resultBuffer = Buffer.from(await workbook.xlsx.writeBuffer());
            mimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            extension = ".xlsx";

        } else if (type === "EXCEL" && isImage) {
            // Keep the fallback synchronous Textract + LLM logic for single Images
`;
