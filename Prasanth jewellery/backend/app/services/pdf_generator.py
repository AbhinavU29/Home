import io
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.graphics.shapes import Drawing, Polygon, Line
from app.models.models import Bill

def generate_bill_pdf(bill: Bill) -> bytes:
    """
    Generates a professional tax-compliant PDF invoice for Prasanth Jewellery.
    Optimized for A4 printing with crisp black text on white backgrounds.
    """
    buffer = io.BytesIO()
    
    # Document settings (0.5 inch margins)
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )
    
    styles = getSampleStyleSheet()
    
    # Premium Palette: Primary Navy Blue & Slate Neutral
    blue_primary = colors.HexColor("#1A365D") 
    text_dark = colors.HexColor("#1A1A1A")
    neutral_light = colors.HexColor("#F8FAFC")
    border_color = colors.HexColor("#CBD5E1")
    
    title_style = ParagraphStyle(
        'HeaderTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        textColor=blue_primary,
        spaceAfter=2
    )
    
    meta_style = ParagraphStyle(
        'HeaderMeta',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        textColor=colors.HexColor("#475569"),
        leading=11
    )
    
    heading_style = ParagraphStyle(
        'SectionHeading',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        textColor=blue_primary,
        spaceBefore=10,
        spaceAfter=4
    )
    
    body_bold = ParagraphStyle(
        'BodyBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        textColor=text_dark
    )
    
    body_normal = ParagraphStyle(
        'BodyNormal',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        textColor=text_dark,
        leading=10
    )
    
    footer_style = ParagraphStyle(
        'FooterStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        textColor=blue_primary,
        alignment=1,
        spaceBefore=15
    )

    story = []
    
    # 1. Shop Header with Vector Logo
    # Draw vector gem logo
    logo_draw = Drawing(40, 40)
    # Diamond outer shape
    logo_draw.add(Polygon([20, 2, 38, 18, 38, 22, 20, 38, 2, 22, 2, 18], 
                          fillColor=blue_primary, strokeColor=blue_primary))
    # Diamond internal facets (light blue accents)
    logo_draw.add(Polygon([20, 2, 20, 38, 2, 22], 
                          fillColor=colors.HexColor("#3B82F6"), strokeColor=colors.HexColor("#3B82F6")))
    logo_draw.add(Line(20, 2, 20, 38, strokeColor=colors.white, strokeWidth=0.8))
    
    company_details = f"""
    <font size="14"><b>PRASANTH JEWELLERY</b></font><br/>
    M M Road, Thalassery<br/>
    Phone: 9846936111
    """
    
    invoice_details = f"""
    <b>TAX INVOICE</b><br/>
    <b>Purchase ID:</b> {bill.purchase_id}<br/>
    <b>Date:</b> {bill.date.strftime('%d-%m-%Y %I:%M %p (IST)') if isinstance(bill.date, datetime) else str(bill.date)}<br/>
    <b>Billed By:</b> {bill.company_name}
    """
    
    header_table_data = [
        [logo_draw, Paragraph(company_details, body_normal), Paragraph(invoice_details, body_normal)]
    ]
    # Total A4 printable width is ~523 pt.
    header_table = Table(header_table_data, colWidths=[50, 230, 243])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ALIGN', (2,0), (2,0), 'RIGHT'),
        ('PADDING', (0,0), (-1,-1), 0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(header_table)
    
    # Divider Line
    line_table = Table([[""]], colWidths=[523])
    line_table.setStyle(TableStyle([
        ('LINEBELOW', (0,0), (-1,-1), 1.5, blue_primary),
        ('PADDING', (0,0), (-1,-1), 0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(line_table)
    
    # 2. Customer Metadata
    cust_details = f"""
    <b>CUSTOMER RECORD</b><br/>
    Name: <b>{bill.customer_name}</b><br/>
    Phone: {bill.phone_number}
    """
    
    meta_table_data = [
        [Paragraph(cust_details, body_normal)]
    ]
    meta_table = Table(meta_table_data, colWidths=[523])
    meta_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('PADDING', (0,0), (-1,-1), 8),
        ('BACKGROUND', (0,0), (-1,-1), neutral_light),
        ('LINEBELOW', (0,0), (-1,-1), 0.8, border_color),
        ('LINEABOVE', (0,0), (-1,-1), 0.8, border_color),
        ('LINELEFT', (0,0), (-1,-1), 0.8, border_color),
        ('LINERIGHT', (0,0), (-1,-1), 0.8, border_color),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 10))
    
    # 3. Itemized Products Table
    story.append(Paragraph("Ornaments Ledger Breakdown", heading_style))
    
    # Table headers matching A4 columns
    headers = [
        Paragraph("<b>Ornament</b>", body_bold),
        Paragraph("<b>Qty</b>", body_bold),
        Paragraph("<b>Weight(g)</b>", body_bold),
        Paragraph("<b>Rate</b>", body_bold),
        Paragraph("<b>MRP</b>", body_bold),
        Paragraph("<b>Discount</b>", body_bold),
        Paragraph("<b>GST</b>", body_bold),
        Paragraph("<b>Total</b>", body_bold)
    ]
    
    table_data = [headers]
    for header in headers:
        header.style.textColor = colors.white
        
    for item in bill.items:
        # Check discount column value
        item_discount = getattr(item, 'discount', 0.0)
        desc_text = f"<b>{item.product_name}</b>"
        if item.ornament_type:
            desc_text += f"<br/><font color='#475569' size='7'>{item.ornament_type}</font>"
        table_data.append([
            Paragraph(desc_text, body_normal),
            Paragraph(str(item.quantity), body_normal),
            Paragraph(f"{item.weight_gold_g:.3f}g" if item.weight_gold_g > 0 else "-", body_normal),
            Paragraph(f"₹{item.rate_per_gram:,.2f}" if item.rate_per_gram > 0 else "-", body_normal),
            Paragraph(f"₹{item.MRP:,.2f}" if item.MRP > 0 else "-", body_normal),
            Paragraph(f"₹{item_discount:,.2f}" if item_discount > 0 else "-", body_normal),
            Paragraph(f"{item.GST}%", body_normal),
            Paragraph(f"₹{item.item_total:,.2f}", body_normal)
        ])
        
    items_table = Table(table_data, colWidths=[133, 25, 55, 65, 65, 55, 45, 80])
    items_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('PADDING', (0,0), (-1,-1), 6),
        ('BACKGROUND', (0,0), (-1,0), blue_primary),
        ('GRID', (0,0), (-1,-1), 0.5, border_color),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, neutral_light])
    ]))
    story.append(items_table)
    story.append(Spacer(1, 10))
    
    # 4. Calculation aggregates
    totals_lines = f"""
    Subtotal: <b>₹{bill.subtotal:,.2f}</b><br/>
    Global Discount: <b>-₹{bill.discount:,.2f}</b><br/>
    <font color='#1A365D' size='11'><b>Grand Total Paid: ₹{bill.total_amount:,.2f}</b></font>
    """
    
    creator_details = f"{bill.creator.username} ({bill.creator.full_name or 'N/A'})" if bill.creator else "Staff"
    pmt_notes = f"""
    Created By: <b>{creator_details}</b><br/>
    Authorized Signatory:<br/><br/><br/>
    _______________________________
    """
    
    summary_data = [
        [Paragraph(pmt_notes, body_normal), Paragraph(totals_lines, body_normal)]
    ]
    summary_table = Table(summary_data, colWidths=[260, 263])
    summary_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('PADDING', (0,0), (-1,-1), 8),
        ('BACKGROUND', (0,0), (-1,-1), neutral_light),
        ('LINEBELOW', (0,0), (-1,-1), 0.8, border_color),
        ('LINEABOVE', (0,0), (-1,-1), 0.8, border_color),
        ('LINELEFT', (0,0), (-1,-1), 0.8, border_color),
        ('LINERIGHT', (0,0), (-1,-1), 0.8, border_color),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 15))
    
    # 5. Footer Message
    story.append(Paragraph("Thank you for choosing Prasanth Jewellery. Visit Again.", footer_style))
    
    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
