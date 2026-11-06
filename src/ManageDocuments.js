
import React, { useState, useEffect } from 'react';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';

import { ref, deleteObject } from 'firebase/storage';

import { db, storage } from './firebaseConfig';
import './general.css';

const ManageDocuments = () => {
  const collections = [
    'homeContent',
    'vendas',
    'Aluguel',
    'Briefings',
    'midia'
  ];

  const [collectionName, setCollectionName] = useState('');
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [updatedFields, setUpdatedFields] = useState([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Converte os formatos antigos e novos para um array padronizado
  const normalizeFields = (fields) => {
    if (Array.isArray(fields)) {
      return fields.map((field, index) => ({
        name: field.name ?? '',
        value: field.value ?? '',
        order: field.order ?? index + 1
      }));
    }

    if (fields && typeof fields === 'object') {
      return Object.entries(fields).map(([name, value], index) => {
        if (
          value &&
          typeof value === 'object' &&
          !Array.isArray(value) &&
          'name' in value &&
          'value' in value
        ) {
          return {
            name: value.name,
            value: value.value,
            order: value.order ?? index + 1
          };
        }

        return {
          name,
          value:
            typeof value === 'object'
              ? JSON.stringify(value, null, 2)
              : value,
          order: index + 1
        };
      });
    }

    return [];
  };

  // Carregar documentos
  useEffect(() => {
    const fetchDocuments = async () => {
      if (!collectionName) {
        setDocuments([]);
        setSelectedDoc(null);
        return;
      }

      try {
        setLoading(true);
        setError('');
        setSelectedDoc(null);
        setUpdatedFields([]);

        const querySnapshot = await getDocs(
          collection(db, collectionName)
        );

        const docs = querySnapshot.docs.map(item => ({
          id: item.id,
          ...item.data()
        }));

        setDocuments(docs);

      } catch (error) {
        console.error('Erro ao buscar documentos:', error);
        setError('Não foi possível carregar os documentos.');
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [collectionName]);

  // Selecionar documento
  const handleSelectDoc = (document) => {
    setSelectedDoc(document);

    const normalized = normalizeFields(document.fields);

    setUpdatedFields(
      normalized.sort((a, b) => a.order - b.order)
    );
  };

  // Alterar campos
  const handleFieldChange = (index, property, value) => {
    setUpdatedFields(previous =>
      previous.map((field, i) =>
        i === index
          ? { ...field, [property]: value }
          : field
      )
    );
  };

  // Adicionar campo
  const handleAddField = () => {
    const newOrder = updatedFields.length
      ? Math.max(...updatedFields.map(f => f.order)) + 1
      : 1;

    setUpdatedFields(previous => [
      ...previous,
      {
        name: '',
        value: '',
        order: newOrder
      }
    ]);
  };

  // Remover campo
  const handleRemoveField = (index) => {
    if (!window.confirm('Deseja remover este campo?')) {
      return;
    }

    setUpdatedFields(previous =>
      previous
        .filter((_, i) => i !== index)
        .map((field, i) => ({
          ...field,
          order: i + 1
        }))
    );
  };

  // Salvar alterações
  const handleUpdate = async () => {
    if (!selectedDoc) return;

    try {
      setSaving(true);

      const fieldsToSave = updatedFields
        .map((field, index) => ({
          name: field.name.trim(),
          value: field.value,
          order: index + 1
        }))
        .filter(field => field.name !== '');

      const documentRef = doc(
        db,
        collectionName,
        selectedDoc.id
      );

      // Atualiza somente fields.
      // Imagens e outros dados são preservados.
      await updateDoc(documentRef, {
        fields: fieldsToSave
      });

      const updatedDocument = {
        ...selectedDoc,
        fields: fieldsToSave
      };

      setSelectedDoc(updatedDocument);

      setDocuments(previous =>
        previous.map(item =>
          item.id === selectedDoc.id
            ? updatedDocument
            : item
        )
      );

      setUpdatedFields(fieldsToSave);

      alert('Documento atualizado com sucesso!');

    } catch (error) {
      console.error('Erro ao atualizar documento:', error);
      alert('Erro ao atualizar documento.');
    } finally {
      setSaving(false);
    }
  };

  // Encontrar todas as imagens do documento
  const getDocumentImages = (document) => {
    const images = [];

    if (Array.isArray(document.images)) {
      images.push(...document.images);
    }

    if (Array.isArray(document.imageUrl)) {
      images.push(...document.imageUrl);
    } else if (typeof document.imageUrl === 'string') {
      images.push(document.imageUrl);
    }

    return [...new Set(images.filter(Boolean))];
  };

  // Excluir documento e imagens do Storage
  const handleDelete = async () => {
    if (!selectedDoc) return;

    const confirmed = window.confirm(
      `Tem certeza que deseja excluir "${selectedDoc.id}"? Esta ação não pode ser desfeita.`
    );

    if (!confirmed) return;

    try {
      setSaving(true);

      const images = getDocumentImages(selectedDoc);

      // Excluir imagens do Firebase Storage
      const results = await Promise.allSettled(
        images.map(async (imageUrl) => {
          const imageRef = ref(storage, imageUrl);
          await deleteObject(imageRef);
        })
      );

      const failedImages = results.filter(
        result => result.status === 'rejected'
      );

      // Excluir documento do Firestore
      await deleteDoc(
        doc(db, collectionName, selectedDoc.id)
      );

      setDocuments(previous =>
        previous.filter(item => item.id !== selectedDoc.id)
      );

      setSelectedDoc(null);
      setUpdatedFields([]);

      if (failedImages.length > 0) {
        alert(
          'Documento excluído, mas algumas imagens não puderam ser removidas do Storage.'
        );
      } else {
        alert('Documento e imagens excluídos com sucesso!');
      }

    } catch (error) {
      console.error('Erro ao excluir documento:', error);
      alert('Erro ao excluir documento.');
    } finally {
      setSaving(false);
    }
  };

  // Exibir valores de forma segura
  const displayValue = (value) => {
    if (value === null || value === undefined) return '';

    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }

    return String(value);
  };

  const documentImages = selectedDoc
    ? getDocumentImages(selectedDoc)
    : [];

  return (
    <div className="manage-documents">

      <header className="manage-header">
        <div>
          <span className="manage-subtitle">
            PAINEL ADMINISTRATIVO
          </span>

          <h1>Gerenciar Documentos</h1>

          <p>
            Consulte, edite e organize os conteúdos do site.
          </p>
        </div>
      </header>

      <section className="manage-selector">
        <label htmlFor="collection">
          Selecionar coleção
        </label>

        <select
          id="collection"
          value={collectionName}
          onChange={(e) => setCollectionName(e.target.value)}
        >
          <option value="">
            Selecione uma coleção
          </option>

          {collections.map(col => (
            <option key={col} value={col}>
              {col}
            </option>
          ))}
        </select>
      </section>

      {loading && (
        <div className="manage-message">
          Carregando documentos...
        </div>
      )}

      {error && (
        <div className="manage-error">
          {error}
        </div>
      )}

      {!loading && collectionName && (
        <section className="manage-document-list">

          <div className="manage-section-header">
            <div>
              <h2>Documentos</h2>
              <span>
                {documents.length} documento(s) encontrado(s)
              </span>
            </div>
          </div>

          {documents.length > 0 ? (
            <div className="manage-document-grid">
              {documents.map(document => (
                <button
                  key={document.id}
                  type="button"
                  className={`manage-document-card ${
                    selectedDoc?.id === document.id
                      ? 'selected'
                      : ''
                  }`}
                  onClick={() => handleSelectDoc(document)}
                >
                  <span className="manage-document-icon">
                    <span className="document-symbol">▤</span>
                  </span>

                  <span className="manage-document-info">
                    <strong>{document.id}</strong>
                    <small>
                      {normalizeFields(document.fields).length} campo(s)
                    </small>
                  </span>

                  <span className="manage-document-arrow">
                    ›
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="manage-empty">
              Nenhum documento encontrado nesta coleção.
            </div>
          )}

        </section>
      )}

      {selectedDoc && (
        <section className="manage-editor">

          <div className="manage-editor-header">
            <div>
              <span className="manage-subtitle">
                EDITANDO DOCUMENTO
              </span>

              <h2>{selectedDoc.id}</h2>

              <p>
                Coleção: {collectionName}
              </p>
            </div>

            <button
              type="button"
              className="manage-close-button"
              onClick={() => {
                setSelectedDoc(null);
                setUpdatedFields([]);
              }}
            >
              Fechar
            </button>
          </div>

          {/* Imagens */}
          {documentImages.length > 0 && (
            <div className="manage-images-section">
              <h3>Imagens cadastradas</h3>

              <div className="manage-images-grid">
                {documentImages.map((image, index) => (
                  <div
                    className="manage-image-item"
                    key={image}
                  >
                    <img
                      src={image}
                      alt={`Imagem ${index + 1}`}
                    />
                    <span>Imagem {index + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Campos */}
          <div className="manage-fields-header">
            <div>
              <h3>Conteúdo do documento</h3>
              <p>
                Edite os títulos e as descrições abaixo.
              </p>
            </div>

            <button
              type="button"
              className="manage-add-button"
              onClick={handleAddField}
            >
              + Adicionar campo
            </button>
          </div>

          {updatedFields.length > 0 ? (
            <div className="manage-fields-list">

              {updatedFields
                .map((field, index) => ({ field, index }))
                .sort((a, b) => a.field.order - b.field.order)
                .map(({ field, index }) => (
                  <div
                    key={index}
                    className="manage-field-card"
                  >
                    <div className="manage-field-top">
                      <span className="manage-field-number">
                        CAMPO {index + 1}
                      </span>

                      <button
                        type="button"
                        className="manage-remove-button"
                        onClick={() => handleRemoveField(index)}
                      >
                        Remover
                      </button>
                    </div>

                    <label>
                      Título em negrito
                    </label>

                    <input
                      type="text"
                      value={field.name}
                      onChange={(e) =>
                        handleFieldChange(
                          index,
                          'name',
                          e.target.value
                        )
                      }
                      placeholder="Digite o título"
                    />

                    <label>
                      Descrição
                    </label>

                    <textarea
                      value={displayValue(field.value)}
                      onChange={(e) =>
                        handleFieldChange(
                          index,
                          'value',
                          e.target.value
                        )
                      }
                      rows={6}
                      placeholder="Digite a descrição"
                    />
                  </div>
                ))}

            </div>
          ) : (
            <div className="manage-empty">
              Este documento ainda não possui campos.
              Você pode adicionar um novo campo.
            </div>
          )}

          {/* Botões */}
          <div className="manage-actions">

            <button
              type="button"
              className="manage-save-button"
              onClick={handleUpdate}
              disabled={saving}
            >
              {saving ? 'Salvando...' : 'Salvar alterações'}
            </button>

            <button
              type="button"
              className="manage-delete-button"
              onClick={handleDelete}
              disabled={saving}
            >
              Excluir documento
            </button>

          </div>

        </section>
      )}

    </div>
  );
};

export default ManageDocuments;
