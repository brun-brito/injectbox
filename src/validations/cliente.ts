export function validarNome(nome: string): boolean {
  return nome.trim().length >= 3
}

export function validarEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function validarTelefone(telefone: string): boolean {
  return /^\(?\d{2}\)?[\s-]?\d{4,5}-?\d{4}$/.test(telefone)
}

export function validarCPF(cpf: string): boolean {
  cpf = cpf.replace(/\D/g, '')
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false

  const calc = (factor: number) =>
    cpf
      .slice(0, factor - 1)
      .split('')
      .reduce((acc, curr, i) => acc + parseInt(curr) * (factor - i), 0)

  const dig1 = (calc(10) * 10) % 11 % 10
  const dig2 = (calc(11) * 10) % 11 % 10

  return dig1 === Number(cpf[9]) && dig2 === Number(cpf[10])
}