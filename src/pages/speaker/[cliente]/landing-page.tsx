import Image from 'next/image'
import { GetServerSideProps } from 'next'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { cadastrarCliente } from '@/services/clienteService'
import ClienteForm from '@/components/ClienteForm'
import epikLogo from '@/assets/fotos/epik-vetor.svg'
import fotoIA from '@/assets/fotos/foto-IA.jpg'
import { useRef } from 'react'

type FormType = {
  nome: string
  email: string
  telefone: string
  cpf: string
  conselho?: string
}

type Props = {
  cliente: string
  produto: string
}

export default function LandingPage({ cliente, produto }: Props) {
  const formRef = useRef<HTMLDivElement>(null)

  const handleCadastro = async (form: FormType) => {
    try {
      await cadastrarCliente({ ...form, empresa: cliente, produto })
      alert('Cadastro realizado com sucesso!')
    } catch (err) {
      if (err instanceof Error) {
        alert(err.message)
      } else {
        alert('Erro desconhecido')
      }
    }
  }

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <main className="min-h-screen bg-[#041B2D] text-white flex flex-col items-center px-4 py-8">
      {/* Logo */}
      <div className="w-full flex justify-center mb-4">
        <Image src={epikLogo} alt="Logo Epik" width={260} height={80} />
      </div>

      {/* Imagem principal */}
      <div className="w-full max-w-4xl relative aspect-[16/9] rounded-lg overflow-hidden mb-6 shadow-lg">
        <Image src={fotoIA} alt="Foto IA" layout="fill" objectFit="cover" />
      </div>

      {/* Título e descrição */}
      <div className="text-center max-w-2xl mb-6">
        <h1 className="text-4xl md:text-5xl font-bold">SPEAKER EPIK 24 HORAS</h1>
        <p className="mt-4 text-lg text-gray-200">
          Um assessor para tirar suas dúvidas, a qualquer hora, sobre procedimentos, produtos,
          protocolos, composição e muito mais.
        </p>
      </div>

      {/* Botão principal */}
      <button
        onClick={scrollToForm}
        className="bg-lime-400 text-black px-6 py-3 text-lg font-semibold rounded shadow hover:bg-lime-500 transition"
      >
        FAÇA SEU CADASTRO
      </button>

      {/* Formulário */}
      <div ref={formRef} className="mt-16 w-full max-w-xl">
        <ClienteForm onSubmit={handleCadastro} />
      </div>
    </main>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { cliente } = context.params as { cliente: string }
  const produto = 'speaker'

  const ref = doc(db, 'empresas', cliente, 'produtos', produto)
  const snapshot = await getDoc(ref)

  if (!snapshot.exists()) {
    return { notFound: true }
  }

  return {
    props: { cliente, produto },
  }
}