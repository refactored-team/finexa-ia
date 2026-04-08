from pipeline.schemas import EnrichedTransaction

def apply_post_validation(tx: EnrichedTransaction) -> EnrichedTransaction:
    """
    Applies business and post-validation rules to a classified transaction.
    """
    # 1. Gastos hormiga no pueden ser mayores a $500 MXN
    if tx.is_ant_expense and tx.amount > 500.0:
        tx.is_ant_expense = False
        if tx.reasoning:
            tx.reasoning = f"{tx.reasoning} [Post-validación: eliminado flag de hormiga por monto > $500 MXN]"
        else:
            tx.reasoning = "[Post-validación: eliminado flag de hormiga por monto > $500 MXN]"

    # 2. Limitar la confianza de 1.0 a 0.95 (el modelo Haiku tiende a sobreestimar)
    if tx.confidence > 0.95:
        tx.confidence = 0.95

    return tx

def post_validate_batch(transactions: list[EnrichedTransaction]) -> list[EnrichedTransaction]:
    """
    Applies post-validation rules to a batch of enriched transactions.
    """
    for tx in transactions:
        apply_post_validation(tx)
    return transactions
