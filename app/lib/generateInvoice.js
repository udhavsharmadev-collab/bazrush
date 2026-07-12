import PDFDocument from "pdfkit";

export function generateInvoicePDF(order) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(20).text("INVOICE", { align: "right" });
    doc.fontSize(10).text(`Order ID: ${order.id}`, { align: "right" });
    doc.text(`Placed: ${new Date(order.placedAt).toLocaleString("en-IN")}`, { align: "right" });
    if (order.deliveredAt) doc.text(`Delivered: ${new Date(order.deliveredAt).toLocaleString("en-IN")}`, { align: "right" });
    doc.moveDown(2);

    doc.fontSize(11).font("Helvetica-Bold").text("Bill To:");
    doc.font("Helvetica").fontSize(10).text(order.customer?.name || "Customer");
    doc.text(order.customer?.address || "");
    doc.moveDown(1.5);

    (order.shops || []).forEach((shop) => {
      doc.font("Helvetica-Bold").fontSize(11).text(`🏪 ${shop.shopName || shop.name || "Shop"}`);
      doc.moveDown(0.3);

      const top = doc.y;
      doc.fontSize(9).font("Helvetica-Bold");
      doc.text("Item", 50, top);
      doc.text("Qty", 300, top);
      doc.text("Price", 370, top);
      doc.text("Total", 460, top);
      doc.moveDown(0.4);
      doc.font("Helvetica");
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();

      let y = doc.y + 8;
      (shop.items || []).forEach((item) => {
        doc.fontSize(9).text(item.name, 50, y, { width: 240 });
        doc.text(String(item.quantity), 300, y);
        doc.text(`₹${item.price}`, 370, y);
        doc.text(`₹${item.price * item.quantity}`, 460, y);
        y += 18;
      });

      doc.y = y;
      doc.font("Helvetica-Bold").fontSize(9).text(`Shop Subtotal: ₹${shop.subtotal}`, 370, y + 4);
      doc.moveDown(2);
    });

    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    doc.font("Helvetica").fontSize(10);
    doc.text(`Delivery Fee: ${order.deliveryFee ? "₹" + order.deliveryFee : "FREE"}`, { align: "right" });
    doc.font("Helvetica-Bold").fontSize(13);
    doc.text(`Total Paid: ₹${order.totalPrice}`, { align: "right" });
    doc.fontSize(9).font("Helvetica").text(`Payment: ${order.paymentMethod?.toUpperCase() || "N/A"}`, { align: "right" });

    doc.moveDown(3);
    doc.fontSize(9).text("Thank you for your order!", { align: "center" });

    doc.end();
  });
}