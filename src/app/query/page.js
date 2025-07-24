import SpendQuery from "@/components/spendQuery/SpendQuery";
import { getTags } from "@/components/lib/mongoLibrary";

export default async function ReceiptPage() {

    const tags = await getTags();

    return (
        <>
            <div>
                <SpendQuery tags={tags} />
            </div>
        </>
    )
}