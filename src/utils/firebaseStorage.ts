import { storage } from '@/lib/firebaseAdmin';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

export interface UploadResult {
  url: string;
  fileName: string;
  fullPath: string;
}

/**
 * Faz upload de arquivo para o Firebase Storage
 */
export async function uploadImagemCampanha(
  file: formidable.File,
  cliente: string,
  campanhaId: string
): Promise<UploadResult> {
  const bucket = storage.bucket();
  
  // Gerar nome único para o arquivo
  const timestamp = Date.now();
  const ext = path.extname(file.originalFilename || '');
  const fileName = `${timestamp}_${Math.random().toString(36).substring(2)}${ext}`;
  
  // Caminho no Storage: zcampanha/[cliente]/imagens/[idCampanha]/arquivo.ext
  const storagePath = `zcampanha/${cliente}/imagens/${campanhaId}/${fileName}`;
  
  // Referência do arquivo no Storage
  const fileRef = bucket.file(storagePath);
  
  // Ler o arquivo temporário
  const fileBuffer = fs.readFileSync(file.filepath);
  
  // Detectar content-type baseado na extensão
  const contentType = getContentType(ext);
  
  // Upload do arquivo
  await fileRef.save(fileBuffer, {
    metadata: {
      contentType,
      metadata: {
        originalName: file.originalFilename || fileName,
        uploadedBy: 'zcampanha-system',
        cliente,
        campanhaId,
        uploadDate: new Date().toISOString()
      }
    }
  });
  
  // Tornar o arquivo público
  await fileRef.makePublic();
  
  // Obter URL pública
  const publicUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;
  
  // Limpar arquivo temporário
  fs.unlinkSync(file.filepath);
  
  return {
    url: publicUrl,
    fileName,
    fullPath: storagePath
  };
}

/**
 * Remove imagem do Firebase Storage
 */
export async function removerImagemCampanha(storagePath: string): Promise<void> {
  try {
    const bucket = storage.bucket();
    const file = bucket.file(storagePath);
    
    // Verificar se o arquivo existe
    const [exists] = await file.exists();
    if (exists) {
      await file.delete();
      console.log(`Arquivo removido: ${storagePath}`);
    }
  } catch (error) {
    console.error('Erro ao remover arquivo do Storage:', error);
    // Não propagar o erro para não quebrar o fluxo principal
  }
}

/**
 * Remove todas as imagens de uma campanha
 */
export async function removerImagensCampanha(cliente: string, campanhaId: string): Promise<void> {
  try {
    const bucket = storage.bucket();
    const folderPath = `zcampanha/${cliente}/imagens/${campanhaId}/`;
    
    // Listar todos os arquivos na pasta da campanha
    const [files] = await bucket.getFiles({
      prefix: folderPath
    });
    
    // Deletar todos os arquivos encontrados
    await Promise.all(
      files.map(file => file.delete().catch(err => 
        console.error(`Erro ao deletar ${file.name}:`, err)
      ))
    );
    
    console.log(`Imagens da campanha ${campanhaId} removidas`);
  } catch (error) {
    console.error('Erro ao remover imagens da campanha:', error);
  }
}

/**
 * Extrai o caminho do Storage de uma URL pública
 */
export function extrairCaminhoStorage(url: string): string | null {
  try {
    // URLs do tipo: https://storage.googleapis.com/bucket-name/path/to/file
    const match = url.match(/https:\/\/storage\.googleapis\.com\/[^\/]+\/(.+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * Determina o content-type baseado na extensão do arquivo
 */
function getContentType(ext: string): string {
  const contentTypes: { [key: string]: string } = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.bmp': 'image/bmp'
  };
  
  return contentTypes[ext.toLowerCase()] || 'application/octet-stream';
}

/**
 * Valida se o arquivo é uma imagem válida
 */
export function validarImagem(file: formidable.File): { valido: boolean; erro?: string } {
  // Verificar tamanho (máximo 10MB)
  if (file.size > 10 * 1024 * 1024) {
    return { valido: false, erro: 'Arquivo muito grande. Máximo 10MB.' };
  }
  
  // Verificar tipo MIME
  if (!file.mimetype || !file.mimetype.startsWith('image/')) {
    return { valido: false, erro: 'Arquivo deve ser uma imagem.' };
  }
  
  // Verificar extensão
  const ext = path.extname(file.originalFilename || '').toLowerCase();
  const extensoesValidas = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
  
  if (!extensoesValidas.includes(ext)) {
    return { valido: false, erro: 'Formato de imagem não suportado.' };
  }
  
  return { valido: true };
}
