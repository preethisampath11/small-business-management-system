# Invoice PDF Generation Feature

## Overview
The Invotrack system now includes automatic PDF invoice generation for orders.

## Backend Implementation

### 1. Installation
- **Package**: `pdf-lib` v1.17.1+
- **Location**: `/server/utils/generateInvoice.js`

### 2. Invoice Generation Utility

**File**: `/server/utils/generateInvoice.js`

**Function**: `generateInvoicePDF(invoiceData)`

**Input Parameters**:
```javascript
{
  invoiceNumber: "INV-001",           // Invoice identifier
  date: "2024-04-03T10:00:00Z",       // Order creation date
  sellerName: "Your Business",         // Business name (from User model)
  sellerEmail: "business@example.com", // Business email
  customerName: "John Doe",            // Customer name
  customerEmail: "john@example.com",   // Customer email
  customerPhone: "+1234567890",        // Customer phone
  customerAddress: "123 Main St",      // Customer address
  items: [
    {
      name: "Web Design",
      quantity: 2,
      price: 500
    }
  ],
  totalAmount: 1000                    // Total in currency
}
```

**Output**: Returns a PDF document as a Buffer (ready to send as HTTP response)

**PDF Layout**:
- Seller business name in blue (#378ADD) header
- "INVOICE" subtitle
- Invoice number and date
- "BILL TO" section with customer details
- Items table with columns:
  - Item Description
  - Quantity
  - Unit Price
  - Total Amount
- Grand total amount (blue highlighted)
- "Thank you for your business!" footer
- Seller name and email

### 3. API Route

**Endpoint**: `GET /api/orders/:id/invoice`

**Route File**: `/server/routes/orderRoutes.js`

**Controller**: `/server/controllers/orderController.js` → `getInvoice()`

**Authentication**: Required (Bearer token in Authorization header)

**Features**:
1. Fetches order with populated seller (userId) and customer (customerId) info
2. Verifies request authorization (only order owner can download)
3. Auto-generates invoice number if not already set (format: `INV-001`, `INV-002`, etc.)
4. Invoice numbering is per-seller (each user has their own sequence)
5. Stores the generated invoice number on the order record
6. Generates PDF using the utility function
7. Returns PDF with proper content headers for browser download

**Response Headers**:
- `Content-Type: application/pdf`
- `Content-Disposition: attachment; filename="Invoice-INV-001.pdf"`

**Error Handling**:
- 404: Order not found
- 403: User not authorized to access this order
- 500: Server error during PDF generation

## Frontend Integration

### 1. Orders Page (`/client/src/pages/Orders.jsx`)

**New Function**: `handleDownloadInvoice(orderId)`
- Fetches PDF from API endpoint
- Extracts filename from response headers
- Creates blob from response
- Triggers browser download
- Cleans up object URL

**UI Changes**:
- Added "Invoice" button in Actions column next to "View" button
- Button styled in green (#3fcf8e on hover)
- Uses grid layout for side-by-side View and Invoice buttons

### 2. Customers Detail View (`/client/src/pages/Customers.jsx`)

**New Function**: `handleDownloadInvoice(orderId)`
- Identical to Orders page implementation
- Reusable download handler

**UI Changes**:
- Added "Download" column in Order History table
- Download button 📥 in green for each order
- Allows downloading invoices directly from customer profile

## Usage Workflow

### For Sellers:
1. Navigate to Orders page (`/dashboard/orders`)
2. Find the order you want to invoice
3. Click the "Invoice" button
4. Browser automatically downloads `Invoice-INV-XXX.pdf`
5. Share with customer or print

### Alternative - From Customer View:
1. Navigate to Customers page (`/dashboard/customers`)
2. Click "View" to see customer details
3. Scroll to Order History section
4. Click "📥 Download" button for any order
5. Invoice PDF is downloaded with invoice number and date

## Invoice Number Assignment

- **Format**: `INV-NNN` (INV prefix + 3-digit padded number)
- **Storage**: Stored in Order model's `invoiceNumber` field
- **Generation**: Automatic on first invoice download
- **Scope**: Per-seller (each user has independent numbering)
- **Example Sequence**:
  - First invoice: `INV-001`
  - Second invoice: `INV-002`
  - etc.

## Technical Details

### PDF Generation
- Uses `pdf-lib` (lightweight, pure JavaScript)
- Supports standard fonts (Helvetica, Helvetica-Bold, Helvetica-Oblique)
- A4 page size (595 × 842 points)
- 40pt margins on all sides
- Professional two-color design (Invotrack branding: #378ADD blue)

### Database Updates
- Order model already has `invoiceNumber` field
- Field is unique but sparse (allows null values)
- Auto-populated on first invoice download
- Persisted for future reference

### Performance
- Lightweight PDF generation (no external services)
- Generates on-demand (not pre-generated)
- Fast response times (typically <100ms)

## Troubleshooting

### PDF Download Not Working
1. Verify Authorization header is being sent
2. Check browser console for CORS errors
3. Ensure backend server is running on port 5000
4. Test with curl: `curl -H "Authorization: Bearer TOKEN" http://localhost:5000/api/orders/ID/invoice -o invoice.pdf`

### Invoice Number Not Incrementing
- Ensure Order model's `invoiceNumber` field is saved after first download
- Check MongoDB for existing invoiceNumber records
- Manually verify unique constraint is not violated

### PDF Looks Corrupted
- Check that all required customer/order data is populated
- Verify phone number is a valid string
- Ensure items array has valid quantity and price numbers

## Future Enhancements
- [ ] Custom invoice templates
- [ ] Logo/watermark support
- [ ] Multiple currency support
- [ ] Email delivery of invoices
- [ ] Invoice archive/history
- [ ] Batch invoice generation
- [ ] Custom invoice numbering format
