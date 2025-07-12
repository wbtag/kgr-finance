import SpendInterface from "@/components/SpendInterface";
import { getWeeklySpend } from "@/components/lib/cosmosLibrary";

export default async function Page() {

  const weeklySpend = await getWeeklySpend();
  return (
    <>
      <div>
        <SpendInterface weeklySpend={weeklySpend} />
      </div>
    </>
  );
}
