
import { createClient } from '@supabase/supabase-js';


const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

if (!supabaseUrl || !supabaseAnonKey || !isValidUrl(supabaseUrl)) {
  console.warn('Supabase URL or Anon Key is missing or invalid. Check your .env.local file.');
}

export const supabase = createClient(
  isValidUrl(supabaseUrl) ? supabaseUrl : 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);

/**
 * Upload de comprovante para o Supabase Storage
 * @param file - Arquivo de imagem do comprovante
 * @param userId - ID do usuário
 * @param transactionId - ID da transação
 * @returns URL pública do comprovante ou null em caso de erro
 */
export const uploadReceipt = async (
  file: File,
  userId: string,
  transactionId: string
): Promise<string | null> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${transactionId}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('receipts')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error('Error uploading receipt:', error);
      return null;
    }

    // Obter URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('receipts')
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (err) {
    console.error('Upload failed:', err);
    return null;
  }
};

/**
 * Deletar comprovante do Supabase Storage
 * @param receiptUrl - URL do comprovante a ser deletado
 */
export const deleteReceipt = async (receiptUrl: string): Promise<boolean> => {
  try {
    // Extrair o caminho do arquivo da URL
    const url = new URL(receiptUrl);
    const pathParts = url.pathname.split('/receipts/');
    if (pathParts.length < 2) return false;

    const filePath = pathParts[1];

    const { error } = await supabase.storage
      .from('receipts')
      .remove([filePath]);

    if (error) {
      console.error('Error deleting receipt:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Delete failed:', err);
    return false;
  }
};
