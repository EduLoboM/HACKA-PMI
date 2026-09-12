/**
 * Utilitários oficiais de validação e formatação de CNPJ
 * Algoritmo oficial de dígitos verificadores (Módulo 11 da Receita Federal do Brasil)
 */

export function limparCNPJ(cnpj: string): string {
	return (cnpj ?? '').replace(/\D/g, '');
}

export function formatarCNPJ(cnpj: string): string {
	const limpo = limparCNPJ(cnpj);
	if (limpo.length !== 14) return cnpj;
	return limpo.replace(
		/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
		'$1.$2.$3/$4-$5'
	);
}

export function validarCNPJ(cnpj: string): boolean {
	const limpo = limparCNPJ(cnpj);

	if (limpo.length !== 14) return false;

	// Rejeita sequências repetidas conhecidas (ex: 00000000000000, 11111111111111, etc.)
	if (/^(\d)\1{13}$/.test(limpo)) return false;

	const digitos = limpo.split('').map(Number);

	// Cálculo do 1º Dígito Verificador
	const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
	let soma1 = 0;
	for (let i = 0; i < 12; i++) {
		soma1 += digitos[i] * pesos1[i];
	}
	const resto1 = soma1 % 11;
	const dv1 = resto1 < 2 ? 0 : 11 - resto1;
	if (digitos[12] !== dv1) return false;

	// Cálculo do 2º Dígito Verificador
	const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
	let soma2 = 0;
	for (let i = 0; i < 13; i++) {
		soma2 += digitos[i] * pesos2[i];
	}
	const resto2 = soma2 % 11;
	const dv2 = resto2 < 2 ? 0 : 11 - resto2;

	return digitos[13] === dv2;
}

