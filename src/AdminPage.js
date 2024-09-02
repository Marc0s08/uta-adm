import React, { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebaseConfig';

const predefinedCollections = ['homeContent', 'vendas', 'Aluguel', 'Briefings', 'midia'];

const AdminPage = () => {
  const [collectionName, setCollectionName] = useState('');
  const [docName, setDocName] = useState('');
  const [fields, setFields] = useState([{ name: '', value: '' }]);
  const [imageFile, setImageFile] = useState(null);
  const [contactLink, setContactLink] = useState('');

  const handleFieldChange = (index, e) => {
    const newFields = fields.slice();
    newFields[index][e.target.name] = e.target.value;
    setFields(newFields);
  };

  const handleAddField = () => {
    setFields([...fields, { name: '', value: '' }]);
  };

  const handleRemoveField = (index) => {
    const newFields = fields.filter((_, i) => i !== index);
    setFields(newFields);
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

    const data = {};
    fields.forEach(field => {
      if (field.name && field.value) {
        data[field.name] = field.value;
      }
    });

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

    if (contactLink) {
      data.contactLink = contactLink;
    }

    try {
      await setDoc(doc(db, collectionName, docName), data);
      setCollectionName('');
      setDocName('');
      setFields([{ name: '', value: '' }]);
      setImageFile(null);
      setContactLink('');
      alert('Documento adicionado com sucesso!');
    } catch (error) {
      console.error('Erro ao adicionar documento: ', error);
      alert('Erro ao adicionar documento');
    }
  };

  const handleAddContact = () => {
    if (collectionName === 'vendas' || collectionName === 'Aluguel') {
      window.open('https://wa.me/?text=Olá!%20Gostaria%20de%20adicionar%20um%20contato%20à%20minha%20agenda.', '_blank');
    } else {
      alert('Este recurso está disponível apenas para as páginas de vendas e aluguel.');
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
        {collectionName === 'vendas' || collectionName === 'Aluguel' ? (
          <div>
            <button
              type="button"
              style={{
                display: 'inline-block',
                marginTop: '10px',
                padding: '10px 15px',
                fontSize: '16px',
                color: '#fff',
                backgroundColor: '#25D366', // Cor do WhatsApp
                border: 'none',
                borderRadius: '5px',
                textAlign: 'center',
                textDecoration: 'none',
                cursor: 'pointer',
              }}
              onClick={handleAddContact}
            >
              Adicionar Contato WhatsApp
            </button>
          </div>
        ) : null}
        <button type="button" onClick={handleAddField}>Adicionar nova descrição</button>
        <button type="submit">Upload Site</button>
      </form>
    </div>
  );
};

export default AdminPage;
