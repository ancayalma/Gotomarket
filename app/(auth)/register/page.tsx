import { RegisterComponent } from "./components/RegisterComponent";
import { getPlans } from "@/actions/plans/plan-actions";
import Footer from "@/app/(routes)/components/Footer";

const RegisterPage = async ({ searchParams }: { searchParams: { plan?: string; cycle?: string } }) => {
  const plans = await getPlans();
  return (
    <div className="flex flex-col w-full h-full overflow-auto p-10 space-y-5">
      <div className="py-2 flex items-center justify-center gap-3">
        <h1 className="text-3xl md:text-5xl font-black bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent italic tracking-tight uppercase leading-relaxed py-4 px-4 mb-2">Welcome to</h1>
        <img src="/BasaltCRMWide.png" alt="BasaltCRM logo" className="h-10 sm:h-12 w-auto" />
      </div>
      {/* @ts-ignore */}
      <RegisterComponent availablePlans={plans} initialPlanSlug={searchParams.plan} initialCycle={searchParams.cycle} />
      <div className="w-full max-w-lg sm:max-w-xl mx-auto">
        <Footer />
      </div>
    </div>
  );
};

export default RegisterPage;
