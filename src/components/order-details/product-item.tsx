// src/components/order-details/ProductItem.tsx

import React from "react";

interface ProductItemProps {
    album_name: string;
    size: string;
    paper_type: string;
    printing_format: string;
    product_qty: number;
    price_per_unit: number;
    folderPath: string;
}

const ProductItem: React.FC<ProductItemProps> = ({
                                                     album_name,
                                                     size,
                                                     paper_type,
                                                     printing_format,
                                                     product_qty,
                                                     price_per_unit,
                                                     folderPath,
                                                 }) => {
    return (
        <div className="bg-white p-4 rounded-lg mb-4">
            <p>Album name: {album_name}</p>
            <p>Size (w x h): {size}</p>
            <p>Paper type: {paper_type}</p>
            <p>Printing format: {printing_format}</p>
            <p>Quantity: {product_qty}</p>
            <p>Price: {price_per_unit * product_qty}</p>
            <a
                href={`/api/orders?download=true&folderPath=${encodeURIComponent(folderPath)}`}
                className="text-blue-500"
            >
                File
            </a>
        </div>
    );
};

export default ProductItem;
