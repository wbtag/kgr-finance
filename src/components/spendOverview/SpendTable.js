import React from "react"
import {
    useReactTable,
    getCoreRowModel,
    flexRender,
} from "@tanstack/react-table"

const columns = [
    {
        accessorKey: "category",
        header: "Kategorie"
    },
    {
        accessorKey: "spend",
        header: "Útrata",
        cell: ({ row }) => {
            const spend = row.original.spend;
            const limit = row.original.limit;
            const over = spend > limit;
            return (
                <div className={`w-full text-right ${over ? "text-red-600" : ""}`}>
                    {spend}/{limit} Kč
                </div>
            );
        },
        meta: { className: 'text-right' },
    },
]

export default function SpendTable({ source, other }) {

    const data = React.useMemo(() => {
        return Object.entries(source).map(([category, values]) => ({
            category,
            spend: values.spend,
            limit: values.limit
        }));
    }, [source]);

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    })

    return (
        <table className="w-80">
            <thead>
                {table.getHeaderGroups().map(headerGroup => (
                    <tr key={headerGroup.id}>
                        {headerGroup.headers.map(header => (
                            <th
                                key={header.id}
                                className="px-4 py-2 border-b font-medium min-w-[150px]"
                            >
                                {header.isPlaceholder
                                    ? null
                                    : flexRender(
                                        header.column.columnDef.header,
                                        header.getContext()
                                    )}
                            </th>
                        ))}
                    </tr>
                ))}
            </thead>
            <tbody>
                {table.getRowModel().rows.map(row => (
                    <tr key={row.id} className="">
                        {row.getVisibleCells().map(cell => (
                            <td key={cell.id} className="px-4 py-2">
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </td>
                        ))}
                    </tr>
                ))}
                <tr>
                    <td className="px-4 py-2">Jiné</td>
                    <td className="px-4 py-2 text-right">{other} Kč</td>
                </tr>
            </tbody>
        </table >
    )
}
