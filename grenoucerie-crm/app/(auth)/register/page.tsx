import { RegisterComponent } from "./components/RegisterComponent";
import { getPlans } from "@/actions/plans/plan-actions";
import Footer from "@/app/(routes)/components/Footer";

const RegisterPage = async ({ searchParams }: { searchParams: Promise<{ plan?: string; cycle?: string }> }) => {
  const resolvedParams = await searchParams;
  const plans = await getPlans();
  return (
    <div className="flex flex-col w-full min-h-screen">
      <div className="flex-1 flex flex-col items-center w-full max-w-xl mx-auto px-4 sm:px-10 pt-10">
        <div className="w-full flex items-center justify-center mb-10">
          <img src="/BasaltCRMWide.png" alt="BasaltCRM logo" className="h-12 sm:h-16 w-auto" />
        </div>
        
        <div className="w-full flex-1">
          {/* @ts-ignore */}
          <RegisterComponent availablePlans={plans} initialPlanSlug={resolvedParams.plan} initialCycle={resolvedParams.cycle} />
        </div>

        <div className="w-full mt-10">
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
