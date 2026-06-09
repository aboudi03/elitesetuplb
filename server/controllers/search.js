const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function searchProducts(request, response) {
    try {
        const { query } = request.query;
        if (!query) {
            return response.status(400).json({ error: "Query parameter is required" });
        }

        const normalizedQuery = String(query).trim();
        if (normalizedQuery.length < 2) {
            return response.json([]);
        }

        const products = await prisma.product.findMany({
            where: {
                isActive: true,
                OR: [
                    {
                        title: {
                            contains: normalizedQuery
                        }
                    },
                    {
                        model: {
                            contains: normalizedQuery
                        }
                    },
                    {
                        description: {
                            contains: normalizedQuery
                        }
                    },
                    {
                        manufacturer: {
                            contains: normalizedQuery
                        }
                    }
                ]
            },
            take: 8,
            orderBy: [
                { featuredSortOrder: "asc" },
                { createdAt: "desc" }
            ]
        });

        return response.json(products);
    } catch (error) {
        console.error("Error searching products:", error);
        return response.status(500).json({ error: "Error searching products" });
    }
}

module.exports = { searchProducts };
