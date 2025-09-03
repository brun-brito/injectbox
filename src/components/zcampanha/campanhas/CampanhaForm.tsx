import React from "react";
import * as Icons from 'react-icons/fi';
import ContentEditable from 'react-contenteditable';
import exemploBotoes from '@/assets/fotos/zcampanha/exemplo-botoes.jpeg';
import * as Type from "@/types/Campanha";
import Image from 'next/image';

type ButtonAction = {
  id: string;
  label: string;
};

interface CampanhaFormData {
  id?: string;
  nome: string;
  tipoMensagem: Type.TipoMensagem;
  textoMensagem: string;
  legendaImagem?: string;
  imagemUrl?: string; // Alterado de imagemBase64 para imagemUrl
  botoesAcao?: Type.ButtonAction[];
  contatosSelecionados: Type.ContatoSelecionado[];
}

type CampanhaFormProps = {
  aberta: boolean;
  onFechar: () => void;
  onSalvar: (dados: CampanhaFormData) => Promise<void>;
  campanhaEmEdicao?: Type.Campanha | null;
  contatos: Type.Contato[];
  nome: string;
  setNome: (nome: string) => void;
  tipoMensagem: Type.TipoMensagem;
  setTipoMensagem: (tipo: Type.TipoMensagem) => void;
  textoMensagem: string;
  setTextoMensagem: (texto: string) => void;
  legendaImagem: string;
  setLegendaImagem: (legenda: string) => void;
  imagemUrl: string; // Alterado de imagemBase64 para imagemUrl
  setImagemUrl: (imagem: string) => void; // Alterado de setImagemBase64 para setImagemUrl
  imagemFile: File | null; // Novo estado para o arquivo
  setImagemFile: (file: File | null) => void; // Novo setter para o arquivo
  botoesAcao: Type.ButtonAction[];
  setBotoesAcao: (botoes: Type.ButtonAction[]) => void;
  contatosSelecionados: Type.ContatoSelecionado[];
  setContatosSelecionados: (contatos: Type.ContatoSelecionado[]) => void;
  erro: string;
  setErro: (erro: string) => void;
  isFormValid: boolean;
  mostrarVariaveisTexto: boolean;
  setMostrarVariaveisTexto: (mostrar: boolean) => void;
  mostrarVariaveisLegenda: boolean;
  setMostrarVariaveisLegenda: (mostrar: boolean) => void;
  mostrarVariaveisBotoes: boolean;
  setMostrarVariaveisBotoes: (mostrar: boolean) => void;
  handleImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  adicionarBotao: () => void;
  removerBotao: (index: number) => void;
  atualizarBotao: (index: number, campo: keyof ButtonAction, valor: string) => void;
  inserirVariavelTexto: (variavel: string) => void;
  inserirVariavelLegenda: (variavel: string) => void;
  inserirVariavelBotoes: (variavel: string) => void;
  renderizarTextoComVariaveis: (texto: string) => string;
  renderizarSelecaoContatos: () => React.ReactNode;
  salvarCampanha: () => Promise<void>;
  fecharModalCriar: () => void;
  loadingCampanha: boolean;
};

const MenuVariaveis = ({ mostrar, onInserir, onFechar }: { 
  mostrar: boolean, 
  onInserir: (variavel: string) => void,
  onFechar: () => void 
}) => {
  if (!mostrar) return null;
    
    return (
      <div className="variaveis-menu">
        <div className="variaveis-header">
          <span className="variaveis-titulo">Inserir Variável</span>
          <span className="variaveis-subtitulo">Clique para adicionar</span>
        </div>
        <div className="variaveis-lista">
          <button
            type="button"
            className="variavel-item"
            onClick={() => onInserir('$nome')}
          >
            <div className="variavel-preview">
              <span className="variavel-tag">$nome</span>
              <span className="variavel-exemplo">João Silva</span>
            </div>
            <span className="variavel-desc">Nome completo do contato</span>
          </button>
          <button
            type="button"
            className="variavel-item"
            onClick={() => onInserir('$primeiroNome')}
          >
            <div className="variavel-preview">
              <span className="variavel-tag">$primeiroNome</span>
              <span className="variavel-exemplo">João</span>
            </div>
            <span className="variavel-desc">Primeiro nome do contato</span>
          </button>
        </div>
        <div className="variaveis-overlay" onClick={onFechar}></div>
      </div>
    );
  };

