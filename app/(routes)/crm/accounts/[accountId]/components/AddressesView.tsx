import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Home, Truck } from "lucide-react";

interface AddressesViewProps {
    data: any;
}

const AddressItem = ({ label, value }: { label: string, value: string | null | undefined }) => (
    <div className="-mx-2 flex items-start space-x-4 rounded-md p-2 transition-all hover:bg-accent/50 group">
        <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50 group-hover:text-primary transition-colors">
                {label}
            </p>
            <p className="text-sm text-muted-foreground/80 group-hover:text-foreground transition-colors">
                {value || "Not set"}
            </p>
        </div>
    </div>
);

export function AddressesView({ data }: AddressesViewProps) {

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            <Card className="bg-background/20 backdrop-blur-sm border-white/5 shadow-xl">
                <CardHeader className="pb-3 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                            <Home size={18} />
                        </div>
                        <CardTitle className="text-base font-bold tracking-tight">Billing Address</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="gap-1 pt-4">
                    <AddressItem label="Street" value={data.billing_street} />
                    <div className="grid grid-cols-2">
                        <AddressItem label="City" value={data.billing_city} />
                        <AddressItem label="State" value={data.billing_state} />
                    </div>
                    <div className="grid grid-cols-2">
                        <AddressItem label="Postal Code" value={data.billing_postal_code} />
                        <AddressItem label="Country" value={data.billing_country} />
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-background/20 backdrop-blur-sm border-white/5 shadow-xl">
                <CardHeader className="pb-3 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400">
                            <Truck size={18} />
                        </div>
                        <CardTitle className="text-base font-bold tracking-tight">Shipping Address</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="gap-1 pt-4">
                    <AddressItem label="Street" value={data.shipping_street} />
                    <div className="grid grid-cols-2">
                        <AddressItem label="City" value={data.shipping_city} />
                        <AddressItem label="State" value={data.shipping_state} />
                    </div>
                    <div className="grid grid-cols-2">
                        <AddressItem label="Postal Code" value={data.shipping_postal_code} />
                        <AddressItem label="Country" value={data.shipping_country} />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
