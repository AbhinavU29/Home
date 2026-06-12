import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("PrasanthJewelleryNotifications")

def send_whatsapp_invoice(phone_number: str, invoice_number: str, amount: float, customer_name: str) -> bool:
    """
    Simulates sending an invoice to WhatsApp. Logs details of payload.
    """
    message = (
        f"Namaste {customer_name}! Thank you for shopping at Prasanth Jewellery. "
        f"Your invoice {invoice_number} for amount INR {amount:,.2f} is generated. "
        f"Download here: https://prasanthjewellery.com/invoices/{invoice_number}.pdf"
    )
    logger.info(f"[WHATSAPP SIMULATION] Sending to {phone_number}: {message}")
    # Write to a file for manual review
    with open("notifications_log.txt", "a", encoding="utf-8") as f:
        f.write(f"WHATSAPP | {phone_number} | {message}\n")
    return True

def send_sms_scheme_payment(phone_number: str, customer_name: str, amount: float, receipt_number: str, balance: float) -> bool:
    """
    Simulates sending an SMS confirmation for Chit scheme payment.
    """
    message = (
        f"Dear {customer_name}, we have received payment of INR {amount:,.2f} for your Chit scheme. "
        f"Receipt: {receipt_number}. Current maturity balance: INR {balance:,.2f}. Prasanth Jewellery."
    )
    logger.info(f"[SMS SIMULATION] Sending to {phone_number}: {message}")
    with open("notifications_log.txt", "a", encoding="utf-8") as f:
        f.write(f"SMS | {phone_number} | {message}\n")
    return True

def send_sms_otp(phone_number: str, otp: str) -> bool:
    """
    Simulates sending an OTP.
    """
    message = f"OTP for logging into Prasanth Jewellery: {otp}. Valid for 5 minutes."
    logger.info(f"[SMS SIMULATION] Sending to {phone_number}: {message}")
    with open("notifications_log.txt", "a", encoding="utf-8") as f:
        f.write(f"SMS OTP | {phone_number} | {message}\n")
    return True
