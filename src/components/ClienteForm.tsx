import { useState } from 'react'
import { 
  validarNome, 
  validarEmail, 
  validarTelefone, 
  validarCPF
} from '@/validations/cliente'
import { useRouter } from 'next/router'
import { Cliente } from '@/types/Cliente'

type Props = {
  onSubmit: (form: Cliente) => Promise<void>
}

const placeholders: Record<string, string> = {
  nome: 'ex: José da Silva',
  email: 'ex: jose@exemplo.com',
  telefone: 'ex: 86982731234',
  cpf: 'ex: 12345678900',
  especialidade: 'ex: Odontologia',
  uf: 'ex: RJ',
  conselho: 'ex: 107532',
}

export default function ClienteForm({ onSubmit }: Props) {
  const router = useRouter()
  const cliente = router.query.cliente as string
  const [form, setForm] = useState<Cliente>({
    nome: '',
    email: '',
    telefone: '',
    cpf: '',
    especialidade: '',
    uf: '',
    conselho: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const [erros, setErros] = useState<Record<string, string>>({})
  const [tocados, setTocados] = useState<Record<string, boolean>>({})
  const [isLoading, setIsLoading] = useState(false)
  
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setTocados({ ...tocados, [name]: true })

    if (value === '') return

    const novosErros = { ...erros }

    switch (name) {
      case 'nome':
        novosErros.nome = validarNome(value) ? '' : 'Nome inválido'
        break
      case 'email':
        novosErros.email = validarEmail(value) ? '' : 'Email inválido'
        break
      case 'telefone':
        novosErros.telefone = validarTelefone(value) ? '' : 'Telefone inválido'
        break
      case 'cpf':
        novosErros.cpf = validarCPF(value) ? '' : 'CPF inválido'
        break
      default:
        break
    }

    setErros(novosErros)
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const novosErros: Record<string, string> = {}
  
    if (!validarNome(form.nome)) novosErros.nome = 'Nome inválido'
    if (!validarEmail(form.email)) novosErros.email = 'Email inválido'
    if (!validarTelefone(form.telefone)) novosErros.telefone = 'Telefone inválido'
    if (!validarCPF(form.cpf)) novosErros.cpf = 'CPF inválido'
  
    if (Object.keys(novosErros).length > 0) {
      setErros(novosErros)
      return
    }
  
    try {
      setIsLoading(true)
      setErros({})
      await onSubmit(form)
      router.push(`/speaker/${cliente}/success`)
    } finally {
      setIsLoading(false)
    }
  }

  const labels: Record<string, string> = {
    nome: 'Nome completo',
    email: 'Email',
    telefone: 'Telefone com DDD',
    cpf: 'CPF',
    especialidade: 'Especialidade',
    uf: 'UF',
    conselho: 'Número do conselho',
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
      {['nome', 'email', 'telefone', 'cpf', 'especialidade', 'conselho'].map((campo) => (
        <div key={campo}>
          <label htmlFor={campo} className="font-semibold text-left block text-sm font-medium text-white mb-1">
            {labels[campo]}
          </label>
          <input
            id={campo}
            name={campo}
            value={String(form[campo as keyof typeof form] || '')}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            placeholder={placeholders[campo]}
            className={`w-full p-2 border rounded ${erros[campo] ? 'border-red-500' : 'border-gray-300'}`}
            maxLength={['telefone', 'cpf'].includes(campo) ? 11 : undefined}
          />
          {tocados[campo] && erros[campo] && (
            <p className="text-red-500 text-sm mt-1">{erros[campo]}</p>
          )}
        </div>
      ))}
      <div>
        <label htmlFor="uf" className="font-semibold text-left block text-sm font-medium text-white mb-1">
          UF
        </label>
        <select
          id="uf"
          name="uf"
          value={form.uf}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded border-gray-300"
        >
          <option value="" disabled>Selecione um estado</option>
          {[
            'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
            'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
            'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
          ].map((uf) => (
            <option key={uf} value={uf}>{uf}</option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className={`cursor-pointer w-full p-2 text-white rounded 
          ${isLoading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
      >
        {isLoading ? 'Enviando...' : 'Cadastrar'}
      </button>
    </form>
  )
}