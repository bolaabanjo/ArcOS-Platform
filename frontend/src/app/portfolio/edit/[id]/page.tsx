'use client';

interface PortfolioEditProps {
  params: {
    id: string
  }
}

export default function PortfolioEditPage({ params }: PortfolioEditProps) {
  const { id } = params

  return (
    <main>
      <h1>Edit Portfolio {id}</h1>
    </main>
  )
}
