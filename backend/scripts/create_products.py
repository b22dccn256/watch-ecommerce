#!/usr/bin/env python3
import json
import random
from datetime import datetime
import os
from pathlib import Path

# Output path (backend/exports)
HERE = Path(__file__).resolve().parent
OUTPUT_DIR = HERE.parent / "exports"
OUTPUT_FILE = OUTPUT_DIR / "products_fixed_500.txt"

brands = [
    {"name": "Rolex", "slug": "rolex", "base_price": (150_000_000, 500_000_000), "type": "automatic", "image_prefix": "rolex"},
    {"name": "Omega", "slug": "omega", "base_price": (80_000_000, 200_000_000), "type": "automatic", "image_prefix": "omega"},
    {"name": "Seiko", "slug": "seiko", "base_price": (3_000_000, 25_000_000), "type": "automatic", "image_prefix": "seiko"},
    {"name": "Casio", "slug": "casio", "base_price": (1_000_000, 15_000_000), "type": "quartz", "image_prefix": "casio"},
    {"name": "Tissot", "slug": "tissot", "base_price": (8_000_000, 40_000_000), "type": "automatic", "image_prefix": "tissot"},
    {"name": "Longines", "slug": "longines", "base_price": (30_000_000, 80_000_000), "type": "automatic", "image_prefix": "longines"},
    {"name": "Hamilton", "slug": "hamilton", "base_price": (12_000_000, 25_000_000), "type": "automatic", "image_prefix": "hamilton"},
    {"name": "Orient", "slug": "orient", "base_price": (3_500_000, 12_000_000), "type": "automatic", "image_prefix": "orient"},
    {"name": "Citizen", "slug": "citizen", "base_price": (4_000_000, 20_000_000), "type": "quartz", "image_prefix": "citizen"},
    {"name": "IWC", "slug": "iwc", "base_price": (100_000_000, 300_000_000), "type": "automatic", "image_prefix": "iwc"},
    {"name": "Tag Heuer", "slug": "tag-heuer", "base_price": (60_000_000, 150_000_000), "type": "automatic", "image_prefix": "tag-heuer"},
    {"name": "Bulova", "slug": "bulova", "base_price": (5_000_000, 18_000_000), "type": "quartz", "image_prefix": "bulova"},
    {"name": "Fossil", "slug": "fossil", "base_price": (3_000_000, 8_000_000), "type": "quartz", "image_prefix": "fossil"},
    {"name": "Garmin", "slug": "garmin", "base_price": (5_000_000, 15_000_000), "type": "smartwatch", "image_prefix": "garmin"},
    {"name": "Apple", "slug": "apple", "base_price": (8_000_000, 20_000_000), "type": "smartwatch", "image_prefix": "apple"},
]

model_lines = {
    "Rolex": ["Submariner", "Daytona", "Datejust", "GMT-Master II", "Explorer", "Oyster Perpetual", "Sea-Dweller", "Yacht-Master"],
    "Omega": ["Seamaster", "Speedmaster", "Constellation", "De Ville", "Railmaster"],
    "Seiko": ["5 Sports", "Presage", "Prospex", "Grand Seiko", "Alpinist", "Turtle", "Samurai"],
    "Casio": ["G-Shock", "Edifice", "Vintage", "Pro Trek", "Baby-G", "Classic"],
    "Tissot": ["PRX", "Le Locle", "Seastar", "Gentleman", "Chemin des Tourelles"],
    "Longines": ["HydroConquest", "Master Collection", "Heritage", "Conquest", "La Grande Classique"],
    "Hamilton": ["Khaki Field", "Jazzmaster", "Ventura", "American Classic"],
    "Orient": ["Bambino", "Kamasu", "Ray", "Mako", "Sun & Moon"],
    "Citizen": ["Eco-Drive", "Promaster", "Tsuyosa", "Attesa", "Brycen"],
    "IWC": ["Pilot's Watch", "Portugieser", "Aquatimer", "Portofino", "Ingenieur"],
    "Tag Heuer": ["Carrera", "Aquaracer", "Monaco", "Formula 1", "Autavia"],
    "Bulova": ["Lunar Pilot", "Marine Star", "Precisionist", "Computron", "Curv"],
    "Fossil": ["Grant", "Machine", "Townman", "Q Collection", "Heritage"],
    "Garmin": ["Venu", "Fenix", "Forerunner", "Instinct", "Lily"],
    "Apple": ["Watch Series", "Watch SE", "Watch Ultra"],
}

