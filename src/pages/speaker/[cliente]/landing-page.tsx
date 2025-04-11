import Image from 'next/image'
import { GetServerSideProps } from 'next'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { cadastrarCliente } from '@/services/clienteService'
import ClienteForm from '@/components/ClienteForm'
import epikLogo from '@/assets/fotos/epik/epik-vetor.svg'
import fotoIA from '@/assets/fotos/epik/foto-IA.jpg'
import { useRef } from 'react'
import { useState } from 'react'
import Head from 'next/head'
import { Cliente } from '@/types/Cliente'

type Props = {
  cliente: string
  produto: string
}

export default function LandingPage({ cliente, produto }: Props) {
  const formRef = useRef<HTMLDivElement>(null)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)

  const handleCadastro = async (form: Cliente) => {
    try {
      await cadastrarCliente({ 
        ...form, 
        empresa: cliente,
        produto
      })
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
    setMostrarFormulario((prev) => !prev)
    if (!mostrarFormulario) {
      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }
  }

  return (
    <>
    <Head>
      <title>{`Speaker - ${cliente}`}</title>
      <link rel="icon" href={`/${cliente || 'favicon'}.ico`} />
    </Head>
    <main className="min-h-screen bg-gradient-to-b from-[#01202e] via-[#174359] to-[#01202e] text-white px-4 py-8 flex items-center justify-center">
      <section className='flex flex-col md:flex-row items-start justify-between w-full max-w-7xl gap-4'>
        <div className="flex flex-col items-start w-full max-w-xl mb-4 ml-5">
          <div className="mb-9">
            <Image src={epikLogo} alt="Logo Epik" width={290} height={80} />
          </div>
          <div className="w-full max-w-xs md:max-w-md relative aspect-[1] rounded-lg overflow-hidden shadow-lg border-l-10 border-r-10 border-[#d9ff3c]">
            <Image src={fotoIA} alt="Foto IA" fill className="object-cover" />
          </div>
        </div>

        <div className="mt-0 md:mt-30 flex-1 min-h-[500px] flex flex-col justify-start w-full max-w-2xl">
          {/* Título e descrição */}
          <div className="text-center max-w-2xl m-4">
            <div className="text-left dela-gothic-one-regular leading-tight">
              <h1 className="text-5xl md:text-6xl text-transparent" style={{ WebkitTextStroke: '1px white' }}>
                SPEAKER
              </h1>
              <h1 className="text-5xl md:text-7xl text-[#c3916e]">EPIK</h1>
              <h1 className="text-5xl md:text-5xl text-transparent" style={{ WebkitTextStroke: '1px white' }}>24 HORAS</h1>
            </div>
            <p className="mt-4 text-lg text-gray-200 uppercase">
              Um assessor para tirar suas dúvidas, a qualquer hora, sobre procedimentos, produtos,
              protocolos, composição e muito mais.
            </p>
          </div>

          {/* div cadastro */}
          <div className="text-center max-w-2xl m-4">
            <div>
              <h2 className="text-[#d9ff3c] text-3xl md:text-4xl font-bold">Faça seu cadastro e utilize por <br></br>30 DIAS GRÁTIS!</h2>
            </div>

            {/* Botão principal */}
            <button
              onClick={scrollToForm}
              className="cursor-pointer mt-4 bg-lime-400 text-black px-6 py-3 text-lg font-semibold rounded shadow hover:scale-105 hover:bg-lime-500 transition-transform duration-300 ease-out"
              >
              {mostrarFormulario ? 'FECHAR FORMULÁRIO' : 'CLIQUE AQUI!'}
            </button>

            {/* Formulário */}
            {mostrarFormulario && (
              <div
              ref={formRef}
              className={`
                mt-6 w-full max-w-xl justify-items-center
                transition-all duration-700 ease-in-out
                transform
                ${mostrarFormulario ? 'opacity-100 scale-100 translate-y-0 blur-0' : 'opacity-0 scale-95 translate-y-6 blur-sm'}
                `}
                >
                <ClienteForm onSubmit={handleCadastro} />
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
    </>
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