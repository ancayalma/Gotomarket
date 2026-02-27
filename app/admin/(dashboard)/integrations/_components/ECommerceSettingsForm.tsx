"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Eye, EyeOff, ExternalLink, ShoppingBag, Store } from "lucide-react";
import { saveIntegrationSettings } from "@/actions/admin/save-integration-settings";
import { useRouter } from "next/navigation";

interface Props {
    initialData: any;
}

export const ShopifySettingsForm = ({ initialData }: Props) => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [enabled, setEnabled] = useState(initialData?.shopify_enabled || false);
    const [storeUrl, setStoreUrl] = useState(initialData?.shopify_store_url || "");
    const [accessToken, setAccessToken] = useState(initialData?.shopify_access_token || "");
    const [tokenVisible, setTokenVisible] = useState(false);

    const onSave = async () => {
        setLoading(true);
        const formData = new FormData();
        if (enabled) formData.append("shopify_enabled", "on");
        formData.append("shopify_store_url", storeUrl);
        formData.append("shopify_access_token", accessToken);

        const result = await saveIntegrationSettings(formData);
        if (result?.success) {
            toast.success("Shopify settings saved!");
            router.refresh();
        } else {
            toast.error(result?.error || "Failed to save.");
        }
        setLoading(false);
    };

    return (
        <Card className="border border-green-500/20 bg-green-500/5 shadow-none w-full h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1">
                    <CardTitle className="text-xl md:text-2xl font-black bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent italic tracking-tight uppercase leading-relaxed py-2 px-2">
                        <ShoppingBag className="h-6 w-6 text-green-500" />
                        Shopify
                    </CardTitle>
                    <CardDescription className="text-muted-foreground/80">
                        Import products from your Shopify store.
                    </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                    <Switch id="shopify-mode" checked={enabled} onCheckedChange={setEnabled} />
                </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4 flex-1 flex flex-col">
                {enabled && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="grid gap-2">
                            <Label htmlFor="shopify-url">Store URL</Label>
                            <Input
                                id="shopify-url"
                                value={storeUrl}
                                onChange={(e) => setStoreUrl(e.target.value)}
                                placeholder="your-store.myshopify.com"
                                className="bg-background/50 border-green-500/20 text-sm"
                            />
                            <p className="text-xs text-muted-foreground">
                                Found in your Shopify Admin URL bar (without https://)
                            </p>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="shopify-token">Admin API Access Token</Label>
                            <div className="relative">
                                <Input
                                    id="shopify-token"
                                    type={tokenVisible ? "text" : "password"}
                                    value={accessToken}
                                    onChange={(e) => setAccessToken(e.target.value)}
                                    placeholder="shpat_..."
                                    className="bg-background/50 border-green-500/20 font-mono text-sm pr-10"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => setTokenVisible(!tokenVisible)}
                                >
                                    {tokenVisible ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Settings → Apps → Develop apps → Create an app → Configure scopes (read_products) → Install → Copy token
                            </p>
                        </div>
                    </div>
                )}
                <div className="flex justify-between items-center pt-2 mt-auto">
                    <Button
                        variant="outline"
                        type="button"
                        size="sm"
                        onClick={() => window.open("https://shopify.dev/docs/api/admin-rest", "_blank")}
                        className="border-green-500/20 hover:bg-green-500/10 text-xs py-1 h-8"
                    >
                        Shopify API Docs
                        <ExternalLink className="w-4 h-4 ml-1" />
                    </Button>
                    <Button
                        onClick={onSave}
                        disabled={loading}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 h-8 font-semibold"
                    >
                        {loading ? "Saving..." : "Save Settings"}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

export const WooCommerceSettingsForm = ({ initialData }: Props) => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [enabled, setEnabled] = useState(initialData?.woocommerce_enabled || false);
    const [storeUrl, setStoreUrl] = useState(initialData?.woocommerce_store_url || "");
    const [consumerKey, setConsumerKey] = useState(initialData?.woocommerce_consumer_key || "");
    const [consumerSecret, setConsumerSecret] = useState(initialData?.woocommerce_consumer_secret || "");
    const [secretVisible, setSecretVisible] = useState(false);

    const onSave = async () => {
        setLoading(true);
        const formData = new FormData();
        if (enabled) formData.append("woocommerce_enabled", "on");
        formData.append("woocommerce_store_url", storeUrl);
        formData.append("woocommerce_consumer_key", consumerKey);
        formData.append("woocommerce_consumer_secret", consumerSecret);

        const result = await saveIntegrationSettings(formData);
        if (result?.success) {
            toast.success("WooCommerce settings saved!");
            router.refresh();
        } else {
            toast.error(result?.error || "Failed to save.");
        }
        setLoading(false);
    };

    return (
        <Card className="border border-purple-500/20 bg-purple-500/5 shadow-none w-full h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1">
                    <CardTitle className="text-xl md:text-2xl font-black bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent italic tracking-tight uppercase leading-relaxed py-2 px-2">
                        <Store className="h-6 w-6 text-purple-500" />
                        WooCommerce
                    </CardTitle>
                    <CardDescription className="text-muted-foreground/80">
                        Import products from your WooCommerce store.
                    </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                    <Switch id="woo-mode" checked={enabled} onCheckedChange={setEnabled} />
                </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4 flex-1 flex flex-col">
                {enabled && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="grid gap-2">
                            <Label htmlFor="woo-url">Store URL</Label>
                            <Input
                                id="woo-url"
                                value={storeUrl}
                                onChange={(e) => setStoreUrl(e.target.value)}
                                placeholder="https://your-store.com"
                                className="bg-background/50 border-purple-500/20 text-sm"
                            />
                            <p className="text-xs text-muted-foreground">
                                Your WordPress site URL (must be HTTPS)
                            </p>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="woo-key">Consumer Key</Label>
                            <Input
                                id="woo-key"
                                type="password"
                                value={consumerKey}
                                onChange={(e) => setConsumerKey(e.target.value)}
                                placeholder="ck_..."
                                className="bg-background/50 border-purple-500/20 font-mono text-sm"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="woo-secret">Consumer Secret</Label>
                            <div className="relative">
                                <Input
                                    id="woo-secret"
                                    type={secretVisible ? "text" : "password"}
                                    value={consumerSecret}
                                    onChange={(e) => setConsumerSecret(e.target.value)}
                                    placeholder="cs_..."
                                    className="bg-background/50 border-purple-500/20 font-mono text-sm pr-10"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => setSecretVisible(!secretVisible)}
                                >
                                    {secretVisible ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                WooCommerce → Settings → Advanced → REST API → Add key (Read permissions)
                            </p>
                        </div>
                    </div>
                )}
                <div className="flex justify-between items-center pt-2 mt-auto">
                    <Button
                        variant="outline"
                        type="button"
                        size="sm"
                        onClick={() => window.open("https://woocommerce.github.io/woocommerce-rest-api-docs/", "_blank")}
                        className="border-purple-500/20 hover:bg-purple-500/10 text-xs py-1 h-8"
                    >
                        WooCommerce API Docs
                        <ExternalLink className="w-4 h-4 ml-1" />
                    </Button>
                    <Button
                        onClick={onSave}
                        disabled={loading}
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-700 h-8 font-semibold"
                    >
                        {loading ? "Saving..." : "Save Settings"}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};
