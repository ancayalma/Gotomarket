import { getAllCrmData } from "./actions/crm/get-crm-data";

async function run() {
  try {
    const data = await getAllCrmData();
    console.log("SUCCESS!");
  } catch (e) {
    console.error("ERROR:", e);
  }
}
run();
