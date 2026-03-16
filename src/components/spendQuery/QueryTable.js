'use client'

import Image from "next/image";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

export const getColumns = (openReceiptDetail, handleDeleteReceipt) => [
  {
    accessorKey: "description",
    header: "Popis",
    cell: row => (
      <div>{row.getValue()}</div>
    )
  },
  {
    accessorKey: "category",
    header: "Kategorie",
    cell: row => (
      <div>{row.getValue()}</div>
    )
  },
  {
    accessorKey: "amount",
    header: "Částka",
    cell: row => (
      <div style={{ textAlign: 'right' }}>{row.getValue()}</div>
    )
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const receipt = row.original
      return (
        <div className="mt-1 flex flex-row">
          <button className="cursor-pointer pl-[10px]" onClick={() => openReceiptDetail(receipt)}>
            <Image src="/icons/search.svg" alt="Detail" width={12} height={12} />
          </button>
          <button className="cursor-pointer pl-[10px]" onClick={() => handleDeleteReceipt(receipt)}>
            <Image src="/icons/trash.svg" alt="Delete" width={12} height={12} />
          </button>
        </div>
      )
    },
  },
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
    <div className="justify-center flex md:justify-start md:ml-12">
      <div className="mb-5" />
      <table className="table-auto pb-3">
        <thead>
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <th
                  key={header.id}
                  className="px-4 py-2 border-b text-sm"
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
                  <td key={cell.id} className="px-4 py-1 text-sm">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))) : (
            <tr>
              <td colSpan={columns.length}>
                No results.
              </td>
            </tr>
          )}
        </tbody>
      </table >
    </div>
  )
}