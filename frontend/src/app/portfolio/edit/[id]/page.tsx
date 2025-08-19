'use client';

export default function PortfolioEditPage({ params }: { params: { id: string } }) {
  const { id } = params

  return (
    <main>
      <h1>Edit Portfolio {id}</h1>
    </main>
  )
}