const CampanhaForm: React.FC<CampanhaFormProps> = ({
  aberta,
  campanhaEmEdicao = null,
  nome,
  setNome,
  tipoMensagem,
  setTipoMensagem,
  textoMensagem,
  setTextoMensagem,
  legendaImagem,
  setLegendaImagem,
  imagemUrl, // Alterado de imagemBase64 para imagemUrl
  setImagemUrl, // Alterado de setImagemBase64 para setImagemUrl
  botoesAcao,
  erro,
  isFormValid,
  mostrarVariaveisTexto,
  setMostrarVariaveisTexto,
  mostrarVariaveisLegenda,
  setMostrarVariaveisLegenda,
  mostrarVariaveisBotoes,
  setMostrarVariaveisBotoes,
  handleImageUpload,
  adicionarBotao,
  removerBotao,
  atualizarBotao,
  inserirVariavelTexto,
  inserirVariavelLegenda,
  inserirVariavelBotoes,
  renderizarTextoComVariaveis,
  renderizarSelecaoContatos,
  salvarCampanha,
  fecharModalCriar,
  loadingCampanha,
}) => {
  if (!aberta) return null;

  return (
    <div className="modal-overlay" onClick={fecharModalCriar}>
      <div className="modal-content modal-criar" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{campanhaEmEdicao ? 'Editar Campanha' : 'Nova Campanha'}</h3>
          <button onClick={fecharModalCriar} className="btn-fechar-modal">
            <Icons.FiX size={20} />
          </button>
        </div>
        
        <div className="form-campanha">
          <div className="form-group">
            <label>Nome da Campanha<span className="required-asterisk">*</span></label>
            <input
              type="text"
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Ex: Promoção Black Friday"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Tipo de Mensagem<span className="required-asterisk">*</span></label>
            <div className="tipo-mensagem-selector">
              <button
                type="button"
                className={`tipo-btn ${tipoMensagem === 'texto' ? 'ativo' : ''}`}
                onClick={() => setTipoMensagem('texto')}
              >
                <Icons.FiFileText size={18} />
                <span>Texto</span>
              </button>
              <button
                type="button"
                className={`tipo-btn ${tipoMensagem === 'imagem' ? 'ativo' : ''}`}
                onClick={() => setTipoMensagem('imagem')}
              >
                <Icons.FiImage size={18} />
                <span>Imagem</span>
              </button>
              <button
                type="button"
                className={`tipo-btn ${tipoMensagem === 'botoes' ? 'ativo' : ''}`}
                onClick={() => setTipoMensagem('botoes')}
              >
                <Icons.FiMessageSquare size={18} />
                <span>Botões</span>
              </button>
            </div>
          </div>

          {tipoMensagem === 'texto' && (
            <div className="form-group">
              <label>Mensagem de Texto<span className="required-asterisk">*</span></label>
              <div className="input-with-variables">
                <ContentEditable
                  id="texto-mensagem"
                  className="form-textarea editor-highlight"
                  html={renderizarTextoComVariaveis(textoMensagem)}
                  onChange={e => {
                    const element = e.currentTarget as HTMLDivElement;
                    let text = element.innerHTML;
                  
                    text = text
                      .replace(/<br\s*\/?>/gi, '\n')
                      .replace(/<div>/gi, '\n')
                      .replace(/<\/div>/gi, '')
                      .replace(/<[^>]*>/g, '');
                  
                    text = text
                      .replace(/&nbsp;/g, ' ')
                      .replace(/&amp;/g, '&')
                      .replace(/&lt;/g, '<')
                      .replace(/&gt;/g, '>');
                  
                    setTextoMensagem(text);
                  }}
                  onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                  
                      const selection = window.getSelection();
                      if (!selection || selection.rangeCount === 0) return;
                  
                      const range = selection.getRangeAt(0);
                      
                      const br1 = document.createElement('br');
                      const br2 = document.createElement('br');
                      range.deleteContents();
                      range.insertNode(br2);
                      range.insertNode(br1);
                  
                      range.setStartAfter(br2);
                      range.collapse(true);
                      selection.removeAllRanges();
                      selection.addRange(range);
                    }
                  }}
                  placeholder="Digite a mensagem que será enviada..."
                  style={{ 
                    whiteSpace: 'pre-wrap',
                    minHeight: '80px',
                    maxHeight: '200px',
                    overflowY: 'auto'
                  }}
                />
                <div className="variables-button-container">
                  <button
                    type="button"
                    className="variaveis-btn"
                    onClick={() => setMostrarVariaveisTexto(!mostrarVariaveisTexto)}
                    title="Inserir variáveis"
                  >
                    <span className="variaveis-btn-icon">@</span>
                  </button>
                  <MenuVariaveis 
                    mostrar={mostrarVariaveisTexto}
                    onInserir={inserirVariavelTexto}
                    onFechar={() => setMostrarVariaveisTexto(false)}
                  />
                </div>
              </div>
              <small className="form-hint">
                Use variáveis: $nome, $primeiroNome • Pressione Enter para quebrar linha
              </small>
            </div>
          )}

          {tipoMensagem === 'imagem' && (
            <>
              <div className="form-group">
                <label>Imagem<span className="required-asterisk">*</span></label>
                {!imagemUrl ? (
                  <div className="image-selector">
                    <label htmlFor="image-upload" className="image-upload-btn">
                      <Icons.FiImage size={32} className="upload-icon" />
                      <div className="upload-text">
                        <span className="upload-title">Clique para selecionar uma imagem</span>
                        <span className="upload-subtitle">JPG, PNG, GIF até 10MB</span>
                      </div>
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="file-input-hidden"
                      id="image-upload"
                    />
                  </div>
                ) : (
                  <div className="image-preview-container">
                    <div className="image-preview">
                      <Image src={imagemUrl} alt="Preview" width={200} height={150} />
                      <button
                        type="button"
                        onClick={() => {
                          setImagemUrl('');
                        }}
                        className="remove-image-btn"
                        title="Remover imagem"
                      >
                        <Icons.FiX size={16} />
                      </button>
                    </div>
                    <div className="image-actions">
                      <label htmlFor="image-upload" className="change-image-btn">
                        <Icons.FiImage size={16} />
                        Trocar imagem
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="file-input-hidden"
                        id="image-upload"
                      />
                    </div>
                  </div>
                )}
              </div>
              
              <div className="form-group">
                <label>Legenda (opcional)</label>
                <div className="input-with-variables">
                   <ContentEditable
                    id="legenda-imagem"
                    className="form-textarea editor-highlight"
                    html={renderizarTextoComVariaveis(legendaImagem)}
                    onChange={e => {
                      const element = e.currentTarget as HTMLDivElement;
                      let text = element.innerHTML;
                      
                      text = text
                        .replace(/<br\s*\/?>/gi, '\n')
                        .replace(/<div>/gi, '\n')
                        .replace(/<\/div>/gi, '')
                        .replace(/<[^>]*>/g, '');
                      
                      text = text
                        .replace(/&nbsp;/g, ' ')
                        .replace(/&amp;/g, '&')
                        .replace(/&lt;/g, '<')
                        .replace(/&gt;/g, '>');
                      
                      setLegendaImagem(text);
                    }}
                    onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        
                        const selection = window.getSelection();
                        if (selection && selection.rangeCount > 0) {
                          const range = selection.getRangeAt(0);
                          
                          const br = document.createElement('br');
                          range.deleteContents();
                          range.insertNode(br);
                          
                          range.setStartAfter(br);
                          range.collapse(true);
                          selection.removeAllRanges();
                          selection.addRange(range);
                          
                          const element = e.target as HTMLElement;
                          let text = element.innerHTML;
                          text = text
                            .replace(/<br\s*\/?>/gi, '\n')
                            .replace(/<div>/gi, '\n')
                            .replace(/<\/div>/gi, '')
                            .replace(/<[^>]*>/g, '');
                          
                          setLegendaImagem(text);
                        }
                      }
                    }}
                    placeholder="Legenda da imagem..."
                    style={{ 
                      whiteSpace: 'pre-wrap',
                      minHeight: '60px',
                      maxHeight: '150px',
                      overflowY: 'auto'
                    }}
                  />
                  <div className="variables-button-container">
                    <button
                      type="button"
                      className="variaveis-btn"
                      onClick={() => setMostrarVariaveisLegenda(!mostrarVariaveisLegenda)}
                      title="Inserir variáveis"
                    >
                      @
                    </button>
                    <MenuVariaveis 
                      mostrar={mostrarVariaveisLegenda}
                      onInserir={inserirVariavelLegenda}
                      onFechar={() => setMostrarVariaveisLegenda(false)}
                    />
                  </div>
                </div>
                <small className="form-hint">
                  Use variáveis: $nome, $primeiroNome • Pressione Enter para quebrar linha
                </small>
              </div>
            </>
          )}

          {tipoMensagem === 'botoes' && (
            <>
              <div className="form-group">
                <label>Mensagem de Texto<span className="required-asterisk">*</span></label>
                <div className="input-with-variables">
                  <ContentEditable
                    id="texto-botoes"
                    className="form-textarea editor-highlight"
                    html={renderizarTextoComVariaveis(textoMensagem)}
                    onChange={e => {
                      const element = e.currentTarget as HTMLDivElement;
                      let text = element.innerHTML;
                      
                      text = text
                        .replace(/<br\s*\/?>/gi, '\n')
                        .replace(/<div>/gi, '\n')
                        .replace(/<\/div>/gi, '')
                        .replace(/<[^>]*>/g, '');
                      
                      text = text
                        .replace(/&nbsp;/g, ' ')
                        .replace(/&amp;/g, '&')
                        .replace(/&lt;/g, '<')
                        .replace(/&gt;/g, '>');
                      
                      setTextoMensagem(text);
                    }}
                    onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        
                        const selection = window.getSelection();
                        if (selection && selection.rangeCount > 0) {
                          const range = selection.getRangeAt(0);
                          
                          const br = document.createElement('br');
                          range.deleteContents();
                          range.insertNode(br);
                          
                          range.setStartAfter(br);
                          range.collapse(true);
                          selection.removeAllRanges();
                          selection.addRange(range);
                          
                          const element = e.target as HTMLElement;
                          let text = element.innerHTML;
                          text = text
                            .replace(/<br\s*\/?>/gi, '\n')
                            .replace(/<div>/gi, '\n')
                            .replace(/<\/div>/gi, '')
                            .replace(/<[^>]*>/g, '');
                          
                          setTextoMensagem(text);
                        }
                      }
                    }}
                    placeholder="Digite a mensagem que acompanha os botões..."
                    style={{ 
                      whiteSpace: 'pre-wrap',
                      minHeight: '80px',
                      maxHeight: '200px',
                      overflowY: 'auto'
                    }}
                  />
                  <div className="variables-button-container">
                    <button
                      type="button"
                      className="variaveis-btn"
                      onClick={() => setMostrarVariaveisBotoes(!mostrarVariaveisBotoes)}
                      title="Inserir variáveis"
                    >
                      @
                    </button>
                    <MenuVariaveis 
                      mostrar={mostrarVariaveisBotoes}
                      onInserir={inserirVariavelBotoes}
                      onFechar={() => setMostrarVariaveisBotoes(false)}
                    />
                  </div>
                </div>
                <small className="form-hint">
                  Use variáveis: $nome, $primeiroNome • Pressione Enter para quebrar linha
                </small>
              </div>

              <div className="form-group">
                <label>Imagem (opcional)</label>
                {!imagemUrl ? (
                  <div className="image-selector">
                    <label htmlFor="image-upload" className="image-upload-btn">
                      <Icons.FiImage size={32} className="upload-icon" />
                      <div className="upload-text">
                        <span className="upload-title">Clique para adicionar uma imagem aos botões</span>
                        <span className="upload-subtitle">JPG, PNG, GIF até 10MB (opcional)</span>
                      </div>
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="file-input-hidden"
                      id="image-upload"
                    />
                  </div>
                ) : (
                  <div className="image-preview-container">
                    <div className="image-preview">
                      <Image src={imagemUrl} alt="Media preview" width={100} height={100} />
                      <button
                        type="button"
                        onClick={() => setImagemUrl('')}
                        className="remove-image-btn"
                        title="Remover imagem"
                      >
                        <Icons.FiX size={16} />
                      </button>
                    </div>
                    <div className="image-actions">
                      <label htmlFor="image-upload" className="change-image-btn">
                        <Icons.FiImage size={16} />
                        Trocar imagem
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="file-input-hidden"
                        id="image-upload"
                      />
                    </div>
                  </div>
                )}
                <small className="form-hint">
                  A imagem será exibida acima do texto e botões na mensagem
                </small>
              </div>

              <div className="form-group">
                <div className="exemplo-imagem-container">
                  <div className="exemplo-imagem-header">
                    <span>Exemplo de como aparece {imagemUrl ? 'com imagem ' : ''}no WhatsApp:</span>
                  </div>
                  <div className="exemplo-imagem-wrapper">
                    <Image 
                      src={exemploBotoes.src} 
                      alt="Exemplo de botões no WhatsApp"
                      width={80}
                      height={80}
                    />
                  </div>
                </div>
              </div>
              
              <div className="form-group">
                <label>Botões de Ação<span className="required-asterisk">*</span></label>
                <div className="botoes-editor">
                  {botoesAcao.map((botao, index) => (
                    <div key={index} className="botao-item">
                      <div className="botao-header">
                        <span>Botão {index + 1}</span>
                        <button
                          type="button"
                          onClick={() => removerBotao(index)}
                          className="btn-remover-botao"
                        >
                          <Icons.FiX size={14} />
                        </button>
                      </div>
                      
                      <div className="botao-fields">
                        <input
                          type="text"
                          value={botao.label}
                          onChange={e => atualizarBotao(index, 'label', e.target.value)}
                          placeholder="Texto do botão"
                          className="botao-input"
                        />
                      </div>
                    </div>
                  ))}
                  
                  <button
                    type="button"
                    onClick={adicionarBotao}
                    className="btn-adicionar-botao"
                  >
                    <Icons.FiPlus size={16} />
                    Adicionar Botão
                  </button>
                </div>
              </div>
            </>
          )}
          
          {renderizarSelecaoContatos()}

          {erro && (
            <div className="erro-feedback">
              <Icons.FiAlertCircle size={16} />
              <span>{erro}</span>
            </div>
          )}
        </div>
        
        <div className="modal-actions">
          <button onClick={salvarCampanha} className="btn-criar" disabled={!isFormValid || loadingCampanha}>
            {loadingCampanha ? (
              <>
                <div className="loading-spinner" />
                {campanhaEmEdicao ? 'Salvando...' : 'Criando...'}
              </>
            ) : (
              <>
                {campanhaEmEdicao ? <Icons.FiCheck size={16} /> : <Icons.FiPlus size={16} />}
                {campanhaEmEdicao ? 'Salvar Alterações' : 'Criar Campanha'}
              </>
            )}
          </button>
          <button onClick={fecharModalCriar} className="btn-cancelar">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default CampanhaForm;