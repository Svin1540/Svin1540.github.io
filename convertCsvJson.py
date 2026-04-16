import csv
import json
from datetime import datetime

def format_name(name):
    return name.lower().replace(" ", "_")

def convert_value(key, value):
    value = value.strip()

    if value == "":
        return None

    # Number in cm (height)
    if key == "height":
        try:
            return float(value)
        except ValueError:
            return None

    # Debut date → YYYY-MM-DD
    if key == "debut":
        try:
            dt = datetime.strptime(value, "%d %B %Y")
            return dt.strftime("%Y-%m-%d")
        except ValueError:
            return value

    # Birthday → MM-DD
    if key == "birthday":
        try:
            dt = datetime.strptime(value, "%d %B")
            return dt.strftime("%m-%d")
        except ValueError:
            return value

    return value


csv_file = "data.csv"
json_file = "data.json"

data = []

with open(csv_file, mode="r", encoding="utf-8") as file:
    reader = csv.DictReader(file)

    for row in reader:
        new_row = {}

        for k, v in row.items():
            new_row[k] = convert_value(k, v)

        image_key = format_name(new_row["name"])
        new_row["image"] = f"./image/{image_key}.jpg"
        data.append(new_row)

with open(json_file, mode="w", encoding="utf-8") as file:
    json.dump(data, file, indent=4)

print("Conversion complete!")