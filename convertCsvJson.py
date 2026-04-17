import csv
import json
import re
from datetime import datetime

# ================= CONFIG =================
CONFIG = {
    "files": [
        "ProjectData - ID.csv",
        "ProjectData - EN.csv"
    ],
    "exports": {
        "data": ["name", "height", "debut", "birthday", "branch", "color", "quote"],
        "data_color": ["name", "color"],
        "data_quote": ["name", "quote"]
    }
}
# =========================================


# ---------- Helpers ----------

def format_name(name):
    return name.lower().replace(" ", "_")


def fix_encoding(text):
    try:
        return text.encode('latin1').decode('utf-8')
    except:
        return text


# ---------- Parsers ----------

def parse_debut(value):
    value = value.strip()

    formats = [
        "%Y %m/%d",     # 2019 09/13
        "%Y-%m-%d",     # 2019-09-13
        "%d %B %Y",     # 13 September 2019
    ]

    for fmt in formats:
        try:
            dt = datetime.strptime(value, fmt)
            return dt.strftime("%Y-%m-%d")
        except:
            continue

    return value  # fallback


def parse_birthday(value):
    value = fix_encoding(value)

    # Japanese format: 3月14日
    match = re.search(r"(\d{1,2})月(\d{1,2})日", value)
    if match:
        return f"{int(match.group(1)):02d}-{int(match.group(2)):02d}"

    # Already MM-DD
    if re.match(r"\d{2}-\d{2}", value):
        return value

    return value


def parse_quote(value):
    if not value.strip():
        return []

    quotes = re.split(r"\||\n", value)
    return [q.strip() for q in quotes if q.strip()]


def convert_value(key, value):
    value = value.strip()

    if value == "":
        return None

    if key == "height":
        try:
            return int(value)
        except:
            return None

    if key == "debut":
        return parse_debut(value)

    if key == "birthday":
        return parse_birthday(value)

    if key == "quote":
        return parse_quote(value)

    return value


# ---------- Load All CSV ----------

all_data = []

for file_name in CONFIG["files"]:
    with open(file_name, mode="r", encoding="utf-8") as file:
        reader = csv.reader(file)

        for row in reader:
            if not row or len(row) < 5:
                continue  # skip broken rows

            # Fill missing columns safely
            row += [""] * (7 - len(row))

            name, height, debut, birthday, branch, color, quote = row[:7]

            item = {
                "name": convert_value("name", name),
                "height": convert_value("height", height),
                "debut": convert_value("debut", debut),
                "birthday": convert_value("birthday", birthday),
                "branch": convert_value("branch", branch),
                "color": convert_value("color", color),
                "quote": convert_value("quote", quote),
            }

            item["image"] = format_name(item["name"])

            all_data.append(item)

print(f"Loaded {len(all_data)} entries")


# ---------- Optional Cleanup ----------

# Remove duplicates by name
seen = set()
unique_data = []

for item in all_data:
    if item["name"] not in seen:
        seen.add(item["name"])
        unique_data.append(item)

all_data = unique_data

# Sort by name
all_data.sort(key=lambda x: x["name"])


# ---------- Export ----------

for export_name, fields in CONFIG["exports"].items():
    output = []

    for item in all_data:
        filtered = {k: item.get(k) for k in fields}

        if export_name == "original":
            filtered["image"] = item["image"]

        output.append(filtered)

    with open(f"{export_name}.json", "w", encoding="utf-8") as f:
        json.dump(output, f, indent=4)

print("All JSON files generated!")