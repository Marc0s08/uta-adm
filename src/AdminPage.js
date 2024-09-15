import React, { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebaseConfig';

const predefinedCollections = ['homeContent', 'vendas', 'Aluguel', 'Briefings', 'midia'];

const AdminPage = () => {
  const [collectionName, setCollectionName] = useState('');
  const [docName, setDocName] = useState('');
  const [fields, setFields] = useState([{ name: '', value: '', order: 1 }]);
  const [imageFile, setImageFile] = useState(null);
  const [contactNumber, setContactNumber] = useState('');

  const handleFieldChange = (index, e) => {
    const newFields = [...fields];
    newFields[index][e.target.name] = e.target.value;
    setFields(newFields);
  };

  const handleAddField = () => {
    const newOrder = fields.length ? Math.max(...fields.map(f => f.order)) + 1 : 1;
    setFields([...fields, { name: '', value: '', order: newOrder }]);
  };

  const handleRemoveField = (index) => {
    const newFields = fields.filter((_, i) => i !== index);
    setFields(newFields.map((field, i) => ({ ...field, order: i + 1 }))); // Reordenar
  };

  const handleImageUpload = (e) => {
    if (e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!collectionName) {
      alert('Por favor, selecione uma coleção.');
      return;
    }

    if (!docName) {
      alert('Por favor, forneça uma identificação para o documento.');
      return;
    }

    const data = { fields: fields.filter(field => field.name && field.value).sort((a, b) => a.order - b.order) };

    if (imageFile) {
      try {
        const imageRef = ref(storage, `images/${imageFile.name}`);
        await uploadBytes(imageRef, imageFile);
        const imageUrl = await getDownloadURL(imageRef);
        data.imageUrl = imageUrl;
      } catch (error) {
        console.error('Erro ao fazer upload da imagem: ', error);
        alert('Erro ao fazer upload da imagem');
        return;
      }
    }

    if (collectionName === 'vendas' || collectionName === 'Aluguel') {
      if (contactNumber) {
        const formattedContactNumber = contactNumber.replace(/\D/g, '');
        data.contactLink = `https://wa.me/+55${formattedContactNumber}`;
      } else {
        alert('Por favor, forneça um número de contato.');
        return;
      }
    }

    try {
      await setDoc(doc(db, collectionName, docName), data);
      setCollectionName('');
      setDocName('');
      setFields([{ name: '', value: '', order: 1 }]);
      setImageFile(null);
      setContactNumber('');
      alert('Documento adicionado com sucesso!');
    } catch (error) {
      console.error('Erro ao adicionar documento: ', error);
      alert('Erro ao adicionar documento');
    }
  };

  return (
    <div>
      <h1>Página de Administração</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>
            Selecione a Página:
            <select
              value={collectionName}
              onChange={(e) => setCollectionName(e.target.value)}
            >
              <option value="">Selecione uma coleção</option>
              {predefinedCollections.map((col, index) => (
                <option key={index} value={col}>{col}</option>
              ))}
            </select>
          </label>
        </div>
        <div>
          <label>
            Identificação
            <input
              type="text"
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              required
            />
          </label>
        </div>
        {fields.map((field, index) => (
          <div key={index}>
            <label>
              Título em Negrito
              <input
                type="text"
                name="name"
                value={field.name}
                onChange={(e) => handleFieldChange(index, e)}
              />
            </label>
            <label>
              Descrição
              <textarea
                name="value"
                value={field.value}
                onChange={(e) => handleFieldChange(index, e)}
                rows={4}
              />
            </label>
            <button type="button" onClick={() => handleRemoveField(index)}>Remover Campo</button>
          </div>
        ))}
        <div>
          <label>
            Upload de Imagem:
            <input type="file" onChange={handleImageUpload} />
          </label>
        </div>
        {(collectionName === 'vendas' || collectionName === 'Aluguel') && (
          <div>
            <label>
              Contato WhatsApp:
              <input
                type="text"
                placeholder="Digite o número com DDD"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
              />
            </label>
          </div>
        )}
        <button type="button" onClick={handleAddField}>Adicionar nova descrição</button>
        <button type="submit">Upload Site</button>
      </form>
    </div>
  );
};

export default AdminPage;
