import requests
import random
from datetime import datetime, timedelta
import time

# Configuración de Plaid
PLAID_CLIENT_ID = "69c9bf6cdce309000dfb523e"
PLAID_SECRET = "b58b264d100a226db46107144cfbd7"
ACCESS_TOKEN = "access-sandbox-210d7593-265e-402a-b6ba-f0f69e211907"  # Reemplazar con el token real

# Cantidad de transacciones a crear (500 o 1000)
TOTAL_TRANSACCIONES = 2
MAX_RETRIES_429 = 5
INITIAL_BACKOFF_SECONDS = 2.0

# Listas para generar datos realistas
COMERCIOS = [
    "Walmart", "Target", "Amazon", "Netflix", "Spotify", "Uber", "Lyft",
    "Starbucks", "McDonald's", "Burger King", "Chipotle", "Kroger",
    "Costco", "Home Depot", "Best Buy", "Apple Store", "Google Play",
    "Shell", "Exxon", "7-Eleven", "CVS Pharmacy", "Walgreens", "Paypal",
    "Zelle", "Venmo", "Nómina", "Transferencia", "Pago de tarjeta"
]

CONCEPTOS = [
    "Compra", "Suscripción", "Pago de servicios", "Depósito nómina",
    "Transferencia recibida", "Pago tarjeta crédito", "Cargo mensual"
]

def random_date_within_last_14_days():
    """Genera una fecha aleatoria dentro de los últimos 14 días (formato YYYY-MM-DD)"""
    today = datetime.now()
    # Plaid sandbox valida "within the last 14 days" de forma estricta; usar 0..13 evita el borde inválido.
    delta = random.randint(0, 13)
    past_date = today - timedelta(days=delta)
    return past_date.strftime("%Y-%m-%d")

def generate_transaction(index):
    """Genera una transacción individual con datos realistas"""
    amount = round(random.uniform(2.50, 500.00), 2)
    # 70% gastos (positivo), 30% ingresos/transferencias (negativo)
    if random.random() < 0.7:
        amount = abs(amount)  # gasto: positivo
    else:
        amount = -abs(amount)  # ingreso: negativo
    
    merchant = random.choice(COMERCIOS)
    concept = random.choice(CONCEPTOS)
    description = f"{merchant} - {concept} #{index}"
    
    date = random_date_within_last_14_days()
    
    return {
        "amount": amount,
        "date_posted": date,
        "date_transacted": date,
        "description": description,
        "iso_currency_code": "USD"
    }

def create_transactions_batch(transactions_batch):
    """Envía un lote de hasta 10 transacciones a Plaid"""
    url = "https://sandbox.plaid.com/sandbox/transactions/create"
    payload = {
        "client_id": PLAID_CLIENT_ID,
        "secret": PLAID_SECRET,
        "access_token": ACCESS_TOKEN,
        "transactions": transactions_batch
    }
    attempt = 0
    while True:
        response = requests.post(url, json=payload)
        if response.status_code == 200:
            print(f"✅ Lote de {len(transactions_batch)} transacciones creado")
            return True

        print(f"❌ Error: {response.status_code} - {response.text}")

        if response.status_code == 429 and attempt < MAX_RETRIES_429:
            wait_seconds = INITIAL_BACKOFF_SECONDS * (2 ** attempt)
            print(f"⏳ Rate limit, reintentando en {wait_seconds:.1f}s...")
            time.sleep(wait_seconds)
            attempt += 1
            continue

        return False

def main():
    print(f"🚀 Generando {TOTAL_TRANSACCIONES} transacciones realistas...")
    
    # Dividir en lotes de 10
    lote_tamano = 10
    lotes = (TOTAL_TRANSACCIONES + lote_tamano - 1) // lote_tamano
    
    transacciones_creadas = 0
    for lote_num in range(lotes):
        inicio = lote_num * lote_tamano
        fin = min(inicio + lote_tamano, TOTAL_TRANSACCIONES)
        batch = []
        for i in range(inicio, fin):
            batch.append(generate_transaction(i+1))
        
        print(f"\n📦 Lote {lote_num+1}/{lotes} (transacciones {inicio+1}-{fin})")
        success = create_transactions_batch(batch)
        if success:
            transacciones_creadas += len(batch)
        else:
            print("⚠️ Deteniendo por error. Revisa credenciales y access_token.")
            break
        
        # Pequeña pausa para no saturar la API de Sandbox
        time.sleep(0.5)
    
    print(f"\n🎉 Proceso completado. {transacciones_creadas} transacciones creadas.")
    print("ℹ️ Espera unos segundos y luego llama a /transactions/sync para recuperarlas.")

if __name__ == "__main__":
    main()