type Props = {
    produto: string
    cliente: string
  }
  
  export default function LandingHeader({ produto, cliente }: Props) {
    return (
      <>
        <h1 className="text-3xl font-bold mb-4">Landing do {produto}</h1>
        <h2 className="text-xl mb-6">Cliente: {cliente}</h2>
      </>
    )
  }