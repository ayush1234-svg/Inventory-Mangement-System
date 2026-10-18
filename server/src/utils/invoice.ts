import { Model } from 'mongoose';

export async function generateInvoiceNumber(
  saleModel: Model<any>,
  prefix = 'WTL-'
): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const monthPrefix = `${prefix}${year}${month}-`;

  // Find the latest invoice created in this month
  const latestSale = await saleModel
    .findOne({ invoiceNumber: { $regex: `^${monthPrefix}` } })
    .sort({ invoiceNumber: -1 })
    .lean();

  let nextSequence = 1;
  if (latestSale && (latestSale as any).invoiceNumber) {
    const parts = (latestSale as any).invoiceNumber.split('-');
    const lastNumStr = parts[parts.length - 1];
    const parsed = parseInt(lastNumStr, 10);
    if (!isNaN(parsed)) {
      nextSequence = parsed + 1;
    }
  }

  const sequenceFormatted = String(nextSequence).padStart(5, '0');
  return `${monthPrefix}${sequenceFormatted}`;
}
