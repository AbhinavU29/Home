import io
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from app.models.models import Invoice

def generate_invoice_pdf(invoice: Invoice) -> bytes:
    """
    Generates a premium GST-compliant PDF invoice for Prasanth Jewellery.
    """
    buffer = io.BytesIO()
    
    # Page setup
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )
    
    styles = getSampleStyleSheet()
    
    # Custom Luxury Styles
    gold_color = colors.HexColor("#A88020") # Dark Gold for print legibility
    dark_gray = colors.HexColor("#1A1A1A")
    light_gold = colors.HexColor("#F9F6EE")
    
    title_style = ParagraphStyle(
        'InvoiceTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        textColor=gold_color,
        spaceAfter=4,
        alignment=1 # Center
    )
    
    subtitle_style = ParagraphStyle(
        'InvoiceSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        textColor=dark_gray,
        spaceAfter=15,
        alignment=1
    )
    
    heading_style = ParagraphStyle(
        'SectionHeading',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        textColor=gold_color,
        spaceBefore=10,
        spaceAfter=6
    )
    
    body_bold = ParagraphStyle(
        'BodyBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        textColor=dark_gray
    )
    
    body_normal = ParagraphStyle(
        'BodyNormal',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        textColor=dark_gray
    )

    story = []
    
    # 1. Header Section
    story.append(Paragraph("PRASANTH JEWELLERY", title_style))
    story.append(Paragraph("123 Gold Bazaar Road, Coimbatore, Tamil Nadu, India<br/>GSTIN: 33AAAAAPJ1234F1Z1 | Tel: +91 98765 43210", subtitle_style))
    
    # 2. Invoice Metadata & Customer details
    # Two-column layout: Left (Customer info), Right (Invoice info)
    cust_info = f"""
    <b>Billed To:</b><br/>
    Name: {invoice.customer.name}<br/>
    Phone: {invoice.customer.phone}<br/>
    PAN: {invoice.customer.pan_number or 'N/A'}<br/>
    Aadhaar: {invoice.customer.aadhaar_number or 'N/A'}
    """
    
    inv_info = f"""
    <b>Invoice Details:</b><br/>
    Invoice No: <b>{invoice.invoice_number}</b><br/>
    Date: {invoice.date.strftime('%d-%m-%Y %I:%M %p (IST)')}<br/>
    E-Way Bill: {invoice.e_way_bill_number or 'N/A'}<br/>
    Cashier: {invoice.creator.username.capitalize()}
    """
    
    meta_table_data = [
        [Paragraph(cust_info, body_normal), Paragraph(inv_info, body_normal)]
    ]
    meta_table = Table(meta_table_data, colWidths=[260, 260])
    meta_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('PADDING', (0,0), (-1,-1), 6),
        ('BACKGROUND', (0,0), (-1,-1), light_gold),
        ('LINEBELOW', (0,0), (-1,-1), 1, gold_color),
        ('LINEABOVE', (0,0), (-1,-1), 1, gold_color),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 15))
    
    # 3. Itemized Products Table
    story.append(Paragraph("Purchase Specifications", heading_style))
    
    # Table columns: Description, Purity, Weight Breakup, Net Wt, Rate, Making, Total
    item_header = [
        Paragraph("<b>Item Description / Code</b>", body_bold),
        Paragraph("<b>Purity</b>", body_bold),
        Paragraph("<b>Gross / Stone / Bead</b>", body_bold),
        Paragraph("<b>Net Wt (g)</b>", body_bold),
        Paragraph("<b>Metal Rate/g</b>", body_bold),
        Paragraph("<b>Making/g</b>", body_bold),
        Paragraph("<b>Total (INR)</b>", body_bold)
    ]
    
    table_data = [item_header]
    
    for item in invoice.items:
        wt_breakup = f"{item.gross_weight:.3f} / {item.stone_weight:.3f} / {item.bead_weight:.3f}"
        table_data.append([
            Paragraph(f"{item.subcategory.capitalize()} ({item.item_code})", body_normal),
            Paragraph(item.purity, body_normal),
            Paragraph(wt_breakup, body_normal),
            Paragraph(f"{item.net_weight:.3f}", body_normal),
            Paragraph(f"₹{item.rate_applied:,.2f}", body_normal),
            Paragraph(f"₹{item.making_charges_applied:,.2f}", body_normal),
            Paragraph(f"₹{item.final_item_price:,.2f}", body_normal)
        ])
        
    items_table = Table(table_data, colWidths=[120, 50, 110, 60, 65, 55, 70])
    items_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('PADDING', (0,0), (-1,-1), 6),
        ('BACKGROUND', (0,0), (-1,0), gold_color),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('GRID', (0,0), (-1,-1), 0.5, colors.lightgrey),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, light_gold])
    ]))
    # Quick fix for text color in header row (the Paragraphs override table textcolor, so styling inside Paragraph works)
    for i in range(len(item_header)):
        item_header[i].style.textColor = colors.white
        
    story.append(items_table)
    story.append(Spacer(1, 15))
    
    # 4. Calculation Summary & Payment details
    # Left column: Payments made, Right column: Pricing summary
    pmt_details = "<b>Payment Information:</b><br/>"
    for p in invoice.payments:
        ref_str = f" ({p.details})" if p.details else ""
        pmt_details += f"- {p.payment_method}: <b>₹{p.amount_paid:,.2f}</b>{ref_str}<br/>"
        
    pmt_details += "<br/><b>Terms & Conditions:</b><br/>"
    pmt_details += "1. Subject to Coimbatore Jurisdiction.<br/>"
    pmt_details += "2. Certified HUID gold rates locked at billing time.<br/>"
    
    price_details = f"""
    Subtotal: <b>₹{invoice.subtotal:,.2f}</b><br/>
    Making Charges: <b>₹{invoice.making_charges_total:,.2f}</b><br/>
    Wastage Charges: <b>₹{invoice.wastage_charges_total:,.2f}</b><br/>
    GST (3%): <b>₹{invoice.gst_amount:,.2f}</b><br/>
    Discount: <b>-₹{invoice.discount:,.2f}</b><br/>
    <font color='#A88020' size='12'><b>Final Total: ₹{invoice.final_amount:,.2f}</b></font>
    """
    
    summary_data = [
        [Paragraph(pmt_details, body_normal), Paragraph(price_details, body_normal)]
    ]
    summary_table = Table(summary_data, colWidths=[260, 260])
    summary_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('PADDING', (0,0), (-1,-1), 8),
        ('BACKGROUND', (0,0), (-1,-1), light_gold),
        ('LINEBELOW', (0,0), (-1,-1), 1, gold_color),
        ('LINEABOVE', (0,0), (-1,-1), 1, gold_color),
    ]))
    
    story.append(summary_table)
    story.append(Spacer(1, 30))
    
    # 5. Signatures
    sig_data = [
        [Paragraph("Customer Signature", body_normal), Paragraph("For Prasanth Jewellery", body_normal)],
        ["", ""],  # empty row for space
        ["_________________________", "_________________________"]
    ]
    sig_table = Table(sig_data, colWidths=[260, 260])
    sig_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'BOTTOM'),
        ('PADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(sig_table)
    
    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
