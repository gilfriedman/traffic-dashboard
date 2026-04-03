import re

NEIGHBORHOOD_DISPLAY_NAMES = {
    "rambam": "Rambam",
    "neve_zeev": "Neve Ze'ev",
    "old_city": "Old City",
    "ramot_bet": "Ramot Bet",
    "shchuna_bet": "Sh'chuna Bet",
    "shchuna_he": "Sh'chuna He",
}


def extract_neighborhood(route_id):
    return re.sub(r'\d+$', '', route_id)


def get_display_name(neighborhood_key):
    return NEIGHBORHOOD_DISPLAY_NAMES.get(neighborhood_key, neighborhood_key)
