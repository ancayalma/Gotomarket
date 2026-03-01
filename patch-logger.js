const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
    });
}

function processFile(filePath) {
    if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // We want to target pattern like console.log("[SOMETHING]", error)
    // or console.error("[SOMETHING]", error)
    // Specifically looking for strings starting with [
    
    // Note: the pattern ` console.log("[SOMETHING]", error) `
    const regex = /console\.(log|error)\(\s*(["'`]\[.*?["'`])/g;
    
    if (regex.test(content)) {
        let newContent = content.replace(regex, 'systemLogger.error($2');
        
        // Add import { systemLogger } from "@/lib/logger"; to the top if not present
        if (!newContent.includes('import { systemLogger }')) {
            // Find last import
            const lastImportIndex = newContent.lastIndexOf('import ');
            if (lastImportIndex !== -1) {
                const endOfLastImport = newContent.indexOf('\n', lastImportIndex);
                newContent = newContent.slice(0, endOfLastImport + 1) + 
                             'import { systemLogger } from "@/lib/logger";\n' + 
                             newContent.slice(endOfLastImport + 1);
            } else {
                newContent = 'import { systemLogger } from "@/lib/logger";\n' + newContent;
            }
        }
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log("Patched logger in", filePath);
    }
}

walkDir(path.join(__dirname, 'app', 'api'), processFile);
walkDir(path.join(__dirname, 'actions'), processFile);
