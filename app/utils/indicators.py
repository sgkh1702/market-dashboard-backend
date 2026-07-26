def sma(values, period):
    if len(values) < period:
        return None
    closes = [x["c"] for x in values[-period:]]
    return sum(closes) / period

def rsi(values, period=14):
    if len(values) < period + 1:
        return None

    closes = [x["c"] for x in values]
    gains = []
    losses = []

    for i in range(1, len(closes)):
        diff = closes[i] - closes[i - 1]
        gains.append(max(diff, 0))
        losses.append(abs(min(diff, 0)))

    avg_gain = sum(gains[-period:]) / period
    avg_loss = sum(losses[-period:]) / period

    if avg_loss == 0:
        return 100

    rs = avg_gain / avg_loss
    return 100 - (100 / (1 + rs))

def round_nullable(value, digits=2):
    return round(value, digits) if value is not None else None