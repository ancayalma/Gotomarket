import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Container from "../../components/ui/Container";
import { getProducts } from "@/actions/crm/products";
import ProductsClient from "./components/ProductsClient";

import { LearnLink } from "@/components/ui/LearnLink";

export default async function ProductsPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        redirect("/sign-in");
    }

    const products = await getProducts();

    return (
        <Container
            title="Products Catalog"
            description="Manage your product catalog, bundles, and pricing."
        >
            <LearnLink
                tab="products"
                overviewTitle="Product Revenue Engine"
                overviewWhat="A centralized repository for all stockable goods, service bundles, and software licenses available for quoting."
                overviewWhy="Standardized products ensure that every sales quote uses approved SKUs and pricing models, preventing margin erosion and maintaining inventory integrity."
                overviewHow="Assign SKUs, set base unit prices, and categorize items. Once defined here, products become searchable and selectable within the Quote Builder tool."
            />
            <ProductsClient initialProducts={JSON.parse(JSON.stringify(products))} />
        </Container>
    );
}
