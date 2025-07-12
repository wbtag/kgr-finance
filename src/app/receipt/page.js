import ReceiptInterface from "@/components/ReceiptInterface";
import { getTags } from "@/components/lib/cosmosLibrary";

export default async function ReceiptPage() {

    const tags = await getTags();

    return (
        <>
            <div>
                <ReceiptInterface tags={tags}/>
            </div>
        </>
    )
}