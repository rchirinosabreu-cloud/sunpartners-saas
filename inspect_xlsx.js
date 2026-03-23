const xlsx = require('xlsx');
const workbook = xlsx.readFile('inventory.xlsx');
const sheet_name_list = workbook.SheetNames;
console.log('Sheet Names:', sheet_name_list);
const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);
console.log('First 2 rows:', JSON.stringify(data.slice(0, 2), null, 2));
