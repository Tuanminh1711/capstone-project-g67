const fs = require('fs');
const path = require('path');

// Files that need import path fixes
const filesToFix = [
  'src/app/admin/response-manager/report-list/report-list.component.ts',
  'src/app/admin/response-manager/report-list/report-detail.component.ts',
  'src/app/admin/response-manager/report-list/report-approve-reject.component.ts',
  'src/app/admin/response-manager/ticket-list/ticket-detail.component.ts',
  'src/app/admin/response-manager/ticket-list/send-response.component.ts',
  'src/app/admin/plant-manager/plant-list/admin-plant-list.component.ts'
];

filesToFix.forEach(filePath => {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Remove duplicate imports and fix paths
    content = content.replace(/import.*?\n.*?import.*?AdminFooterComponent.*?import.*?\n/gs, '');
    content = content.replace(/from '\.\.\/\.\.\/shared\//g, "from '../../../shared/");
    
    // Clean up any malformed lines
    content = content.replace(/;\{[^}]*\}/g, ';');
    content = content.replace(/;\{ Component[^}]*from[^;]*;/g, ';');
    
    fs.writeFileSync(filePath, content);
    console.log(`Fixed: ${filePath}`);
  } catch (err) {
    console.log(`Could not fix ${filePath}: ${err.message}`);
  }
});

console.log('Import fixes completed');
