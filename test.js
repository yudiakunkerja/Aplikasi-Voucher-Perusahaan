const displayFiles = [{ url: '1', docType: 'petty_cash_report' }, { url: '2' }];
const pettyCashFile = displayFiles.find(f => f.docType === 'petty_cash_report');
console.log(pettyCashFile);
