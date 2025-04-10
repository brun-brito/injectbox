import { useState } from 'react'

type Props = {
  onSubmit: (form: any) => Promise<void>
}

export default function ClienteForm({ onSubmit }: Props) {
  const [form, setForm] = useState({
    nome: '',
    email: '',
    telefone: '',
    cpf: '',
    conselho: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4 text-left">
      {['nome', 'email', 'telefone', 'cpf', 'conselho'].map((campo) => (
        <input
          key={campo}
          name={campo}
          value={form[campo as keyof typeof form]}
          onChange={handleChange}
          required={campo !== 'conselho'}
          placeholder={campo}
          className="w-full p-2 border border-gray-300 rounded"
        />
      ))}
      <button type="submit" className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700">
        Cadastrar
      </button>
    </form>
  )
}