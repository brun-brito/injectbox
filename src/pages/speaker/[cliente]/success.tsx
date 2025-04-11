import Head from 'next/head'
import { FaWhatsapp } from 'react-icons/fa'

export default function Sucesso() {
  return (
    <>
      <Head>
        <title>Cadastro realizado</title>
        <link rel="icon" href="/success.ico"/>
      </Head>

      <main className="min-h-screen bg-[#01202e] text-white flex flex-col items-center justify-center px-4">
        <h1 className="text-3xl md:text-4xl font-bold mb-4 text-center text-lime-400">
          Cadastro realizado com sucesso!
        </h1>
        <p className="mb-6 text-center text-gray-300 max-w-md">
          Agora você pode tirar dúvidas diretamente com nosso Speaker via WhatsApp.
        </p>
        <a
          href="https://wa.me/5547996392820"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 bg-lime-400 text-black font-semibold px-6 py-3 rounded shadow hover:bg-lime-500 transition"
        >
          <FaWhatsapp className="text-2xl" />
          Falar no WhatsApp
        </a>
      </main>
    </>
  )
}