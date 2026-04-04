import { PDFDocument, rgb } from 'pdf-lib';

export const generateInvoicePDF = async (invoiceData) => {
  try {
    const {
      invoiceNumber,
      date,
      sellerName,
      sellerEmail,
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      items,
      totalAmount,
    } = invoiceData;

    // Validate items array
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error("Items array is required and must not be empty");
    }

    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4 size
    const { width, height } = page.getSize();

    const margin = 40;
    const contentWidth = width - 2 * margin;
    let y = height - margin;

    // Embed fonts once
    const helveticaBold = await pdfDoc.embedFont('Helvetica-Bold');
    const helvetica = await pdfDoc.embedFont('Helvetica');
    const helveticaOblique = await pdfDoc.embedFont('Helvetica-Oblique');

    // Helper function for new line
    const newLine = (spacing = 20) => {
      y -= spacing;
    };

    // Title and seller info
    page.drawText(sellerName || 'Invoice', {
      x: margin,
      y,
      size: 24,
      color: rgb(55/255, 138/255, 221/255), // Invotrack blue
      font: helveticaBold,
    });
    newLine(30);

    page.drawText('INVOICE', {
      x: margin,
      y,
      size: 20,
      color: rgb(100/255, 100/255, 100/255),
      font: helveticaBold,
    });
    newLine(25);

    // Invoice number and date
    page.drawText(`Invoice #: ${invoiceNumber || 'N/A'}`, {
      x: margin,
      y,
      size: 11,
      color: rgb(50/255, 50/255, 50/255),
      font: helvetica,
    });
    newLine(15);

    const formattedDate = date ? new Date(date).toLocaleDateString() : 'N/A';
    page.drawText(`Date: ${formattedDate}`, {
      x: margin,
      y,
      size: 11,
      color: rgb(50/255, 50/255, 50/255),
      font: helvetica,
    });
    newLine(25);

    // Customer section
    page.drawText('BILL TO:', {
      x: margin,
      y,
      size: 11,
      color: rgb(50/255, 50/255, 50/255),
      font: helveticaBold,
    });
    newLine(15);

    page.drawText(customerName || 'Customer', {
      x: margin,
      y,
      size: 11,
      color: rgb(50/255, 50/255, 50/255),
      font: helveticaBold,
    });
    newLine(12);

    if (customerAddress) {
      page.drawText(customerAddress, {
        x: margin,
        y,
        size: 10,
        color: rgb(80/255, 80/255, 80/255),
        font: helvetica,
      });
      newLine(12);
    }

    if (customerEmail) {
      page.drawText(`Email: ${customerEmail}`, {
        x: margin,
        y,
        size: 10,
        color: rgb(80/255, 80/255, 80/255),
        font: helvetica,
      });
      newLine(10);
    }

    if (customerPhone) {
      page.drawText(`Phone: ${customerPhone}`, {
        x: margin,
        y,
        size: 10,
        color: rgb(80/255, 80/255, 80/255),
        font: helvetica,
      });
      newLine(10);
    }

    newLine(15);

    // Items table header
    const col1X = margin;
    const col2X = margin + 300;
    const col3X = margin + 380;
    const col4X = margin + 450;

    page.drawText('Item Description', {
      x: col1X,
      y,
      size: 11,
      color: rgb(255/255, 255/255, 255/255),
      font: helveticaBold,
    });
    page.drawText('Qty', {
      x: col2X,
      y,
      size: 11,
      color: rgb(255/255, 255/255, 255/255),
      font: helveticaBold,
    });
    page.drawText('Unit Price', {
      x: col3X,
      y,
      size: 11,
      color: rgb(255/255, 255/255, 255/255),
      font: helveticaBold,
    });
    page.drawText('Total', {
      x: col4X,
      y,
      size: 11,
      color: rgb(255/255, 255/255, 255/255),
      font: helveticaBold,
    });

    // Draw header background
    page.drawRectangle({
      x: margin,
      y: y - 15,
      width: contentWidth,
      height: 20,
      color: rgb(55/255, 138/255, 221/255),
    });
    newLine(30);

    // Items rows
    items.forEach((item, index) => {
      const quantity = item.quantity || 0;
      const price = item.price || 0;
      const lineTotal = quantity * price;

      page.drawText(item.name || 'Item', {
        x: col1X,
        y,
        size: 10,
        color: rgb(50/255, 50/255, 50/255),
        font: helvetica,
      });
      page.drawText(quantity.toString(), {
        x: col2X,
        y,
        size: 10,
        color: rgb(50/255, 50/255, 50/255),
        font: helvetica,
      });
      page.drawText(`Rs. ${price.toFixed(2)}`, {
        x: col3X,
        y,
        size: 10,
        color: rgb(50/255, 50/255, 50/255),
        font: helvetica,
      });
      page.drawText(`Rs. ${lineTotal.toFixed(2)}`, {
        x: col4X,
        y,
        size: 10,
        color: rgb(50/255, 50/255, 50/255),
        font: helvetica,
      });

      newLine(15);

      // Add separator line between items
      if (index < items.length - 1) {
        page.drawRectangle({
          x: margin,
          y: y - 5,
          width: contentWidth,
          height: 0.5,
          color: rgb(200/255, 200/255, 200/255),
        });
        newLine(8);
      }
    });

    // Separator before total
    y -= 10;
    page.drawRectangle({
      x: margin,
      y,
      width: contentWidth,
      height: 1,
      color: rgb(55/255, 138/255, 221/255),
    });
    y -= 20;

    // Total amount
    page.drawText('TOTAL AMOUNT:', {
      x: col3X,
      y,
      size: 12,
      color: rgb(50/255, 50/255, 50/255),
      font: helveticaBold,
    });
    page.drawText(`Rs. ${(totalAmount || 0).toFixed(2)}`, {
      x: col4X,
      y,
      size: 14,
      color: rgb(55/255, 138/255, 221/255),
      font: helveticaBold,
    });

    // Footer
    y = margin + 30;
    page.drawText('Thank you for your business!', {
      x: margin,
      y,
      size: 11,
      color: rgb(100/255, 100/255, 100/255),
      font: helveticaOblique,
    });

    // Seller info in footer
    y -= 15;
    page.drawText(`${sellerName || 'Business'} | ${sellerEmail || 'email@example.com'}`, {
      x: margin,
      y,
      size: 9,
      color: rgb(120/255, 120/255, 120/255),
      font: helvetica,
    });

    // Convert PDF to bytes and return
    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);

  } catch (error) {
    console.error("PDF Generation Error Details:", {
      message: error.message,
      stack: error.stack,
      invoiceData: invoiceData
    });
    throw new Error(`Failed to generate PDF: ${error.message}`);
  }
};
