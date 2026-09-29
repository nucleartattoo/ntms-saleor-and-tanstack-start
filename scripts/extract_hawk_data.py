#!/usr/bin/env python3
"""
Extract Hawk Eagle Cartridges and store data from Hawk Magento pod via stdin.
"""
import subprocess
import json
import os

PHP_SCRIPT = """<?php
require "app/bootstrap.php";
$b = \Magento\Framework\App\Bootstrap::create(BP, $_SERVER);
$c = $b->getObjectManager()->get(\Magento\Framework\App\ResourceConnection::class)->getConnection();

// Parent product info
$parent = $c->fetchRow("
    SELECT e.entity_id, e.sku, v_name.value as name,
           v_desc.value as description, v_sdesc.value as short_description,
           v_img.value as image
    FROM catalog_product_entity e
    JOIN catalog_product_entity_varchar v_name ON e.entity_id = v_name.entity_id
        AND v_name.attribute_id = (SELECT attribute_id FROM eav_attribute WHERE attribute_code = 'name' AND entity_type_id = 4)
        AND v_name.store_id = 0
    LEFT JOIN catalog_product_entity_text v_desc ON e.entity_id = v_desc.entity_id
        AND v_desc.attribute_id = (SELECT attribute_id FROM eav_attribute WHERE attribute_code = 'description' AND entity_type_id = 4)
        AND v_desc.store_id = 0
    LEFT JOIN catalog_product_entity_text v_sdesc ON e.entity_id = v_sdesc.entity_id
        AND v_sdesc.attribute_id = (SELECT attribute_id FROM eav_attribute WHERE attribute_code = 'short_description' AND entity_type_id = 4)
        AND v_sdesc.store_id = 0
    LEFT JOIN catalog_product_entity_varchar v_img ON e.entity_id = v_img.entity_id
        AND v_img.attribute_id = (SELECT attribute_id FROM eav_attribute WHERE attribute_code = 'image' AND entity_type_id = 4)
        AND v_img.store_id = 0
    WHERE e.entity_id = 6520
");

// Parent gallery images
$parent['images'] = $c->fetchCol("
    SELECT g.value
    FROM catalog_product_entity_media_gallery g
    JOIN catalog_product_entity_media_gallery_value v ON g.value_id = v.value_id
    WHERE v.entity_id = 6520
    ORDER BY v.position
");

// Variants
$sql = "
    SELECT r.child_id, e.sku, v_name.value as name, p_price.value as price, inv.qty, inv.is_in_stock,
           opt_group.value as config_group,
           opt_gauge.value as gauge,
           opt_size.value as size
    FROM catalog_product_relation r
    JOIN catalog_product_entity e ON r.child_id = e.entity_id
    LEFT JOIN catalog_product_entity_varchar v_name ON e.entity_id = v_name.entity_id
        AND v_name.attribute_id = (SELECT attribute_id FROM eav_attribute WHERE attribute_code = 'name' AND entity_type_id = 4)
        AND v_name.store_id = 0
    LEFT JOIN catalog_product_entity_decimal p_price ON e.entity_id = p_price.entity_id
        AND p_price.attribute_id = (SELECT attribute_id FROM eav_attribute WHERE attribute_code = 'price' AND entity_type_id = 4)
        AND p_price.store_id = 0
    LEFT JOIN cataloginventory_stock_item inv ON e.entity_id = inv.product_id
    LEFT JOIN catalog_product_entity_int a_group ON e.entity_id = a_group.entity_id
        AND a_group.attribute_id = 300 AND a_group.store_id = 0
    LEFT JOIN eav_attribute_option_value opt_group ON a_group.value = opt_group.option_id AND opt_group.store_id = 0
    LEFT JOIN catalog_product_entity_int a_gauge ON e.entity_id = a_gauge.entity_id
        AND a_gauge.attribute_id = 301 AND a_gauge.store_id = 0
    LEFT JOIN eav_attribute_option_value opt_gauge ON a_gauge.value = opt_gauge.option_id AND opt_gauge.store_id = 0
    LEFT JOIN catalog_product_entity_int a_size ON e.entity_id = a_size.entity_id
        AND a_size.attribute_id = 302 AND a_size.store_id = 0
    LEFT JOIN eav_attribute_option_value opt_size ON a_size.value = opt_size.option_id AND opt_size.store_id = 0
    WHERE r.parent_id = 6520
    ORDER BY e.sku
";
$parent['variants'] = $c->fetchAll($sql);

echo json_encode($parent);
"""

def main():
    print("🚀 Extracting Eagle Cartridges from Hawk pod...")
    cmd = [
        "ssh", "9900x",
        "kubectl", "-n", "hawk", "exec", "-i", "-c", "php", "hawk-magento-php-5cb8d9fc59-jhw2p", "--", "php"
    ]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    stdout, stderr = proc.communicate(input=PHP_SCRIPT.encode("utf-8"))

    if proc.returncode != 0:
        print("❌ Error:", stderr.decode())
        return

    data = json.loads(stdout.decode("utf-8"))
    out_dir = "/Volumes/samsung2tb980pro/project/Saleor-NTMS/scripts/data"
    os.makedirs(out_dir, exist_ok=True)
    out_file = os.path.join(out_dir, "hawk_eagle_cartridges.json")

    with open(out_file, "w") as f:
        json.dump(data, f, indent=2)

    print(f"✅ Extracted: '{data['name']}' (SKU: {data['sku']}) with {len(data['variants'])} variants")
    print(f"📁 Saved to: {out_file}")

if __name__ == "__main__":
    main()
