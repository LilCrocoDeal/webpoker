from itertools import combinations
from collections import Counter

from poker.igm.process_utils import scorer_f_and_hc, scorer_4, scorer_fh, scorer_s_and_sf, scorer_3, \
    scorer_2p, scorer_p, is_straight



def determine_best_hand(card_list: list) -> tuple[int, int]:
    """Идентификация лучшей комбинации из доступных 7 карт"""

    combinations_list = {"Royal flush": 10, "Straight flush": 9, "Four of a kind": 8, "Full house": 7, "Flush": 6,
                         "Straight": 5, "Three of a kind": 4, "Two pairs": 3, "Pair": 2, "High card": 1}

    recent_combinations = list(combinations(sorted(card_list, key=lambda x: x[0]), 5))
    highest_combination = combinations_list["High card"]
    best_score = 0

    for combination in recent_combinations:
        values_array = [card[0] for card in combination]

        # Проверка на каре и фулл хаус
        if len(set(values_array)) == 2:
            if any(values_array.count(value) == 4 for value in set(values_array)):
                if combinations_list["Four of a kind"] > highest_combination:
                    highest_combination = combinations_list["Four of a kind"]
                    best_score = scorer_4(Counter(values_array))
                elif combinations_list["Four of a kind"] == highest_combination:
                    best_score = max(best_score, scorer_4(Counter(values_array)))
            else:
                if combinations_list["Full house"] > highest_combination:
                    highest_combination = combinations_list["Full house"]
                    best_score = scorer_fh(Counter(values_array))
                elif combinations_list["Full house"] == highest_combination:
                    best_score = max(best_score, scorer_fh(Counter(values_array)))

        # Проверка на масть
        elif len(set(card[1] for card in combination)) == 1:
            if not is_straight(combination):
                if combinations_list["Flush"] > highest_combination:
                    highest_combination = combinations_list["Flush"]
                    best_score = scorer_f_and_hc(values_array)
                elif combinations_list["Flush"] == highest_combination:
                    best_score = max(best_score, scorer_f_and_hc(values_array))
            elif max(values_array) == 14 and min(values_array) == 10:
                if combinations_list["Royal flush"] > highest_combination:
                    highest_combination = combinations_list["Royal flush"]
                    best_score = 14
            else:
                if combinations_list["Straight flush"] > highest_combination:
                    highest_combination = combinations_list["Straight flush"]
                    best_score = scorer_s_and_sf(values_array)
                elif combinations_list["Straight flush"] == highest_combination:
                    best_score = max(best_score, scorer_s_and_sf(values_array))

        # Проверка на стрит
        elif is_straight(combination):
            if combinations_list["Straight"] > highest_combination:
                highest_combination = combinations_list["Straight"]
                best_score = scorer_s_and_sf(values_array)
            elif combinations_list["Straight"] == highest_combination:
                best_score = max(best_score, scorer_s_and_sf(values_array))

        # Проверка на сет и 2 пары
        elif len(set(values_array)) == 3:
            if 3 in Counter(values_array).values():
                if combinations_list["Three of a kind"] > highest_combination:
                    highest_combination = combinations_list["Three of a kind"]
                    best_score = scorer_3(Counter(values_array))
                elif combinations_list["Three of a kind"] == highest_combination:
                    best_score = max(best_score, scorer_3(Counter(values_array)))
            else:
                if combinations_list["Two pairs"] > highest_combination:
                    highest_combination = combinations_list["Two pairs"]
                    best_score = scorer_2p(Counter(values_array))
                elif combinations_list["Two pairs"] == highest_combination:
                    best_score = max(best_score, scorer_2p(Counter(values_array)))

        # Проверка на пару
        elif 2 in Counter(values_array).values():
            if combinations_list["Pair"] > highest_combination:
                highest_combination = combinations_list["Pair"]
                best_score = scorer_p(Counter(values_array))
            elif combinations_list["Pair"] == highest_combination:
                best_score = max(best_score, scorer_p(Counter(values_array)))
        else:
            if combinations_list["High card"] > highest_combination:
                highest_combination = combinations_list["High card"]
                best_score = scorer_f_and_hc(values_array)
            elif combinations_list["High card"] == highest_combination:
                best_score = max(best_score, scorer_f_and_hc(values_array))

    return highest_combination, best_score


def compare_hands(hands_array: list) -> list:
    """Сравнивает лучшие руки игроков из входных данных и выдает победившую"""
    best_hand_in_set = (1, 0)
    for hand in hands_array:
        if hand['score'][0] > best_hand_in_set[0]:
            best_hand_in_set = hand['score']
        elif hand['score'][0] == best_hand_in_set[0] and hand['score'][1] > best_hand_in_set[1]:
            best_hand_in_set = hand['score']
        else:
            continue

    result = []
    for hand in hands_array:
        if hand['score'][0] == best_hand_in_set[0] and hand['score'][1] == best_hand_in_set[1]:
            result.append(hand['player_id'])

    return result

