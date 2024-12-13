def is_straight(card_list: tuple) -> bool:
    """Проверка на соответствие руки стриту"""

    values = [card[0] for card in card_list]
    unique_values = set(values)

    if 14 in unique_values:
        unique_values.add(1)

    sorted_values = sorted(unique_values)

    for i in range(len(sorted_values) - 4):
        if sorted_values[i:i + 5] == list(range(sorted_values[i], sorted_values[i] + 5)):
            return True
    return False


def scorer_4(d: dict) -> int:
    """Вычисляет очки руки Каре"""

    base, kicker = 0, 0
    for k, v in d.items():
        if v == 4:
            base = k
        else:
            kicker = k
    return base * 10 + kicker


def scorer_fh(d: dict) -> int:
    """Вычисляет очки руки Фулл Хаус"""

    base3, base2 = 0, 0
    for k, v in d.items():
        if v == 3:
            base3 = k
        else:
            base2 = k
    return base3 * 10 + base2


def scorer_f_and_hc(c: list) -> int:
    """Вычисляет очки руки Флеш и Старшая карта"""

    c_sorted = sorted(c, reverse=True)
    return c_sorted[0] * 10000 + c_sorted[1] * 1000 + c_sorted[2] * 100 + c_sorted[3] * 10 + c_sorted[4]


def scorer_s_and_sf(c: list) -> int:
    """Вычисляет очки руки Стрит и Стрит Флеш"""

    c_sorted = sorted(c, reverse=True)
    if c_sorted[0] == 14 and c_sorted[4] == 2:
        return 5
    else:
        return c_sorted[0]


def scorer_3(d: dict) -> int:
    """Вычисляет очки руки Сет"""

    base, kickers = 0, []
    for k, v in d.items():
        if v == 3:
            base = k
        else:
            kickers.append(k)
    k_sorted = sorted(kickers, reverse=True)
    return base * 100 + k_sorted[0] * 10 + k_sorted[1]


def scorer_2p(d: dict) -> int:
    """Вычисляет очки руки Две Пары"""

    pairs, kicker = [], 0
    for k, v in d.items():
        if v == 2:
            pairs.append(k)
        else:
            kicker = k
    p_sorted = sorted(pairs, reverse=True)
    return p_sorted[0] * 100 + p_sorted[1] * 10 + kicker


def scorer_p(d: dict) -> int:
    """Вычисляет очки руки Пара"""

    pair, kickers = 0, []
    for k, v in d.items():
        if v == 2:
            pair = k
        else:
            kickers.append(k)
    k_sorted = sorted(kickers, reverse=True)
    return pair * 1000 + k_sorted[0] * 100 + k_sorted[1] * 10 + k_sorted[2]
