import React from 'react';

const AddContactButton = () => {
  const handleClick = () => {
    // Substitua YOUR_PHONE_NUMBER pelo número do WhatsApp desejado
    const contactLink = "https://api.whatsapp.com/send?phone=YOUR_PHONE_NUMBER";
    window.open(contactLink, '_blank');
  };

  return (
    <button onClick={handleClick} className="contact-button">
      Adicionar Contato
    </button>
  );
};

export default AddContactButton;
