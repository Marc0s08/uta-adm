
import React, { useState, useEffect } from 'react';

import {
  doc,
  setDoc
} from 'firebase/firestore';

import {
  ref,
  uploadBytes,
  getDownloadURL
} from 'firebase/storage';

import { db, storage } from './firebaseConfig';
import './AdminPage.css';

const predefinedCollections = [
  'homeContent',
  'vendas',
  'Aluguel',
  'Briefings',
  'midia'
];

const AdminPage = () => {
  const [collectionName, setCollectionName] = useState('');
  const [docName, setDocName] = useState('');

  const [fields, setFields] = useState([
    { name: '', value: '', order: 1 }
  ]);

  const [imageFiles, setImageFiles] = useState([]);
  const [contactNumber, setContactNumber] = useState('');

  const [loading, setLoading] = useState(false);
  const [previewUrls, setPreviewUrls] = useState([]);

  // Criar e limpar pré-visualizações das imagens
  useEffect(() => {
    const urls = imageFiles.map(file =>
      URL.createObjectURL(file)
    );

    setPreviewUrls(urls);

    return () => {
      urls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [imageFiles]);

  // Alterar campos
  const handleFieldChange = (index, e) => {
    const newFields = [...fields];

    newFields[index][e.target.name] = e.target.value;

    setFields(newFields);
  };

  // Adicionar campo
  const handleAddField = () => {
    const newOrder = fields.length
      ? Math.max(...fields.map(f => f.order)) + 1
      : 1;

    setFields([
      ...fields,
      {
        name: '',
        value: '',
        order: newOrder
      }
    ]);
  };

  // Remover campo
  const handleRemoveField = (index) => {
    const newFields = fields.filter(
      (_, i) => i !== index
    );

    setFields(
      newFields.map((field, i) => ({
        ...field,
        order: i + 1
      }))
    );
  };

  // Selecionar imagens
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);

    if (
      collectionName === 'Briefings' ||
      collectionName === 'midia'
    ) {
      setImageFiles(files);
    } else {
      setImageFiles(files.slice(0, 1));
    }

    // Permite selecionar novamente o mesmo arquivo
    e.target.value = '';
  };

  // Alterar coleção
  const handleCollectionChange = (e) => {
    setCollectionName(e.target.value);
    setImageFiles([]);
  };

  // Enviar documento
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    if (!collectionName) {
      alert('Por favor, selecione uma coleção.');
      return;
    }

    if (!docName.trim()) {
      alert('Por favor, forneça uma identificação para o documento.');
      return;
    }

    // Validar WhatsApp
    if (
      collectionName === 'vendas' ||
      collectionName === 'Aluguel'
    ) {
      const formattedContactNumber =
        contactNumber.replace(/\D/g, '');

      if (!formattedContactNumber) {
        alert('Por favor, forneça um número de contato.');
        return;
      }

      if (formattedContactNumber.length < 10 ||
          formattedContactNumber.length > 11) {
        alert('Digite um número válido com DDD.');
        return;
      }
    }

    // Preparar dados
    const data = {
      fields: fields
        .filter(field =>
          field.name.trim() !== '' &&
          String(field.value).trim() !== ''
        )
        .sort((a, b) => a.order - b.order)
        .map((field, index) => ({
          name: field.name.trim(),
          value: field.value,
          order: index + 1
        }))
    };

    setLoading(true);

    try {
      // Upload das imagens
      if (imageFiles.length > 0) {
        const imageUrls = await Promise.all(
          imageFiles.map(async (imageFile, index) => {
            const uniqueName =
              `${Date.now()}-${index}-${imageFile.name}`;

            const imageRef = ref(
              storage,
              `images/${uniqueName}`
            );

            await uploadBytes(imageRef, imageFile);

            return await getDownloadURL(imageRef);
          })
        );

        // BRIEFINGS: array images
        if (collectionName === 'Briefings') {
          data.images = imageUrls;
        }

        // MIDIA: array imageUrl
        else if (collectionName === 'midia') {
          data.imageUrl = imageUrls;
        }

        // DEMAIS COLEÇÕES: imagem única
        else {
          data.imageUrl = imageUrls[0];
        }
      }

      // Contato WhatsApp
      if (
        collectionName === 'vendas' ||
        collectionName === 'Aluguel'
      ) {
        const formattedContactNumber =
          contactNumber.replace(/\D/g, '');

        data.contactLink =
          `https://wa.me/55${formattedContactNumber}`;
      }

      // Salvar no Firestore
      await setDoc(
        doc(db, collectionName, docName.trim()),
        data
      );

      // Limpar formulário
      setCollectionName('');
      setDocName('');
      setFields([
        { name: '', value: '', order: 1 }
      ]);
      setImageFiles([]);
      setContactNumber('');

      alert('Documento adicionado com sucesso!');

    } catch (error) {
      console.error(
        'Erro ao adicionar documento:',
        error
      );

      alert(
        'Erro ao adicionar documento. Verifique o console.'
      );

    } finally {
      setLoading(false);
    }
  };

  const supportsMultipleImages =
    collectionName === 'Briefings' ||
    collectionName === 'midia';

  return (
    <div className="admin-page">

      {/* CABEÇALHO */}
      <header className="admin-header">

        <span className="admin-subtitle">
          PAINEL ADMINISTRATIVO
        </span>

        <h1>Adicionar Conteúdo</h1>

        <p>
          Cadastre e publique novos conteúdos no site.
        </p>

      </header>

      <form
        className="admin-form"
        onSubmit={handleSubmit}
      >

        {/* DESTINO DO CONTEÚDO */}
        <section className="admin-section">

          <div className="admin-section-title">

            <span className="admin-icon">
              <svg viewBox="0 0 24 24">
                <rect
                  x="3"
                  y="3"
                  width="18"
                  height="18"
                  rx="2"
                />
                <path d="M9 3v18M3 9h6" />
              </svg>
            </span>

            <div>
              <h2>Destino do conteúdo</h2>
              <p>
                Selecione onde deseja publicar.
              </p>
            </div>

          </div>

          <label htmlFor="admin-collection">
            Selecione a Página
          </label>

          <select
            id="admin-collection"
            value={collectionName}
            onChange={handleCollectionChange}
            required
          >
            <option value="">
              Selecione uma coleção
            </option>

            {predefinedCollections.map(col => (
              <option key={col} value={col}>
                {col}
              </option>
            ))}

          </select>

          <label htmlFor="admin-docname">
            Identificação do documento
          </label>

          <input
            id="admin-docname"
            type="text"
            placeholder="Ex: OPERACAO_BANCO_CENTRAL"
            value={docName}
            onChange={(e) => setDocName(e.target.value)}
            required
          />

        </section>

        {/* CONTEÚDO */}
        <section className="admin-section">

          <div className="admin-section-title">

            <span className="admin-icon">
              <svg viewBox="0 0 24 24">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
              </svg>
            </span>

            <div>
              <h2>Conteúdo</h2>
              <p>
                Adicione títulos e descrições.
              </p>
            </div>

          </div>

          <div className="admin-fields">

            {fields.map((field, index) => (
              <div
                className="admin-field-card"
                key={index}
              >

                <div className="admin-field-header">

                  <span>
                    CAMPO {index + 1}
                  </span>

                  <button
                    type="button"
                    className="admin-remove-button"
                    onClick={() => handleRemoveField(index)}
                  >
                    Remover
                  </button>

                </div>

                <label>
                  Título em Negrito
                </label>

                <input
                  type="text"
                  name="name"
                  placeholder="Digite o título"
                  value={field.name}
                  onChange={(e) =>
                    handleFieldChange(index, e)
                  }
                />

                <label>
                  Descrição
                </label>

                <textarea
                  name="value"
                  placeholder="Digite a descrição do conteúdo..."
                  value={field.value}
                  onChange={(e) =>
                    handleFieldChange(index, e)
                  }
                  rows={5}
                />

              </div>
            ))}

          </div>

          <button
            type="button"
            className="admin-add-button"
            onClick={handleAddField}
          >
            + Adicionar nova descrição
          </button>

        </section>

        {/* IMAGENS */}
        <section className="admin-section">

          <div className="admin-section-title">

            <span className="admin-icon">
              <svg viewBox="0 0 24 24">
                <rect
                  x="3"
                  y="3"
                  width="18"
                  height="18"
                  rx="2"
                />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="m21 15-5-5L5 21" />
              </svg>
            </span>

            <div>
              <h2>Imagens</h2>
              <p>
                Adicione imagens ao documento.
              </p>
            </div>

          </div>

          <label
            className="admin-upload-area"
            htmlFor="admin-image-upload"
          >

            <span className="admin-upload-icon">
              <svg viewBox="0 0 24 24">
                <path d="M12 16V4" />
                <path d="m7 9 5-5 5 5" />
                <path d="M20 16v4H4v-4" />
              </svg>
            </span>

            <strong>
              Clique para selecionar imagens
            </strong>

            <small>
              {supportsMultipleImages
                ? 'Você pode selecionar várias imagens.'
                : 'Selecione apenas uma imagem.'}
            </small>

            <input
              id="admin-image-upload"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              multiple={supportsMultipleImages}
            />

          </label>

          {imageFiles.length > 0 && (
            <div className="admin-selected-images">

              <div className="admin-selected-header">
                <strong>
                  {imageFiles.length} imagem(ns) selecionada(s)
                </strong>

                <button
                  type="button"
                  onClick={() => setImageFiles([])}
                  className="admin-clear-images"
                >
                  Limpar imagens
                </button>
              </div>

              <div className="admin-preview-grid">

                {imageFiles.map((file, index) => (
                  <div
                    className="admin-preview-item"
                    key={`${file.name}-${index}`}
                  >

                    <img
                      src={previewUrls[index]}
                      alt={file.name}
                    />

                    <span title={file.name}>
                      {file.name}
                    </span>

                  </div>
                ))}

              </div>

            </div>
          )}

        </section>

        {/* WHATSAPP */}
        {(collectionName === 'vendas' ||
          collectionName === 'Aluguel') && (

          <section className="admin-section">

            <div className="admin-section-title">

              <span className="admin-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M21 11.5a8.5 8.5 0 0 1-12.6 7.4L3 21l2.1-5.4A8.5 8.5 0 1 1 21 11.5Z" />
                </svg>
              </span>

              <div>
                <h2>Contato</h2>
                <p>
                  Configure o contato para WhatsApp.
                </p>
              </div>

            </div>

            <label htmlFor="admin-contact">
              Número de WhatsApp
            </label>

            <input
              id="admin-contact"
              type="tel"
              placeholder="Digite o número com DDD"
              value={contactNumber}
              onChange={(e) =>
                setContactNumber(e.target.value)
              }
            />

          </section>

        )}

        {/* PUBLICAR */}
        <div className="admin-submit-area">

          <button
            type="submit"
            className="admin-submit-button"
            disabled={loading}
          >

            {loading ? (
              <>
                <span className="admin-spinner" />
                Enviando...
              </>
            ) : (
              <>
                <span>↑</span>
                Publicar Conteúdo
              </>
            )}

          </button>

        </div>

      </form>

    </div>
  );
};

export default AdminPage;
