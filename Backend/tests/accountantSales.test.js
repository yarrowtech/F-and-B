import test from 'node:test';
import assert from 'node:assert/strict';
import { PassThrough } from 'node:stream';
import ExcelJS from 'exceljs';
import Bill from '../models/Bill.model.js';
import Restaurant from '../models/Restaurant.model.js';
import { getAccountantSalesReport } from '../controllers/accountantSales.controller.js';
import { salesDateRange, buildSalesReport, buildSalesReceipt } from '../utils/accountantSalesReport.js';

const options = { date: '2026-11-25', restaurantName: 'Test Restaurant' };
const bill = {
  billNo: '4', paymentStatus: 'PAID', paymentMethod: 'CASH', itemsTotal: 489.05,
  cgst: 12.23, sgst: 12.23, totalAmount: 514,
  order: { table: { tableNumber: 1 }, items: [
    { _id: 'a', menuItem: { _id: 'dosa', name: 'Dosa' }, price: 150, quantity: 2 },
    { _id: 'b', menuItem: { _id: 'lassi', name: 'Lassi' }, price: 85, quantity: 2 },
    { _id: 'c', menuItem: { _id: 'water', name: 'Water' }, price: 19.05, quantity: 1 },
    { _id: 'd', menuItem: { _id: 'cancelled', name: 'Cancelled' }, price: 100, quantity: 1, status: 'CANCELLED' },
  ] },
};

test('date range uses IST midnight and rejects invalid dates', () => {
  const range = salesDateRange(options.date);
  assert.equal(range.start.toISOString(), '2026-11-24T18:30:00.000Z');
  assert.equal(range.end.toISOString(), '2026-11-25T18:30:00.000Z');
  for (const date of ['2026-02-30', '', '25-11-2026']) assert.throws(() => salesDateRange(date));
});

test('paid totals reconcile, excluding void, unpaid and cancelled lines', () => {
  const report = buildSalesReport([bill, { ...bill, paymentStatus: 'VOID' }, { ...bill, paymentStatus: 'PENDING' }], options);
  assert.equal(report.summary.billCount, 1);
  assert.equal(report.summary.collected, 514);
  assert.equal(report.summary.roundOff, 0.49);
  assert.equal(report.payments.CASH, 514);
  assert.equal(report.items.length, 3);
  assert.equal(report.items.reduce((sum, row) => sum + row.amount, 0), 489.05);
  assert.match(buildSalesReceipt(report, 'daily'), /Total collected\s+514.00/);
  assert.match(buildSalesReceipt(report, 'items'), /Item value\s+489.05/);
});

test('complimentary quantities do not inflate item sales and empty reports print', () => {
  const report = buildSalesReport([{ ...bill, complimentaryType: 'ITEMS', complimentaryItems: ['a'] }], options);
  const dosa = report.items.find((row) => row.name === 'Dosa');
  assert.deepEqual(dosa, { name: 'Dosa', quantity: 0, complimentaryQuantity: 2, amount: 0 });
  const full = buildSalesReport([{ ...bill, complimentaryType: 'FULL_ORDER' }], options);
  assert.equal(full.items.reduce((sum, row) => sum + row.amount, 0), 0);
  assert.match(buildSalesReceipt(buildSalesReport([], options), 'daily'), /No paid sales/);
  assert.equal(buildSalesReport([{ ...bill, order: null }], options).missingOrders, 1);
});

test('report handler scopes restaurant and paid date, returns real Excel for both reports', async (t) => {
  let query;
  t.mock.method(Bill, 'find', (filter) => {
    query = filter;
    const chain = { populate: () => chain, sort: () => chain, lean: async () => [bill] };
    return chain;
  });
  t.mock.method(Restaurant, 'findById', () => ({ select: () => ({ lean: async () => ({ name: 'Test Restaurant' }) }) }));
  for (const type of ['daily', 'items']) {
    const res = new PassThrough();
    const chunks = [];
    const headers = {};
    res.on('data', (chunk) => chunks.push(chunk));
    res.setHeader = (key, value) => { headers[key] = value; };
    res.status = () => res;
    res.json = (body) => assert.fail(JSON.stringify(body));
    await getAccountantSalesReport({ query: { date: options.date, type, format: 'excel' }, user: { restaurant: 'restaurant-1' } }, res);
    assert.equal(query.restaurant, 'restaurant-1');
    assert.equal(query.paymentStatus, 'PAID');
    assert.equal(query.paidAt.$lt.toISOString(), '2026-11-25T18:30:00.000Z');
    assert.match(headers['Content-Type'], /spreadsheetml/);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(Buffer.concat(chunks));
    const sheet = workbook.worksheets[0];
    const last = sheet.getRow(sheet.rowCount);
    assert.equal(last.getCell(1).value, 'TOTAL');
    assert.equal(last.getCell(type === 'daily' ? 10 : 4).value, type === 'daily' ? 514 : 489.05);
  }
});
