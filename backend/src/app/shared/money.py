from __future__ import annotations

from decimal import Decimal, ROUND_HALF_UP
from typing import Union

MoneyType = Union[int, float, str, Decimal]

PAISE_FACTOR = Decimal("100")


def to_decimal(val: MoneyType) -> Decimal:
    """Safely convert any numeric input to a 2-decimal-place Decimal without float inaccuracies."""
    if isinstance(val, Decimal):
        return val.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    if isinstance(val, (int, str)):
        return Decimal(str(val)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    # float: format through string to prevent 0.30000000000000004
    return Decimal(f"{val:.2f}").quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def to_paise(val: MoneyType) -> int:
    """Convert amount to integer minor units (paise / cents: 1 INR = 100 paise)."""
    dec = to_decimal(val)
    paise = (dec * PAISE_FACTOR).quantize(Decimal("1"), rounding=ROUND_HALF_UP)
    return int(paise)


def from_paise(paise: int) -> float:
    """Convert integer minor units (paise) back to float for JSON output."""
    dec = (Decimal(paise) / PAISE_FACTOR).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    return float(dec)


def from_paise_decimal(paise: int) -> Decimal:
    """Convert integer minor units (paise) to Decimal."""
    return (Decimal(paise) / PAISE_FACTOR).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
