# Quote PDF Requirements - HitQuote App

## Mandatory Elements for ALL PDF Templates

### 1. Business Information
- **Business Name** (from `businessData.business_name`)
- **Business Email** (from `businessData.business_email`)
- **Business Phone** (from `businessData.business_phone`)
- **Business Address** (from `businessData.business_address`)
- **Business License Number** (from `businessData.business_license`)
- **Business Logo** (from `logoUrl` if available)

### 2. Customer Information
- **Customer Name** (from `quoteData.customer_name`)
- **Customer Email** (from `quoteData.customer_email`)
- **Customer Phone** (from `quoteData.customer_phone`)
- **Customer Address** (from `quoteData.customer_address`)

### 3. Quote Details
- **Quote/Proposal Number** (from `quoteData.proposal_number` or `quoteData.id`)
- **Quote Date** (from `quoteData.created_at` - formatted properly)
- **Quote Title/Description** (from `quoteData.title`)
- **Quote Notes** (from `quoteData.notes` if available)

### 4. Line Items
For each item in `quoteData.items`:
- **Item Name/Description** (`item.name`)
- **Quantity** (`item.quantity`)
- **Unit Price** (`item.price`)
- **Total Price** (quantity × price)
- **Item Notes** (if available)

### 5. Financial Summary
- **Subtotal** (sum of all line items before discount)
- **Discount Amount** (from `quoteData.discount_amount`)
- **Discount Percentage** (from `quoteData.discount_percentage`)
- **Total Amount** (final amount after discount)
- **Currency formatting** (Hebrew locale with ₪ symbol)

### 6. Legal & Validity Information
- **Validity Period** (30 days from quote date)
- **Validity End Date** (calculated: quote date + 30 days)
- **Terms & Conditions** (if applicable)

### 7. App Branding (MANDATORY)
- **Footer Text**: "מופק באמצעות אפליקציית HitQuote" (Generated using HitQuote app)
- **App Attribution**: Must appear at bottom of every PDF

### 8. Design Requirements
- **RTL Support**: All text must be right-to-left for Hebrew
- **Professional Layout**: Clean, business-appropriate design
- **User Color Integration**: MANDATORY use of `userColor` parameter throughout template
- **Responsive**: Must work on various screen sizes
- **Print-Friendly**: Black text on white background for good printing

### 8.1 User Color Implementation (CRITICAL)
Every template MUST implement the user's chosen color (`userColor` parameter) in:
- **Headers/Banners**: Main header background or accent colors
- **Borders**: Section dividers, table borders, decorative elements
- **Highlights**: Final total amounts, important notices
- **Accents**: Section titles, call-to-action elements
- **Gradients**: Modern templates should use color + transparency variations
- **Fallback**: Always provide fallback to '#FDDC33' (default yellow) if userColor is null

**Color Usage Examples:**
```css
background: ${userColor || '#FDDC33'};
border: 3px solid ${userColor || '#FDDC33'};
color: ${userColor || '#FDDC33'};
background: linear-gradient(135deg, ${userColor || '#FDDC33'}, ${userColor ? userColor + '88' : '#FDDC3388'});
```

### 9. Date Formatting
- Use Hebrew date format: DD/MM/YYYY
- Display full date with day name if space allows
- Ensure proper Hebrew calendar integration if needed

### 10. Error Handling
- Display placeholder text for missing business information
- Handle missing customer information gracefully
- Show "לא צוין" (Not specified) for empty fields
- Ensure PDF generates even with minimal data

### 11. Template Identification
Each template must have:
- **Unique ID** (e.g., 'template2', 'template3')
- **Display Name** in Hebrew
- **Description** in Hebrew
- **Preview identifier** for UI selection

## Template Implementation Notes
- All templates must implement these requirements
- Templates can add additional styling but cannot remove mandatory elements
- Use consistent Hebrew typography and business formatting
- Maintain professional appearance suitable for business use
- Ensure all financial calculations are accurate and clearly displayed