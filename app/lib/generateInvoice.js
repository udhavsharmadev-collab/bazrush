import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const PAGE_WIDTH = 595.28;  // A4
const PAGE_HEIGHT = 841.89;
const MARGIN = 50;

export async function generateInvoicePDF(order) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const black = rgb(0, 0, 0);
  const gray = rgb(0.45, 0.45, 0.45);
  const line = rgb(0.75, 0.75, 0.75);

  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  const newPageIfNeeded = (needed = 20) => {
    if (y - needed < MARGIN) {
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGIN;
    }
  };

  const drawLeft = (text, x, size, useFont, color = black) => {
    page.drawText(text, { x, y, size, font: useFont, color });
  };

  const drawRight = (text, size, useFont, color = black) => {
    const width = useFont.widthOfTextAtSize(text, size);
    page.drawText(text, { x: PAGE_WIDTH - MARGIN - width, y, size, font: useFont, color });
  };

  const drawCenter = (text, size, useFont, color = black) => {
    const width = useFont.widthOfTextAtSize(text, size);
    page.drawText(text, { x: (PAGE_WIDTH - width) / 2, y, size, font: useFont, color });
  };

  const hr = () => {
    page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_WIDTH - MARGIN, y }, thickness: 1, color: line });
  };

  // Header
  drawRight("INVOICE", 20, fontBold);
  y -= 24;
  drawRight(`Order ID: ${order.id}`, 10, font, gray);
  y -= 14;
  drawRight(`Placed: ${new Date(order.placedAt).toLocaleString("en-IN")}`, 10, font, gray);
  y -= 14;
  if (order.deliveredAt) {
    drawRight(`Delivered: ${new Date(order.deliveredAt).toLocaleString("en-IN")}`, 10, font, gray);
    y -= 14;
  }
  y -= 20;

  // Bill To
  drawLeft("Bill To:", MARGIN, 11, fontBold);
  y -= 16;
  drawLeft(order.customer?.name || "Customer", MARGIN, 10, font);
  y -= 14;
  drawLeft(order.customer?.address || "", MARGIN, 10, font);
  y -= 26;

  // Shops
  (order.shops || []).forEach((shop) => {
    newPageIfNeeded(60);
    drawLeft(shop.shopName || shop.name || "Shop", MARGIN, 11, fontBold);
    y -= 18;

    drawLeft("Item", 50, 9, fontBold);
    drawLeft("Qty", 300, 9, fontBold);
    drawLeft("Price", 370, 9, fontBold);
    drawLeft("Total", 460, 9, fontBold);
    y -= 6;
    hr();
    y -= 14;

    (shop.items || []).forEach((item) => {
      newPageIfNeeded(20);
      drawLeft(item.name, 50, 9, font);
      drawLeft(String(item.quantity), 300, 9, font);
      drawLeft(`Rs.${item.price}`, 370, 9, font);
      drawLeft(`Rs.${item.price * item.quantity}`, 460, 9, font);
      y -= 18;
    });

    drawLeft(`Shop Subtotal: Rs.${shop.subtotal}`, 370, 9, fontBold);
    y -= 26;
  });

  // Totals
  newPageIfNeeded(90);
  hr();
  y -= 18;
  drawRight(`Delivery Fee: ${order.deliveryFee ? "Rs." + order.deliveryFee : "FREE"}`, 10, font);
  y -= 20;
  drawRight(`Total Paid: Rs.${order.totalPrice}`, 13, fontBold);
  y -= 16;
  drawRight(`Payment: ${order.paymentMethod?.toUpperCase() || "N/A"}`, 9, font, gray);
  y -= 40;

  drawCenter("Thank you for your order!", 9, font, gray);

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}