colors_pool = ["Đen", "Trắng", "Xanh dương", "Vàng", "Bạc", "Nâu", "Xanh lá", "Đỏ", "Hồng", "Titan"]
sizes_pool = ["38mm", "39mm", "40mm", "41mm", "42mm", "43mm", "44mm", "45mm"]
glass_pool = ["Sapphire", "Mineral", "Hardlex", "Gorilla Glass"]
water_pool = ["50m", "100m", "200m", "300m", "1000m"]
strap_pool = ["Steel", "Leather", "NATO", "Rubber", "Mesh"]


def generate_product(brand, idx):
    brand_name = brand["name"]
    model_line = random.choice(model_lines.get(brand_name, ["Classic"]))
    model_number = random.randint(1, 999)
    variant = random.choice(["Date", "No Date", "Chronograph", "Automatic", "Limited", ""])
    name_parts = [brand_name, model_line]
    if variant:
        name_parts.append(variant)
    name_parts.append(str(model_number))
    product_name = " ".join(name_parts)

    price = random.randint(brand["base_price"][0], brand["base_price"][1])
    cost_price = int(price * 0.65)
    stock = random.randint(5, 150)
    sales_count = random.randint(0, 350)
    low_stock = random.randint(2, 10)

    desc = f"Đồng hồ {brand_name} {model_line} chính hãng, máy {brand['type']}, thiết kế sang trọng, phù hợp với phong cách thời trang và thể thao. Bảo hành 2 năm."

    img_id = random.randint(1, 100)
    image = f"https://picsum.photos/id/{img_id}/800/600"

    specs = {
        "waterResistance": random.choice(water_pool),
        "glass": random.choice(glass_pool),
        "movement": {
            "type": brand["type"].capitalize(),
            "caliber": "",
            "powerReserve": random.choice(["40h", "80h", "0h"]) if brand["type"] == "automatic" else ""
        },
        "case": {
            "diameter": random.choice(["40 mm", "42 mm", "44 mm"]),
            "thickness": "",
            "lugToLug": "",
            "material": "Stainless steel"
        },
        "strap": {
            "material": random.choice(strap_pool),
            "claspType": "Folding clasp"
        },
        "weight": ""
    }

    colors = random.sample(colors_pool, k=random.randint(1, 3))
    sizes = random.sample(sizes_pool, k=random.randint(1, 2))

    slug = product_name.lower().replace(" ", "-") + f"-{random.randint(10,999)}"

    product = {
        "_id": f"watch_{idx+1:04d}",
        "name": product_name,
        "description": desc,
        "price": price,
        "costPrice": cost_price,
        "image": image,
        "images": [],
        "videoUrl": None,
        "video360Url": None,
        "isFeatured": random.choice([True, False]),
        "stock": stock,
        "colors": colors,
        "sizes": sizes,
        "lowStockThreshold": low_stock,
        "deletedAt": None,
        "isActive": True,
        "averageRating": round(random.uniform(3.5, 5.0), 1),
        "reviewsCount": random.randint(0, 50),
        "salesCount": sales_count,
        "brand": brand["slug"],
        "collectionName": model_line,
        "type": brand["type"],
        "slug": slug,
        "specs": specs,
        "createdAt": datetime.now().isoformat(),
        "customAttributes": [],
        "wristSizeOptions": [],
        "__v": 0,
        "updatedAt": datetime.now().isoformat()
    }
    return product


def main():
    random.seed()
    products = []
    for i in range(500):
        brand = random.choice(brands)
        prod = generate_product(brand, i)
        products.append(prod)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    with OUTPUT_FILE.open('w', encoding='utf-8') as f:
        for prod in products:
            f.write(json.dumps(prod, ensure_ascii=False) + '\n')

    print(f"✅ Đã tạo {len(products)} sản phẩm mới. File: {OUTPUT_FILE}")


if __name__ == '__main__':
    main()
