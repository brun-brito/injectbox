// apenas chama o endpoint correto
type ClienteData = {
  nome: string
  email: string
  telefone: string
  cpf: string
  conselho?: string
  empresa: string
  produto: string
}

export async function cadastrarCliente(data: ClienteData) {
    const res = await fetch('/api/cadastrar-cliente', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
  
    const json = await res.json()
  
    if (!res.ok) {
      throw new Error(json.erro || 'Erro ao cadastrar cliente')
    }
  
    return json
  }