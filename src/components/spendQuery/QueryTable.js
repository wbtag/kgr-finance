'use client'

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

export const getColumns = (detail) => [
  {
    accessorKey: "description",
    header: "Popis",
    cell: info => (
      <div>{info.getValue()}</div>
    )
  },
  {
    accessorKey: "category",
    header: "Kategorie",
    cell: info => (
      <div>{info.getValue()}</div>
    )
  },
  {
    accessorKey: "amount",
    header: "Částka",
    cell: info => (
      <div style={{ textAlign: 'right', paddingLeft: '10px' }}>{info.getValue()}</div>
    )
  },
  // {
  //   id: "actions",
  //   cell: ({ row }) => {
  //     const receipt = row.original
  //     return (
  //       <button style={{ paddingLeft: '10px' }} onClick={() => detail(receipt)}>
  //         Detail
  //       </button>
  //     )
  //   },
  // },
]

export function DataTable({
  columns,
  data,
}) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <table className="table-auto">
      <thead>
        {table.getHeaderGroups().map(headerGroup => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map(header => (
              <th
                key={header.id}
                className="px-4 py-2 border-b font-medium min-w-[100px]"
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
        {table.getRowModel().rows?.length ? (
          table.getRowModel().rows.map(row => (
            <tr key={row.id} className="">
              {row.getVisibleCells().map(cell => (
                <td key={cell.id} className="px-4 py-2">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))) : (
          <TableRow>
            <TableCell colSpan={columns.length}>
              No results.
            </TableCell>
          </TableRow>
        )}
      </tbody>
    </table >
  )
}