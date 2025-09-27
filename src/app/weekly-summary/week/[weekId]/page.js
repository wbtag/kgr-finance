import WeekDetail from "@/components/WeekDetail";

export default async function WeekDetailPage({ params }) {
    return (
        <div>
            <WeekDetail weekId={params.weekId} />
        </div>
    )
}