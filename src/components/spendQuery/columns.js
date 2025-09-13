'use client'

export const getColumns = (detail) => [
  {
    accessorKey: "description",
    header: "Popis",
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
  {
    id: "actions",
    cell: ({ row }) => {
      const receipt = row.original
      return (
        <button style={{paddingLeft: '10px'}} onClick={() => detail(receipt)}>
          Detail
        </button>
      )
    },
  },
]