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
    setUpdatedFields(Object.entries(doc).map(([name, value]) => ({ name, value })));

    // Adiciona o campo imageUrl se não estiver presente
    if (!doc.hasOwnProperty('imageUrl')) {
      setUpdatedFields(prevFields => [...prevFields, { name: 'imageUrl', value: '' }]);
    }
  };

  const handleFieldChange = (index, e) => {
    const newFields = updatedFields.slice();
    newFields[index][e.target.name] = e.target.value;
    setUpdatedFields(newFields);
  };

  const handleRemoveField = async (index) => {
    if (window.confirm(`Tem certeza que deseja remover o campo "${updatedFields[index].name}"?`)) {
      const fieldToRemove = updatedFields[index].name;
      const updatedData = { ...selectedDoc };
      delete updatedData[fieldToRemove];  // Remove o campo localmente

      try {
        await updateDoc(doc(db, collectionName, selectedDoc.id), updatedData);
        
        // Remove a imagem se o campo 'imageUrl' for removido
        if (fieldToRemove === 'imageUrl') {
          const imageRef = ref(storage, selectedDoc.imageUrl);
          await deleteObject(imageRef);
        }

        const newFields = updatedFields.filter((_, i) => i !== index);
        setUpdatedFields(newFields);
        alert(`Campo "${fieldToRemove}" removido com sucesso!`);
      } catch (error) {
        console.error('Erro ao remover campo: ', error);
        alert('Erro ao remover campo');
      }
    }
  };

  const handleUpdate = async () => {
    const updatedData = {};
    updatedFields.forEach(field => {
      if (field.name && field.value) {
        updatedData[field.name] = field.value;
      }
    });
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
    if (window.confirm(`Tem certeza que deseja deletar o documento "${selectedDoc.id}"?`)) {
      try {
        // Remove a imagem se existir
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
            {updatedFields.map((field, index) => (
              <div key={index}>
                <label>
                  Nome do Campo:
                  <input
                    type="text"
                    name="name"
                    value={field.name}
                    disabled={field.name === 'imageUrl'} // Desabilita a edição do nome se for o campo imageUrl
                  />
                </label>
                <label>
                  Valor do Campo:
                  <input
                    type="text"
                    name="value"
                    value={field.value}
                    onChange={(e) => handleFieldChange(index, e)}
                  />
                </label>
                {field.name !== 'imageUrl' && (
                  <button 
                    type="button" 
                    onClick={() => handleRemoveField(index)} 
                    className="remove-field-button"
                  >
                    Remover Campo
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={handleUpdate} className="update-button">Atualizar Documento</button>
            <button type="button" onClick={handleDelete} className="delete-button">Deletar Documento</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ManageDocuments;
