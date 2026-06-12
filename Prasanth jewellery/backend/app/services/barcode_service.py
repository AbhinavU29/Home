import io
import base64
import qrcode
import barcode
from barcode.writer import ImageWriter

def generate_barcode_base64(code_text: str) -> str:
    """
    Generates a Code 128 barcode image as a Base64 encoded PNG string.
    If generation fails due to missing imaging libraries, returns a mock SVG/Base64.
    """
    try:
        rv = io.BytesIO()
        CODE128 = barcode.get_barcode_class('code128')
        # Use ImageWriter to output PNG. Requires Pillow.
        obj = CODE128(code_text, writer=ImageWriter())
        obj.write(rv)
        return "data:image/png;base64," + base64.b64encode(rv.getvalue()).decode('utf-8')
    except Exception as e:
        # Fallback Mock Base64 image (small solid gold color placeholder)
        return "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='150' height='50'><rect width='150' height='50' fill='%23D4AF37'/><text x='10' y='30' fill='black' font-family='Arial' font-size='12'>BARCODE: " + code_text + "</text></svg>"

def generate_qrcode_base64(code_text: str) -> str:
    """
    Generates a QR Code image as a Base64 encoded PNG string.
    """
    try:
        qr = qrcode.QRCode(version=1, box_size=10, border=4)
        qr.add_data(code_text)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        rv = io.BytesIO()
        img.save(rv, format="PNG")
        return "data:image/png;base64," + base64.b64encode(rv.getvalue()).decode('utf-8')
    except Exception as e:
        # Fallback Mock Base64 QR code image
        return "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><rect width='100' height='100' fill='white' stroke='%23D4AF37' stroke-width='4'/><rect x='20' y='20' width='60' height='60' fill='black'/><text x='25' y='10' fill='black' font-size='8'>QR: " + code_text[:10] + "</text></svg>"
