import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from './firebaseConfig';
import './general.css'; // Importa o CSS

const ManageDocuments = () => {
  const [collections] = useState(['homeContent', 'vendas', 'Aluguel', 'Briefings', 'midia']);
  const [collectionName, setCollectionName] = useState('');
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [updatedFields, setUpdatedFields] = useState([]);

  useEffect(() => {
    const fetchDocuments = async () => {
      if (collectionName) {
        try {
          const querySnapshot = await getDocs(collection(db, collectionName));
          const docs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setDocuments(docs);
        } catch (error) {
          console.error('Erro ao buscar documentos: ', error);
        }
      }
    };
    fetchDocuments();
  }, [collectionName]);

  const handleSelectDoc = (doc) => {
    setSelectedDoc(doc);
    setUpdatedFields(
      Object.entries(doc.fields || {}).map(([name, value], index) => {
        let parsedValue;
        try {
          parsedValue = typeof value === 'string' ? JSON.parse(value) : value;
        } catch (error) {
          parsedValue = value;
        }

        return {
          name,
          value: parsedValue,
          order: index + 1
        };
      })
    );
  };

  const handleFieldChange = (index, fieldType, e) => {
    const newFields = [...updatedFields];
    if (fieldType === 'name') {
      newFields[index].value.name = e.target.value; 
    } else if (fieldType === 'value') {
      newFields[index].value.value = e.target.value; 
    }
    setUpdatedFields(newFields);
  };

  const handleRemoveField = async (index) => {
    if (window.confirm(`Tem certeza que deseja remover o campo?`)) {
      const fieldToRemove = updatedFields[index].name;
      const updatedData = { ...selectedDoc, fields: { ...selectedDoc.fields } };
      delete updatedData.fields[fieldToRemove];

      try {
        await updateDoc(doc(db, collectionName, selectedDoc.id), updatedData);

        if (fieldToRemove === 'imageUrl' && selectedDoc.imageUrl) {
          const imageRef = ref(storage, selectedDoc.imageUrl);
          await deleteObject(imageRef);
        }
        const newFields = updatedFields.filter((_, i) => i !== index);
        setUpdatedFields(newFields);
        alert('Campo removido com sucesso!');
      } catch (error) {
        console.error('Erro ao remover campo: ', error);
        alert('Erro ao remover campo');
      }
    }
  };

  // Função para verificar se uma string é um JSON válido
  const isValidJson = (value) => {
    if (typeof value !== 'string') return false;
    try {
      JSON.parse(value);
      return true;
    } catch {
      return false;
    }
  };

  const handleUpdate = async () => {
    const updatedData = {
      fields: updatedFields
        .filter(field => field.value)
        .reduce((acc, field) => {
          if (typeof field.value === 'string') {
            // Verifica se a string é um JSON válido antes de tentar fazer o parse
            try {
              acc[field.name] = isValidJson(field.value) ? JSON.parse(field.value) : field.value;
            } catch (error) {
              console.error(`Erro ao analisar JSON para o campo ${field.name}:`, error);
              alert(`Erro ao analisar JSON no campo ${field.name}. Verifique a formatação.`);
            }
          } else {
            acc[field.name] = field.value; 
          }
          return acc;
        }, {})
    };

    try {
      await updateDoc(doc(db, collectionName, selectedDoc.id), updatedData);
      alert('Documento atualizado com sucesso!');
      setSelectedDoc(null);
      setUpdatedFields([]);
    } catch (error) {
      console.error('Erro ao atualizar documento: ', error);
      alert('Erro ao atualizar documento');
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Tem certeza que deseja deletar o documento?`)) {
      try {
        if (selectedDoc.imageUrl) {
          const imageRef = ref(storage, selectedDoc.imageUrl);
          await deleteObject(imageRef);
        }

        await deleteDoc(doc(db, collectionName, selectedDoc.id));
        alert('Documento deletado com sucesso!');
        setSelectedDoc(null);
        setUpdatedFields([]);
        const updatedDocuments = documents.filter(doc => doc.id !== selectedDoc.id);
        setDocuments(updatedDocuments);
      } catch (error) {
        console.error('Erro ao deletar documento: ', error);
        alert('Erro ao deletar documento');
      }
    }
  };

  return (
    <div>
      <h1>Gerenciar Documentos</h1>
      <div>
        <label>
          Selecione a Coleção:
          <select
            value={collectionName}
            onChange={(e) => setCollectionName(e.target.value)}
          >
            <option value="">Selecione uma coleção</option>
            {collections.map((col, index) => (
              <option key={index} value={col}>{col}</option>
            ))}
          </select>
        </label>
      </div>
      {documents.length > 0 && (
        <div>
          <h2>Documentos</h2>
          <ul>
            {documents.map(doc => (
              <li key={doc.id}>
                <button onClick={() => handleSelectDoc(doc)}>{doc.id}</button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {selectedDoc && (
        <div>
          <h2>Editar Documento: {selectedDoc.id}</h2>
          <form onSubmit={(e) => e.preventDefault()}>
            {updatedFields
              .sort((a, b) => a.order - b.order)
              .map((field, index) => (
                <div key={index} className="field">
                  <label>Nome do Campo:</label>
                  <input
                    type="text"
                    value={field.name}
                    readOnly
                    className="field-name-input"
                  />

                  {typeof field.value === 'object' && field.value.name && field.value.value ? (
                    <div>
                      <label>Nome Interno:</label>
                      <input
                        type="text"
                        value={field.value.name}
                        onChange={(e) => handleFieldChange(index, 'name', e)}
                        className="field-internal-name-input"
                      />
                      <label>Valor Interno:</label>
                      <textarea
                        value={field.value.value.replace(/\\n/g, '\n').replace(/\\t/g, '\t')}
                        onChange={(e) => handleFieldChange(index, 'value', e)}
                        rows={6}
                        className="field-value-textarea"
                        style={{ whiteSpace: 'pre-line' }}
                      />
                    </div>
                  ) : (
                    <div>
                      <label>Valor:</label>
                      <textarea
                        value={field.value.replace(/\\n/g, '\n').replace(/\\t/g, '\t')}
                        onChange={(e) => handleFieldChange(index, 'value', e)}
                        rows={6}
                        className="field-value-textarea"
                        style={{ whiteSpace: 'pre-line' }}
                      />
                    </div>
                  )}

                  <button 
                    type="button" 
                    onClick={() => handleRemoveField(index)} 
                    className="remove-field-button"
                  >
                    Remover Campo
                  </button>
                </div>
              ))}
            <div className="button-group">
              <button type="button" onClick={handleUpdate} className="update-button">Atualizar Documento</button>
              <button type="button" onClick={handleDelete} className="delete-button">Deletar Documento</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ManageDocuments;
