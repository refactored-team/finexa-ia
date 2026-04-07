#!/usr/bin/env python3
"""
Limpia un JSON de respuesta Plaid (p. ej. /transactions/sync) y exporta CSV listo para SageMaker.

Uso:
  python3 models/cleaner.py
  python3 models/cleaner.py --input models/response.json --output models/transactions_sagemaker.csv
"""

from __future__ import annotations

import argparse
import csv
import json
from datetime import datetime
from pathlib import Path
from typing import Any

# Umbral en USD (valor absoluto del amount de Plaid) para marcar gasto pequeño.
SMALL_EXPENSE_THRESHOLD = 25.0


def _coalesce_merchant(tx: dict[str, Any]) -> str:
    name = (tx.get("merchant_name") or "").strip()
    if name:
        return name
    cps = tx.get("counterparties") or []
    if isinstance(cps, list) and cps:
        n = (cps[0].get("name") or "").strip()
        if n:
            return n
    return (tx.get("name") or "").strip()


def _category_primary(tx: dict[str, Any]) -> str:
    pfc = tx.get("personal_finance_category")
    if isinstance(pfc, dict) and pfc.get("primary"):
        return str(pfc["primary"])
    cats = tx.get("category")
    if isinstance(cats, list) and cats:
        return " > ".join(str(c) for c in cats)
    return ""


def _category_detail(tx: dict[str, Any]) -> str:
    pfc = tx.get("personal_finance_category")
    if isinstance(pfc, dict) and pfc.get("detailed"):
        return str(pfc["detailed"])
    return ""


def _is_small_expense(tx: dict[str, Any]) -> bool:
    """
    Plaid: amount > 0 suele ser gasto (cargo), < 0 ingreso.
    Marcamos gasto pequeño si es un cargo positivo bajo el umbral.
    """
    try:
        amt = float(tx.get("amount", 0))
    except (TypeError, ValueError):
        return False
    return 0 < amt < SMALL_EXPENSE_THRESHOLD


def _parse_date(d: str | None) -> datetime | None:
    if not d:
        return None
    try:
        return datetime.strptime(d[:10], "%Y-%m-%d")
    except ValueError:
        return None


def flatten_transactions(payload: dict[str, Any]) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for key in ("added", "modified"):
        block = payload.get(key)
        if not isinstance(block, list):
            continue
        for tx in block:
            if not isinstance(tx, dict):
                continue
            dt = _parse_date(tx.get("date"))
            month = dt.month if dt else ""
            # 0=Lunes … 6=Domingo (coherente con datetime.weekday())
            weekday = dt.weekday() if dt is not None else ""

            rows.append(
                {
                    "date": (tx.get("date") or "")[:10],
                    "amount": tx.get("amount", ""),
                    "merchant_name": _coalesce_merchant(tx),
                    "category": _category_primary(tx),
                    "category_detail": _category_detail(tx),
                    "payment_channel": (tx.get("payment_channel") or "").strip(),
                    "type": (tx.get("transaction_type") or "").strip(),
                    "month": month,
                    "weekday": weekday,
                    "is_small_expense": _is_small_expense(tx),
                }
            )
    return rows


def main() -> None:
    parser = argparse.ArgumentParser(description="Plaid JSON → CSV para SageMaker")
    parser.add_argument(
        "--input",
        "-i",
        type=Path,
        default=Path(__file__).resolve().parent / "response.json",
        help="JSON de respuesta Plaid (con clave 'added')",
    )
    parser.add_argument(
        "--output",
        "-o",
        type=Path,
        default=Path(__file__).resolve().parent / "transactions_sagemaker.csv",
        help="CSV de salida",
    )
    args = parser.parse_args()

    with open(args.input, encoding="utf-8") as f:
        data = json.load(f)

    if not isinstance(data, dict):
        raise SystemExit("El JSON raíz debe ser un objeto.")

    rows = flatten_transactions(data)
    fieldnames = [
        "date",
        "amount",
        "merchant_name",
        "category",
        "category_detail",
        "payment_channel",
        "type",
        "month",
        "weekday",
        "is_small_expense",
    ]

    args.output.parent.mkdir(parents=True, exist_ok=True)
    with open(args.output, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        w.writeheader()
        for row in rows:
            w.writerow(row)

    print(f"OK: {len(rows)} filas → {args.output}")


if __name__ == "__main__":
    main()
