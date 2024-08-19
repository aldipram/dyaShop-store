import db from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET (
    req: Request,
    { params } : { params: { productId: string }}
) {
    try {

        if (!params.productId) {
            return new NextResponse("Product Id store tidak ditemukan", { status: 400 });
        }

        const product = await db.product.findUnique({
            where: {
                id: params.productId,
            },
            include: {
                images: true,
                category: true,
            }
        });

        return NextResponse.json(product);
    } catch (error) {
        console.log("[PRODUCT_GET] ", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

export async function PATCH (
    req: Request,
    { params } : { params: { storeId: string, productId: string }}
) {
    try {
        
        const { userId } = auth();
        const body = await req.json();

        const {
            name,
            price,
            categoryId,
            images,
            isFeatured,
            isArchived,
        } = body;
        
        if(!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        if (!name) {
            return new NextResponse("Tambahkan nama product anda", { status: 400 });
        };

        if (!images || !images.length) {
            return new NextResponse("Tambahkan image anda", { status: 400 });
        };

        if (!price) {
            return new NextResponse("Tambahkan harga di product anda", { status: 400 });
        };

        if (!categoryId) {
            return new NextResponse("Tambahkan category product anda", { status: 400 });
        };

        if (!params.productId) {
            return new NextResponse("Produk Id tidak ditemukan", { status: 400 });
        }

        const storeByUserId = await db.store.findMany({
            where: {
                id: params.storeId,
                userId
            }
        })

        if (!storeByUserId) {
            return new NextResponse("Unautorized", { status: 401 })
        }

        await db.product.update({
            where: {
                id: params.productId,
            },
            data: {
                name,
                price,
                isFeatured,
                isArchived,
                categoryId,
                images: {
                    deleteMany: {}
                }
            },
        });

        const product = await db.product.update({
            where: {
                id: params.productId
            },
            data: {
                images: {
                    createMany: {
                        data: [
                            ...images.map((image: {url: string}) => image)
                        ]
                    }
                }
            }
        })

        return NextResponse.json(product);
    } catch (error) {
        console.log("[PRODUCT_PATCH] ", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

export async function DELETE (
    req: Request,
    { params } : { params: { storeId: string, productId: string }}
) {
    try {
        
        const { userId } = auth();``
        
        if(!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        if (!params.productId) {
            return new NextResponse("Produk Id store tidak ditemukan", { status: 400 });
        }

        const storeByUserId = await db.store.findMany({
            where: {
                id: params.storeId,
                userId
            }
        })

        if (!storeByUserId) {
            return new NextResponse("Unautorized", { status: 401 })
        }

        const product = await db.product.deleteMany({
            where: {
                id: params.productId,
            },
        });

        return NextResponse.json(product);
    } catch (error) {
        console.log("[PRODUCT_DELETE] ", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}