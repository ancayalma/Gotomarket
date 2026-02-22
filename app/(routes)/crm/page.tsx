import { redirect } from "next/navigation";

const CrmPage = async () => {
  redirect("/crm/dashboard");
};

export default CrmPage;
