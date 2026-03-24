import Query from "@/components/interfaces/Query";

export default async function ReceiptPage({ searchParams }) {

    const params = await searchParams;

    return (
        <>
            <div>
                <Query period={params.period} />
            </div>
        </>
    )
}